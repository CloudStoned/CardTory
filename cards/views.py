from django.shortcuts import render, get_object_or_404
from django.template.loader import render_to_string
from django.core.paginator import Paginator
from django.http import JsonResponse
from .forms import CardForm
from .models import Card

from ai.read_image import read_photo

def home(request):
    return render_filtered_cards(request, full_page=True)

def filter_cards(request):
    return render_filtered_cards(request)

def render_filtered_cards(request, full_page=False):
    search_query = request.GET.get("search", "")
    card_type = request.GET.get("type", "")
    rarity = request.GET.get("rarity", "")
    color = request.GET.get("color", "")
    sort = request.GET.get("sort", "name:asc")
    per_page = int(request.GET.get("per_page", 10))
    page_number = int(request.GET.get("page", 1))

    cards = (
        Card.objects
        .search(search_query)
        .of_type(card_type)
        .of_rarity(rarity)
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
        "selected_rarity": rarity,
        "selected_color": color,
        "sort": sort,
        "per_page": per_page,
        "CARD_TYPE_CHOICES": Card.CARD_TYPE_CHOICES,
        "RARITY_CHOICES": Card.RARITY_CHOICES,
        "COLOR_CHOICES": Card.COLOR_CHOICES,
    }

    if request.headers.get("x-requested-with") == "XMLHttpRequest":
        html = render(request, "cards_table.html", context).content.decode("utf-8")
        return JsonResponse({"table_html": html})

    return render(request, "home.html", context)

def add_card(request):
    if request.method == "POST":
        photo = request.FILES.get("photo")
        if photo:
            try:
                print(f"File name: {photo.name}")
                print(f"Content type: {photo.content_type}")
                print(f"File size: {photo.size}")
                result = read_photo(photo)
                print(result)

                # Return AI result to frontend
                return JsonResponse({
                    "success": True,
                    "ai_result": result,
                })

            except Exception as e:
                return JsonResponse({"success": False, "error": str(e)})

        # Manual form submission
        form = CardForm(request.POST, request.FILES)  
        if form.is_valid():
            card = form.save()
            row_html = render_to_string("partials/cards_table_row.html", {"card": card})
            return JsonResponse({"success": True, "row_html": row_html})
        else:
            html = render_to_string("partials/add_form.html", {"form": form}, request)
            return JsonResponse({"success": False, "html": html})

    # GET request → return JSON with empty form
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