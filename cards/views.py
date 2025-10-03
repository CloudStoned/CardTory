from django.shortcuts import render, get_object_or_404
from django.template.loader import render_to_string
from django.core.paginator import Paginator
from django.http import JsonResponse
from .forms import CardForm
from .models import Card

import json

from ai.read_image import read_photo

def home(request):
    return render_filtered_cards(request, full_page=True)

def filter_cards(request):
    return render_filtered_cards(request)

def render_filtered_cards(request, full_page=False):
    search_query = request.GET.get("search", "")
    card_type = request.GET.get("type", "")
    color = request.GET.get("color", "")
    sort = request.GET.get("sort", "name:asc")
    per_page = int(request.GET.get("per_page", 10))
    page_number = int(request.GET.get("page", 1))

    cards = (
        Card.objects
        .search(search_query)
        .of_type(card_type)
        .of_color(color)
    )

    # Sorting
    field, direction = sort.split(":")
    if direction == "desc":
        field = "-" + field
    cards = cards.order_by(field)

    # Pagination
    paginator = Paginator(cards, per_page)
    page_obj = paginator.get_page(page_number)

    context = {
        "cards": page_obj,
        "search_query": search_query,
        "selected_type": card_type,
        "selected_color": color,
        "sort": sort,
        "per_page": per_page,
        "CARD_TYPE_CHOICES": Card.CARD_TYPE_CHOICES,
        "COLOR_CHOICES": Card.COLOR_CHOICES,
    }

    if request.headers.get("x-requested-with") == "XMLHttpRequest":
        html = render(request, "cards_table.html", context).content.decode("utf-8")
        return JsonResponse({"table_html": html})

    return render(request, "home.html", context)

def add_card(request):
    if request.method == "POST":
        # 1️⃣ Photo upload for AI prefill
        if "photo" in request.FILES:
            photo = request.FILES["photo"]
            result_str = read_photo(photo)       
            result = json.loads(result_str)     

            form = CardForm(initial={
                "name": result.get("name"),
                "card_type": result.get("type", "").lower(), 
                "color": result.get("color", "").lower(),  
                "mana_cost": result.get("mana_cost"),
                "card_description": result.get("card_text"),
            })
            
            html = render_to_string("partials/add_form.html", {"form": form}, request)
            return JsonResponse({"success": True, "html": html})

        # 2️⃣ Manual form submission
        form = CardForm(request.POST, request.FILES)  
        if form.is_valid():
            card = form.save()
            row_html = render_to_string("partials/cards_table_row.html", {"card": card})
            return JsonResponse({"success": True, "row_html": row_html})
        else:
            html = render_to_string("partials/add_form.html", {"form": form}, request)
            return JsonResponse({"success": False, "html": html})

    # 3️⃣ GET request → return empty form
    form = CardForm()
    html = render_to_string("partials/add_form.html", {"form": form}, request)
    return JsonResponse({"html": html})

def edit_card(request, id):
    card = get_object_or_404(Card, pk=id)

    if request.method == "POST":
        form = CardForm(request.POST, instance=card)
        if form.is_valid():
            card = form.save()
            # Re-render the updated row
            row_html = render_to_string("partials/cards_table_row.html", {"card": card})
            return JsonResponse({"success": True, "id": card.id, "row_html": row_html})
        else:
            html = render_to_string("partials/edit_form.html", {"form": form}, request=request)
            return JsonResponse({"success": False, "html": html})
    else:
        # GET request → return prefilled form
        form = CardForm(instance=card)
        html = render_to_string("partials/edit_form.html", {"form": form}, request=request)
        return JsonResponse({"success": True, "html": html})
    
def remove_card(request, id):
    if request.method == "POST":
        card = get_object_or_404(Card, pk=id)
        card.delete()
        return JsonResponse({"success": True, "id": id})
    else:
        return JsonResponse({"success": False, "error": "Invalid Request"}, status=400)