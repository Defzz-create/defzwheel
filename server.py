from flask import Flask, request, jsonify, send_from_directory
from datetime import datetime, timedelta
import os, json
import requests

app = Flask(__name__)

json_id = os.getenv("json_id")
api_key = os.getenv("api_key")
token = os.getenv("tg_bot_token")
tg_id = os.getenv("tg_id")

def load_spins():
    url = f"https://api.jsonbin.io/v3/b/{json_id}/latest"
    headers = {"X-Master-Key": api_key}
    try:
        r = requests.get(url, headers=headers)
        r.raise_for_status()
        data = r.json().get("record", {})
        return data
    except Exception as e:
        print("Ошибка загрузки spins:", e)
        return {}

def save_spins(data):
    url = f"https://api.jsonbin.io/v3/b/{json_id}"
    headers = {
        "X-Master-Key": api_key,
        "Content-Type": "application/json"
    }
    try:
        requests.put(url, headers=headers, json=data)
    except Exception as e:
        print("Ошибка сохранения spins:", e)

def get_real_ip():
    ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    if ip and "," in ip:
        ip = ip.split(",")[0].strip()
    return ip

def send_telegram_message(phone, prize):
    if not token or not tg_id:
        print("❌ tg_bot_token или tg_id не указаны в Render Settings.")
        return
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    text = f"🎯 <b>Новый выигрыш!</b>\n📞 Телефон: {phone}\n🎁 Приз: {prize}"
    try:
        requests.post(url, data={"chat_id": tg_id, "text": text, "parse_mode": "HTML"})
    except Exception as e:
        print("Ошибка отправки в Telegram:", e)

@app.route("/check_ip")
def check_ip():
    ip = get_real_ip()
    spins = load_spins()
    now = datetime.now()
    if ip in spins:
        last_spin = datetime.fromisoformat(spins[ip])
        if now - last_spin < timedelta(days=30):
            return jsonify({"can_spin": False, "message": "Вы уже крутили барабан! Повторная попытка через месяц."})
    return jsonify({"can_spin": True})

@app.route("/register_spin", methods=["POST"])
def register_spin():
    ip = get_real_ip()
    spins = load_spins()
    spins[ip] = datetime.now().isoformat()
    save_spins(spins)
    return jsonify({"status": "ok"})

@app.route("/submit_prize", methods=["POST"])
def submit_prize():
    data = request.json
    phone = data.get("phone", "Не указан")
    prize = data.get("prize", "Без приза")
    send_telegram_message(phone, prize)
    return jsonify({"success": True})

@app.route("/")
def index():
    return send_from_directory("wheel", "index.html")

@app.route("/<path:path>")
def static_files(path):
    return send_from_directory("wheel", path)

@app.route("/debug_spins")
def debug_spins():
    return jsonify(load_spins())

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
