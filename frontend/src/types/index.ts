export interface Prompt {
  id: number
  title: string
  content: string
  created_at: string
  updated_at: string
}

export interface GenerateSummaryRequest {
  transcription: string
  prompt_id: number
}

export interface GenerateSummaryResponse {
  summary: string
}

export interface TranscriptionMessage {
  type: 'partial' | 'final'
  text: string
}
