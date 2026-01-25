interface LanguageSelectorProps {
  language: string
  setLanguage: (lang: string) => void
  disabled: boolean
}

function LanguageSelector({ language, setLanguage, disabled }: LanguageSelectorProps) {
  return (
    <div className="language-selector">
      <label htmlFor="language-select">Langue de transcription :</label>
      <select
        id="language-select"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        disabled={disabled}
        className="language-select"
      >
        <option value="fr">Français</option>
        <option value="en">Anglais</option>
      </select>
    </div>
  )
}

export default LanguageSelector
