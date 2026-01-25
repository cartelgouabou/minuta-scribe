import { useState, useEffect } from 'react'

interface TranscriptionViewProps {
  transcription: string
  setTranscription: (text: string) => void
  isRecording: boolean
}

function TranscriptionView({
  transcription,
  setTranscription,
  isRecording,
}: TranscriptionViewProps) {
  const [editableText, setEditableText] = useState<string>(transcription)
  const [wasRecording, setWasRecording] = useState<boolean>(false)

  useEffect(() => {
    if (isRecording) {
      // Pendant l'enregistrement, on cache la transcription et on affiche le loader
      setWasRecording(true)
    } else {
      // Une fois l'enregistrement terminé
      if (transcription) {
        // Si la transcription est disponible, l'afficher
        setEditableText(transcription)
        setWasRecording(false)
      }
      // Si pas encore de transcription mais qu'on vient de terminer l'enregistrement,
      // on garde wasRecording à true pour continuer à afficher le loader
    }
  }, [transcription, isRecording])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setEditableText(newText)
    setTranscription(newText)
  }

  const loadingMessage = isRecording 
    ? "Transcription en cours... La transcription sera affichée à la fin de l'enregistrement."
    : "Traitement de la transcription en cours... Veuillez patienter."

  // Afficher le spinner seulement si on est en train d'enregistrer OU si on vient de terminer
  // l'enregistrement et qu'on attend encore la transcription finale
  const showLoading = isRecording || (wasRecording && !transcription)

  return (
    <div className="transcription-view">
      <h2>Transcription</h2>
      {showLoading ? (
        <div className="transcription-loading">
          <div className="spinner"></div>
          <p className="loading-message">
            {loadingMessage}
          </p>
        </div>
      ) : (
        <textarea
          value={editableText}
          onChange={handleChange}
          readOnly={false}
          placeholder="Éditez la transcription ici"
          rows={10}
          style={{ 
            width: '100%', 
            padding: '1rem', 
            fontSize: '1rem'
          }}
        />
      )}
    </div>
  )
}

export default TranscriptionView
