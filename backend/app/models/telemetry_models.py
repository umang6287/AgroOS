from pydantic import BaseModel


class TelemetryReading(BaseModel):
    zoneId: str
    soilMoisturePct: float
    temperatureC: float = 0.0
    humidityPct: float = 0.0
    waterTankPct: float = 0.0
