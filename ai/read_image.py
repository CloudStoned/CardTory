from google import genai
import os
from dotenv import load_dotenv
from pydantic import BaseModel
import tempfile

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


def read_photo(photo_file):
    """
    Reads a Django UploadedFile object, saves it temporarily, and sends it 
    to the Gemini API for content generation with structured output.

    :param photo_file: The Django InMemoryUploadedFile object.
    :return: The JSON string result from the AI.
    """
    
    # Initialize variables for cleanup
    temp_file_path = None
    uploaded_file_name = None 
    
    print("---Starting Image Processing---")

    try:
        # 1. Write the UploadedFile content to a temporary disk file
        # We use a suffix to help the API identify the file type
        file_extension = photo_file.name.split('.')[-1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file_extension}") as temp_file:
            for chunk in photo_file.chunks():
                temp_file.write(chunk)
            temp_file_path = temp_file.name # Get the temporary file path

        print(f"---Temporary file created at: {temp_file_path}---")

        # 2. Upload the file using the path (the format the API requires)
        my_file = client.files.upload(file=temp_file_path)
        uploaded_file_name = my_file.name # Save the API name for deletion
        print(f"---File Uploaded to Gemini API: {uploaded_file_name}---")
        
        # 3. Generate content using the file object and structured schema
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[my_file, prompt],
            config={
                "response_mime_type": "application/json",
                "response_schema": CardDetails, 
            },
        )
        
        result = response.text
        return result

    except Exception as e:
        print(f"!!! CRITICAL API ERROR during file processing: {e}")
        # Re-raise the exception to be caught by the calling Django view
        raise e
        
    finally:
        # 4. Cleanup: MUST delete files in both locations
        
        # Delete the temporary local disk file
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
            print("---Temporary local file deleted---")
            
        # Delete the file uploaded to the Gemini API service
        if uploaded_file_name:
            client.files.delete(name=uploaded_file_name)
            print(f"---API file {uploaded_file_name} deleted---")