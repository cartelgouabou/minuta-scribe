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

  useEffect(() => {
    // Synchroniser editableText avec transcription quand elle change
    if (transcription !== editableText) {
      setEditableText(transcription)
    }
  }, [transcription, editableText])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setEditableText(newText)
    setTranscription(newText)
  }

  const loadingMessage = isRecording 
    ? "Transcription en cours... La transcription sera affichée à la fin de l'enregistrement."
    : "Traitement de la transcription en cours... Veuillez patienter."

  // Afficher le spinner seulement si on est en train d'enregistrer ET qu'on n'a pas encore de transcription
  // Sinon, toujours permettre l'édition/collage
  const showLoading = isRecording && !editableText
  
  // Déterminer le placeholder selon l'état
  const getPlaceholder = () => {
    if (editableText) {
      return "Éditez la transcription ici ou collez une transcription depuis une autre application"
    }
    return "Lancer l'enregistrement pour générer une transcription, ou collez une transcription depuis une autre application"
  }

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
          placeholder={getPlaceholder()}
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
