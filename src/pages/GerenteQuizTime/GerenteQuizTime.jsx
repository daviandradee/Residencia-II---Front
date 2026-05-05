import React from 'react';
import { useParams } from 'react-router-dom';
import '../../index.css';
import './GerenteQuizTime.css';

const GerenteQuizTime = () => {
    const { companyId } = useParams();
    const companyName = localStorage.getItem('companyName') || 'sua empresa';

    return (
        <div className="quiztime-container">
            <div className="quiztime-card">
                <div className="quiztime-hero">
                    <span className="quiztime-badge">Etapa do gerente</span>
                    <h1>Hora do Quiz</h1>
                    <p>Hora de colocar o conhecimento em prática! O facilitador separou perguntas especiais para você.</p>
                </div>
                <div className="quiztime-details">
                    <div className="quiztime-info-card">
                        <span className="quiztime-label">Empresa</span>
                        <strong>{companyName}</strong>
                    </div>
                    <div className="quiztime-info-card quiztime-info-highlight">
                        <span className="quiztime-label">Próxima etapa</span>
                        <strong>Configuração da empresa</strong>
                    </div>
                </div>
                <div className="quiztime-body">
                    <p className="quiztime-text">
                        Aguarde um instante. Em breve você será direcionado automaticamente para definir estratégia de estoques, preços e investimentos.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GerenteQuizTime;
