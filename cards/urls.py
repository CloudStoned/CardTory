from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),         
    path("add-card/", views.add_card, name="add_card"),
]
