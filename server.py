from flask import Flask, send_from_directory, jsonify, request
from datetime import datetime
import json
import os

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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))
