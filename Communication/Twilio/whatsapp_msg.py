import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

account_sid = os.getenv('TWILIO_ACCOUNT_SID')
auth_token = os.getenv('TWILIO_AUTH_TOKEN')
to_number = os.getenv('VERIFIED_MOBILE_NUMBER')
whatsapp_from = os.getenv('TWILIO_WHATSAPP_NUMBER')

client = Client(account_sid, auth_token)

try:
    message = client.messages.create(
      from_=f'whatsapp:{whatsapp_from}',
      body='નમસ્તે! આ પાયથન તરફથી આવેલો વોટ્સએપ સંદેશ છે. તમારી એપોઇન્ટમેન્ટ 2/1 ના રોજ બપોરે 3 વાગ્યે છે.',
      to=f'whatsapp:{to_number}'
    )
    print(f"WhatsApp message sent successfully! SID: {message.sid}")
except Exception as e:
    print(f"Failed to send WhatsApp message: {e}")
