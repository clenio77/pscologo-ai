import React, { useState, useRef, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Search,
  History,
  Mic,
  Square,
  Play,
  Sparkles,
  Trash2,
  Calendar,
  ChevronRight,
  Wind,
  BarChart3,
  X,
  LayoutDashboard,
  LogOut,
  ArrowLeft,
  User,
  ClipboardList,
  Plus,
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
import DocumentosView from './DocumentosView';
import { FileText } from 'lucide-react';

export default function PsicologoDashboard(props) {
  const {
    usuario,
    setUsuario,
    gravando,
    setGravando,
    transcricao,
    setTranscricao,
    exercicio,
    setExercicio,
    carregando,
    setCarregando,
    historico,
    setHistorico,
    searchTerm,
    setSearchTerm,
    sessaoAtiva,
    setSessaoAtiva,
    currentView,
    setCurrentView,
    showSOS,
    setShowSOS,
    breathingStep,
    setBreathingStep,
    falando,
    setFalando,
    listaPacientes,
    setListaPacientes,
    pacienteSelecionado,
    setPacienteSelecionado,
    showNovoPacienteForm,
    setShowNovoPacienteForm,
    novoPacNome,
    setNovoPacNome,
    novoPacEmail,
    setNovoPacEmail,
    novoPacSenha,
    setNovoPacSenha,
    financeiroData,
    setFinanceiroData,
    listaPacotes,
    setListaPacotes,
    listaNotas,
    setListaNotas,
    novaNotaConteudo,
    setNovaNotaConteudo,
    carregandoNotas,
    setCarregandoNotas,
    abordagemSelecionada,
    setAbordagemSelecionada,
    insightsIA,
    setInsightsIA,
    carregandoInsights,
    setCarregandoInsights,
    listaTarefas,
    setListaTarefas,
    carregandoTarefas,
    setCarregandoTarefas,
    anamneseData,
    setAnamneseData,
    carregandoAnamnese,
    setCarregandoAnamnese,
    salvandoAnamnese,
    setSalvandoAnamnese,
    listaAvaliacoes,
    setListaAvaliacoes,
    carregandoAvaliacoes,
    setCarregandoAvaliacoes,
    novaAvaliacaoTipo,
    setNovaAvaliacaoTipo,
    respostasAvaliacao,
    setRespostasAvaliacao,
    tcleAssinado,
    setTcleAssinado,
    dataAssinaturaTcle,
    setDataAssinaturaTcle,
    carregandoTcle,
    setCarregandoTcle,
    handlePsicologoCadastrarPaciente,
    fetchHistorico,
    fetchPacientes,
    fetchFinanceiro,
    fetchPacotes,
    fetchTCLE,
    fetchDiario,
    fetchNotas,
    handleAdicionarNota,
    handleRemoverNota,
    fetchInsights,
    fetchTarefas,
    fetchAnamnese,
    handleSalvarAnamnese,
    handleLogout,
    falar,
    pararDeFalar,
    SOSOverlay,
    deleteSessao,
    filteredHistorico,
    iniciarGravacao,
    pararGravacao,
    selecionarSessao,
    formatarAnalise,
    API_BASE_URL,
  } = props;
  return (
    <div className="app-wrapper">
      <aside className="sidebar">
        <div className="user-profile-header">
          <div className="user-info">
            <span className="user-name">{usuario.nome}</span>
            <span className="user-role">Profissional</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={14} />
          </button>
        </div>

        {!pacienteSelecionado && (
          <div style={{ padding: '1rem 1rem 0 1rem' }}>
            <button
              className={`nav-btn ${currentView === 'app' && !showNovoPacienteForm ? 'active' : ''}`}
              onClick={() => {
                setCurrentView('app');
                setShowNovoPacienteForm(false);
              }}
              style={{ marginBottom: '8px' }}
            >
              <User size={18} style={{ marginRight: 8 }} /> Pacientes
            </button>
            <button
              className={`nav-btn ${currentView === 'agenda' ? 'active' : ''}`}
              onClick={() => {
                setCurrentView('agenda');
                setShowNovoPacienteForm(false);
              }}
              style={{ marginBottom: '8px' }}
            >
              <Calendar size={18} style={{ marginRight: 8 }} /> Minha Agenda
            </button>
            <button
              className={`nav-btn ${currentView === 'financeiro' ? 'active' : ''}`}
              onClick={() => {
                setCurrentView('financeiro');
                fetchFinanceiro();
                setShowNovoPacienteForm(false);
              }}
              style={{ marginBottom: '8px' }}
            >
              <BarChart3 size={18} style={{ marginRight: 8 }} /> Painel Financeiro
            </button>
            <button
              className={`nav-btn ${showNovoPacienteForm ? 'active' : ''}`}
              onClick={() => {
                setShowNovoPacienteForm(true);
                setCurrentView('app');
              }}
              style={{
                marginBottom: '1rem',
                borderColor: 'var(--accent)',
                color: 'white',
                background: showNovoPacienteForm ? 'var(--accent)' : 'rgba(139, 92, 246, 0.1)',
              }}
            >
              + Cadastrar Paciente
            </button>
          </div>
        )}

        {currentView === 'app' && !pacienteSelecionado && !showNovoPacienteForm && (
          <>
            <div
              className="sidebar-header"
              style={{ padding: '0 1.5rem 1.5rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}
            >
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>
                <History size={18} style={{ marginRight: 8 }} /> Pacientes Ativos
              </h2>
            </div>

            <div className="history-list">
              {listaPacientes.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`history-item ${pacienteSelecionado?.id === p.id ? 'active' : ''}`}
                  onClick={() => {
                    setPacienteSelecionado(p);
                    setCurrentView('app');
                  }}
                >
                  <div className="history-item-content">
                    <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '4px' }}>{p.nome}</div>
                    <div className="preview" style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                      Atividade: {p.ultima_atividade}
                    </div>
                  </div>
                </motion.div>
              ))}
              {listaPacientes.length === 0 && (
                <div className="status-text" style={{ textAlign: 'center', marginTop: '2rem' }}>
                  Nenhum paciente cadastrado
                </div>
              )}
            </div>
          </>
        )}

        {pacienteSelecionado && (
          <>
            <div className="sidebar-header" style={{ padding: '1.5rem' }}>
              <button
                className="back-link"
                onClick={() => {
                  setPacienteSelecionado(null);
                  setCurrentView('app');
                }}
                style={{ marginBottom: '1.5rem' }}
              >
                <ArrowLeft size={16} /> Voltar para Pacientes
              </button>
              <h2 style={{ fontSize: '1.1rem', margin: 0 }}>
                <History size={16} style={{ marginRight: 8 }} /> Desabafos do Paciente
              </h2>
            </div>

            <div className="history-list">
              {filteredHistorico.map((item) => (
                <div
                  key={item.id}
                  className={`history-item ${sessaoAtiva?.id === item.id ? 'active' : ''}`}
                  onClick={() => selecionarSessao(item)}
                  style={{ padding: '0.8rem' }}
                >
                  <div className="date" style={{ fontSize: '0.65rem' }}>
                    {item.data}
                  </div>
                  <div className="preview" style={{ fontSize: '0.8rem' }}>
                    {item.transcricao}
                  </div>
                </div>
              ))}
              {filteredHistorico.length === 0 && (
                <div className="status-text" style={{ textAlign: 'center', marginTop: '2rem' }}>
                  Nenhum desabafo
                </div>
              )}
            </div>
          </>
        )}
      </aside>

      <main className="main-content">
        <div className="app-container" style={{ maxWidth: '900px' }}>
          {showNovoPacienteForm && !pacienteSelecionado ? (
            <div
              style={{
                maxWidth: '500px',
                margin: '0 auto',
                background: 'var(--card-bg)',
                border: '1px solid var(--glass-border)',
                padding: '3rem',
                borderRadius: '2rem',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem' }}>Cadastrar Novo Paciente</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Ele será vinculado automaticamente a você e poderá agendar sessões.
                </p>
              </div>
              <form
                onSubmit={handlePsicologoCadastrarPaciente}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                <div className="form-group">
                  <label>Nome Completo do Paciente</label>
                  <input
                    type="text"
                    placeholder="Nome do paciente"
                    value={novoPacNome}
                    onChange={(e) => setNovoPacNome(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>E-mail</label>
                  <input
                    type="email"
                    placeholder="email@paciente.com"
                    value={novoPacEmail}
                    onChange={(e) => setNovoPacEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Senha Provisória</label>
                  <input
                    type="password"
                    placeholder="Defina a senha dele"
                    value={novoPacSenha}
                    onChange={(e) => setNovoPacSenha(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="auth-submit-btn" disabled={carregando}>
                  {carregando ? 'Cadastrando...' : 'Salvar e Vincolar Paciente'}
                </button>
                <button type="button" className="reset-btn" onClick={() => setShowNovoPacienteForm(false)}>
                  Cancelar
                </button>
              </form>
            </div>
          ) : !pacienteSelecionado ? (
            currentView === 'agenda' ? (
              <div>
                <h2
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '2.2rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <Calendar size={32} style={{ color: 'var(--accent)' }} /> Minha Agenda Geral
                </h2>
                <AgendaView
                  usuario={usuario}
                  API_BASE_URL={API_BASE_URL}
                  pacienteSelecionado={pacienteSelecionado}
                  listaPacientes={listaPacientes}
                />
              </div>
            ) : currentView === 'financeiro' ? (
              <div>
                <h2
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '2.2rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <BarChart3 size={32} style={{ color: 'var(--accent)' }} /> Fluxo de Caixa Clínico
                </h2>
                <FinanceiroView
                  usuario={usuario}
                  API_BASE_URL={API_BASE_URL}
                  pacienteSelecionado={null}
                  financeiroData={financeiroData}
                  setFinanceiroData={setFinanceiroData}
                  listaPacotes={listaPacotes}
                  fetchFinanceiro={fetchFinanceiro}
                  fetchPacotes={fetchPacotes}
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                <User size={64} style={{ color: 'var(--accent)', opacity: 0.5, marginBottom: '1.5rem' }} />
                <h2 style={{ fontSize: '2rem', fontFamily: 'Outfit, sans-serif', marginBottom: '0.5rem' }}>
                  Bem-vindo, Dr(a). {usuario.nome.split(' ')[0]}!
                </h2>
                <p style={{ color: 'var(--text-muted)' }}>
                  Navegue pela barra lateral para gerenciar pacientes, verificar consultas ou analisar o faturamento.
                </p>
              </div>
            )
          ) : (
            <div>
              <div className="patient-detail-header">
                <div className="patient-detail-info">
                  <h2>{pacienteSelecionado.nome}</h2>
                  <p style={{ color: 'var(--text-muted)' }}>{pacienteSelecionado.email}</p>
                </div>
                <button
                  className="back-link"
                  onClick={() => {
                    setPacienteSelecionado(null);
                    setCurrentView('app');
                  }}
                >
                  <ArrowLeft size={16} /> Fechar Ficha do Paciente
                </button>
              </div>

              {carregandoInsights ? (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.01)',
                    border: '1px dashed rgba(255,255,255,0.1)',
                    padding: '1rem',
                    borderRadius: '1rem',
                    marginBottom: '1.5rem',
                    textAlign: 'center',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  Carregando análises de risco e insights rápidos do paciente com Gemini...
                </div>
              ) : (
                (insightsIA.foco || (insightsIA.alertas && insightsIA.alertas.length > 0)) && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.05)',
                      border: '1px solid rgba(239, 68, 68, 0.15)',
                      borderRadius: '1.2rem',
                      padding: '1.2rem',
                      marginBottom: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          color: '#f87171',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Sparkles size={14} /> Sinais de Risco / Alertas:
                      </span>
                      {insightsIA.alertas &&
                        insightsIA.alertas.map((alerta, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: alerta.toLowerCase().includes('baixo')
                                ? 'rgba(34, 197, 94, 0.15)'
                                : 'rgba(239, 68, 68, 0.2)',
                              color: alerta.toLowerCase().includes('baixo') ? '#4ade80' : '#f87171',
                              fontSize: '0.75rem',
                              padding: '3px 8px',
                              borderRadius: '20px',
                              fontWeight: 'bold',
                            }}
                          >
                            {alerta}
                          </span>
                        ))}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        Tendência de Humor: <strong>{insightsIA.humor_trend}</strong>
                      </span>
                    </div>

                    {insightsIA.foco && (
                      <div
                        style={{
                          fontSize: '0.85rem',
                          color: '#cbd5e1',
                          borderTop: '1px solid rgba(255,255,255,0.05)',
                          paddingTop: '8px',
                        }}
                      >
                        💡 <strong>Preparativo em 10s (Foco sugerido):</strong> {insightsIA.foco}
                      </div>
                    )}
                  </div>
                )
              )}

              <div style={{ display: 'flex', gap: '12px', marginBottom: '2rem' }}>
                <button
                  className={`nav-btn ${currentView === 'app' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('app');
                  }}
                  style={{ flex: 1, justifyContent: 'center', marginBottom: 0 }}
                >
                  <MessageSquare size={16} style={{ marginRight: 8 }} /> Histórico Clínico
                </button>
                <button
                  className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('dashboard');
                  }}
                  style={{ flex: 1, justifyContent: 'center', marginBottom: 0 }}
                >
                  <BarChart3 size={16} style={{ marginRight: 8 }} /> Evolução
                </button>
                <button
                  className={`nav-btn ${currentView === 'agenda' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('agenda');
                  }}
                  style={{ flex: 1, justifyContent: 'center', marginBottom: 0 }}
                >
                  <Calendar size={16} style={{ marginRight: 8 }} /> Consultas
                </button>
                <button
                  className={`nav-btn ${currentView === 'financeiro' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('financeiro');
                    fetchPacotes(pacienteSelecionado.id);
                    fetchFinanceiro();
                  }}
                  style={{ flex: 1, justifyContent: 'center', marginBottom: 0 }}
                >
                  <BarChart3 size={16} style={{ marginRight: 8 }} /> Financeiro
                </button>
                <button
                  className={`nav-btn ${currentView === 'prontuario' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('prontuario');
                  }}
                  style={{ flex: 1, justifyContent: 'center', marginBottom: 0, borderColor: 'var(--accent)' }}
                >
                  <Sparkles size={16} style={{ marginRight: 8, color: 'var(--accent)' }} /> Prontuário IA
                </button>
                <button
                  className={`nav-btn ${currentView === 'tarefas' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('tarefas');
                    fetchTarefas(pacienteSelecionado.id);
                  }}
                  style={{ flex: 1, justifyContent: 'center', marginBottom: 0 }}
                >
                  <ClipboardList size={16} style={{ marginRight: 8 }} /> Tarefas
                </button>
                <button
                  className={`nav-btn ${currentView === 'anamnese' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('anamnese');
                    fetchAnamnese(pacienteSelecionado.id);
                  }}
                  style={{ flex: 1, justifyContent: 'center', marginBottom: 0 }}
                >
                  <ClipboardList size={16} style={{ marginRight: 8 }} /> Anamnese
                </button>
                <button
                  className={`nav-btn ${currentView === 'avaliacoes' ? 'active' : ''}`}
                  onClick={() => setCurrentView('avaliacoes')}
                  style={{ flex: 1, justifyContent: 'center', marginBottom: 0 }}
                >
                  <BarChart3 size={16} style={{ marginRight: 8 }} /> Avaliações
                </button>
                <button
                  className={`nav-btn ${currentView === 'documentos' ? 'active' : ''}`}
                  onClick={() => setCurrentView('documentos')}
                  style={{ flex: 1, justifyContent: 'center', marginBottom: 0 }}
                >
                  <FileText size={16} style={{ marginRight: 8 }} /> Documentos
                </button>
                <button
                  className={`nav-btn ${currentView === 'plano_terapeutico' ? 'active' : ''}`}
                  onClick={() => setCurrentView('plano_terapeutico')}
                  style={{ flex: 1, justifyContent: 'center', marginBottom: 0 }}
                >
                  <Plus size={16} style={{ marginRight: 8 }} /> Plano
                </button>
              </div>

              {currentView === 'dashboard' ? (
                <DashboardView historico={historico} setCurrentView={setCurrentView} />
              ) : currentView === 'agenda' ? (
                <AgendaView
                  usuario={usuario}
                  API_BASE_URL={API_BASE_URL}
                  pacienteSelecionado={pacienteSelecionado}
                  listaPacientes={listaPacientes}
                />
              ) : currentView === 'financeiro' ? (
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
              ) : currentView === 'prontuario' ? (
                <ProntuarioIAView
                  usuario={usuario}
                  API_BASE_URL={API_BASE_URL}
                  pacienteSelecionado={pacienteSelecionado}
                />
              ) : currentView === 'tarefas' ? (
                <TarefasClinicasView
                  usuario={usuario}
                  API_BASE_URL={API_BASE_URL}
                  pacienteSelecionado={pacienteSelecionado}
                  listaTarefas={listaTarefas}
                  carregandoTarefas={carregandoTarefas}
                  fetchTarefas={fetchTarefas}
                />
              ) : currentView === 'anamnese' ? (
                <AnamneseView usuario={usuario} API_BASE_URL={API_BASE_URL} pacienteSelecionado={pacienteSelecionado} />
              ) : currentView === 'avaliacoes' ? (
                <AvaliacoesView
                  usuario={usuario}
                  API_BASE_URL={API_BASE_URL}
                  pacienteSelecionado={pacienteSelecionado}
                />
              ) : currentView === 'documentos' ? (
                <DocumentosView
                  usuario={usuario}
                  API_BASE_URL={API_BASE_URL}
                  pacienteSelecionado={pacienteSelecionado}
                />
              ) : currentView === 'plano_terapeutico' ? (
                <PlanoTerapeuticoView
                  usuario={usuario}
                  API_BASE_URL={API_BASE_URL}
                  pacienteSelecionado={pacienteSelecionado}
                />
              ) : (
                <div style={{ display: 'flex', gap: '2rem' }}>
                  {/* Barra de Busca Dinâmica Interna */}
                  <div style={{ width: '30%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="search-container" style={{ marginTop: 0 }}>
                      <Search className="search-icon" size={16} />
                      <input
                        type="text"
                        placeholder="Buscar registros..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '0.6rem 0.8rem 0.6rem 2.2rem', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div
                      style={{
                        maxHeight: '400px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      {filteredHistorico.map((item) => (
                        <div
                          key={item.id}
                          className={`history-item ${sessaoAtiva?.id === item.id ? 'active' : ''}`}
                          onClick={() => selecionarSessao(item)}
                          style={{ padding: '0.8rem' }}
                        >
                          <div className="date" style={{ fontSize: '0.65rem' }}>
                            {item.data}
                          </div>
                          <div className="preview" style={{ fontSize: '0.8rem' }}>
                            {item.transcricao}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ficha Clínica Selecionada */}
                  <div style={{ flex: 1 }}>
                    {exercicio ? (
                      <motion.div
                        className="result-card professional-card"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ margin: 0, background: 'rgba(15, 23, 42, 0.4)' }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1.5rem',
                          }}
                        >
                          <h3 style={{ margin: 0, fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>
                            <Sparkles size={14} style={{ marginRight: 8 }} /> Ficha Evolutiva (IA)
                          </h3>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={falando ? pararDeFalar : () => falar(exercicio)}
                              className="audio-control-btn"
                              title={falando ? 'Parar áudio' : 'Ouvir laudo'}
                            >
                              {falando ? (
                                <Square size={14} fill="currentColor" />
                              ) : (
                                <Play size={14} fill="currentColor" />
                              )}
                            </button>
                            <button
                              className="logout-btn"
                              style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}
                              onClick={(e) => deleteSessao(e, sessaoAtiva.id)}
                            >
                              <Trash2 size={12} /> Apagar
                            </button>
                          </div>
                        </div>
                        <div
                          className="result-card"
                          style={{
                            background: 'rgba(0,0,0,0.2)',
                            borderLeftColor: 'rgba(255,255,255,0.1)',
                            padding: '1rem',
                            marginBottom: '1.5rem',
                          }}
                        >
                          <h4
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-muted)',
                              textTransform: 'uppercase',
                              marginBottom: '6px',
                            }}
                          >
                            Relato do Paciente
                          </h4>
                          <p style={{ fontSize: '0.95rem', color: '#e2e8f0', fontStyle: 'italic' }}>"{transcricao}"</p>
                        </div>
                        {formatarAnalise(exercicio)}
                      </motion.div>
                    ) : (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '4rem 2rem',
                          background: 'rgba(255,255,255,0.02)',
                          borderRadius: '1.5rem',
                          border: '1px solid var(--glass-border)',
                        }}
                      >
                        <MessageSquare
                          size={32}
                          style={{ color: 'var(--accent)', opacity: 0.4, marginBottom: '1rem' }}
                        />
                        <h4 style={{ margin: 0, color: 'var(--text-main)' }}>
                          Selecione um desabafo na coluna esquerda
                        </h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                          Você poderá verificar a transcrição do áudio, gatilhos identificados e orientações teóricas da
                          IA.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
