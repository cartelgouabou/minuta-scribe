import { useState, useRef, useEffect } from 'react'

interface AudioRecorderProps {
  isRecording: boolean
  setIsRecording: (value: boolean) => void
  onTranscriptionUpdate: (text: string) => void
  language: string
  onRecordingStart: () => void
  onRecordingStop: () => void
  onStreamReady?: (stream: MediaStream | null) => void
}

function AudioRecorder({
  isRecording,
  setIsRecording,
  onTranscriptionUpdate,
  language,
  onRecordingStart,
  onRecordingStop,
  onStreamReady,
}: AudioRecorderProps) {
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const websocketRef = useRef<WebSocket | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const accumulatedTranscriptionRef = useRef<string>('')

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      if (onStreamReady) {
        onStreamReady(stream)
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })
      mediaRecorderRef.current = mediaRecorder

      // Utiliser une URL relative pour fonctionner avec le proxy Nginx en Docker
      // En développement: ws://localhost:5173/ws/transcribe (proxied par Vite)
      // En production Docker: ws://localhost/ws/transcribe (proxied par Nginx)
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsHost = window.location.host
      const ws = new WebSocket(`${wsProtocol}//${wsHost}/ws/transcribe`)
      websocketRef.current = ws

      ws.onopen = () => {
        // Envoyer la langue sélectionnée
        ws.send(JSON.stringify({ language }))
        mediaRecorder.start(100) // Envoyer des chunks toutes les 100ms
        setIsRecording(true)
        setError(null)
        accumulatedTranscriptionRef.current = '' // Réinitialiser la transcription accumulée
        onTranscriptionUpdate('') // Réinitialiser la transcription dans l'UI
        onRecordingStart()
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('Message WebSocket reçu:', data)
          if (data.type === 'partial') {
            // Accumuler les transcriptions partielles
            const newText = data.text.trim()
            console.log('Transcription partielle reçue:', newText)
            if (newText) {
              const current = accumulatedTranscriptionRef.current.trim()
              
              // Si le nouveau texte n'est pas déjà dans la transcription accumulée, l'ajouter
              if (!current || !current.includes(newText)) {
                // Ajouter un espace si nécessaire
                if (current && !current.endsWith(' ') && !current.endsWith('.') && !current.endsWith('!') && !current.endsWith('?')) {
                  accumulatedTranscriptionRef.current += ' '
                }
                accumulatedTranscriptionRef.current += newText
                console.log('Transcription accumulée mise à jour:', accumulatedTranscriptionRef.current)
              }
              
              // Toujours mettre à jour la transcription en temps réel
              onTranscriptionUpdate(accumulatedTranscriptionRef.current)
            }
          } else if (data.type === 'final') {
            console.log('Transcription finale reçue:', data.text)
            // La transcription finale remplace tout
            onTranscriptionUpdate(data.text)
            accumulatedTranscriptionRef.current = data.text
            onRecordingStop()
            // Fermer le WebSocket après avoir reçu la transcription finale
            if (ws.readyState === WebSocket.OPEN) {
              ws.close()
            }
          } else if (data.type === 'error') {
            console.error('Erreur transcription:', data.message)
            setError(data.message || 'Erreur lors de la transcription')
            if (ws.readyState === WebSocket.OPEN) {
              ws.close()
            }
          }
        } catch (err) {
          console.error('Erreur parsing message WebSocket:', err)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setError('Erreur de connexion WebSocket')
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          ws.send(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'stop' }))
          // Ne pas fermer le WebSocket ici, attendre la transcription finale
          // Le WebSocket sera fermé automatiquement quand on reçoit le message final
        }
      }
    } catch (err) {
      console.error('Error starting recording:', err)
      setError('Impossible d\'accéder au microphone')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }
    if (onStreamReady) {
      onStreamReady(null)
    }
    setIsRecording(false)
    onRecordingStop()
  }

  useEffect(() => {
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  return (
    <div className="audio-recorder">
      {error && <div className="error">{error}</div>}
      {!isRecording ? (
        <button onClick={startRecording} className="btn btn-primary">
          Start Recording
        </button>
      ) : (
        <button onClick={stopRecording} className="btn btn-danger">
          Stop Recording
        </button>
      )}
    </div>
  )
}

export default AudioRecorder
