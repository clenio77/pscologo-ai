import sys

def main():
    with open('/home/clenio/Documentos/Meusagentes/pscologo_ai/frontend/src/App.js.backup', 'r') as f:
        lines = f.readlines()
        
    psicologo_jsx = "".join(lines[817:1268]) # 817 is index 817. Wait, array is 0-indexed.
    # Line 1 is index 0. So line 818 is index 817.
    # Let's use 1-indexed to be safe:
    # return ( starts at line 817. Index 816.
    # ); ends at line 1267. Index 1266.
    # slice: 816 to 1267
    psicologo_jsx = "".join(lines[816:1267])
    
    # Paciente
    # return ( starts at 1270. Index 1269.
    # ); ends at 1604. Index 1603.
    # slice: 1269 to 1604
    paciente_jsx = "".join(lines[1269:1604])

    imports = """import React, { useState, useRef, useEffect, useMemo } from 'react';
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
"""

    props_destructure = """  const {
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
"""

    psicologo_code = imports + "\nexport default function PsicologoDashboard(props) {\n" + props_destructure + "\n" + psicologo_jsx + "\n}\n"
    
    paciente_code = imports + "\nexport default function PacienteDashboard(props) {\n" + props_destructure + "\n"
    paciente_code += """
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
"""
    paciente_code += "\n" + paciente_jsx + "\n}\n"
    
    with open('/home/clenio/Documentos/Meusagentes/pscologo_ai/frontend/src/components/PsicologoDashboard.js', 'w') as f:
        f.write(psicologo_code)

    with open('/home/clenio/Documentos/Meusagentes/pscologo_ai/frontend/src/components/PacienteDashboard.js', 'w') as f:
        f.write(paciente_code)

if __name__ == '__main__':
    main()
