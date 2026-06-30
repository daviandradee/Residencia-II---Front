import localStorage from './storage'
const API = import.meta.env.VITE_API_URL
const companyId = () => localStorage.getItem('companyId')

export async function getQuizQuestions(code) {
  const res = await fetch(`${API}/quiz/${code}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ companyId: companyId() })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Erro ao buscar perguntas')
  }
  return res.json()
}

export async function submitAnswer(code, payload) {
  const res = await fetch(`${API}/quiz/${code}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, companyId: companyId() })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Erro ao enviar resposta')
  }
  return res.json()
}

export async function finishQuiz(code) {
  const res = await fetch(`${API}/quiz/${code}/finish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ companyId: companyId() })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Erro ao finalizar quiz')
  }
  return res.json()
}
