import React, { useState, useRef, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Search, History, Mic, Square, Play, Sparkles, Trash2, Calendar, ChevronRight, Wind, BarChart3, X, LayoutDashboard, LogOut, ArrowLeft, User, ClipboardList, Plus
} from 'lucide-react';
import FinanceiroView from './FinanceiroView';
import DiarioEmocionalView from './DiarioEmocionalView';
import TarefasClinicasView from './TarefasClinicasView';
import PlanoTerapeuticoView from './PlanoTerapeuticoView';
import AvaliacoesView from './AvaliacoesView';
import AnamneseView from './AnamneseView';
import ProntuarioIAView from './ProntuarioIAView';
import AgendaView from './AgendaView';
import DashboardView from './DashboardView';

export default function PacienteDashboard(props) {
  const {
    usuario, setUsuario, gravando, setGravando, transcricao, setTranscricao, exercicio, setExercicio,
    carregando, setCarregando, historico, setHistorico, searchTerm, setSearchTerm, sessaoAtiva, setSessaoAtiva,
    currentView, setCurrentView, showSOS, setShowSOS, breathingStep, setBreathingStep, falando, setFalando,
    listaPacientes, setListaPacientes, pacienteSelecionado, setPacienteSelecionado, showNovoPacienteForm, setShowNovoPacienteForm,
    novoPacNome, setNovoPacNome, novoPacEmail, setNovoPacEmail, novoPacSenha, setNovoPacSenha, financeiroData, setFinanceiroData,
    listaPacotes, setListaPacotes, listaNotas, setListaNotas, novaNotaConteudo, setNovaNotaConteudo, carregandoNotas, setCarregandoNotas,
    abordagemSelecionada, setAbordagemSelecionada, insightsIA, setInsightsIA, carregandoInsights, setCarregandoInsights,
    listaTarefas, setListaTarefas, carregandoTarefas, setCarregandoTarefas, anamneseData, setAnamneseData, carregandoAnamnese,
    setCarregandoAnamnese, salvandoAnamnese, setSalvandoAnamnese, listaAvaliacoes, setListaAvaliacoes, carregandoAvaliacoes,
    setCarregandoAvaliacoes, novaAvaliacaoTipo, setNovaAvaliacaoTipo, respostasAvaliacao, setRespostasAvaliacao, tcleAssinado,
    setTcleAssinado, dataAssinaturaTcle, setDataAssinaturaTcle, carregandoTcle, setCarregandoTcle,
    handlePsicologoCadastrarPaciente, fetchHistorico, fetchPacientes, fetchFinanceiro, fetchPacotes, fetchTCLE, fetchDiario,
    fetchNotas, handleAdicionarNota, handleRemoverNota, fetchInsights, fetchTarefas, fetchAnamnese, handleSalvarAnamnese,
    handleLogout, falar, pararDeFalar, SOSOverlay, deleteSessao, filteredHistorico, iniciarGravacao, pararGravacao,
    selecionarSessao, formatarAnalise, API_BASE_URL
  } = props;


  const handleAssinarTCLE = async () => {
    setTcleAssinado(true);
  };

  const getSentimentClass = (sentimento) => {
    switch (sentimento?.toLowerCase()) {
      case 'positivo': return 'sentiment-positive';
      case 'negativo': return 'sentiment-negative';
      case 'neutro': return 'sentiment-neutral';
      case 'alerta': return 'sentiment-alert';
      default: return 'sentiment-neutral';
    }
  };

  const copiarParaPsicologo = () => {
      navigator.clipboard.writeText(exercicio);
      alert("Resumo copiado!");
  };
  
  const handleConcluirTarefa = (id, bool) => {
      alert("Operação realizada (Simulado)");
  };

  const TCLEModal = () => (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
        <h2>Termo de Consentimento Livre e Esclarecido (TCLE)</h2>
        <p>Para continuar utilizando a plataforma, você precisa ler e aceitar nossos termos.</p>
        <button onClick={handleAssinarTCLE}>Li e Concordo</button>
      </div>
    </div>
  );

  return (
    <div className="app-wrapper">
      {!tcleAssinado && <TCLEModal />}
      <aside className="sidebar">
        <div className="user-profile-header">
          <div className="user-info">
            <span className="user-name">{usuario.nome}</span>
            <span className="user-role">Paciente</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={14} />
          </button>
        </div>

        <div className="sidebar-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}><History size={20} style={{ marginRight: 8 }} /> Histórico</h2>
            <button className="sos-btn-small" onClick={() => setShowSOS(true)} title="Modo SOS / Respiração">
              <Wind size={18} />
            </button>
          </div>
          <button
            className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
            style={{ marginBottom: '8px' }}
          >
            <BarChart3 size={18} style={{ marginRight: 8 }} /> Ver Evolução
          </button>
          <button
            className={`nav-btn ${currentView === 'agenda' ? 'active' : ''}`}
            onClick={() => { setCurrentView('agenda'); }}
            style={{ marginBottom: '8px' }}
          >
            <Calendar size={18} style={{ marginRight: 8 }} /> Minhas Consultas
          </button>
          <button
            className={`nav-btn ${currentView === 'financeiro' ? 'active' : ''}`}
            onClick={() => { setCurrentView('financeiro'); fetchPacotes(); fetchFinanceiro(); }}
            style={{ marginBottom: '8px' }}
          >
            <BarChart3 size={18} style={{ marginRight: 8 }} /> Meus Pagamentos
          </button>
          <button
            className={`nav-btn ${currentView === 'tarefas' ? 'active' : ''}`}
            onClick={() => { setCurrentView('tarefas'); fetchTarefas(usuario.id); }}
            style={{ marginBottom: '8px' }}
          >
            <ClipboardList size={18} style={{ marginRight: 8 }} /> Minhas Tarefas
          </button>
          <button
            className={`nav-btn ${currentView === 'diario' ? 'active' : ''}`}
            onClick={() => { setCurrentView('diario'); fetchDiario(); }}
            style={{ marginBottom: '1rem' }}
          >
            <MessageSquare size={18} style={{ marginRight: 8 }} /> Diário Emocional
          </button>
          <div className="search-container">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Pesquisar registros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="history-list">
          {filteredHistorico.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`history-item ${sessaoAtiva?.id === item.id ? 'active' : ''}`}
              onClick={() => {
                selecionarSessao(item);
                setCurrentView('app');
              }}
            >
              <div className="history-item-content">
                <div className="date">
                  {item.data} • <span className={`sentiment-tag ${getSentimentClass(item.sentimento)}`}>{item.sentimento}</span>
                  <button className="delete-btn" onClick={(e) => deleteSessao(e, item.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="preview">{item.transcricao}</div>
              </div>
            </motion.div>
          ))}
          {filteredHistorico.length === 0 && (
            <div className="status-text" style={{ textAlign: 'center', marginTop: '2rem' }}>
              Nenhum registro encontrado
            </div>
          )}
        </div>
      </aside>

      <main className="main-content">
        <AnimatePresence>
          {showSOS && <SOSOverlay />}
        </AnimatePresence>

        {currentView === 'dashboard' ? (
          <DashboardView historico={historico} setCurrentView={setCurrentView} />
        ) : currentView === 'agenda' ? (
          <div className="app-container" style={{ maxWidth: '900px' }}>
            <header className="header" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.5rem', fontWeight: '700' }}>Agendamento de Sessões</h2>
              <p style={{ color: 'var(--text-muted)' }}>Agende e gerencie suas consultas presenciais ou online</p>
            </header>
            <AgendaView usuario={usuario} API_BASE_URL={API_BASE_URL} pacienteSelecionado={pacienteSelecionado} listaPacientes={listaPacientes} />
          </div>
        ) : currentView === 'financeiro' ? (
          <div className="app-container" style={{ maxWidth: '900px' }}>
            <header className="header" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.5rem', fontWeight: '700' }}>Painel Financeiro</h2>
              <p style={{ color: 'var(--text-muted)' }}>Acompanhe seu saldo de sessões e histórico de faturas</p>
            </header>
            <FinanceiroView 
              usuario={usuario}
              API_BASE_URL={API_BASE_URL}
              pacienteSelecionado={pacienteSelecionado}
              financeiroData={financeiroData}
              setFinanceiroData={setFinanceiroData}
              listaPacotes={listaPacotes}
              fetchFinanceiro={fetchFinanceiro}
              fetchPacotes={fetchPacotes}
            />
          </div>
        ) : currentView === 'tarefas' ? (
          <div className="app-container" style={{ maxWidth: '900px' }}>
            <header className="header" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.5rem', fontWeight: '700' }}>Minhas Tarefas</h2>
              <p style={{ color: 'var(--text-muted)' }}>Atividades e reflexões prescritas pelo seu terapeuta para realizar durante a semana</p>
            </header>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {carregandoTarefas ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Carregando atividades...</p>
              ) : listaTarefas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1.5rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <ClipboardList size={40} style={{ color: 'var(--accent)', opacity: 0.3, marginBottom: '1rem', display: 'block', margin: '0 auto' }} />
                  <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>Nenhuma tarefa pendente</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
                    Seu terapeuta irá prescrever exercícios ou leituras específicas por aqui quando necessário. Fique atento!
                  </p>
                </div>
              ) : (
                listaTarefas.map((tarefa) => (
                  <div key={tarefa.id} style={{
                    background: tarefa.concluida ? 'rgba(34, 197, 94, 0.02)' : 'rgba(15, 23, 42, 0.4)',
                    border: tarefa.concluida ? '1px solid rgba(34, 197, 94, 0.15)' : '1px solid var(--glass-border)',
                    padding: '1.5rem',
                    borderRadius: '1.2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, color: 'white', fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>{tarefa.titulo}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Criado em: {tarefa.data_criacao}</span>
                        {tarefa.concluida && (
                          <span style={{ fontSize: '0.7rem', background: 'rgba(34,197,94,0.15)', color: '#4ade80', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>Concluído</span>
                        )}
                      </div>
                    </div>
                    
                    <p style={{
                      color: '#cbd5e1',
                      fontSize: '0.95rem',
                      lineHeight: '1.6',
                      margin: 0,
                      background: 'rgba(0,0,0,0.15)',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {tarefa.descricao}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '5px' }}>
                      {tarefa.concluida ? (
                        <>
                          <span style={{ fontSize: '0.8rem', color: '#4ade80' }}>Concluída em: {tarefa.data_conclusao}</span>
                          <button
                            onClick={() => handleConcluirTarefa(tarefa.id, false)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              padding: '5px 12px',
                              borderRadius: '0.5rem',
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            Refazer Tarefa
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleConcluirTarefa(tarefa.id, true)}
                          style={{
                            background: 'var(--accent)',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '0.5rem',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          Marcar como Concluída ✔️
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : currentView === 'diario' ? (
          <div className="app-container" style={{ maxWidth: '900px' }}>
            <header className="header" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.5rem', fontWeight: '700' }}>Diário Emocional</h2>
              <p style={{ color: 'var(--text-muted)' }}>Acompanhe seu humor e seus sentimentos</p>
            </header>
            <DiarioEmocionalView usuario={usuario} API_BASE_URL={API_BASE_URL} pacienteSelecionado={null} />
          </div>
        ) : (
          <div className="app-container">
            <header className="header">
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Psicólogo IA
              </motion.h1>
              <p className="status-text">Seu suporte profissional e preparação para terapia</p>
            </header>

            <motion.div
              className="main-card"
              layout
            >
              <section className="record-section">
                <button
                  className={`pulse-button ${gravando ? 'recording' : ''}`}
                  onClick={gravando ? pararGravacao : iniciarGravacao}
                  disabled={carregando}
                >
                  {gravando ? <Square size={48} /> : <Mic size={48} />}
                </button>
                <div className="status-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span className="status-text">
                    {gravando ? 'Ouvindo desabafo...' : carregando ? 'Atualizando prontuário...' : exercicio ? 'Clique para dar seguimento' : 'Clique para começar a falar'}
                  </span>
                  {exercicio && !carregando && !gravando && (
                    <button className="reset-btn" onClick={() => { setTranscricao(''); setExercicio(''); setSessaoAtiva(null); window.speechSynthesis.cancel(); }}>
                      Novo Desabafo
                    </button>
                  )}
                </div>
              </section>

              <AnimatePresence mode="wait">
                {(transcricao || exercicio || carregando) && (
                  <motion.section
                    className="result-section"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="result-card">
                      <h3><MessageSquare size={14} style={{ marginRight: 8 }} /> Seu Desabafo</h3>
                      <p>{carregando && !transcricao ? <span className="loading-dots">Transcrevendo áudio</span> : transcricao}</p>
                    </div>

                    {(exercicio || carregando) && (
                      <motion.div
                        className="result-card professional-card"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                            <Sparkles size={14} style={{ marginRight: 8 }} /> Análise e Preparação
                          </h3>
                          <div className="card-actions" style={{ display: 'flex', gap: '8px' }}>
                            {exercicio && (
                              <>
                                <button
                                  onClick={copiarParaPsicologo}
                                  className="audio-control-btn"
                                  title="Copiar Resumo para o Psicólogo"
                                  style={{ background: 'rgba(255,255,255,0.1)' }}
                                >
                                  <Calendar size={16} />
                                </button>
                                <button
                                  onClick={falando ? pararDeFalar : () => falar(exercicio)}
                                  className="audio-control-btn"
                                  title={falando ? "Parar áudio" : "Ouvir resposta"}
                                >
                                  {falando ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="analysis-content">
                          {carregando && !exercicio ? (
                            <span className="loading-dots">Consultando abordagem terapêutica</span>
                          ) : (
                            formatarAnalise(exercicio)
                          )}
                        </div>
                      </motion.div>
                    )}
                  </motion.section>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );

}
