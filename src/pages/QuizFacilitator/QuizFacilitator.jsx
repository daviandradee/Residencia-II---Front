import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import localStorage from '../../services/storage';
import { io } from 'socket.io-client';
import { useToast } from '../../components/Toast.jsx';
import './QuizFacilitator.css';

const QuizFacilitator = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [totalQuestions, setTotalQuestions] = useState(10);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const facilitadorToken = localStorage.getItem('facilitadorToken');

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL);
    socket.emit('join_room', code);

    socket.on('quiz_finish', () => {
      navigate(`/facilitador/${code}?token=${facilitadorToken}`);
    });

    socket.on('connect', () => console.log('[QuizFacilitator] socket conectado, sala:', code));

    return () => socket.disconnect();
  }, [code, navigate]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/categories`);
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (err) {
        console.error('Erro ao carregar categorias:', err);
      }
    }
    loadCategories();
  }, []);

  const handleGenerateQuiz = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/quiz/${code}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-facilitator-token': facilitadorToken,
        },
        body: JSON.stringify({ totalQuestions, categoryIds: selectedCategories }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erro ao gerar quiz');
      }

      setSuccess('Quiz gerado e iniciado com sucesso!');
      showToast('Quiz gerado com sucesso!', 'success');
    } catch (err) {
      setError(err.message || 'Erro ao gerar quiz. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="quiz-facilitator">
      <div className="quiz-facilitator-card">
        <div className="quiz-facilitator-header">
          <span className="quiz-facilitator-badge">Etapa do Facilitador</span>
          <h1>Gerar Quiz Interativo</h1>
          <p>Defina a quantidade de perguntas e gere o quiz automaticamente com IA.</p>
        </div>

        <div className="quiz-facilitator-body">
          {categories.length > 0 && (
            <div className="quiz-facilitator-categories-group">
              <label>Selecione as categorias:</label>
              <div className="categories-checkbox-grid">
                {categories.map((cat) => (
                  <label key={cat.id} className="category-checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories((prev) => [...prev, cat.id]);
                        } else {
                          setSelectedCategories((prev) => prev.filter((id) => id !== cat.id));
                        }
                      }}
                      disabled={isLoading}
                    />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="quiz-facilitator-input-group">
            <label htmlFor="totalQuestions">Quantidade de perguntas:</label>
            <input
              id="totalQuestions"
              type="number"
              min={1}
              max={50}
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
              disabled={isLoading}
              className="quiz-facilitator-input"
            />
          </div>

          {error && <p className="quiz-facilitator-error">{error}</p>}
          {success && <p className="quiz-facilitator-success">{success}</p>}

          <button
            className={`quiz-facilitator-btn ${isLoading ? 'loading' : ''}`}
            onClick={handleGenerateQuiz}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="btn-spinner" />
                Gerando...
              </>
            ) : (
              'Gerar e Iniciar Quiz'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizFacilitator;
