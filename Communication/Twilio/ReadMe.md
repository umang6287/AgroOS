# Twilio Communication Scripts

This folder contains small Python scripts for sending SMS, WhatsApp messages, and voice calls with Twilio, plus a Flask webhook that receives WhatsApp messages through Twilio and can run local actions.

The project is useful for local Twilio experiments, laptop alerts, and webhook testing through ngrok. Treat the inbound command script with extra care before using it outside a private development environment because it can execute local programs.

## Scripts

| Script | Purpose | How it works |
| --- | --- | --- |
| `send_sms.py` | Sends an outbound SMS from your Twilio phone number to your verified mobile number. | Loads Twilio credentials from `.env`, creates a `twilio.rest.Client`, then calls `client.messages.create(...)`. |
| `make_call.py` | Places an outbound phone call and reads a message when the call is answered. | Loads Twilio credentials and phone numbers from `.env`, then calls `client.calls.create(...)` with inline TwiML containing a `<Say>` instruction. |
| `whatsapp_msg.py` | Sends an outbound WhatsApp message through the Twilio WhatsApp sender. | Loads Twilio credentials, destination number, and WhatsApp sender from `.env`, then calls `client.messages.create(...)` using `whatsapp:` address prefixes. |
| `whatsappMe.py` | Runs a local Flask webhook for inbound WhatsApp commands and Twilio status callbacks. | Twilio sends incoming WhatsApp messages to `/whatsapp`. The script checks `APPROVED_SENDER`, performs supported commands, and sends command confirmations back with the Twilio REST API. The `/status` route logs delivery/call status callbacks only. |

## Requirements

- Python 3.10 or later recommended.
- A Twilio account.
- A Twilio phone number that supports SMS and voice.
- Twilio WhatsApp Sandbox or an approved WhatsApp Business sender.
- ngrok for exposing the local Flask webhook to Twilio during development.

Install Python dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install twilio python-dotenv flask
```

If PowerShell blocks virtual environment activation, run:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

## Environment Variables

Create a `.env` file in this folder. Do not commit it to source control.

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_TRIAL_NUMBER=+15551234567
VERIFIED_MOBILE_NUMBER=+919876543210
TWILIO_WHATSAPP_NUMBER=+14155238886
APPROVED_SENDER=whatsapp:+919876543210
```

Variable details:

- `TWILIO_ACCOUNT_SID`: Twilio Account SID from the Twilio Console.
- `TWILIO_AUTH_TOKEN`: Twilio Auth Token from the Twilio Console.
- `TWILIO_TRIAL_NUMBER`: Your Twilio SMS/voice phone number in E.164 format.
- `VERIFIED_MOBILE_NUMBER`: Your destination phone number in E.164 format. Trial Twilio accounts can usually send only to verified numbers.
- `TWILIO_WHATSAPP_NUMBER`: Twilio WhatsApp sender number without the `whatsapp:` prefix. For the Twilio Sandbox this is commonly `+14155238886`.
- `APPROVED_SENDER`: The exact inbound WhatsApp sender allowed to trigger commands, including the `whatsapp:` prefix.

E.164 format means country code plus number with no spaces, for example `+14155552671` or `+919876543210`.

## Create a Twilio Account

