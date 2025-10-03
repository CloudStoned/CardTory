from django.db import models

class CardQuerySet(models.QuerySet):
    def of_type(self, type_value):
        if type_value:
            return self.filter(type=type_value)
        return self
    
    
    def of_color(self, color_value):
        if color_value:
            return self.filter(color=color_value) 
        return self

    def search(self, term):
        if term:
            return self.filter(
                models.Q(name__icontains=term) |
                models.Q(type__icontains=term) |
                models.Q(rarity__icontains=term)
            )
        return self


class Card(models.Model):
    CARD_TYPE_CHOICES = [
        ("creature", "Creature"),
        ("spell", "Spell"),
        ("artifact", "Artifact"),
        ("land", "Land")
    ]

    COLOR_CHOICES = [
        ("white", "White"),
        ("blue", "Blue"),
        ("black", "Black"),
        ("red", "Red"),
        ("green", "Green"),
        ("colorless", "Colorless"),
    ]

    name = models.CharField(max_length=255)
    card_type = models.CharField(max_length=50, choices=CARD_TYPE_CHOICES, blank=True)
    color = models.CharField(max_length=50, choices=COLOR_CHOICES, blank=True)
    mana_cost = models.CharField(max_length=50, blank=True)
    card_description = models.CharField(max_length=50, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now=True)

    objects = CardQuerySet.as_manager()
    
    def __str__(self):
        return f"{self.id} - {self.name}"