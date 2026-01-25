import { useEffect, useRef } from 'react'
import './Meeting.css'

interface WaveformProps {
  stream: MediaStream | null
  isRecording: boolean
}

function Waveform({ stream, isRecording }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const bufferLengthRef = useRef<number>(0)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)

  useEffect(() => {
    if (!stream || !isRecording) {
      // Nettoyer si on n'enregistre plus
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect()
        sourceRef.current = null
      }
      analyserRef.current = null
      bufferLengthRef.current = 0
      
      // Effacer le canvas
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      }
      return
    }

    // Initialiser l'audio context et l'analyser
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const analyser = audioContext.createAnalyser()
    const source = audioContext.createMediaStreamSource(stream)

    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.3
    source.connect(analyser)

    audioContextRef.current = audioContext
    analyserRef.current = analyser
    sourceRef.current = source

    const bufferLength = analyser.frequencyBinCount
    bufferLengthRef.current = bufferLength

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Ajuster la taille du canvas
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (rect) {
        canvas.width = rect.width || 800
        canvas.height = 150
      }
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const draw = () => {
      if (!isRecording || !analyserRef.current || bufferLengthRef.current === 0) {
        return
      }

      animationFrameRef.current = requestAnimationFrame(draw)

      const dataArray = new Uint8Array(bufferLengthRef.current)
      analyserRef.current.getByteTimeDomainData(dataArray)

      // Fond avec un contraste élevé
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Ligne centrale plus visible
      const centerY = canvas.height / 2
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, centerY)
      ctx.lineTo(canvas.width, centerY)
      ctx.stroke()

      // Dessiner la forme d'onde symétrique avec une couleur plus contrastée
      ctx.strokeStyle = '#00ff88'
      ctx.lineWidth = 2.5
      ctx.beginPath()

      const sliceWidth = canvas.width / bufferLengthRef.current
      let x = 0

      for (let i = 0; i < bufferLengthRef.current; i++) {
        // Convertir les valeurs (0-255) en amplitude (-1 à 1)
        const v = (dataArray[i] / 128.0) - 1.0
        const y = centerY + (v * centerY * 0.8) // 0.8 pour laisser un peu de marge

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }

        x += sliceWidth
      }

      ctx.stroke()

      // Remplir la forme d'onde pour un effet plus visuel avec un meilleur contraste
      ctx.lineTo(canvas.width, centerY)
      ctx.lineTo(0, centerY)
      ctx.closePath()
      
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, 'rgba(0, 255, 136, 0.4)')
      gradient.addColorStop(0.5, 'rgba(0, 255, 136, 0.15)')
      gradient.addColorStop(1, 'rgba(0, 255, 136, 0.4)')
      
      ctx.fillStyle = gradient
      ctx.fill()
    }

    draw()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect()
      }
    }
  }, [stream, isRecording])

  if (!isRecording) {
    return null
  }

  return (
    <div className="waveform-container">
      <canvas ref={canvasRef} className="waveform-canvas" />
    </div>
  )
}

export default Waveform
