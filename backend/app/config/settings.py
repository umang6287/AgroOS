from pydantic import BaseModel


class Settings(BaseModel):
    demo_mode: bool = True
    database_url: str = "sqlite:///./agrios.db"
