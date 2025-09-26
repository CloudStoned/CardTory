from django.shortcuts import render, redirect, get_object_or_404
from django.template.loader import render_to_string
from django.http import JsonResponse, HttpResponseNotAllowed
from django.contrib import messages
from .forms import CardForm
from .models import Card

def home(request):
    form = CardForm()
    
    last_card = Card.objects.order_by("-id").first()
    nxt_card_id = (last_card.id + 1) if last_card else 1
    cards = Card.objects.all().order_by("-id")
    
    context = {"form": form, "nxt_card_id":nxt_card_id,"cards": cards }

    return render(request, "home.html", context)

def add_card(request):
    if request.method == "POST":
        form = CardForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Card Added Successfully")
            return redirect("home")   
        else:
            cards = Card.objects.all().order_by("-id")
            return render(request, "home.html", {"cards": cards, "form": form})
    
    return redirect("home")

def edit_card(request,pk):
    card = get_object_or_404(Card, pk=pk)
    if request.method == "POST":
        form = CardForm(request.POST, instance=card)
        if form.is_valid():
            form.save()
            messages.success(request, "Card Edited Successfully")
            return JsonResponse({"success": True})
    else:
        form = CardForm(instance=card)
    
    context = {"form": form, "card": card}
    html = render_to_string("partials/edit_modal.html", context, request)
    return JsonResponse({"html":html})

def delete_card(request, pk):
    if request.method == "POST":
        card = get_object_or_404(Card, pk=pk)
        card.delete()
        messages.success(request, "Card Deleted Successfully")
        return redirect("home")