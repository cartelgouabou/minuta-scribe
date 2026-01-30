import { useState, useEffect } from 'react'
import { getPrompts, generateSummary, getModels } from '../../services/api'
import { Prompt, ModelsResponse } from '../../types'
import SummaryActions from './SummaryActions'

interface SummaryGeneratorProps {
  transcription: string
}

function SummaryGenerator({ transcription }: SummaryGeneratorProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [selectedPromptId, setSelectedPromptId] = useState<number | null>(null)
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [defaultModel, setDefaultModel] = useState<string>('llama3.2:3b')
  const [provider, setProvider] = useState<string>('ollama')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [summary, setSummary] = useState<string>('')
  const [editedSummary, setEditedSummary] = useState<string>('')
  const [isEdited, setIsEdited] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPrompts()
    loadModels()
  }, [])

  // Recharger les modèles quand la fenêtre reprend le focus (au cas où la config a changé)
  useEffect(() => {
    const handleFocus = () => {
      loadModels()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  useEffect(() => {
    // Mettre à jour le modèle sélectionné quand le modèle par défaut change
    if (defaultModel && !selectedModel) {
      setSelectedModel(defaultModel)
    }
  }, [defaultModel])

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

  const loadModels = async () => {
    try {
      const modelsData: ModelsResponse = await getModels()
      setAvailableModels(modelsData.models)
      setProvider(modelsData.provider)
      if (modelsData.default_model) {
        setDefaultModel(modelsData.default_model)
        setSelectedModel(modelsData.default_model)
      }
    } catch (err) {
      console.error('Error loading models:', err)
      // En cas d'erreur, utiliser les valeurs par défaut
      setAvailableModels(['llama3.2:3b'])
      setDefaultModel('llama3.2:3b')
      setSelectedModel('llama3.2:3b')
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
        model: selectedModel,
      })
      setSummary(result.summary)
      setEditedSummary(result.summary)
      setIsEdited(false)
    } catch (err) {
      console.error('Error generating summary:', err)
      setError('Erreur lors de la génération du compte rendu')
    } finally {
      setLoading(false)
    }
  }

  const handleSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setEditedSummary(newValue)
    setIsEdited(newValue !== summary)
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
      <div className="form-group">
        <label htmlFor="model-select">
          Modèle LLM ({provider}) :
        </label>
        <select
          id="model-select"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={loading || availableModels.length === 0}
        >
          {availableModels.length === 0 ? (
            <option value="">Chargement...</option>
          ) : (
            availableModels.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))
          )}
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
            <div className="summary-header">
              <h3>Compte rendu</h3>
              {isEdited && (
                <span className="edit-indicator" title="Le compte rendu a été modifié">
                  ✏️ Modifié
                </span>
              )}
            </div>
            <textarea
              className="summary-content-editable"
              value={editedSummary}
              onChange={handleSummaryChange}
              placeholder="Le compte rendu généré apparaîtra ici. Vous pouvez l'éditer avant de l'exporter."
              rows={15}
            />
            <div className="summary-hint">
              💡 Vous pouvez modifier le compte rendu ci-dessus avant de l'exporter ou de le copier.
            </div>
          </div>
          <SummaryActions transcription={transcription} summary={editedSummary} />
        </>
      )}
    </div>
  )
}

export default SummaryGenerator
