from django.urls import re_path
from .consumers import ChatConsumer
 
app_name = 'schat'

websocket_urlspatterns = [
    re_path('room/ws/', ChatConsumer.as_asgi(), name='wss')
]