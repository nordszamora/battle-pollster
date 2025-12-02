from django.contrib.auth import get_user_model
from django.contrib.auth.backends import BaseBackend
from django.db.models import Q
from django.contrib.auth.hashers import check_password

User = get_user_model()

class EmailAuthenticationBackend(BaseBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            # Try to get the user by username or email
            user = User.objects.get(email=username)
        except User.DoesNotExist:
            return None

        # Check if the password is correct
        if user and check_password(password, user.password):
            return user

        return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
