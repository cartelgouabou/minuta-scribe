import { Prompt, GenerateSummaryRequest, GenerateSummaryResponse } from '../types'

// Utiliser une URL relative pour fonctionner avec le proxy Nginx en Docker
// En développement local, Vite proxy redirige /api vers localhost:8000
// En production Docker, Nginx proxy redirige /api vers backend:8000
const API_BASE_URL = '/api'

export async function getPrompts(): Promise<Prompt[]> {
  const response = await fetch(`${API_BASE_URL}/prompts`)
  if (!response.ok) {
    throw new Error('Failed to fetch prompts')
  }
  return response.json()
}

export async function getPrompt(id: number): Promise<Prompt> {
  const response = await fetch(`${API_BASE_URL}/prompts/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch prompt')
  }
  return response.json()
}

export async function searchPrompts(query: string): Promise<Prompt[]> {
  const response = await fetch(`${API_BASE_URL}/prompts/search?q=${encodeURIComponent(query)}`)
  if (!response.ok) {
    throw new Error('Failed to search prompts')
  }
  return response.json()
}

export async function createPrompt(data: { title: string; content: string }): Promise<Prompt> {
  const response = await fetch(`${API_BASE_URL}/prompts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to create prompt')
  }
  return response.json()
}

export async function updatePrompt(
  id: number,
  data: { title: string; content: string }
): Promise<Prompt> {
  const response = await fetch(`${API_BASE_URL}/prompts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to update prompt')
  }
  return response.json()
}

export async function deletePrompt(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/prompts/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('Failed to delete prompt')
  }
}

export async function generateSummary(
  request: GenerateSummaryRequest
): Promise<GenerateSummaryResponse> {
  const response = await fetch(`${API_BASE_URL}/generate-summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || 'Failed to generate summary')
  }
  return response.json()
}
