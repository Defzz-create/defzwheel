from flask import Flask, request, jsonify
import json, os, time
from datetime import datetime, timedelta

app = Flask(__name__)

DATA_FILE = "spins.json"

if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, "w") as f:
        json.dump({}, f)

def load_data():
    with open(DATA_FILE, "r") as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)

@app.route("/spin", methods=["POST"])
def spin():
    data = load_data()
    user_id = str(request.json.get("user_id"))
    now = datetime.utcnow()

    if user_id in data:
        last_spin = datetime.fromisoformat(data[user_id])
        if now - last_spin < timedelta(days=30):
            return jsonify({
                "status": "denied",
                "message": "Вы уже крутили колесо в этом месяце!"
            }), 403

    data[user_id] = now.isoformat()
    save_data(data)

    return jsonify({
        "status": "ok",
        "message": "Можно крутить!"
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
