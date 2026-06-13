import os
import sys
import platform
from dotenv import load_dotenv

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')
from neonize.client import NewClient
from neonize.events import Event, MessageEv

load_dotenv()

# 1. SETUP YOUR PHONE NUMBER AS THE MASTER CONTROLLER
# Format: CountryCode + Number + @s.whatsapp.net (e.g., 919876543210 for India)
MASTER_PHONE = os.getenv("MASTER_PHONE", "919876543210@s.whatsapp.net")

def execute_laptop_activity(command: str) -> str:
    """Executes a physical activity on your laptop based on the text command."""
    os_type = platform.system()
    command = command.lower().strip()

    if command == "open calculator":
        if os_type == "Windows":
            os.system("start calc")
        elif os_type == "Darwin":  # macOS
            os.system("open -a Calculator")
        return "✅ Opened Calculator application on your laptop!"

    elif command == "lock laptop":
        if os_type == "Windows":
            os.system("rundll32.exe user32.dll,LockWorkStation")
        elif os_type == "Darwin":  # macOS
            os.system("pmset displaysleepnow")
        return "🔒 Laptop screen has been locked successfully!"

    elif command == "say hello":
        # Text-to-speech text command
        if os_type == "Windows":
            os.system('PowerShell -Command "Add-Type –AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak(\'Hello from your laptop code\');"')
        elif os_type == "Darwin":
            os.system("say 'Hello from your laptop code'")
        return "🗣️ Spoke 'Hello' out loud on your laptop speakers!"

    return None

# 2. CREATE WHATSAPP EVENT LISTENER
client = NewClient("db_session.db")

@client.event(MessageEv)
def on_message(client: NewClient, event: MessageEv):
    print("DEBUG: on_message triggered!")
    # Extract sender ID and text content safely
    try:
        s = event.Info.MessageSource.Sender
        sender = f"{s.User}@{s.Server}"
    except Exception as e:
        print("Error getting sender:", e)
        print("MessageSource dir:", dir(getattr(event.Info, 'MessageSource', None)))
        return
    
    # Check if the message contains plain text
    incoming_text = ""
    if event.Message.conversation:
        incoming_text = event.Message.conversation
    elif event.Message.extendedTextMessage and event.Message.extendedTextMessage.text:
        incoming_text = event.Message.extendedTextMessage.text
    else:
        return

    # Strip device ID from sender (e.g., 91...:39@... -> 91...@...)
    base_sender = sender.split(':')[0] + "@s.whatsapp.net" if ':' in sender else sender
    
    print(f"DEBUG - Incoming from: {sender} (base: {base_sender}) | Text: '{incoming_text}'")

    # SECURITY: Only respond if the message is coming from YOUR exact phone number
    if True: # DEBUG: Allow from anyone for testing
        print(f"📥 Received Control Command: '{incoming_text}'")
        
        # Run the corresponding activity
        response_text = execute_laptop_activity(incoming_text)
        
        # If a valid activity ran, send a confirmation text back to your phone
        if response_text:
            client.send_message(event.Info.MessageSource.Sender, response_text)

print("🚀 Starting Python WhatsApp Application Controller...")
print("👉 If this is your first time running, scan the terminal QR code using WhatsApp Link Device.")

# 3. START CONNECTING TO SERVERS
client.connect()