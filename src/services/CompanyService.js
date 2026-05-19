const API = import.meta.env.VITE_API_URL || '';

export async function getCompanySettings(id) {
  const url = `${API}/companies/${id}/settings`;
  
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!res.ok) {
    throw new Error(`Erro ao buscar dados: ${res.status}`);
  }

  return await res.json();
}

export async function getCompanyLatestConfig(id) {
  const url = `${API}/companies/${id}/configs/latest`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) return null;
  return await res.json();
}

export async function saveCompanySettings(id, formData) {
  const url = `${API}/companies/${id}/configs`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `Erro ao salvar: ${res.status}`);
  }

  return await res.json();
}
