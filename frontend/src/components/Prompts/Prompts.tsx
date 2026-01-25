import { useState, useEffect } from 'react'
import PromptList from './PromptList'
import PromptForm from './PromptForm'
import { Prompt } from '../../types'
import { getPrompts, createPrompt, updatePrompt, deletePrompt } from '../../services/api'
import './Prompts.css'

function Prompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPrompts()
  }, [])

  const loadPrompts = async () => {
    setLoading(true)
    try {
      const data = await getPrompts()
      setPrompts(data)
    } catch (err) {
      console.error('Error loading prompts:', err)
      setError('Erreur lors du chargement des prompts')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (id: number | null, title: string, content: string) => {
    try {
      if (id === null) {
        await createPrompt({ title, content })
      } else {
        await updatePrompt(id, { title, content })
        setEditingPrompt(null)
      }
      await loadPrompts()
      setError(null)
    } catch (err) {
      console.error('Error saving prompt:', err)
      setError(id === null ? 'Erreur lors de la création du prompt' : 'Erreur lors de la modification du prompt')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce prompt ?')) {
      return
    }
    try {
      await deletePrompt(id)
      await loadPrompts()
      setError(null)
    } catch (err) {
      console.error('Error deleting prompt:', err)
      setError('Erreur lors de la suppression du prompt')
    }
  }

  const filteredPrompts = prompts.filter((prompt) =>
    prompt.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="prompts">
      <h1>Gestion des Prompts</h1>
      {error && <div className="error">{error}</div>}
      <PromptList
        prompts={filteredPrompts}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onEdit={setEditingPrompt}
        onDelete={handleDelete}
        loading={loading}
      />
      <PromptForm
        prompt={editingPrompt}
        onSubmit={handleSubmit}
        onCancel={() => setEditingPrompt(null)}
      />
    </div>
  )
}

export default Prompts
