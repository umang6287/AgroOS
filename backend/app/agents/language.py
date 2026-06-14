LANGUAGE_NAMES = {
    "en": "English",
    "mr": "Marathi",
    "hi": "Hindi",
    "gu": "Gujarati",
}


def normalize_language(language: str | None) -> str:
    if not language:
        return "en"
    code = language.split("-", 1)[0].strip().lower()
    return code if code in LANGUAGE_NAMES else "en"


def language_name(language: str | None) -> str:
    return LANGUAGE_NAMES[normalize_language(language)]


def localized_text(language: str | None, key: str, **values) -> str:
    code = normalize_language(language)
    templates = {
        "robot_assigned": {
            "en": "Robot R1 is at {waypoint} on the live patrol route.",
            "mr": "Robot R1 live patrol route var {waypoint} yethe aahe.",
            "hi": "Robot R1 live patrol route par {waypoint} par hai.",
            "gu": "Robot R1 live patrol route par {waypoint} par chhe.",
        },
        "robot_available": {
            "en": "Robot R1 remains available on the live patrol route.",
            "mr": "Robot R1 live patrol route var uplabdh aahe.",
            "hi": "Robot R1 live patrol route par uplabdh hai.",
            "gu": "Robot R1 live patrol route par uplabdh chhe.",
        },
        "communication_alert": {
            "en": "Zone B moisture is critically low. Short irrigation has been scheduled and will be verified in 10 minutes.",
            "mr": "Zone B madhye mati khup sukhi aahe. 12 minute drip sinchan scheduled aahe ani 10 minitat verification honar aahe.",
            "hi": "Zone B ki mitti bahut sukhi hai. 12 minute drip irrigation scheduled hai aur 10 minute mein verification hoga.",
            "gu": "Zone B ma mati khub sukhi chhe. 12 minute drip irrigation scheduled chhe ane 10 minute ma verification thashe.",
        },
        "communication_summary": {
            "en": "Farmer notification prepared through WhatsApp with SMS and phone escalation ready.",
            "mr": "Farmer notification WhatsApp var tayar aahe, SMS ani phone escalation ready aahe.",
            "hi": "Farmer notification WhatsApp par tayar hai, SMS aur phone escalation ready hai.",
            "gu": "Farmer notification WhatsApp par tayar chhe, SMS ane phone escalation ready chhe.",
        },
        "risk_water": {
            "en": "Zone B water stress is high and should be acted on.",
            "mr": "Zone B madhye water stress high aahe ani action garjechi aahe.",
            "hi": "Zone B mein water stress high hai aur action zaroori hai.",
            "gu": "Zone B ma water stress high chhe ane action jaruri chhe.",
        },
        "risk_treatment": {
            "en": "Water stress is high; treatment decisions require farmer review.",
            "mr": "Water stress high aahe; treatment decision sathi farmer review garjecha aahe.",
            "hi": "Water stress high hai; treatment decision ke liye farmer review zaroori hai.",
            "gu": "Water stress high chhe; treatment decision mate farmer review jaruri chhe.",
        },
        "planner_summary": {
            "en": "Scheduled irrigation, robot inspection, communication, and outcome verification.",
            "mr": "Irrigation, robot inspection, communication ani outcome verification scheduled aahe.",
            "hi": "Irrigation, robot inspection, communication aur outcome verification scheduled hai.",
            "gu": "Irrigation, robot inspection, communication ane outcome verification scheduled chhe.",
        },
        "voice_response": {
            "en": "Zone B is dry, irrigation is scheduled, Robot R1 is inspecting the crop, and no heavy rain is expected in the next 6 hours.",
            "mr": "Zone B madhye mati sukhi aahe. 12 minute drip sinchan scheduled aahe, Robot R1 tapasnisathi Zone B madhye aahe, ani pudhchya 6 tasat motha paus expected nahi.",
            "hi": "Zone B sukha hai. 12 minute drip irrigation scheduled hai, Robot R1 crop inspect kar raha hai, aur agle 6 ghante mein tez barish expected nahi hai.",
            "gu": "Zone B sukhu chhe. 12 minute drip irrigation scheduled chhe, Robot R1 crop inspect kari rahyo chhe, ane aagal na 6 kalak ma bhare varsad expected nathi.",
        },
        "voice_summary": {
            "en": "Farm status response generated for the selected language.",
            "mr": "Selected language madhye farm status response tayar kela.",
            "hi": "Selected language mein farm status response tayar hua.",
            "gu": "Selected language ma farm status response tayar thayu.",
        },
    }
    template = templates[key][code]
    return template.format(**values)
