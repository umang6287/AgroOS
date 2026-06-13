import os
import platform
import subprocess
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes


def load_env_file(file_path=".env"):
    if not os.path.exists(file_path):
        return

    with open(file_path, "r", encoding="utf-8") as env_file:
        for line in env_file:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue

            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_env_file()

BOT_TOKEN = os.getenv("BOT_TOKEN")


# Function to open the calculator based on the OS
def open_calculator():
    current_os = platform.system()
    try:
        if current_os == "Windows":
            subprocess.Popen("calc.exe")
        elif current_os == "Darwin":  # macOS
            subprocess.Popen(["open", "-a", "Calculator"])
        elif current_os == "Linux":
            # Tries common Linux calculator names
            for calc in ["gnome-calculator", "kcalc", "bc"]:
                try:
                    subprocess.Popen([calc])
                    break
                except FileNotFoundError:
                    continue
        print("Calculator opened successfully.")
    except Exception as e:
        print(f"Failed to open calculator: {e}")


# Telegram Command Handler
async def opencalc_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Command received! Opening calculator...")
    open_calculator()


def main():
    if not BOT_TOKEN:
        print("Missing BOT_TOKEN. Add it to the .env file.")
        return

    # Initialize the bot application
    app = Application.builder().token(BOT_TOKEN).build()

    # Register the /opencalc command
    app.add_handler(CommandHandler("opencalc", opencalc_handler))

    print("Listener script is running... Waiting for commands.")
    # Keep the script running and listening for updates
    app.run_polling()


if __name__ == "__main__":
    main()
