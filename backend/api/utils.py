from django.contrib.auth import authenticate, login
from django.conf import settings

from rest_framework import status
from rest_framework.response import Response
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

def authenticated(token, feedback):
    response = Response({'message': feedback}, status=(status.HTTP_200_OK if feedback == 'login success' else status.HTTP_201_CREATED))

    response.set_cookie(
            key = 'access_cookie', 
            value = str(token.access_token),
            expires = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
            path = settings.CSRF_COOKIE_PATH,
            secure = settings.SESSION_COOKIE_SECURE,
            httponly = settings.CSRF_COOKIE_HTTPONLY,
            samesite = settings.CSRF_COOKIE_SAMESITE
        )

    response.set_cookie(
            key = '_refresh', 
            value = str(token),
            expires = settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
            path = settings.CSRF_COOKIE_PATH,
            secure = settings.SESSION_COOKIE_SECURE,
            httponly = settings.CSRF_COOKIE_HTTPONLY,
            samesite = settings.CSRF_COOKIE_SAMESITE
        )
    
    return response

def token_validation(refresh_token, token=None):
    try:
        token = OutstandingToken.objects.get(token=refresh_token)
    except OutstandingToken.DoesNotExist:
        return 'OutstandingToken matching query does not exist.'

    is_blacklisted = BlacklistedToken.objects.filter(token=token).exists()

    return is_blacklisted