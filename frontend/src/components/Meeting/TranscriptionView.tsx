import { useState, useEffect } from 'react'

interface TranscriptionViewProps {
  transcription: string
  setTranscription: (text: string) => void
  isRecording: boolean
  isTranscribing?: boolean
}

function TranscriptionView({
  transcription,
  setTranscription,
  isRecording,
  isTranscribing = false,
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
    : "Traitement de la transcription finale en cours... Veuillez patienter."

  // Afficher le spinner si :
  // - On est en train d'enregistrer ET qu'on n'a pas encore de transcription
  // - OU si la transcription finale est en cours de traitement (après l'arrêt de l'enregistrement)
  // Le spinner continue même s'il y a des transcriptions partielles, jusqu'à la transcription finale
  const showLoading = (isRecording && !editableText) || isTranscribing
  
  // Déterminer le placeholder selon l'état
  const getPlaceholder = () => {
    if (editableText) {
      return "Éditez la transcription ici ou collez une transcription depuis une autre application"
    }
    return "Lancer l'enregistrement pour générer une transcription, ou collez une transcription depuis une autre application"
  }

  return (
    <div className="transcription-view">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <h2 style={{ margin: 0 }}>Transcription</h2>
        {isTranscribing && (
          <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px', margin: 0 }}></div>
        )}
      </div>
      {showLoading && !editableText ? (
        <div className="transcription-loading">
          <div className="spinner"></div>
          <p className="loading-message">
            {loadingMessage}
          </p>
        </div>
      ) : (
        <>
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
          {isTranscribing && editableText && (
            <p style={{ 
              marginTop: '0.5rem', 
              fontSize: '0.875rem', 
              color: 'var(--text-secondary)',
              fontStyle: 'italic',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', margin: 0 }}></div>
              Traitement de la transcription finale en cours...
            </p>
          )}
        </>
      )}
    </div>
  )
}

export default TranscriptionView
