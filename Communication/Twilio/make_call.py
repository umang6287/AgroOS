import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

# 1. Replace these with your actual Twilio console credentials
ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')

# 2. Replace these with your phone numbers (Must include country code, e.g., +1 or +91)
TWILIO_NUMBER = os.getenv('TWILIO_TRIAL_NUMBER') 
MY_MOBILE = os.getenv('VERIFIED_MOBILE_NUMBER')     

def trigger_laptop_alert(message="Warning! An event has been triggered on your laptop."):
    # Initialize the Twilio client
    client = Client(ACCOUNT_SID, AUTH_TOKEN)

    print("Triggering call from laptop...")

    # We use inline TwiML to give the phone instructions when you pick up
    inline_twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
    <Response>
        <Say voice="Polly.Aditi" language="hi-IN">{message}</Say>
    </Response>
    """

    try:
        call = client.calls.create(
            twiml=inline_twiml,      # The instructions executed upon answering
            to=MY_MOBILE,            # Your phone
            from_=TWILIO_NUMBER      # Your Twilio virtual phone
        )
        print(f"Success! Phone is ringing. Call SID: {call.sid}")
        
    except Exception as e:
        print(f"Failed to trigger call: {e}")

if __name__ == "__main__":
    custom_message = "नमस्कार! हा पायथन कडून आलेला एक संदेश आहे."
    trigger_laptop_alert(custom_message)
