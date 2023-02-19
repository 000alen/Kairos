import time
import requests

while True:
    requests.get("http://localhost:5000/ping/test")
    time.sleep(1)
