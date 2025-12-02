from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from unittest.mock import patch

User = get_user_model()

class UnitTest(APITestCase):
    def setUp(self):
        self.email = "test@email.com"
        self.password = "test@123"
        
        self.user = User.objects.create_user(
            username="random89", email=self.email, password=self.password
        )
        
    def test_register(self):
        url = reverse('register')
        data = {"email": "newtest@email.com", "password": "test@123"}

        response = self.client.post(url, data, format='json')
        print(response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_login(self):
        url = reverse('login')
        data = {"email": self.email, "password": self.password}
        
        response = self.client.post(url, data, format='json')
        print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_isauth(self):
        url = reverse('isauth')
        
        response = self.client.get(url)
        print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    