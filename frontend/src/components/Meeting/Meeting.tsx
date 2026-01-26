import { useState } from 'react'
import AudioRecorder from './AudioRecorder'
import TranscriptionView from './TranscriptionView'
import SummaryGenerator from './SummaryGenerator'
import LanguageSelector from './LanguageSelector'
import RecordingStats from './RecordingStats'
import Waveform from './Waveform'
import './Meeting.css'

function Meeting() {
  const [transcription, setTranscription] = useState<string>('')
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [language, setLanguage] = useState<string>('fr')
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)

  return (
    <div className="meeting">
      <h1>Meeting</h1>
      <div className="meeting-controls">
        <LanguageSelector language={language} setLanguage={setLanguage} disabled={isRecording} />
        <AudioRecorder
          isRecording={isRecording}
          setIsRecording={setIsRecording}
          onTranscriptionUpdate={setTranscription}
          language={language}
          onRecordingStart={() => setRecordingStartTime(Date.now())}
          onRecordingStop={() => setRecordingStartTime(null)}
          onStreamReady={setAudioStream}
        />
      </div>
      {isRecording && recordingStartTime && (
        <RecordingStats startTime={recordingStartTime} />
      )}
      <Waveform stream={audioStream} isRecording={isRecording} />
      <TranscriptionView
        transcription={transcription}
        setTranscription={setTranscription}
        isRecording={isRecording}
      />
      {transcription && transcription.trim() && (
        <SummaryGenerator transcription={transcription} />
      )}
    </div>
  )
}

export default Meeting
