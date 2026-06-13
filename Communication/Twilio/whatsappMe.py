import os
import subprocess
from flask import Flask, Response, jsonify, request
from dotenv import load_dotenv
from twilio.rest import Client
from twilio.twiml.messaging_response import MessagingResponse

load_dotenv()

app = Flask(__name__)

# SECURITY: Set your exact personal WhatsApp number in the .env file (include country code)
APPROVED_SENDER = os.getenv("APPROVED_SENDER") 
ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER")
EMPTY_TWIML_RESPONSE = "<Response></Response>"


def twiml_response(message=None):
    response = MessagingResponse()

    if message:
        response.message(message)

    return Response(str(response), status=200, mimetype="application/xml")


def send_whatsapp_reply(to_number, body):
    if not all([ACCOUNT_SID, AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER]):
        print("Cannot send WhatsApp reply because Twilio env vars are incomplete.")
        return

    client = Client(ACCOUNT_SID, AUTH_TOKEN)
    message = client.messages.create(
        from_=f"whatsapp:{TWILIO_WHATSAPP_NUMBER}",
        to=to_number,
        body=body,
    )
    print(f"WhatsApp reply sent. SID: {message.sid}")


@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok"}), 200


@app.route("/status", methods=["POST"])
def twilio_status_callback():
    status_update = {
        "message_sid": request.values.get("MessageSid"),
        "message_status": request.values.get("MessageStatus"),
        "call_sid": request.values.get("CallSid"),
        "call_status": request.values.get("CallStatus"),
        "to": request.values.get("To"),
        "from": request.values.get("From"),
        "error_code": request.values.get("ErrorCode"),
        "error_message": request.values.get("ErrorMessage"),
    }

    print(f"Twilio status callback received: {status_update}")
    return "", 204

@app.route("/whatsapp", methods=['POST'])
def incoming_whatsapp():
    sender = request.values.get('From', '')
    message_body = request.values.get('Body', '').strip().lower()
    print(f"Incoming WhatsApp message from {sender}: {message_body}")
    
    # Strictly reject any unauthorized WhatsApp users
    if sender != APPROVED_SENDER:
        print("Rejected unauthorized WhatsApp sender.")
        return twiml_response()

    # Command Logic
    if message_body == "open calculator":
        try:
            subprocess.Popen(["calc.exe"]) # Use 'open -a Calculator' on macOS
            send_whatsapp_reply(sender, "Calculator is now open on the laptop.")
            return twiml_response()
        except Exception as exc:
            print(f"Failed to open calculator: {exc}")
            send_whatsapp_reply(sender, "I tried to open Calculator, but something went wrong on the laptop.")
            return twiml_response()
        
    elif message_body == "run script":
        subprocess.Popen(["python", "your_app_script.py"])

    return twiml_response()

if __name__ == "__main__":
    app.run(port=5000)
