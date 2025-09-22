from django.db import models

class Card(models.Model):
    CARD_TYPE_CHOICES = [
        ("creature", "Creature"),
        ("spell", "Spell"),
        ("artifact", "Artifact"),
        ("land", "Land"),
    ]

    RARITY_CHOICES = [
        ("common", "Common"),
        ("uncommon", "Uncommon"),
        ("rare", "Rare"),
        ("mythic", "Mythic"),
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
    type = models.CharField(max_length=50, choices=CARD_TYPE_CHOICES, blank=True)
    rarity = models.CharField(max_length=50, choices=RARITY_CHOICES, blank=True)
    color = models.CharField(max_length=50, choices=COLOR_CHOICES, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    quantity = models.PositiveIntegerField(default=1)

    created_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.id} - {self.name}"