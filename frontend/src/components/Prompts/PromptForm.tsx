import { useState, useEffect } from 'react'
import { Prompt } from '../../types'

interface PromptFormProps {
  prompt: Prompt | null
  onSubmit: (id: number | null, title: string, content: string) => void
  onCancel: () => void
}

function PromptForm({ prompt, onSubmit, onCancel }: PromptFormProps) {
  const [title, setTitle] = useState<string>('')
  const [content, setContent] = useState<string>('')

  useEffect(() => {
    if (prompt) {
      setTitle(prompt.title)
      setContent(prompt.content)
    } else {
      setTitle('')
      setContent('')
    }
  }, [prompt])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(prompt?.id || null, title, content)
    if (!prompt) {
      setTitle('')
      setContent('')
    }
  }

  return (
    <div className="prompt-form" style={{ marginTop: '2rem' }}>
      <h2>{prompt ? 'Modifier le prompt' : 'Créer un nouveau prompt'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Titre :</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
          />
        </div>
        <div className="form-group">
          <label htmlFor="content">Contenu :</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={10}
            style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {prompt ? 'Modifier' : 'Créer'}
          </button>
          {prompt && (
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              Annuler
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default PromptForm
