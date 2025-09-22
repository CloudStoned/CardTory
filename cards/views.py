# views.py
from django.shortcuts import render, redirect
from .forms import CardForm
from .models import Card

def home(request):
    form = CardForm()
    
    last_card = Card.objects.order_by("-id").first()
    nxt_card_id = (last_card.id + 1) if last_card else 1
    
    context = {"form": form, "nxt_card_id":nxt_card_id}

    return render(request, "home.html", context)

def add_card(request):
    if request.method == "POST":
        form = CardForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect("home")   
        else:
            cards = Card.objects.all()
            return render(request, "home.html", {"cards": cards, "form": form})
    
    return redirect("home")