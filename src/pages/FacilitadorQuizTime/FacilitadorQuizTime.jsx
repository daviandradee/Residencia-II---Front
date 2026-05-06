import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import '../../index.css';
import Modal from '../../components/Modal'; 
import './FacilitadorQuizTime.css';

const FacilitadorQuizTime = () => {
    const navigate = useNavigate();
    const { code } = useParams();
    const [acertos, setAcertos] = useState({});
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [companies, setCompanies] = useState([])
    const [totalPerguntas, setTotalPerguntas] = useState(10);
    const [showModal, setShowModal] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [showModalLeave, setShowModalLeave] = useState(false)
    const [showModalStart, setShowModalStart] = useState(false)

    const myCompanyId = localStorage.getItem('companyId')
    const facilitadorToken = localStorage.getItem('facilitadorToken');

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/companies/${code}`)
            .then(res => res.json())
            .then(data => setCompanies(data))
            .catch(err => console.error('Erro ao buscar empresas:', err))
    }, [code])
    console.log(code)
    useEffect(() => {
        const socket = io(import.meta.env.VITE_API_URL);
        socket.emit('join_room', code)

        socket.on('quiz_finish', () => {
            if (facilitadorToken === null) {
                navigate(`/config/${myCompanyId}`)
            } else {
                navigate(`/facilitador/${code}`)
            }
        })
        socket.on('connect', () => console.log('socket conectado, entrando na sala:', code))
        socket.on('quiz_finish', () => console.log('quiz_finish recebido!'))

        return () => socket.disconnect()
    }, [code, facilitadorToken, myCompanyId, navigate])


    const handleAcertosChange = (companyId, value) => {
        const numValue = Math.max(0, parseInt(value) || 0);
        setAcertos(prev => ({ ...prev, [companyId]: numValue }));
    };

    const handleTotalPerguntasChange = (value) => {
        setTotalPerguntas(Math.max(0, parseInt(value) || 10));
    };

    const handleIniciarPartida = async () => {
        setIsLoading(true)

        const results = Object.entries(acertos).map(([companyId, acertosValue]) => ({
            companyId,
            acertos: acertosValue,
        }));
        const payload = {
            totalQuestions: totalPerguntas,
            results,
        };

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/quiz/${code}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-facilitator-token': facilitadorToken,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                setErro(data.message || 'Erro ao iniciar a partida.');
                return;
            }

            setSucesso('Resultados enviados! Aguardando encerramento do quiz...');
        } catch (error) {
            console.error('Erro ao iniciar partida:', error);
            setErro('Erro ao iniciar a partida. Verifique sua conexão e tente novamente.');
            setShowModalStart(false)
        } finally {
            setEnviando(false);
            setShowModalStart(false)
            setIsLoading(false)
        }
    };



    return (
        <div className="facilitador-quiz-container">
            <div className="facilitador-quiz-card">
                <div className="facilitador-quiz-hero">
                    <span className="facilitador-quiz-badge">Etapa do facilitador</span>
                    <h1>Quiz - Acertos das Empresas</h1>
                    <p>Insira a quantidade de acertos de cada empresa para iniciar a partida.</p>
                </div>

                <div className="facilitador-quiz-body">
                    <div className="facilitador-quiz-companies">
                        <div className="facilitador-quiz-company-row">
                            <div className="facilitador-quiz-company-info">

                                <div className="facilitador-quiz-company-details">
                                    <span className="facilitador-quiz-company-name">Perguntas</span>
                                </div>
                            </div>
                            <div className="facilitador-quiz-input-wrapper">
                                <label>Quantidade:</label>
                                <input
                                    type="number"
                                    min="0"
                                    onChange={(e) => handleTotalPerguntasChange(e.target.value)}
                                    className="facilitador-quiz-input"
                                    disabled={enviando}
                                />
                            </div>
                        </div>
                        {companies.map((company, index) => (
                            <div key={company.id} className="facilitador-quiz-company-row">
                                <div className="facilitador-quiz-company-info">
                                    <span className="facilitador-quiz-company-number">{index + 1}</span>
                                    <div className="facilitador-quiz-company-details">
                                        <span className="facilitador-quiz-company-name">{company.name}</span>
                                        <span className="facilitador-quiz-company-manager">{company.managerName}</span>
                                    </div>
                                </div>
                                <div className="facilitador-quiz-input-wrapper">
                                    <label htmlFor={`acertos-${company.id}`}>Acertos:</label>
                                    <input
                                        type="number"
                                        id={`acertos-${company.id}`}
                                        min="0"
                                        max="10"
                                        value={acertos[company.id] ?? 0}
                                        onChange={(e) => handleAcertosChange(company.id, e.target.value)}
                                        className="facilitador-quiz-input"
                                        disabled={enviando}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    { }
                    {erro && <p className="erro-msg">{erro}</p>}
                    {sucesso && <p className="sucesso-msg">{sucesso}</p>}

                    { }
                    <button
                        className={`facilitador-quiz-btn-iniciar ${enviando ? 'enviando' : ''}`}
                        onClick={() => setShowModalStart(true)}
                        disabled={enviando}
                    >
                        {enviando ? (
                            <>
                                <span className="btn-spinner"></span>
                                Iniciando...
                            </>
                        ) : (
                            'Iniciar Partida'
                        )}
                    </button>
                </div>
            </div>
            <Modal
                isOpen={showModalStart}
                type={isLoading ? "loading" : "confirm"}
                title={isLoading ? "Iniciando sala..." : "Confirmar Início"}
                message="Tem certeza que deseja finalizar o quiz? Todos os participantes serão notificados e direcionados."
                confirmText="Finalizar"
                cancelText="Não, voltar"
                onConfirm={() => {
                    if (!isLoading) {

                        handleIniciarPartida();
                    }
                }}
                onCancel={() => {
                    if (!isLoading) {
                        setShowModalStart(false);
                    }
                }}
            />
        </div>
    );
};

export default FacilitadorQuizTime;