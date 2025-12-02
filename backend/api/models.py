from django.db import models
from django.contrib.auth.models import AbstractUser

from datetime import date
from dateutil.relativedelta import relativedelta

def monthly_due_date():
    return date.today() + relativedelta(months=1)

class User(AbstractUser):
    username = models.CharField(max_length=15, unique=True)
    email = models.EmailField(unique=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
       return self.username

class VotingPoll(models.Model):
    voting_poll_id = models.CharField(max_length=10, unique=True, blank=True)
    poll_due_date = models.DateField(default=monthly_due_date, editable=False)
    poll_has_ended = models.BooleanField(default=False)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='poll_author')

    def __str__(self):
       return self.voting_poll_id

class PollA(models.Model):
    poll_id = models.CharField(max_length=10, unique=True, blank=True)
    poll_A = models.CharField(max_length=50)
    image_A = models.URLField()
    vote_A = models.IntegerField(default=0)
    pollster = models.ForeignKey(VotingPoll, on_delete=models.CASCADE, related_name='voting_a_pollster')
    voter = models.ManyToManyField(User, related_name='poll_a_voter')

    def __str__(self):
        return self.poll_A

class PollB(models.Model):
    poll_id = models.CharField(max_length=10, unique=True, blank=True)
    poll_B = models.CharField(max_length=50)
    image_B = models.URLField()
    vote_B = models.IntegerField(default=0)
    pollster = models.ForeignKey(VotingPoll, on_delete=models.CASCADE, related_name='voting_b_pollster')
    voter = models.ManyToManyField(User, related_name='poll_b_voter')

    def __str__(self):
        return self.poll_B