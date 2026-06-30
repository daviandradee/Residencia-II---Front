import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import localStorage from '../../services/storage';
import { io } from 'socket.io-client';
import { getQuizQuestions, submitAnswer, finishQuiz } from '../../services/quizService';
import { useToast } from '../../components/Toast.jsx';
import './QuizPlayer.css';

const QuizPlayer = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [quizStatus, setQuizStatus] = useState('loading'); // loading | active | finished | error
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState(null);

  const companyId = localStorage.getItem('companyId');

  // Carregar perguntas ao montar
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getQuizQuestions(code);
        if (mounted) {
          setQuestions(data.questions || []);
          setQuizStatus('active');
          setTimeLeft(30);
        }
      } catch (err) {
        if (mounted) {
          setErrorMsg(err.message || 'Erro ao carregar quiz');
          setQuizStatus('error');
        }
      }
    }
    load();
    return () => { mounted = false; };
  }, [code]);

  // Timer
  useEffect(() => {
    if (quizStatus !== 'active') return;
    if (isSubmitting) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [quizStatus, isSubmitting, currentIndex]);

  // Disparar time expired quando timeLeft chegar a 0
  useEffect(() => {
    if (quizStatus === 'active' && timeLeft <= 0 && !isSubmitting) {
      handleTimeExpired();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, quizStatus, isSubmitting]);

  // Socket.IO
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL);
    socket.emit('join_room', code);

    socket.on('quiz_finish', () => {
      showToast('Quiz encerrado! Redirecionando...', 'success');
      navigate(`/config/${companyId}?roomCode=${code}`);
    });

    socket.on('connect', () => console.log('[QuizPlayer] socket conectado, sala:', code));

    return () => socket.disconnect();
  }, [code, companyId, navigate, showToast]);

  const handleTimeExpired = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const currentQuestion = questions[currentIndex];
      if (currentQuestion) {
        await submitAnswer(code, {
          questionId: currentQuestion.id,
          timeExpired: true,
          selectedOption: null
        });
      }
    } catch (err) {
      console.error('Erro ao enviar timeExpired:', err);
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      await handleFinishQuiz();
    } else {
      setCurrentIndex(nextIndex);
      setTimeLeft(30);
      setIsSubmitting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, questions, code, isSubmitting]);

  const handleSelectOption = useCallback(async (optionIndex) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const currentQuestion = questions[currentIndex];
      await submitAnswer(code, {
        questionId: currentQuestion.id,
        selectedOption: optionIndex,
        timeExpired: false
      });
    } catch (err) {
      console.error('Erro ao enviar resposta:', err);
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      await handleFinishQuiz();
    } else {
      setCurrentIndex(nextIndex);
      setTimeLeft(30);
      setIsSubmitting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, questions, code, isSubmitting]);

  const handleFinishQuiz = async () => {
    setIsSubmitting(true);
    try {
      const response = await finishQuiz(code);
      setResult(response);
      setQuizStatus('finished');
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao finalizar quiz');
      setQuizStatus('error');
    }
  };

  const getTimerClass = () => {
    if (timeLeft > 20) return 'quiz-timer-green';
    if (timeLeft > 10) return 'quiz-timer-yellow';
    return 'quiz-timer-red';
  };

  const progressPercent = questions.length > 0
    ? ((currentIndex) / questions.length) * 100
    : 0;

  if (quizStatus === 'loading') {
    return (
      <div className="quiz-player">
        <div className="quiz-player-card">
          <div className="quiz-player-spinner" />
          <p>Carregando quiz...</p>
        </div>
      </div>
    );
  }

  if (quizStatus === 'error') {
    return (
      <div className="quiz-player">
        <div className="quiz-player-card">
          <h2>Erro</h2>
          <p>{errorMsg}</p>
          <button onClick={() => window.location.reload()} className="option-btn">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (quizStatus === 'finished') {
    return (
      <div className="quiz-player">
        <div className="quiz-player-card">
          <h2>Quiz finalizado!</h2>
          <p>Acertos: {result?.acertos ?? 0} / {result?.totalQuestions ?? questions.length}</p>
          <p>Aguardando redirecionamento...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="quiz-player">
      <div className="quiz-player-card">
        <div className="quiz-player-header">
          <span className="quiz-player-badge">Quiz Interativo</span>
          <h2>Pergunta {currentIndex + 1} de {questions.length}</h2>
        </div>

        <div className={`timer-bar ${getTimerClass()}`}>
          <span className="timer-value">{timeLeft}s</span>
        </div>

        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="quiz-player-body">
          {currentQuestion && (
            <>
              <p className="question-text">{currentQuestion.text}</p>
              {currentQuestion.category && (
                <span className="question-category">{currentQuestion.category}</span>
              )}
              <div className="options-list">
                {currentQuestion.options.map((opt, idx) => (
                  <button
                    key={idx}
                    className="option-btn"
                    onClick={() => handleSelectOption(idx)}
                    disabled={isSubmitting}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizPlayer;
