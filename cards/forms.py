from django import forms
from django.forms import ModelForm
from .models import Card

class CardForm(ModelForm):
    class Meta:
        model = Card
        fields = ["name", "card_type", "color", "mana_cost", "card_description", "price", "quantity"]
        widgets = {
            "name": forms.TextInput(attrs={"class": "form-control"}),
            "card_type": forms.Select(attrs={"class": "form-select"}),
            "color": forms.Select(attrs={"class": "form-select"}),
            "mana_cost": forms.TextInput(attrs={"class": "form-control"}),
            "card_description": forms.Textarea(attrs={"class": "form-control", "rows": 3}),
            "price": forms.NumberInput(attrs={"class": "form-control"}),
            "quantity": forms.NumberInput(attrs={"class": "form-control"}),
        }
