from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for React Native frontend

# Get API key from environment
GROQ_API_KEY = os.getenv('GROQ_API_KEY')

@app.route('/')
def home():
    return jsonify({"message": "Flask backend is running!"})

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Chatbot endpoint that receives messages from frontend
    and communicates with Groq API
    """
    try:
        data = request.get_json()
        user_message = data.get('message', '')

        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        if not GROQ_API_KEY:
            return jsonify({"error": "GROQ_API_KEY not configured"}), 500

        # TODO: Implement Groq API call here
        # For now, return a placeholder response
        response = {
            "reply": f"Echo: {user_message}",
            "status": "success"
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "groq_api_configured": bool(GROQ_API_KEY)}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
