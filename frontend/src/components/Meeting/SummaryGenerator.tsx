import { useState, useEffect } from 'react'
import { getPrompts, generateSummary } from '../../services/api'
import { Prompt } from '../../types'
import SummaryActions from './SummaryActions'

interface SummaryGeneratorProps {
  transcription: string
}

function SummaryGenerator({ transcription }: SummaryGeneratorProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [selectedPromptId, setSelectedPromptId] = useState<number | null>(null)
  const [summary, setSummary] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPrompts()
  }, [])

  const loadPrompts = async () => {
    try {
      const data = await getPrompts()
      setPrompts(data)
      if (data.length > 0) {
        setSelectedPromptId(data[0].id)
      }
    } catch (err) {
      console.error('Error loading prompts:', err)
      setError('Erreur lors du chargement des prompts')
    }
  }

  const handleGenerate = async () => {
    if (!selectedPromptId) {
      setError('Veuillez sélectionner un prompt')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await generateSummary({
        transcription,
        prompt_id: selectedPromptId,
      })
      setSummary(result.summary)
    } catch (err) {
      console.error('Error generating summary:', err)
      setError('Erreur lors de la génération du compte rendu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="summary-generator">
      <h2>Générer le compte rendu</h2>
      <div className="form-group">
        <label htmlFor="prompt-select">Prompt :</label>
        <select
          id="prompt-select"
          value={selectedPromptId || ''}
          onChange={(e) => setSelectedPromptId(Number(e.target.value))}
          disabled={loading}
        >
          <option value="">Sélectionner un prompt</option>
          {prompts.map((prompt) => (
            <option key={prompt.id} value={prompt.id}>
              {prompt.title}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={handleGenerate}
        disabled={loading || !selectedPromptId}
        className="btn btn-primary"
      >
        {loading ? 'Génération...' : 'Générer le compte rendu'}
      </button>
      {error && <div className="error">{error}</div>}
      {summary && (
        <>
          <div className="summary-result">
            <h3>Compte rendu</h3>
            <div className="summary-content">{summary}</div>
          </div>
          <SummaryActions transcription={transcription} summary={summary} />
        </>
      )}
    </div>
  )
}

export default SummaryGenerator
