from google import genai
import os
from dotenv import load_dotenv
from pydantic import BaseModel

class CardDetails(BaseModel):
    name: str
    type: str
    color: str
    mana_cost: str
    card_text: str
    
load_dotenv()

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
prompt = """
You are an experienced Magic: The Gathering player.
Given a single MTG card (image or text), identify and return only the following fields:

* **Name**
* **Type(s)** (primary types only: Creature, Artifact, Enchantment, Instant, Sorcery, Planeswalker, Land, Battle)
* **Color(s)** (White, Blue, Black, Red, Green; include multicolor/hybrid as needed; use *Colorless* when appropriate)
* **Mana Cost** (list the symbols in order as they appear)
* **Card Text** (the rules text and abilities printed on the card)

### Rules

* **Types:** Read the printed type line; return only the primary card types. Ignore subtypes (e.g., “Elf”) and supertypes (e.g., “Legendary”).
* **Colors:** Determine from mana cost and/or color indicator. Cards with no colored mana symbols and no color indicator are *Colorless*. Cards with “Devoid” are also *Colorless*.
* **Multi-part cards** (split, adventure, double-faced, modal): Report each face separately.
* **Unknowns:** If any field cannot be determined from what’s shown, return `"Unknown"`.
"""


my_file = client.files.upload(file="ArchangelAvacyn__65613.jpg")

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=[my_file, prompt],
    config={
        "response_mime_type": "application/json",
        "response_schema": CardDetails,
    },
)

print(response.text)