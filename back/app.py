from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import datetime

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for React Native frontend

# Get API key from environment
GROQ_API_KEY = os.getenv('GROQ_API_KEY')

# --- 用來暫存感測器數據的列表 (模擬資料庫) ---
# 注意：重啟伺服器後，這裡的資料會清空。若需永久儲存需連接 SQLite/MySQL
sensor_logs = []

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

# --- 接收前端上傳的感測器數據 (對應 api.js 的 uploadSensorData) ---
@app.route('/api/sensor/log', methods=['POST'])
def log_sensor_data():
    try:
        # 1. 取得前端傳來的 JSON 數據
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # 2. 提取欄位 (對應 frontend 的 mockSensorData.js 結構)
        # 前端送來的是: systemActive, lastStableWeight, isOnCoaster, drinkAmount, reminderMs, timestamp
        new_record = {
            "id": len(sensor_logs) + 1,
            "system_active": data.get('systemActive'),
            "weight": data.get('lastStableWeight'),
            "is_on_coaster": data.get('isOnCoaster'),
            "drink_amount": data.get('drinkAmount'),
            "reminder_ms": data.get('reminderMs'),
            "timestamp": data.get('timestamp') or datetime.datetime.now().isoformat(),
            "received_at": datetime.datetime.now().isoformat()
        }

        # 3. 存入列表 (或是寫入資料庫)
        sensor_logs.insert(0, new_record) # 將最新的資料插在最前面
        
        # 僅保留最近 100 筆，避免記憶體爆炸
        if len(sensor_logs) > 100:
            sensor_logs.pop()

        print(f"✅ 收到數據: 喝水量 {new_record['drink_amount']}ml | 時間: {new_record['timestamp']}")

        return jsonify({
            "success": True, 
            "message": "Data logged successfully",
            "record_id": new_record['id']
        }), 201

    except Exception as e:
        print(f"❌ Error logging data: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
    
# --- (選用) 讓你在瀏覽器查看目前後端收到的所有數據 ---
@app.route('/api/sensor/history', methods=['GET'])
def get_sensor_history():
    return jsonify({
        "count": len(sensor_logs),
        "logs": sensor_logs
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
