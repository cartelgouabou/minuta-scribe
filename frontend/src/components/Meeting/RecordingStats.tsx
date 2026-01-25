import { useState, useEffect } from 'react'

interface RecordingStatsProps {
  startTime: number
}

function RecordingStats({ startTime }: RecordingStatsProps) {
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

  return (
    <div className="recording-stats">
      <div className="stat-item">
        <span className="stat-label">Durée :</span>
        <span className="stat-value">{formatTime(elapsedTime)}</span>
      </div>
    </div>
  )
}

export default RecordingStats
