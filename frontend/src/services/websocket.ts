import { TranscriptionMessage } from '../types'

export function createTranscriptionWebSocket(
  onMessage: (message: TranscriptionMessage) => void,
  onError: (error: Error) => void
): WebSocket {
  const ws = new WebSocket('ws://localhost:8000/ws/transcribe')

  ws.onopen = () => {
    console.log('WebSocket connected')
  }

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      onMessage(data as TranscriptionMessage)
    } catch (err) {
      console.error('Error parsing WebSocket message:', err)
      onError(new Error('Invalid message format'))
    }
  }

  ws.onerror = (error) => {
    console.error('WebSocket error:', error)
    onError(new Error('WebSocket connection error'))
  }

  ws.onclose = () => {
    console.log('WebSocket disconnected')
  }

  return ws
}
