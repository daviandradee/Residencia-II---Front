import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import '../../index.css'
import './WaitingRoom.css'
import Modal from '../../components/Modal'
import { useToast } from '../../components/Toast.jsx'

const WaitingRoom = () => {
  const navigate = useNavigate()
  const { code } = useParams()
  const { showToast } = useToast()
  const socketRef = useRef(null)

  const role = localStorage.getItem('role')
  const companyId = localStorage.getItem('companyId')
  const facilitadorToken = localStorage.getItem('facilitadorToken')
  const roomCode = code

  const [companies, setCompanies] = useState([])
  const [connected, setConnected] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showCancelRoomModal, setShowCancelRoomModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showModalLeave, setShowModalLeave] = useState(false)
  const [showModalStart, setShowModalStart] = useState(false)

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL)
    socketRef.current = socket

    fetch(`${import.meta.env.VITE_API_URL}/companies/${roomCode}`)
      .then(res => res.json())
      .then(data => setCompanies(data))
      .catch(err => console.error('Erro ao buscar empresas:', err))

    socket.emit('join_room', roomCode)
    setConnected(true)

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('companies_updated', (updatedCompanies) => {
      setCompanies(updatedCompanies)
    })

    socket.on('game_started', () => {
      if (companyId !== null) {
        setTimeout(() => {
          showToast('O jogo começou! Redirecionando...', 'success')
          navigate(`/gerente-quiz/${companyId}`)
        }, 1500)
      }
    })
    socket.on('room_cancelled', () => {
      if (facilitadorToken === null) {
        showToast('Sala cancelada pelo facilitador', 'warning')
      }
      localStorage.clear()
      navigate('/lobby')
    })
    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('companies_updated')
      socket.off('game_started')
      socket.off('room_cancelled')
      
      socket.disconnect()
    }
  }, [roomCode])

  const handleStartGame = async () => {
    setIsLoading(true)
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/rooms/${roomCode}/start`, {
        method: 'PATCH',
        headers: { 'x-facilitator-token': facilitadorToken },
      })
      navigate(`/facilitador-quiz/${roomCode}`)
    } catch (error) {
      console.error('Erro ao iniciar jogo:', error)
      setShowModalStart(false)
    } finally {
      setIsLoading(false)
      setShowModalStart(false)
    }
  }

  const handleConfirmCancelRoom = async () => {
    setIsLoading(true)
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/rooms/${roomCode}/cancel`, {
        method: 'PATCH',
        headers: { 'x-facilitador-token': facilitadorToken },
      })
      setSuccessMessage('Sala cancelada com sucesso!')
      setTimeout(() => {
        localStorage.clear()
        navigate('/lobby')
      }, 1200)
    } catch (error) {
      console.error('Erro ao cancelar sala:', error)
      setShowCancelRoomModal(false)
      alert('Erro ao cancelar sala')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmLeave = async (e) => {
    setIsLoading(true)
    e.preventDefault()
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/companies/${companyId}/leave`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        console.error(`Erro ao sair: ${response.status}`)
      }
      localStorage.clear()
      navigate('/lobby')
    } catch (error) {
      console.error('Erro ao sair da sala:', error)
      setShowConfirmModal(false)
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (name) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="waiting-container">
      <div className="waiting-header">
        <h1>Aguardando Participantes</h1>
        <div className="waiting-room-code">
          <span>Código da sala</span>
          <strong>{roomCode}</strong>
        </div>
      </div>

      <div className="waiting-status">
        <div className={`status-dot ${connected ? '' : 'disconnected'}`} />
        {connected ? 'Conectado em tempo real' : 'Reconectando...'}
      </div>

      <div className="waiting-content">
        <div className="waiting-card">
          <h2>Empresas na sala</h2>
          <p className="companies-count">
            <strong>{companies.length}</strong> empresa{companies.length !== 1 ? 's' : ''} conectada{companies.length !== 1 ? 's' : ''}
          </p>

          <div className="company-list">
            {companies.length === 0 ? (
              <p className="company-empty">Nenhuma empresa entrou ainda...</p>
            ) : (
              companies.map((company) => (
                <div key={company.id} className="company-item">
                  <div className="company-avatar">
                    {getInitials(company.name)}
                  </div>
                  <div className="company-info">
                    <span className="company-name">{company.name}</span>
                    <span className="company-manager">{company.managerName}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="waiting-card">
          <h2>{facilitadorToken !=null ? 'Instruções para o Facilitador' : 'Aguarde o início'}</h2>
          <div className="instructions-list">
            {facilitadorToken !=null ? (
              <>
                <div className="instruction-item">
                  <div className="instruction-number">1</div>
                  <p className="instruction-text">Compartilhe o código da sala com os participantes.</p>
                </div>
                <div className="instruction-item">
                  <div className="instruction-number">2</div>
                  <p className="instruction-text">Aguarde todas as empresas entrarem na sala.</p>
                </div>
                <div className="instruction-item">
                  <div className="instruction-number">3</div>
                  <p className="instruction-text">Clique em "Iniciar Jogo" quando todos estiverem prontos.</p>
                </div>
              </>
            ) : (
              <>
                <div className="instruction-item">
                  <div className="instruction-number">1</div>
                  <p className="instruction-text">Você entrou na sala com sucesso!</p>
                </div>
                <div className="instruction-item">
                  <div className="instruction-number">2</div>
                  <p className="instruction-text">Aguarde o facilitador iniciar o jogo.</p>
                </div>
                <div className="instruction-item">
                  <div className="instruction-number">3</div>
                  <p className="instruction-text">Quando o jogo começar você será redirecionado automaticamente.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="waiting-actions">
        {facilitadorToken !=null ? (
          <>
            <button className="btn-cancel" onClick={() => setShowModal(true)}>
              Cancelar Sala
            </button>
            <button
              className="btn-start"
              onClick={() => setShowModalStart(true)}
              disabled={companies.length === 0}
            >
              Iniciar Jogo
            </button>
          </>
        ) : (
          <button className="btn-leave" onClick={() => setShowModalLeave(true)}>
            Sair da Sala
          </button>
        )}
      </div>
      <Modal 
      isOpen= {showModalLeave}
      type={isLoading ? "loading" : "leave"}
      title={isLoading ? "Saindo da Sala..." : "Confirmar Saída"}
      message="Tem certeza que deseja sair da sala? Você poderá entrar novamente usando o código."
      confirmText="Sair da Sala"
      cancelText="Não, voltar"
      onConfirm={(e) => {
            if (!isLoading) { 
              handleConfirmLeave(e);
            }
          }}
          onCancel={() => {
            if (!isLoading) { 
              setShowModalLeave(false);
            }
          }}
  />
     <Modal 
    isOpen={showModal}
    type={isLoading ? "loading" : "warning"}
    title={isLoading ? "Cancelando Sala..." : "Confirmar Cancelamento"}
    message="Tem certeza que deseja cancelar a sala? Todos os participantes serão desconectados."
    confirmText="Cancelar Sala"
    cancelText="Não, voltar"
    onConfirm={() => {
          if (!isLoading) { 
            handleConfirmCancelRoom();
          }
        }}
        onCancel={() => {
          if (!isLoading) { 
            setShowModal(false);
          }
        }}
  />
  <Modal 
    isOpen={showModalStart}
    type={isLoading ? "loading" : "confirm"}
    title={isLoading ? "Iniciando sala..." : "Confirmar Início"}
    message="Tem certeza que deseja iniciar a sala? Todos os participantes serão notificados."
    confirmText="Iniciar Sala"
    cancelText="Não, voltar"
    onConfirm={() => {
          if (!isLoading) { 
            handleStartGame();
          }
        }}
        onCancel={() => {
          if (!isLoading) { 
            setShowModal(false);
          }
        }}
  />

      

    </div>
  )
}

export default WaitingRoom