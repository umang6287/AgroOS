import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.simulation.engine import generate_current_tick_event, get_recent_simulation_events, get_tick_interval_seconds
from app.websocket.connection_manager import ConnectionManager

router = APIRouter()
manager = ConnectionManager()


@router.websocket("/ws/farm")
async def stream_farm_updates(websocket: WebSocket):
    await manager.connect(websocket)
    last_event_id = None

    try:
        for event in get_recent_simulation_events(limit=12):
            await websocket.send_json(event)
            last_event_id = event["eventId"]

        while True:
            event = generate_current_tick_event()
            if event["eventId"] != last_event_id:
                await websocket.send_json(event)
                last_event_id = event["eventId"]
            await asyncio.sleep(get_tick_interval_seconds())
    except WebSocketDisconnect:
        manager.disconnect(websocket)
