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
  Plus
} from 'lucide-react';

import FinanceiroView from './components/FinanceiroView';
import DiarioEmocionalView from './components/DiarioEmocionalView';
import TarefasClinicasView from './components/TarefasClinicasView';
import PlanoTerapeuticoView from './components/PlanoTerapeuticoView';
import AvaliacoesView from './components/AvaliacoesView';
import AnamneseView from './components/AnamneseView';
import ProntuarioIAView from './components/ProntuarioIAView';
import AgendaView from './components/AgendaView';
import DashboardView from './components/DashboardView';
import LoginView from './components/LoginView';
import PsicologoDashboard from './components/PsicologoDashboard';
import PacienteDashboard from './components/PacienteDashboard';
import './index.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  // Autenticação e Perfis
  const [usuario, setUsuario] = useState(() => {
    const saved = localStorage.getItem('usuario');
    return saved ? JSON.parse(saved) : null;
  });

  // Estados do Chat e Histórico (Paciente)
  const [gravando, setGravando] = useState(false);
  const [transcricao, setTranscricao] = useState('');
  const [exercicio, setExercicio] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sessaoAtiva, setSessaoAtiva] = useState(null);
  const [currentView, setCurrentView] = useState('app'); // 'app', 'dashboard', 'agenda', 'financeiro', 'prontuario'
  const [showSOS, setShowSOS] = useState(false);
  const [breathingStep, setBreathingStep] = useState('Inspire');
  const [falando, setFalando] = useState(false);

  // Estados do Psicólogo
  const [listaPacientes, setListaPacientes] = useState([]);
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
  
  // Cadastro de Paciente pelo Psicólogo
  const [showNovoPacienteForm, setShowNovoPacienteForm] = useState(false);
  const [novoPacNome, setNovoPacNome] = useState('');
  const [novoPacEmail, setNovoPacEmail] = useState('');
  const [novoPacSenha, setNovoPacSenha] = useState('');

  // Estados para Financeiro (Fase 4)
  const [financeiroData, setFinanceiroData] = useState({ lancamentos: [], resumo: { total_receitas: 0, total_despesas: 0, lucro_liquido: 0 } });
  const [listaPacotes, setListaPacotes] = useState([]);

  // Notas Clínicas do Psicólogo
  const [listaNotas, setListaNotas] = useState([]);
  const [novaNotaConteudo, setNovaNotaConteudo] = useState('');
  const [carregandoNotas, setCarregandoNotas] = useState(false);
  const [abordagemSelecionada, setAbordagemSelecionada] = useState('padrao');

  // Insights IA de Risco (Novo)
  const [insightsIA, setInsightsIA] = useState({ alertas: [], foco: '', humor_trend: '' });
  const [carregandoInsights, setCarregandoInsights] = useState(false);

  // Tarefas Clínicas / Lições de Casa (Novo)
  const [listaTarefas, setListaTarefas] = useState([]);
  const [carregandoTarefas, setCarregandoTarefas] = useState(false);


  // Anamnese Clínica (Primeira Consulta)
  const [anamneseData, setAnamneseData] = useState({
    queixa_principal: '',
    historico_sintomas: '',
    historico_familiar: '',
    historico_medico: '',
    relacionamentos_sociais: '',
    expectativas_terapia: '',
    observacoes_gerais: ''
  });
  const [carregandoAnamnese, setCarregandoAnamnese] = useState(false);
  const [salvandoAnamnese, setSalvandoAnamnese] = useState(false);

  // Avaliações Psicométricas
  const [listaAvaliacoes, setListaAvaliacoes] = useState([]);
  const [carregandoAvaliacoes, setCarregandoAvaliacoes] = useState(false);
  const [novaAvaliacaoTipo, setNovaAvaliacaoTipo] = useState('PHQ-9');
  const [respostasAvaliacao, setRespostasAvaliacao] = useState({});
  
  // TCLE
  const [tcleAssinado, setTcleAssinado] = useState(true);
  const [dataAssinaturaTcle, setDataAssinaturaTcle] = useState(null);
  const [carregandoTcle, setCarregandoTcle] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);

  // Carregar dados gerais ao iniciar
  useEffect(() => {
    if (usuario) {
      fetchFinanceiro();
      if (usuario.tipo === 'paciente') {
        fetchHistorico();
        fetchPacotes();
        fetchTarefas(usuario.id);
        fetchTCLE(usuario.id);
      } else if (usuario.tipo === 'psicologo') {
        fetchPacientes();
      }
    }
  }, [usuario]);

  // Carregar histórico, pacotes e prontuário IA do paciente selecionado
  useEffect(() => {
    if (usuario && usuario.tipo === 'psicologo' && pacienteSelecionado) {
      fetchHistorico(pacienteSelecionado.id);
      fetchPacotes(pacienteSelecionado.id);
      fetchNotas(pacienteSelecionado.id);
      fetchInsights(pacienteSelecionado.id);
      fetchTarefas(pacienteSelecionado.id);
      fetchAnamnese(pacienteSelecionado.id);
    } else {
      setHistorico([]);
      setListaNotas([]);
      setListaTarefas([]);
      setInsightsIA({ alertas: [], foco: '', humor_trend: '' });
      setAnamneseData({
        queixa_principal: '',
        historico_sintomas: '',
        historico_familiar: '',
        historico_medico: '',
        relacionamentos_sociais: '',
        expectativas_terapia: '',
        observacoes_gerais: ''
      });
      setListaAvaliacoes([]);
      setRespostasAvaliacao({});
    }
    setSessaoAtiva(null);
    setTranscricao('');
    setExercicio('');
    setCurrentView('app'); // Reseta a aba interna ao trocar paciente
    setShowNovoPacienteForm(false); // Fecha cadastro se abrir paciente
  }, [pacienteSelecionado, usuario]);

  // Fetch Handlers

  const handlePsicologoCadastrarPaciente = async (e) => {
    e.preventDefault();
    try {
      const resp = await fetch(`${API_BASE_URL}/cadastro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: novoPacNome,
          email: novoPacEmail,
          senha: novoPacSenha,
          tipo: 'paciente',
          psicologo_id: usuario.id
        })
      });
      const data = await resp.json();
      if (resp.ok) {
        alert("Paciente cadastrado com sucesso!");
        setNovoPacNome('');
        setNovoPacEmail('');
        setNovoPacSenha('');
        setShowNovoPacienteForm(false);
        fetchPacientes();
      } else {
        alert(data.erro || "Erro ao cadastrar paciente");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão");
    }
  };

  const fetchHistorico = async (pacienteId = null) => {
    if (!usuario) return;
    try {
      let url = `${API_BASE_URL}/historico`;
      if (usuario.tipo === 'psicologo' && pacienteId) {
        url += `?paciente_id=${pacienteId}`;
      }

      const resp = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${usuario.token}`
        }
      });

      if (resp.status === 401) {
        handleLogout();
        return;
      }

      const data = await resp.json();
      setHistorico(data.map(item => ({
        ...item,
        sentimento: item.sentimento || 'Neutro'
      })));
    } catch (err) {
      console.error("Erro ao carregar histórico:", err);
    }
  };

  const fetchPacientes = async () => {
    if (!usuario || usuario.tipo !== 'psicologo') return;
    try {
      const resp = await fetch(`${API_BASE_URL}/pacientes`, {
        headers: {
          'Authorization': `Bearer ${usuario.token}`
        }
      });
      if (resp.status === 401) return;
      const data = await resp.json();
      setListaPacientes(data);
    } catch (err) {
      console.error("Erro ao carregar pacientes:", err);
    }
  };

  const fetchFinanceiro = async () => {
    if (!usuario || usuario.tipo !== 'psicologo') return;
    try {
      const resp = await fetch(`${API_BASE_URL}/financeiro`, {
        headers: { 'Authorization': `Bearer ${usuario.token}` }
      });
      if (resp.status === 401) return;
      const data = await resp.json();
      setFinanceiroData(data);
    } catch (err) {
      console.error("Erro ao buscar financeiro:", err);
    }
  };

  const fetchPacotes = async (pacienteId = null) => {
    if (!usuario) return;
    try {
      let url = `${API_BASE_URL}/pacotes`;
      if (usuario.tipo === 'psicologo' && pacienteId) {
        url += `?paciente_id=${pacienteId}`;
      }
      const resp = await fetch(url, {
        headers: { 'Authorization': `Bearer ${usuario.token}` }
      });
      if (resp.status === 401) return;
      const data = await resp.json();
      setListaPacotes(data);
    } catch (err) {
      console.error("Erro ao buscar pacotes:", err);
    }
  };

  const fetchTCLE = async (pacienteId) => {
    // TODO: Connect to actual backend route if needed
    setTcleAssinado(true);
  };

  const fetchDiario = async () => {
    // DiarioEmocionalView handles its own fetching
  };

  const fetchNotas = async (pacienteId) => {
    if (!usuario || usuario.tipo !== 'psicologo' || !pacienteId) return;
    setCarregandoNotas(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/paciente/${pacienteId}/notas`, {
        headers: {
          'Authorization': `Bearer ${usuario.token}`
        }
      });
      if (resp.status === 401) {
        handleLogout();
        return;
      }
      const data = await resp.json();
      if (resp.ok) {
        setListaNotas(data);
      } else {
        console.error("Erro ao buscar notas:", data.erro);
      }
    } catch (err) {
      console.error("Erro de conexão ao buscar notas:", err);
    } finally {
      setCarregandoNotas(false);
    }
  };

  const handleAdicionarNota = async (e) => {
    e.preventDefault();
    if (!usuario || usuario.tipo !== 'psicologo' || !pacienteSelecionado || !novaNotaConteudo.trim()) return;
    
    try {
      const resp = await fetch(`${API_BASE_URL}/paciente/${pacienteSelecionado.id}/notas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usuario.token}`
        },
        body: JSON.stringify({ conteudo: novaNotaConteudo })
      });
      const data = await resp.json();
      if (resp.ok) {
        setListaNotas([data.nota, ...listaNotas]);
        setNovaNotaConteudo('');
      } else {
        alert(data.erro || "Erro ao adicionar nota");
      }
    } catch (err) {
      console.error("Erro de conexão ao criar nota:", err);
      alert("Erro ao conectar com o servidor.");
    }
  };

  const handleRemoverNota = async (notaId) => {
    if (!usuario || usuario.tipo !== 'psicologo' || !window.confirm("Deseja realmente excluir esta nota? Ela não fará mais parte do prontuário inteligente.")) return;
    
    try {
      const resp = await fetch(`${API_BASE_URL}/notas/${notaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${usuario.token}`
        }
      });
      const data = await resp.json();
      if (resp.ok) {
        setListaNotas(listaNotas.filter(n => n.id !== notaId));
      } else {
        alert(data.erro || "Erro ao excluir nota");
      }
    } catch (err) {
      console.error("Erro de conexão ao remover nota:", err);
      alert("Erro ao conectar com o servidor.");
    }
  };

  const fetchInsights = async (pacienteId) => {
    if (!usuario || usuario.tipo !== 'psicologo' || !pacienteId) return;
    setCarregandoInsights(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/paciente/${pacienteId}/insights`, {
        headers: {
          'Authorization': `Bearer ${usuario.token}`
        }
      });
      if (resp.status === 401) {
        handleLogout();
        return;
      }
      const data = await resp.json();
      setInsightsIA(data);
    } catch (err) {
      console.error("Erro ao buscar insights IA:", err);
    } finally {
      setCarregandoInsights(false);
    }
  };

  const fetchTarefas = async (pacienteId) => {
    if (!usuario || !pacienteId) return;
    setCarregandoTarefas(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/paciente/${pacienteId}/tarefas`, {
        headers: {
          'Authorization': `Bearer ${usuario.token}`
        }
      });
      if (resp.status === 401) {
        handleLogout();
        return;
      }
      const data = await resp.json();
      if (resp.ok) {
        setListaTarefas(data);
      } else {
        console.error("Erro ao buscar tarefas:", data.erro);
      }
    } catch (err) {
      console.error("Erro de conexão ao buscar tarefas:", err);
    } finally {
      setCarregandoTarefas(false);
    }
  };

  const fetchAnamnese = async (pacienteId) => {
    if (!usuario || usuario.tipo !== 'psicologo' || !pacienteId) return;
    setCarregandoAnamnese(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/paciente/${pacienteId}/anamnese`, {
        headers: {
          'Authorization': `Bearer ${usuario.token}`
        }
      });
      if (resp.status === 401) {
        handleLogout();
        return;
      }
      const data = await resp.json();
      if (resp.ok) {
        setAnamneseData(data);
      } else {
        console.error("Erro ao buscar anamnese:", data.erro);
      }
    } catch (err) {
      console.error("Erro de conexão ao buscar anamnese:", err);
    } finally {
      setCarregandoAnamnese(false);
    }
  };

  const handleSalvarAnamnese = async (e) => {
    e.preventDefault();
    if (!usuario || usuario.tipo !== 'psicologo' || !pacienteSelecionado) return;
    setSalvandoAnamnese(true);
    
    try {
      const resp = await fetch(`${API_BASE_URL}/paciente/${pacienteSelecionado.id}/anamnese`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usuario.token}`
        },
        body: JSON.stringify(anamneseData)
      });
      const data = await resp.json();
      if (resp.ok) {
        setAnamneseData({
          ...anamneseData,
          data_atualizacao: data.data_atualizacao
        });
        alert(data.mensagem || "Anamnese salva com sucesso!");
        fetchInsights(pacienteSelecionado.id);
      } else {
        alert(data.erro || "Erro ao salvar anamnese");
      }
    } catch (err) {
      console.error("Erro ao salvar anamnese:", err);
      alert("Erro ao conectar com o servidor.");
    } finally {
      setSalvandoAnamnese(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    setUsuario(null);
    setHistorico([]);
    setListaPacientes([]);
    setListaConsultas([]);
    setFinanceiroData({ lancamentos: [], resumo: { total_receitas: 0, total_despesas: 0, lucro_liquido: 0 } });
    setListaPacotes([]);
    setPacienteSelecionado(null);
    setSessaoAtiva(null);
    setTranscricao('');
    setExercicio('');
    setCurrentView('app');
    window.speechSynthesis.cancel();
    setFalando(false);
    setInsightsIA({ alertas: [], foco: null });
    setListaTarefas([]);
    setAnamneseData({});
    setListaAvaliacoes([]);
    setTcleAssinado(true);
  };

  // Animação de respiração e Som binaural 432Hz
  useEffect(() => {
    if (!showSOS) {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => { });
        audioContextRef.current = null;
      }
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 2);
    masterGain.connect(ctx.destination);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(432, ctx.currentTime);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(433.5, ctx.currentTime);

    osc1.connect(masterGain);
    osc2.connect(masterGain);

    osc1.start();
    osc2.start();

    const steps = ['Inspire', 'Segure', 'Expire', 'Segure'];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % steps.length;
      setBreathingStep(steps[idx]);
    }, 4000);

    return () => {
      clearInterval(interval);
      if (ctx.state !== 'closed') {
        masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
        setTimeout(() => ctx.close().catch(() => { }), 1100);
      }
    };
  }, [showSOS]);

  // TTS de Voz
  useEffect(() => {
    const carregarVozes = () => window.speechSynthesis.getVoices();
    carregarVozes();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = carregarVozes;
    }
  }, []);

  const falar = (texto) => {
    if (!texto || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();

    const mensagemPura = texto
      .replace(/SENTIMENTO:.*?\\n/g, '')
      .replace(/ABORDAGEM:/g, 'Abordagem teórica sugerida: ')
      .replace(/LAUDO:/g, 'Laudo de acompanhamento: ')
      .replace(/MAPA:/g, 'Mapa de sensibilidade: ')
      .replace(/ORIENTACAO:/g, 'Orientação técnica: ')
      .replace(/SESSAO:/g, 'Pauta para a próxima sessão: ')
      .replace(/[*#=_\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const chunks = mensagemPura.match(/.{1,200}(?:\s|$)/g) || [mensagemPura];
    let currentChunk = 0;

    const speakNextChunk = () => {
      if (currentChunk >= chunks.length) {
        setFalando(false);
        return;
      }

      const locutor = new SpeechSynthesisUtterance(chunks[currentChunk]);
      const vozes = window.speechSynthesis.getVoices();

      const vozCalma = vozes.find(v => v.name.includes('Natural') && v.lang.includes('pt-BR')) ||
        vozes.find(v => v.name.includes('Neural') && v.lang.includes('pt-BR')) ||
        vozes.find(v => v.name.includes('Google') && v.lang.includes('pt-BR')) ||
        vozes.find(v => v.lang.includes('pt-BR'));

      if (vozCalma) locutor.voice = vozCalma;
      locutor.lang = 'pt-BR';
      locutor.rate = 1.0;
      locutor.pitch = 0.75;
      locutor.volume = 0.9;

      locutor.onstart = () => {
        setFalando(true);
      };

      locutor.onend = () => {
        currentChunk++;
        setTimeout(speakNextChunk, 500);
      };

      locutor.onerror = () => setFalando(false);
      window.speechSynthesis.speak(locutor);
    };

    speakNextChunk();
  };

  const pararDeFalar = () => {
    window.speechSynthesis.cancel();
    setFalando(false);
  };

  const SOSOverlay = () => (
    <motion.div className="sos-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button className="close-sos" onClick={() => setShowSOS(false)}><X size={24} /></button>
      <div className="breathing-container">
        <motion.div className="breathing-circle" animate={{ scale: breathingStep === 'Inspire' || breathingStep === 'Segure' ? 1.5 : 1 }} transition={{ duration: 4, ease: "easeInOut" }}>
          <Wind size={64} className="breathe-icon" />
        </motion.div>
        <h2 className="breathing-text">{breathingStep}</h2>
        <p style={{ opacity: 0.6 }}>Respire fundo, isso vai passar.</p>
      </div>
    </motion.div>
  );

  const deleteSessao = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Deseja apagar este registro do histórico?")) return;

    try {
      const resp = await fetch(`${API_BASE_URL}/sessao/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${usuario.token}`
        }
      });

      if (resp.status === 401) {
        handleLogout();
        return;
      }

      fetchHistorico(pacienteSelecionado ? pacienteSelecionado.id : null);
      if (sessaoAtiva?.id === id) {
        setTranscricao('');
        setExercicio('');
        setSessaoAtiva(null);
      }
    } catch (err) {
      console.error("Erro ao deletar:", err);
    }
  };

  const filteredHistorico = useMemo(() => {
    if (!searchTerm) return historico;
    const fuse = new Fuse(historico, {
      keys: ['transcricao', 'exercicio', 'sentimento'],
      threshold: 0.4
    });
    return fuse.search(searchTerm).map(result => result.item);
  }, [historico, searchTerm]);

  const iniciarGravacao = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new window.MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);

      mediaRecorder.onstop = async () => {
        setCarregando(true);
        const audioBlob = new Blob(audioChunksRef.current);
        const formData = new FormData();
        formData.append('audio', audioBlob, 'sessao.mp3');

        try {
          const resposta = await fetch(`${API_BASE_URL}/transcribe`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${usuario.token}`
            },
            body: formData
          });

          if (resposta.status === 401) {
            handleLogout();
            return;
          }

          const dados = await resposta.json();
          setTranscricao(dados.transcricao);

          const respostaExercicio = await fetch(`${API_BASE_URL}/sugerir-exercicio`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${usuario.token}`
            },
            body: JSON.stringify({
              transcricao: dados.transcricao,
              contexto_anterior: exercicio
            })
          });

          if (respostaExercicio.status === 401) {
            handleLogout();
            return;
          }

          const exercicioData = await respostaExercicio.json();
          setExercicio(exercicioData.exercicio);

          falar(exercicioData.exercicio);
          fetchHistorico();
        } catch (error) {
          console.error("Erro ao processar áudio:", error);
          setTranscricao("Erro na conexão com o assistente.");
        } finally {
          setCarregando(false);
        }
      };

      mediaRecorder.start();
      setGravando(true);
      if (!exercicio) {
        setTranscricao('');
      }
      setSessaoAtiva(null);
      window.speechSynthesis.cancel();
    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      alert("Por favor, permita o acesso ao microfone.");
    }
  };

  const pararGravacao = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setGravando(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const selecionarSessao = (sessao) => {
    setSessaoAtiva(sessao);
    setTranscricao(sessao.transcricao);
    setExercicio(sessao.exercicio);
    falar(sessao.exercicio);
  };

  const formatarAnalise = (texto) => {
    if (!texto) return null;

    const getMatch = (tag) => {
      const regex = new RegExp(`${tag}:([\\s\\S]*?)(?=[A-Z]{4,}:|$)`);
      const match = texto.match(regex);
      return match ? match[1].trim() : null;
    };

    const sections = {
      abordagem: getMatch('ABORDAGEM'),
      laudo: getMatch('LAUDO'),
      mapa: getMatch('MAPA'),
      orientacao: getMatch('ORIENTACAO'),
      sessao: getMatch('SESSAO')
    };

    return (
      <div className="professional-analysis">
        {sections.abordagem && (
          <div className="analysis-section theory-badge">
            <h4 style={{ color: '#ec4899' }}><Sparkles size={14} style={{ marginRight: 8 }} /> Base Teórica</h4>
            <p className="theory-text"><strong>{sections.abordagem}</strong></p>
          </div>
        )}
        {sections.laudo && (
          <div className="analysis-section">
            <h4><ChevronRight size={14} /> Laudo de Acompanhamento</h4>
            <p className="clinical-text">{sections.laudo}</p>
          </div>
        )}

        {sections.mapa && (
          <div className="analysis-section sensitivity-map">
            <h4><ChevronRight size={14} /> Mapa de Sensibilidade</h4>
            <div className="trigger-cloud">
              {sections.mapa.split('\n').map((line, i) => line.trim() && (
                <span key={i} className="trigger-tag">{line.replace(/^[-*]\s*/, '')}</span>
              ))}
            </div>
          </div>
        )}

        {sections.orientacao && (
          <div className="analysis-section orientation">
            <h4><ChevronRight size={14} /> Orientação Técnica</h4>
            <p>{sections.orientacao}</p>
          </div>
        )}

        {sections.sessao && (
          <div className="analysis-section preparation">
            <h4><ChevronRight size={14} /> Pauta para Próxima Sessão</h4>
            <ul>
              {sections.sessao.split('\n').map((line, i) => line.trim() && (
                <li key={i}>{line.replace(/^[-*]\s*/, '')}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  if (!usuario) {
    return <LoginView setUsuario={setUsuario} API_BASE_URL={API_BASE_URL} />;
  }

  
  const allProps = {
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
  };

  if (usuario.tipo === 'psicologo') {
    return <PsicologoDashboard {...allProps} />;
  }

  return <PacienteDashboard {...allProps} />;
}

export default App;
