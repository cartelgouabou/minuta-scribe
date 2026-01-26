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

  // Fonction pour détecter et supprimer les chevauchements de texte
  const mergeTranscription = (current: string, newText: string): string => {
    if (!current || !current.trim()) {
      return newText.trim()
    }

    const currentTrimmed = current.trim()
    const newTrimmed = newText.trim()

    // Si le nouveau texte est déjà complètement contenu dans le texte actuel, ne rien ajouter
    if (currentTrimmed.includes(newTrimmed)) {
      return currentTrimmed
    }

    // Détecter le chevauchement en comparant les derniers mots du texte actuel
    // avec les premiers mots du nouveau texte
    const currentWords = currentTrimmed.split(/\s+/)
    const newWords = newTrimmed.split(/\s+/)

    // Chercher un chevauchement en comparant de 1 à min(10, longueur) mots
    let overlapLength = 0
    const maxOverlap = Math.min(10, Math.min(currentWords.length, newWords.length))

    for (let i = 1; i <= maxOverlap; i++) {
      const currentEnd = currentWords.slice(-i).join(' ').toLowerCase()
      const newStart = newWords.slice(0, i).join(' ').toLowerCase()

      if (currentEnd === newStart) {
        overlapLength = i
      }
    }

    // Si on a trouvé un chevauchement, ne garder que la partie non dupliquée
    if (overlapLength > 0) {
      const nonOverlappingWords = newWords.slice(overlapLength)
      if (nonOverlappingWords.length > 0) {
        // Ajouter un espace si nécessaire
        const separator = currentTrimmed.endsWith(' ') || currentTrimmed.endsWith('.') || 
                         currentTrimmed.endsWith('!') || currentTrimmed.endsWith('?') ? '' : ' '
        return currentTrimmed + separator + nonOverlappingWords.join(' ')
      }
      // Si tout le nouveau texte est déjà dans l'ancien, retourner l'ancien
      return currentTrimmed
    }

    // Pas de chevauchement détecté, ajouter le nouveau texte avec un espace
    const separator = currentTrimmed.endsWith(' ') || currentTrimmed.endsWith('.') || 
                     currentTrimmed.endsWith('!') || currentTrimmed.endsWith('?') ? '' : ' '
    return currentTrimmed + separator + newTrimmed
  }

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

      // Utiliser un timeout pour détecter les vraies erreurs de connexion
      let connectionTimeout: ReturnType<typeof setTimeout> | null = null
      let connectionEstablished = false

      ws.onopen = () => {
        connectionEstablished = true
        if (connectionTimeout) {
          clearTimeout(connectionTimeout)
          connectionTimeout = null
        }
        // Envoyer la langue sélectionnée
        ws.send(JSON.stringify({ language }))
        mediaRecorder.start(100) // Envoyer des chunks toutes les 100ms
        setIsRecording(true)
        setError(null)
        accumulatedTranscriptionRef.current = '' // Réinitialiser la transcription accumulée
        onTranscriptionUpdate('') // Réinitialiser la transcription dans l'UI
        onRecordingStart()
      }

      // Détecter les vraies erreurs de connexion avec un délai
      connectionTimeout = setTimeout(() => {
        if (!connectionEstablished && ws.readyState !== WebSocket.OPEN) {
          setError('Erreur de connexion WebSocket. Vérifiez que le serveur est démarré.')
          setIsRecording(false)
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
          }
        }
      }, 3000) // Attendre 3 secondes avant d'afficher l'erreur

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('Message WebSocket reçu:', data)
          if (data.type === 'partial') {
            // Accumuler les transcriptions partielles avec détection de chevauchement
            const newText = data.text.trim()
            console.log('Transcription partielle reçue:', newText)
            if (newText) {
              const current = accumulatedTranscriptionRef.current
              // Utiliser la fonction de fusion intelligente pour éviter les doublons
              accumulatedTranscriptionRef.current = mergeTranscription(current, newText)
              console.log('Transcription accumulée mise à jour:', accumulatedTranscriptionRef.current)
              
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
        // Ne pas afficher l'erreur immédiatement, attendre le timeout
        // ou vérifier si la connexion est vraiment fermée
        if (ws.readyState === WebSocket.CLOSED && !connectionEstablished) {
          setError('Erreur de connexion WebSocket. Vérifiez que le serveur est démarré.')
          setIsRecording(false)
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
          }
        }
      }

      ws.onclose = (event) => {
        if (connectionTimeout) {
          clearTimeout(connectionTimeout)
          connectionTimeout = null
        }
        // Ne pas afficher d'erreur si la fermeture est normale (code 1000)
        if (event.code !== 1000 && event.code !== 1001 && !connectionEstablished) {
          setError('Connexion WebSocket fermée. Réessayez.')
        }
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
