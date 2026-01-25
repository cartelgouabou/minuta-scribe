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
    // Mettre à jour le texte éditable quand la transcription change
    // Si on est en train d'enregistrer, on met à jour automatiquement
    // Si on n'est plus en train d'enregistrer, on met à jour aussi (pour la transcription finale)
    setEditableText(transcription)
  }, [transcription])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setEditableText(newText)
    setTranscription(newText)
  }

  return (
    <div className="transcription-view">
      <h2>Transcription</h2>
      <textarea
        value={editableText}
        onChange={handleChange}
        disabled={isRecording}
        placeholder={isRecording ? 'Transcription en cours...' : 'Éditez la transcription ici'}
        rows={10}
        style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
      />
    </div>
  )
}

export default TranscriptionView
