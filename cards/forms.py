from django import forms
from django.forms import ModelForm
from .models import Card

class CardForm(ModelForm):
    class Meta:
        model = Card
        fields = ["name", "type", "rarity", "color", "price", "quantity"]
        widgets = {
            "name": forms.TextInput(attrs={"class": "form-control"}),
            "type": forms.Select(attrs={"class": "form-select"}),
            "rarity": forms.Select(attrs={"class": "form-select"}),
            "color": forms.Select(attrs={"class": "form-select"}),
            "price": forms.NumberInput(attrs={"class": "form-control"}),
            "quantity": forms.NumberInput(attrs={"class": "form-control"}),
        }