from flask import Flask, request, jsonify, send_from_directory
from datetime import datetime, timedelta
import os, json, requests

app = Flask(__name__)

spins = "spins.json"
token = os.getenv("tg_bot_token")
id = os.getenv("tg_id")

def load_spins():
    if not os.path.exists(spins):
        return {}
    with open(spins, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except:
            return {}

def save_spins(data):
    with open(spins, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def send_telegram_message(username, prize):
    if not token or not id:
        print("❌ tg_bot_token или tg_id не указаны в Render Settings.")
        return
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    data = {
        "chat_id": id,
        "text": f"🎯 <b>Новый выигрыш!</b>\n👤 Пользователь: @{username}\n🎁 Приз: {prize}",
        "parse_mode": "HTML"
    }
    try:
        requests.post(url, data=data)
    except Exception as e:
        print("Ошибка отправки в Telegram:", e)

@app.route("/check_ip")
def check_ip():
    ip = request.remote_addr
    spins = load_spins()
    now = datetime.now()

    if ip in spins:
        last_spin = datetime.fromisoformat(spins[ip])
        if now - last_spin < timedelta(days=30):
            return jsonify({"can_spin": False, "message": "Вы уже крутили барабан! Повторная попытка через месяц."})

    return jsonify({"can_spin": True})

@app.route("/register_spin", methods=["POST"])
def register_spin():
    ip = request.remote_addr
    spins = load_spins()
    spins[ip] = datetime.now().isoformat()
    save_spins(spins)
    return jsonify({"status": "ok"})

@app.route("/send_prize", methods=["POST"])
def send_prize():
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
    data = load_spins()
    return jsonify(data)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)


