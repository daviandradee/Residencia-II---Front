const API = import.meta.env.VITE_API_URL

export async function getCategories() {
  const res = await fetch(`${API}/categories`)
  if (!res.ok) throw new Error('Erro ao buscar categorias')
  return res.json()
}

export async function createCategory(name) {
  const res = await fetch(`${API}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Erro ao criar categoria')
  return data
}

export async function updateCategory(id, name) {
  const res = await fetch(`${API}/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Erro ao atualizar categoria')
  return data
}

export async function deleteCategory(id) {
  const res = await fetch(`${API}/categories/${id}`, { method: 'DELETE' })
  if (res.status === 204) return
  const data = await res.json()
  throw new Error(data.message || 'Erro ao excluir categoria')
}
