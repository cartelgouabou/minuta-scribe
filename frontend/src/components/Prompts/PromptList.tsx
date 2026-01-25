import { Prompt } from '../../types'

interface PromptListProps {
  prompts: Prompt[]
  searchQuery: string
  onSearchChange: (query: string) => void
  onEdit: (prompt: Prompt) => void
  onDelete: (id: number) => void
  loading: boolean
}

function PromptList({
  prompts,
  searchQuery,
  onSearchChange,
  onEdit,
  onDelete,
  loading,
}: PromptListProps) {
  return (
    <div className="prompt-list">
      <div className="search-box">
        <input
          type="text"
          placeholder="Rechercher par titre..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
        />
      </div>
      {loading ? (
        <div>Chargement...</div>
      ) : prompts.length === 0 ? (
        <div>Aucun prompt trouvé</div>
      ) : (
        <table style={{ width: '100%', marginTop: '1rem' }}>
          <thead>
            <tr>
              <th>Titre</th>
              <th>Contenu</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {prompts.map((prompt) => (
              <tr key={prompt.id}>
                <td>{prompt.title}</td>
                <td style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {prompt.content.substring(0, 100)}...
                </td>
                <td>
                  <button onClick={() => onEdit(prompt)} className="btn btn-small">
                    Modifier
                  </button>
                  <button
                    onClick={() => onDelete(prompt.id)}
                    className="btn btn-small btn-danger"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default PromptList
