"""
Amika Café: Telegram Bot Background Polling Service
Handles /start, welcome greetings, and launches the WebApp.
Zero external dependencies (uses standard urllib.request).
"""

import sys
import time
import json
import urllib.request
import urllib.error

# Ensure UTF-8 output on Windows console
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

BOT_TOKEN = "8935606630:AAHf5kRs6U466GrduKzrwMeBmoKam8ltwEA"
WEBAPP_URL = "https://jeneaa81.github.io/amika-cafe/?v=2"
SUPABASE_URL = "https://ildagazsbdtgjlzlkfaq.supabase.co"
SUPABASE_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imls"
    "ZGFnYXpzYmR0Z2psemxrZmFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1NzA3NDgsImV4"
    "cCI6MjEwODE0Njc0OH0.BSGfGWuXT7HNfsCjmUbeisbcGzXs0FJvUHMz5lC-FeQ"
)

WELCOME_TEXT = (
    "☕ <b>Bine ați venit la Amika Café! / Добро пожаловать!</b>\n\n"
    "✨ <b>Specialty Coffee & Foodberry Bakery (Cricova)</b>\n"
    "Plasați o precomandă rapidă fără coadă și adunați cafele gratuite pe cardul dvs. digital 5+1!\n\n"
    "Оформите быстрый предзаказ без очереди и получайте бесплатный кофе по карте 5+1:\n\n"
    "👇 <i>Apăsați butonul de mai jos pentru a deschide meniul:</i>\n"
    "👇 <i>Нажмите кнопку ниже, чтобы открыть меню:</i>"
)


def api_request(method: str, payload: dict = None) -> dict:
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/{method}"
    data = json.dumps(payload).encode("utf-8") if payload else None
    headers = {"Content-Type": "application/json"} if data else {}
    req = urllib.request.Request(url, data=data, headers=headers)
    with urllib.request.urlopen(req, timeout=35) as resp:
        return json.loads(resp.read().decode("utf-8"))


def register_loyalty_card(user_id: int, user_name: str):
    """Ensures user has a digital loyalty card in Supabase on first start."""
    try:
        url = f"{SUPABASE_URL}/rest/v1/loyalty_cards"
        card_num = f"AMIKA-{abs(hash(str(user_id))) % 9000 + 1000}"
        payload = {
            "card_number": card_num,
            "telegram_user_id": user_id,
            "customer_name": user_name,
            "current_stamps": 0,
            "total_free_earned": 0,
        }
        data = json.dumps(payload).encode("utf-8")
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=ignore-duplicates",
        }
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        urllib.request.urlopen(req, timeout=5)
    except Exception as e:
        # Ignore duplicate errors or network issues
        pass


def send_welcome(chat_id: int, first_name: str):
    payload = {
        "chat_id": chat_id,
        "text": WELCOME_TEXT,
        "parse_mode": "HTML",
        "reply_markup": {
            "inline_keyboard": [
                [
                    {
                        "text": "☕ Deschide Meniul / Открыть Меню",
                        "web_app": {"url": WEBAPP_URL},
                    }
                ]
            ]
        },
    }
    return api_request("sendMessage", payload)


def main():
    print("Amika Cafe Bot Service started for @AmikaCafeBot...", flush=True)
    offset = None

    while True:
        try:
            params = {"timeout": 20}
            if offset is not None:
                params["offset"] = offset

            res = api_request("getUpdates", params)
            updates = res.get("result", [])

            for update in updates:
                offset = update["update_id"] + 1
                msg = update.get("message") or update.get("edited_message")
                if not msg:
                    continue

                chat = msg.get("chat", {})
                chat_id = chat.get("id")
                from_user = msg.get("from", {})
                first_name = from_user.get("first_name", "Oaspete")
                user_id = from_user.get("id", chat_id)
                text = (msg.get("text") or "").strip()

                print(
                    f"Received message from {first_name} (ID: {chat_id}): '{text}'",
                    flush=True,
                )

                # Register loyalty card for user in Supabase
                register_loyalty_card(user_id, first_name)

                # Respond to /start or any greeting/message
                if text.startswith("/start") or text != "":
                    send_welcome(chat_id, first_name)
                    print(f"Sent welcome message to {chat_id}", flush=True)

        except urllib.error.URLError as e:
            print(f"Network error in polling: {e}, retrying in 3s...", flush=True)
            time.sleep(3)
        except Exception as e:
            print(f"Unexpected error: {e}, retrying in 2s...", flush=True)
            time.sleep(2)


if __name__ == "__main__":
    main()
