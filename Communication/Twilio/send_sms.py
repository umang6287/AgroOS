import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

# 1. Use your same Twilio credentials from .env
ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')

# 2. Keep the numbers in E.164 format (no spaces)
TWILIO_NUMBER = os.getenv('TWILIO_TRIAL_NUMBER') 
MY_MOBILE = os.getenv('VERIFIED_MOBILE_NUMBER')

def send_laptop_text():
    # Initialize Twilio client
    client = Client(ACCOUNT_SID, AUTH_TOKEN)

    print("Sending SMS from laptop...")

    try:
        # We call client.messages.create instead of client.calls.create
        message = client.messages.create(
            body="तुमच्या लॅपटॉपवरून नमस्कार! हा ट्विलिओ द्वारे एक स्वयंचलित चाचणी संदेश आहे.",
            to=MY_MOBILE,
            from_=TWILIO_NUMBER
        )
        print(f"SMS Sent successfully! Message SID: {message.sid}")
        
    except Exception as e:
        print(f"Failed to send SMS: {e}")

if __name__ == "__main__":
    send_laptop_text()
