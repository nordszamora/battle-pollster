from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password
from django.middleware.csrf import get_token
from django.db import transaction
from django.db.models import F

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import UserSerializer, VotingPollSerializer, VotingSerializer, PollASerializer, PollBSerializer
from .models import User, VotingPoll, PollA, PollB
from .utils import authenticated, token_validation
    
import string
import random

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    # Handles user registration
    serializer = UserSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()

        # Authenticate user immediately after successful registration
        user = authenticate(
            request,
            username=serializer.validated_data.get('email'),
            password=serializer.validated_data.get('password')
        )
   
        if user is not None:
            # Generate JWT tokens for the newly created user
            token = RefreshToken.for_user(user)
            return authenticated(token, 'account created')

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    # User login using email + password
    email = request.data.get('email')
    password = request.data.get('password')

    user = authenticate(request, username=email, password=password)
   
    if user is not None:
        token = RefreshToken.for_user(user)
        return authenticated(token, 'login success')
    else:
        return Response({'message': 'invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET'])
@permission_classes([AllowAny])
def isauth(request):
    # Returns CSRF token + authentication status
    response = {
      'csrf': get_token(request),
      'IsAuthenticated': request.user.is_authenticated,
      'username': request.user.username if request.user.is_authenticated else None
    }
    
    return Response({'message': response}, status=status.HTTP_200_OK)

@api_view(['GET', 'POST'])
def poll_list(request):
    # Reject request if refresh token is invalid/expired/blacklisted
    if token_validation(request.COOKIES.get('_refresh')):
        return Response({'message': 'request not allowed'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == "GET":
        # Fetch all polls created by the logged-in user
        polls = VotingPoll.objects.filter(author=request.user)
        serializer = VotingSerializer(polls, many=True)
        return Response({'polls': serializer.data}, status=status.HTTP_200_OK)

    elif request.method == "POST":
        # Generate a random poll ID for the newly created poll
        chars = string.ascii_lowercase + string.digits
        ids = ''.join(random.choices(chars, k=7))

        # Extract PollA and PollB payloads from request
        poll_a_data = request.data.get('voting_a_poll') or {
            'poll_A': request.data.get('poll_A'),
            'image_A': request.data.get('image_A')
        }
        poll_b_data = request.data.get('voting_b_poll') or {
            'poll_B': request.data.get('poll_B'),
            'image_B': request.data.get('image_B')
        }

        if not poll_a_data or not poll_b_data:
            return Response({'message': 'missing poll A or poll B data'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate child poll serializers
        voting_a_poll = PollASerializer(data=poll_a_data)
        voting_b_poll = PollBSerializer(data=poll_b_data)

        a_valid = voting_a_poll.is_valid()
        b_valid = voting_b_poll.is_valid()
       
        if not (a_valid and b_valid):
            # Return errors for invalid poll inputs
            return Response({
                'poll_a_errors': voting_a_poll.errors,
                'poll_b_errors': voting_b_poll.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        # Use atomic transaction to ensure PollA and PollB do not get created unless VotingPoll also succeeds
        with transaction.atomic():
            voting_poll = VotingPoll.objects.create(author=request.user, voting_poll_id=ids)

            # Child poll IDs (A/B)
            child_a_id = f"{ids}A"
            child_b_id = f"{ids}B"

            # Save poll options in database
            voting_a_poll.save(pollster=voting_poll, poll_id=child_a_id)
            voting_b_poll.save(pollster=voting_poll, poll_id=child_b_id)

        return Response({'message': ids}, status=status.HTTP_201_CREATED)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticatedOrReadOnly])
def poll_result(request, poll=None):
    # Get poll by public ID or 404
    poll = get_object_or_404(VotingPoll, voting_poll_id=poll)

    if request.method == "GET":
        # Return poll result, includes vote counts
        serializer = VotingSerializer(poll)
        return Response({'message': serializer.data}, status=status.HTTP_200_OK)
    
    elif request.method == "PUT":
        # Validate refresh token to prevent unauthorized updates
        if token_validation(request.COOKIES.get('_refresh')):
            return Response({'message': 'request not allowed'}, status=status.HTTP_401_UNAUTHORIZED)

        # Mark poll as ended (partial update)
        expired = VotingSerializer(poll, data={'poll_has_ended': request.data.get('poll_expired')}, partial=True)

        if expired.is_valid():
            expired.save()
            return Response({'message': 'poll expired'}, status=status.HTTP_200_OK)
         
    elif request.method == "DELETE":
        if token_validation(request.COOKIES.get('_refresh')):
            return Response({'message': 'request not allowed'}, status=status.HTTP_401_UNAUTHORIZED)
    
        poll.delete()
        return Response({"message": 'poll deleted'}, status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def _vote_poll_A(request, poll_id=None, voting_id=None):
    # Handle voting/unvoting for Poll A
    poll = get_object_or_404(VotingPoll, voting_poll_id=poll_id)
    vote_a = get_object_or_404(PollA, pollster=poll, poll_id=voting_id)
    
    # Reject invalid token actions
    if token_validation(request.COOKIES.get('_refresh')):
        return Response({'message': 'request not allowed'}, status=status.HTTP_401_UNAUTHORIZED)

    # Check whether user already voted for A
    has_voted = poll.voting_a_pollster.filter(voter__username=request.user).exists()
    voting, _ = PollA.objects.get_or_create(pollster=poll)
   
    if not has_voted:
        # Increment vote using F() expression for safety in concurrent updates
        voting.vote_A = F('vote_A') + 1
        voting.save(update_fields=['vote_A'])
        voting.refresh_from_db()
        voting.voter.add(request.user)
        return Response({'message': 'poll - A voted'}, status=status.HTTP_201_CREATED)
    else:
        # Undo vote (toggle voting)
        voting.vote_A = F('vote_A') - 1
        voting.save(update_fields=['vote_A'])
        voting.refresh_from_db()
        voting.voter.remove(request.user)
        return Response({'message':'poll - A unvoted'}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def _vote_poll_B(request, poll_id=None, voting_id=None):
    # Same logic as _vote_poll_A but for side B
    poll = get_object_or_404(VotingPoll, voting_poll_id=poll_id)
    vote_a = get_object_or_404(PollB, pollster=poll, poll_id=voting_id)
    
    if token_validation(request.COOKIES.get('_refresh')):
        return Response({'message': 'request not allowed'}, status=status.HTTP_401_UNAUTHORIZED)

    has_voted = poll.voting_b_pollster.filter(voter__username=request.user).exists()
    voting, _ = PollB.objects.get_or_create(pollster=poll)
   
    if not has_voted:
        voting.vote_B = F('vote_B') + 1
        voting.save(update_fields=['vote_B'])
        voting.refresh_from_db()
        voting.voter.add(request.user)
        return Response({'message': 'poll - B voted'}, status=status.HTTP_201_CREATED)
    else:
        voting.vote_B = F('vote_B') - 1
        voting.save(update_fields=['vote_B'])
        voting.refresh_from_db()
        voting.voter.remove(request.user)
        return Response({'message':'poll - B unvoted'}, status=status.HTTP_200_OK)
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    # Refresh token must be valid to proceed
    if token_validation(request.COOKIES.get('_refresh')):
        return Response({'message': 'request not allowed'}, status=status.HTTP_401_UNAUTHORIZED)

    # Blacklist refresh token to prevent reuse
    token = RefreshToken(request.COOKIES.get('_refresh'))
    token.blacklist()

    # Remove cookies from browser
    response = Response({'message': 'user logout'}, status=status.HTTP_200_OK)
    response.delete_cookie('access_cookie')
    response.delete_cookie('_refresh')

    return response
