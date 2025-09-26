from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),         
    path("add/", views.add_card, name="add_card"),
    path("card/<int:pk>/edit/", views.edit_card, name="edit_card"),
    path("card/<int:pk>/delete/", views.delete_card, name="delete_card"),
]
