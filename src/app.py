import os
import io
import json
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import google.generativeai as genai
from gtts import gTTS

app = Flask(__name__)
CORS(app)

# ==========================================
# 🔑 ใส่ API KEY ของคุณตรงนี้
# ==========================================
GENAI_API_KEY = "AIzaSyBQvAIvn4xXW1VbaKCbzwW2UETna04HTgc" 

genai.configure(api_key=GENAI_API_KEY)

@app.route('/generate-script', methods=['POST'])
def generate_script():
    try:
        data = request.json
        
        # 1. รับค่า
        contents = data.get('contents', [])
        sys_instruct_data = data.get('systemInstruction', {})
        
        # ดึง System Instruction
        sys_instruct = "You are a creative director."
        if 'parts' in sys_instruct_data and len(sys_instruct_data['parts']) > 0:
            sys_instruct = sys_instruct_data['parts'][0].get('text', '')

        # 2. Config (แปลงให้ถูกต้องตาม Python SDK)
        raw_config = data.get('generationConfig', {})
        generation_config = {
            "temperature": raw_config.get("temperature", 0.7),
            "max_output_tokens": raw_config.get("maxOutputTokens", 8192),
            "response_mime_type": "application/json" 
        }

        # 3. เรียกใช้ Model (ใช้ Gemini 2.0 Flash ตามสิทธิ์ที่คุณมีในรูป)
        model = genai.GenerativeModel(
            model_name='gemini-2.0-flash', 
            system_instruction=sys_instruct
        )
        
        response = model.generate_content(
            contents, 
            generation_config=generation_config
        )
        
        if response.candidates:
             return jsonify({"candidates": [{"content": {"parts": [{"text": response.text}]}}]})
        else:
             return jsonify({"error": "No content generated"}), 500

    except Exception as e:
        print(f"Server Error: {str(e)}")
        return jsonify({"error": f"Server Error: {str(e)}"}), 500

@app.route('/generate-voice', methods=['POST'])
def generate_voice():
    try:
        data = request.json
        text = data.get('text', '')
        if not text: return jsonify({"error": "No text"}), 400
        
        tts = gTTS(text=text, lang='th', slow=False)
        fp = io.BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        
        return send_file(fp, mimetype='audio/mpeg', download_name='voice.mp3')
    except Exception as e:
        print(f"Voice Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)