import queue

from typing import Dict, List, Optional
from uuid import uuid4


def uuid() -> str:
    return str(uuid4())


class EventEmitter:
    qs: Dict[str, List[queue.Queue]]

    def __init__(self):
        self.qs = {}

    @staticmethod
    def format_sse(data: str, event: Optional[str] = None) -> str:
        msg = f"data: {data}\n\n"
        if event is not None:
            msg = f"event: {event}\n{msg}"
        return msg

    def listen(self, id: str):
        if id not in self.qs:
            self.qs[id] = []

        q = queue.Queue()
        self.qs[id].append(q)
        return q

    def emit(self, id: str, message: str):
        if id not in self.qs:
            return

        listeners = self.qs[id]

        for i in reversed(range(len(listeners))):
            try:
                listeners[i].put_nowait(message)
            except queue.Full:
                del listeners[i]
