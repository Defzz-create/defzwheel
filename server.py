from flask import Flask, send_from_directory, jsonify, request
from datetime import datetime
import json
import os
import requests

bot_token = '8484039904:AAG_AU03u1kdnxp8V-g0MFNmx0iLJPUn6lY'
admin_id = 714698934

app = Flask(__name__, static_folder='wheel')
SPINS_FILE = "spins.json"

def load_spins():
    if os.path.exists(SPINS_FILE):
        with open(SPINS_FILE, "r") as f:
            return json.load(f)
    return {}

def save_spins(data):
    with open(SPINS_FILE, "w") as f:
        json.dump(data, f, indent=4)

@app.route("/")
def index():
    return send_from_directory('wheel', 'index.html')

@app.route("/check_ip")
def check_ip():
    user_ip = request.remote_addr
    spins = load_spins()
    now = datetime.now()
    month_key = f"{now.year}-{now.month}"

    if user_ip in spins and spins[user_ip].get("month") == month_key:
        return jsonify({"can_spin": False, "message": "Вы уже прокручивали колесо в этом месяце!"})

    return jsonify({"can_spin": True, "message": "Можно крутить"})

@app.route("/register_spin", methods=["POST"])
def register_spin():
    user_ip = request.remote_addr
    spins = load_spins()
    now = datetime.now()
    month_key = f"{now.year}-{now.month}"

    spins[user_ip] = {"month": month_key, "last_spin": now.isoformat()}
    save_spins(spins)
    return jsonify({"status": "ok"})

@app.route("/<path:path>")
def static_files(path):
    return send_from_directory('wheel', path)

@app.route("/send_prize", methods=["POST"])
def send_prize():
    data = request.json
    username = data.get("username", "Неизвестен")
    prize = data.get("prize", "Без приза")

    message = f"🎯 Новый приз!\n👤 Пользователь: @{username}\n🎁 Приз: {prize}"
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"

    try:
        requests.post(url, json={"chat_id": admin_id, "text": message})
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))
