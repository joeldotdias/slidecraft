from flask import Flask, request, jsonify
import requests
from PyPDF2 import PdfReader
import os
from flask_cors import CORS
import re
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app)  # Enable CORS

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
load_dotenv()


def clean_text(text_list):
    cleaned_text = []
    for text in text_list:
        cleaned = re.sub(r"[^\w\s,.!?]", "", text)
        cleaned_text.append(cleaned)
    return " ".join(cleaned_text)


def generate_prompt(cleaned_text, num_slides=8):
    return f"""
Given the following summary of a PDF document, generate content for strictly {num_slides} slides:

PDF Summary:
{cleaned_text}

Follow these guidelines strictly:
1. Each slide should have a title and 3 points of content.
2. The title should be brief and relevant to the slide's content.
3. Each point should be in sentence form and 15-20 words long.
4. The content should describe different aspects of the topic covered in the PDF summary.
5. Start the output with this.
# Main Title: <Insert Presentation Title Here>
6. Use this exact format for each slide:

Slide [number]: [Title]
Content:
• [First point in sentence form, 15-20 words]
• [Second point in sentence form, 15-20 words]
• [Third point in sentence form, 15-20 words]

Create {num_slides} slides following this format, ensuring that each slide covers a distinct aspect of the topic. The content should progress logically from general information to more specific details, based on the provided PDF summary.
"""


@app.route("/upload", methods=["POST"])
def upload_pdf():
    api_key = os.getenv("TOGETHER_KEY")
    url = "https://api.together.xyz/v1/completions"

    if "pdf" not in request.files:
        return jsonify({"message": "No file part"}), 400

    file = request.files["pdf"]

    if file.filename == "":
        return jsonify({"message": "No selected file"}), 400

    # Save the uploaded PDF file
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    # Extract text using PyPDF2
    try:
        reader = PdfReader(file_path)
        extracted_text = ""

        for page_num in range(len(reader.pages)):
            extracted_text += reader.pages[page_num].extract_text()

        cleaned_text = clean_text(extracted_text)

        num_slides = 8  # Adjust this as needed
        prompt = generate_prompt(cleaned_text, num_slides)

        # Prepare the payload for the API call
        payload = {"prompt": prompt, "model": "mistralai/Mixtral-8x7B-Instruct-v0.1"}
        headers = {
            "Authorization": f"Bearer {api_key}",
            "accept": "application/json",
            "content-type": "application/json",
        }

        # Make the request to the Together API
        response = requests.post(url, json=payload, headers=headers)

        # Print the full response for debugging
        response_json = response.json()
        choices = response_json.get("choices", [])

        if choices:
            generated_text = choices[0].get("text", "")

            return jsonify({"summary": generated_text}), 200
            # print("Generated Text:\n", generated_text)
        else:
            print("No content generated from the API.")

        # Save the extracted text to a file
        text_file_path = os.path.join(
            UPLOAD_FOLDER, f"{os.path.splitext(file.filename)[0]}.txt"
        )
        with open(text_file_path, "w", encoding="utf-8") as text_file:
            text_file.write(extracted_text)

        return jsonify(
            {"message": f"Text extracted and saved to {text_file_path}"}
        ), 200
    except Exception as e:
        return jsonify({"message": f"Error extracting text: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