1. Go to [Twilio Sign Up](https://www.twilio.com/try-twilio) and create an account.
2. Verify your email address and phone number.
3. Open the [Twilio Console](https://console.twilio.com/).
4. Copy your `Account SID` and `Auth Token` into `.env`.
5. Buy or select a Twilio phone number from **Phone Numbers > Manage > Buy a number**.
6. Make sure the number supports the channels you need, such as SMS and Voice.
7. For a trial account, add your personal phone number under verified caller IDs or verified recipients before sending messages or calls.

## Enable WhatsApp in Twilio

For development, use the Twilio WhatsApp Sandbox:

1. Open Twilio Console.
2. Go to **Messaging > Try it out > Send a WhatsApp message** or search for **WhatsApp Sandbox**.
3. Follow the join instructions shown by Twilio. Usually this means sending a code from your WhatsApp account to the Twilio sandbox number.
4. Put the sandbox number in `.env` as `TWILIO_WHATSAPP_NUMBER`.
5. Put your own WhatsApp number in `.env` as `VERIFIED_MOBILE_NUMBER`.
6. Put `whatsapp:<your-number>` in `.env` as `APPROVED_SENDER`.

For production, use an approved WhatsApp Business sender instead of the sandbox. Production WhatsApp messaging usually requires business verification, approved templates for business-initiated conversations, and compliance with WhatsApp policies.

## Create an ngrok Account

ngrok is used so Twilio can reach your local Flask server while you are developing.

1. Go to [ngrok Sign Up](https://dashboard.ngrok.com/signup) and create an account.
2. Download ngrok from [ngrok Downloads](https://ngrok.com/download).
3. Install or unzip ngrok.
4. In the ngrok dashboard, copy your authtoken.
5. Configure ngrok:

```powershell
ngrok config add-authtoken <your-ngrok-authtoken>
```

6. Start a public tunnel to the Flask app:

```powershell
ngrok http 5000
```

ngrok will show a forwarding URL similar to:

```text
https://abc123.ngrok-free.app -> http://localhost:5000
```

The local Flask app runs at:

```text
http://localhost:5000
```

The Twilio webhook URL should be:

```text
https://abc123.ngrok-free.app/whatsapp
```

Replace `https://abc123.ngrok-free.app` with the actual HTTPS forwarding URL shown in your ngrok terminal.

## Run the Scripts

Activate the virtual environment first:

```powershell
.\.venv\Scripts\Activate.ps1
```

Send an SMS:

```powershell
python send_sms.py
```

Make a voice call:

```powershell
python make_call.py
```

Send a WhatsApp message:

```powershell
python whatsapp_msg.py
```

Run the inbound WhatsApp webhook:

```powershell
python whatsappMe.py
```

The Flask app starts locally on:

```text
http://localhost:5000
```

The inbound route is:

```text
POST http://localhost:5000/whatsapp
```

The status callback route is:

```text
POST http://localhost:5000/status
```

When using ngrok, Twilio must call the public HTTPS route:

```text
POST https://<your-ngrok-domain>/whatsapp
```

If you configure Twilio status callbacks, use:

```text
POST https://<your-ngrok-domain>/status
```

## Configure the Twilio WhatsApp Webhook

1. Start the Flask app:

```powershell
python whatsappMe.py
```

2. Start ngrok in a second terminal:

```powershell
ngrok http 5000
```

3. Copy the HTTPS forwarding URL from ngrok.
4. In Twilio Console, open the WhatsApp Sandbox settings or your WhatsApp sender settings.
5. Set **When a message comes in** to:

```text
https://<your-ngrok-domain>/whatsapp
```

6. Set the method to `POST`.
7. Save the configuration.
8. Send a WhatsApp message to the Twilio sandbox/sender from the approved WhatsApp number.

Supported inbound commands in `whatsappMe.py`:

- `open calculator`: opens the Windows Calculator app and sends a WhatsApp confirmation back to the same conversation: `Calculator is now open on the laptop.`
- `run script`: runs `your_app_script.py` with Python.

The confirmation for `open calculator` is sent with Twilio's REST API instead of TwiML returned from the webhook. This makes the reply explicit and avoids depending on Twilio's inbound webhook response handling.

## Status Callback Behavior

`whatsappMe.py` includes a `POST /status` route for Twilio status callbacks. This route is intentionally logging-only.

Example events Twilio may send:

- `sent`
- `delivered`
- `read`
- `failed`
- `undelivered`
- call statuses such as `initiated`, `ringing`, `answered`, and `completed`

The route prints the callback data in the Flask terminal and returns `204 No Content`.

Important: do not send a WhatsApp/SMS message from inside `/status` for every callback. A status notification message can create its own `sent`, `delivered`, and `read` callbacks, which can create a recursive message loop.

For debugging, watch the Flask terminal for output like:

```text
Twilio status callback received: {'message_sid': 'SM...', 'message_status': 'delivered', ...}
```

For production, store these callback events in a database or log pipeline instead of sending them back to the WhatsApp conversation.

## Production Readiness Checklist

Before using this beyond local development, make the following changes.

### Security

- Never commit `.env` or secrets. Add `.env` to `.gitignore`.
- Rotate the Twilio Auth Token if it has ever been shared or committed.
- Validate Twilio webhook signatures instead of relying only on `APPROVED_SENDER`.
- Avoid running arbitrary local commands from inbound messages.
- Replace `subprocess.Popen(["python", "your_app_script.py"])` with an allowlisted, fully qualified script path.
- Add authentication and authorization for any command-like endpoint.
- Log inbound requests safely without printing secrets or full personal phone numbers.
- Use least-privilege credentials and separate development, staging, and production Twilio projects.

### Reliability

- Add clear startup validation for missing environment variables.
- Add structured logging instead of `print`.
- Add retry handling for transient Twilio API errors where appropriate.
- Return valid TwiML responses using `twilio.twiml.messaging_response.MessagingResponse`.
- Run Flask behind a production WSGI server such as Waitress or Gunicorn. On Windows, Waitress is a practical option.
- Use a stable public domain in production instead of a temporary ngrok URL.

### Code Quality

- Move shared Twilio client setup into a common helper module.
- Move message text into configuration or templates.
- Save source files as UTF-8 and replace any garbled text strings with clean Hindi, Marathi, Gujarati, or English text as intended.
- Add a `requirements.txt` or `pyproject.toml`.
- Add tests for environment validation and webhook command parsing.

### Compliance

- Get user consent before sending SMS, WhatsApp messages, or voice calls.
- Respect opt-out requests such as `STOP`.
- Use approved WhatsApp templates for production business-initiated messages.
- Follow Twilio, WhatsApp, and local telecom regulations for your target countries.

## Suggested `.gitignore`

```gitignore
.env
.venv/
__pycache__/
*.pyc
```

## Troubleshooting

### Authentication failed

Check `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`. If the token was exposed, rotate it in the Twilio Console.

### Trial account cannot send to a number

Verify the destination number in the Twilio Console. Trial accounts are restricted.

### WhatsApp message fails

Make sure your WhatsApp number has joined the Twilio Sandbox and that both numbers include the correct `whatsapp:` prefix in API calls. In this project, `TWILIO_WHATSAPP_NUMBER` should be stored without the prefix because the script adds it.

### Twilio webhook is not called

Confirm that:

- `python whatsappMe.py` is running.
- `ngrok http 5000` is running.
- The Twilio webhook uses the HTTPS ngrok URL ending in `/whatsapp`.
- The Twilio webhook method is `POST`.

### Calculator opens but no confirmation message arrives

Confirm that:

- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_WHATSAPP_NUMBER` are set in `.env`.
- `TWILIO_WHATSAPP_NUMBER` does not include the `whatsapp:` prefix. The script adds it.
- Your WhatsApp number has joined the Twilio Sandbox, or your production WhatsApp sender is approved.
- The Flask terminal prints `WhatsApp reply sent. SID: SM...`.
- If the terminal prints a Twilio error, fix that error first. Common causes are an unjoined sandbox user, an invalid WhatsApp sender, or using a trial account with an unverified destination.

### Too many status update messages arrive

That means `/status` or another callback handler is sending a new WhatsApp/SMS message for every delivery status event. Remove that send logic and keep status callbacks logging-only or database-only.

In this project, `/status` should only print the callback and return `204`.

### The inbound command is ignored

Check that `APPROVED_SENDER` exactly matches Twilio's inbound `From` value, for example:

```env
APPROVED_SENDER=whatsapp:+919876543210
```

## Recommended Next Improvements

For a more production-grade version of this project, consider adding:

- `requirements.txt`
- `.gitignore`
- `config.py` for validated environment loading
- `twilio_client.py` for shared Twilio client setup
- `app.py` as the Flask entrypoint
- `tests/` for webhook and command validation
- Twilio request signature verification middleware
