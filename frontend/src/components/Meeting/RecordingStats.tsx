import { useState, useEffect } from 'react'

interface RecordingStatsProps {
  startTime: number
  transcription: string
}

function RecordingStats({ startTime, transcription }: RecordingStatsProps) {
  const [elapsedTime, setElapsedTime] = useState<number>(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const wordCount = transcription.trim() ? transcription.trim().split(/\s+/).length : 0

  return (
    <div className="recording-stats">
      <div className="stat-item">
        <span className="stat-label">Durée :</span>
        <span className="stat-value">{formatTime(elapsedTime)}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Mots transcrits :</span>
        <span className="stat-value">{wordCount}</span>
      </div>
    </div>
  )
}

export default RecordingStats
