import { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../../services/ChatService';
import './Chat.css';

export default function Chat({ roomConfig }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const reply = await sendChatMessage({
        roomConfig,
        messages: messages,
        message: text,
      });
      setMessages([...next, { role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages([...next, { role: 'assistant', content: `Erro: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="chat-wrapper">
      {open && (
        <div className="chat-box">
          <div className="chat-header">
            <span>🤖 Assistente de Planejamento</span>
            <button onClick={() => setOpen(false)} className="chat-close">✕</button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-empty">
                Olá! Pergunte sobre estoque, margens, operadores ou CAPEX para esta rodada.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                <span>{m.content}</span>
              </div>
            ))}
            {loading && (
              <div className="chat-msg assistant">
                <span className="chat-typing">digitando...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-row">
            <textarea
              className="chat-input"
              rows={2}
              placeholder="Digite sua pergunta..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
            />
            <button className="chat-send" onClick={handleSend} disabled={loading || !input.trim()}>
              ➤
            </button>
          </div>
        </div>
      )}

      <button className="chat-fab" onClick={() => setOpen(o => !o)} title="Assistente IA">
        {open ? '✕' : '💬'}
      </button>
    </div>
  );
}
