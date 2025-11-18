import asyncio
import websockets
import wave

async def send_audio():
    uri = "ws://localhost:8000/transcribe"

    # Load WAV file
    wav = wave.open("test.wav", "rb")
    chunk_size = 1024

    async with websockets.connect(uri) as websocket:
        data = wav.readframes(chunk_size)

        while data:
            await websocket.send(data)
            response = await websocket.recv()
            print("SERVER:", response)
            data = wav.readframes(chunk_size)

asyncio.run(send_audio())
