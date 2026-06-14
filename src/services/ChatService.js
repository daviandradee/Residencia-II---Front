const API = import.meta.env.VITE_API_URL || '';

export async function sendChatMessage({ roomConfig, messages, message }) {
  const res = await fetch(`${API}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomConfig, messages, message }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Erro ${res.status}`);
  }

  const data = await res.json();
  return data.reply;
}
