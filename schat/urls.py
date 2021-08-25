from django.urls import path
from .views import  RoomHandler

app_name= 'schat'
urlpatterns = [
    path('room/', RoomHandler.as_view(), name='room-template')

]
