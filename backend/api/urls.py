from django.urls import path
from . import views

urlpatterns = [
    path('register', views.register, name='register'),
    path('login', views.login, name='login'),
    path('isauth', views.isauth, name='isauth'),
    path('poll_list', views.poll_list, name='poll-list'),
    path('poll/<str:poll>', views.poll_result, name='poll-result'),
    path('vote/vote_a/<str:poll_id>/<str:voting_id>', views._vote_poll_A, name='vote-poll-A'),
    path('vote/vote_b/<str:poll_id>/<str:voting_id>', views._vote_poll_B, name='vote-poll-B'),
    path('logout', views.logout, name='logout'),
]