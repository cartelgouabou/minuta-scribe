import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Meeting from './components/Meeting/Meeting'
import Prompts from './components/Prompts/Prompts'
import { useTheme } from './contexts/ThemeContext'
import './App.css'

function App() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <h1 className="app-title">Minuta</h1>
          <nav className="nav">
            <Link to="/">Meeting</Link>
            <Link to="/prompts">Prompts</Link>
            <button onClick={toggleTheme} className="theme-toggle" title={`Basculer en mode ${theme === 'dark' ? 'clair' : 'sombre'}`}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </nav>
        </header>
        <main className="main">
          <Routes>
            <Route path="/" element={<Meeting />} />
            <Route path="/prompts" element={<Prompts />} />
          </Routes>
        </main>
        <footer className="app-footer">
          <div className="footer-content">
            <p>Minuta - Transcription et Génération de Comptes Rendus © {new Date().getFullYear()}</p>
            <div className="footer-logo">
              <img 
                src="/logo.png" 
                alt="Logo Minuta" 
                onError={(e) => {
                  // Si le logo n'existe pas, masquer l'image silencieusement
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          </div>
        </footer>
      </div>
    </Router>
  )
}

export default App
