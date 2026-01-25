import { TranscriptionMessage } from '../types'

export function createTranscriptionWebSocket(
  onMessage: (message: TranscriptionMessage) => void,
  onError: (error: Error) => void
): WebSocket {
  // Utiliser une URL relative pour fonctionner avec le proxy Nginx en Docker
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsHost = window.location.host
  const ws = new WebSocket(`${wsProtocol}//${wsHost}/ws/transcribe`)

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
