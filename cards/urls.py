from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),         
    path("filter_cards/", views.filter_cards, name="filter_cards"),
    path("add/", views.add_card, name="add_card"),
    path("card/<int:id>/edit/", views.edit_card, name="edit_card")
]
