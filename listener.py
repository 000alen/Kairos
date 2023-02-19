import sseclient

messages = sseclient.SSEClient("http://localhost:5000/events/test")

for message in messages:
    print(message)
