from rest_framework import serializers

from random_username.generate import generate_username

from .models import User, VotingPoll, PollA, PollB

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        read_only_fields = ['id', 'username']

    def validate_password(self, value):
        if len(value) < 8:
           raise serializers.ValidationError('password must be atleast 8 digits')
        return value

    def create(self, validated_data):
        username = generate_username(1)[0].lower()
        email = validated_data.get('email')
        password = validated_data.get('password')

        user = User.objects.create_user(
            username=username,
            email=email, 
            password=password
        )
    
        return user
        
    def __init__(self, *args, **kwargs):
        fields = kwargs.pop('fields', None)
        super().__init__(*args, **kwargs)
        if fields is not None:
            # Drop any fields not specified in the `fields` argument.
            allowed = set(fields)
            existing = set(self.fields)
            for field_name in existing - allowed:
                self.fields.pop(field_name)
        
class PollASerializer(serializers.ModelSerializer):
    voter = UserSerializer(read_only=True, fields=['id', 'username'], many=True)
    
    class Meta:
        model = PollA
        fields = ['poll_id', 'poll_A', 'image_A', 'vote_A', 'voter']  # include poll_id/vote_A for GET feedback

class PollBSerializer(serializers.ModelSerializer):
    voter = UserSerializer(read_only=True, many=True)
   
    class Meta:
        model = PollB
        fields = ['poll_id', 'poll_B', 'image_B', 'vote_B', 'voter']

class VotingPollSerializer(serializers.ModelSerializer):
    class Meta:
        model = VotingPoll
        fields = '__all__'

# Serializer to return a VotingPoll with its A/B children
class VotingSerializer(serializers.ModelSerializer):
    poll_a = serializers.SerializerMethodField()
    poll_b = serializers.SerializerMethodField()

    class Meta:
        model = VotingPoll
        fields = ['id', 'voting_poll_id', 'poll_due_date', 'poll_has_ended', 'author', 'poll_a', 'poll_b']

    def get_poll_a(self, obj):
        a = obj.voting_a_pollster.first()
        return PollASerializer(a).data if a else None

    def get_poll_b(self, obj):
        b = obj.voting_b_pollster.first()
        return PollBSerializer(b).data if b else None
