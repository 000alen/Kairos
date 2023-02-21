import asyncio
import y_py as Y
from websockets import connect
from ypy_websocket import WebsocketProvider


async def client():
    ydoc = Y.YDoc()
    async with connect("ws://localhost:1234/my-roomname") as websocket:
        WebsocketProvider(ydoc, websocket)

        print(
            ydoc.get_map("doc"),
            ydoc.get_array("doc"),
            ydoc.get_text("doc"),
            ydoc.get_xml_element("doc"),
            ydoc.get_xml_text("doc"),
        )


asyncio.run(client())
