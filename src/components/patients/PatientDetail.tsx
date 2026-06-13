import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Clipboard, 
  Printer, 
  Plus, 
  Calendar as CalendarIcon, 
  FileText, 
  FileSpreadsheet,
  Heart,
  User,
  Brain,
  MessageSquare,
  Smile,
  TrendingUp,
  BarChart2,
  Target,
  Download,
  AudioLines,
  Sparkles,
  Copy,
  Check,
  Trash2,
  Share2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { api } from '../../services/api';
import type { Patient, Evolution, PatientForm } from '../../services/api';
import type { ProfessionalProfile } from '../../context/AuthContext';
import { calculateAge } from '../../utils/formatters';
import { supabase } from '../../services/supabaseClient';
import { ysqLabels } from '../../utils/ysqQuestions';
import { YsqResults } from './YsqResults';

interface PatientDetailProps {
  patient: Patient;
  evolutions: Evolution[];
  appliedForms: PatientForm[];
  user: ProfessionalProfile | null;
  onBack: () => void;
  onOpenEvolutionModal: () => void;
  onOpenApplyFormModal: () => void;
  onRefreshForms: () => Promise<void>;
}

import { AnalysisModal } from './AnalysisModal';
import { PatientProfileModal } from './PatientProfileModal';
import { SentimentModal } from './SentimentModal';
import { MetricsModal } from './MetricsModal';
import { ProgressRadarModal } from './ProgressRadarModal';
import { ReportExportModal } from './ReportExportModal';
import { TestsModal } from './TestsModal';
import type { AnalysisType } from '../../services/aiService';
import type { PatientAnalysis } from '../../services/api';

interface TimelineEvent {
  id: string;
  date: string;
  type: 'evolution' | 'ysq' | 'crisis';
  data: any;
}

export const PatientDetail: React.FC<PatientDetailProps> = ({
  patient,
  evolutions,
  appliedForms,
  user,
  onBack,
  onOpenEvolutionModal,
  onOpenApplyFormModal,
  onRefreshForms
}) => {
  const [activeView, setActiveView] = useState<'dashboard' | 'evolutions' | 'forms'>('dashboard');

  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [activeAnalysisType, setActiveAnalysisType] = useState<AnalysisType>('freud');
  const [patientAnalysis, setPatientAnalysis] = useState<PatientAnalysis | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [sentimentModalOpen, setSentimentModalOpen] = useState(false);
  const [testsModalOpen, setTestsModalOpen] = useState(false);
  
  const [metricsModalOpen, setMetricsModalOpen] = useState(false);
  const [progressRadarModalOpen, setProgressRadarModalOpen] = useState(false);
  const [reportExportModalOpen, setReportExportModalOpen] = useState(false);

  // Estados da Linha do Tempo Clínica Integrada
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(true);
  const [ysqResultsOpen, setYsqResultsOpen] = useState(false);
  const [selectedYsqSubmissionId, setSelectedYsqSubmissionId] = useState<string | null>(null);
  const [copiedFormId, setCopiedFormId] = useState<string | null>(null);

  // Carrega formulações clínicas
  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        const data = await api.getPatientAnalysis(patient.id);
        if (data) setPatientAnalysis(data);
      } catch (e) {
        console.error('Falha ao carregar analises:', e);
      }
    };
    loadAnalysis();
  }, [patient.id]);

  // Carrega crises e submissões YSQ para montar a Timeline Integrada
  const fetchTimelineData = async () => {
    setLoadingTimeline(true);
    try {
      // 1. Busca crises
      const { data: crisisData } = await supabase
        .from('patient_crisis_checkins')
        .select('*')
        .eq('patient_id', patient.id);

      // 2. Busca submissões YSQ concluídas
      const { data: ysqData } = await supabase
        .from('ysq_submissions')
        .select('*, ysq_scores(*)')
        .eq('patient_id', patient.id)
        .eq('status', 'completed');

      const events: TimelineEvent[] = [];

      // Sessões Clínicas
      evolutions.forEach(evo => {
        events.push({
          id: evo.id,
          date: evo.session_date ? `${evo.session_date}T12:00:00` : evo.created_at,
          type: 'evolution',
          data: evo
        });
      });

      // Crises de Emergência
      if (crisisData) {
        crisisData.forEach(c => {
          events.push({
            id: c.id,
            date: c.created_at,
            type: 'crisis',
            data: c
          });
        });
      }

      // Testes YSQ-L3
      if (ysqData) {
        ysqData.forEach(y => {
          events.push({
            id: y.id,
            date: y.completed_at || y.updated_at || y.created_at,
            type: 'ysq',
            data: y
          });
        });
      }

      // Ordenar decrescente por data
      events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTimelineEvents(events);
    } catch (err) {
      console.error('Erro ao montar timeline clínica integrada:', err);
    } finally {
      setLoadingTimeline(false);
    }
  };

  useEffect(() => {
    if (patient.id) {
      fetchTimelineData();
    }
  }, [patient.id, evolutions]);

  const openAnalysis = (type: AnalysisType) => {
    setActiveAnalysisType(type);
    setAnalysisModalOpen(true);
  };

  const handleOpenYsqResults = (submissionId: string) => {
    setSelectedYsqSubmissionId(submissionId);
    setYsqResultsOpen(true);
  };

  const handleDeleteForm = async (formId: string) => {
    if (!window.confirm('Tem certeza de que deseja excluir este formulário? Se for um link pendente, o paciente não conseguirá mais responder.')) {
      return;
    }
    try {
      await api.deletePatientForm(formId);
      await onRefreshForms();
    } catch (err) {
      console.error('Erro ao excluir formulário:', err);
      alert('Erro ao excluir formulário.');
    }
  };

  const handleCopyFormLink = (formId: string) => {
    const link = `${window.location.origin}/responder-formulario/${formId}`;
    navigator.clipboard.writeText(link);
    setCopiedFormId(formId);
    setTimeout(() => setCopiedFormId(null), 2000);
  };

  const handleSendFormWhatsApp = (form: PatientForm) => {
    const link = `${window.location.origin}/responder-formulario/${form.id}`;
    const message = `Olá, ${patient.name}! Por favor, responda a este formulário personalizado de anamnese clínica: ${link}`;
    const phoneClean = patient.phone ? patient.phone.replace(/\D/g, '') : '';
    const url = `https://api.whatsapp.com/send?phone=${phoneClean}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const getCriticalYsqSchemes = (scores: any) => {
    if (!scores) return [];
    
    // Filtra campos de score e ordena os maiores
    const items = Object.entries(scores)
      .filter(([key]) => key.endsWith('_score'))
      .map(([key, val]) => {
        const sigla = key.replace('_score', '');
        return {
          sigla,
          label: ysqLabels[sigla] || sigla,
          score: Number(val)
        };
      })
      .filter(item => item.score >= 4.0) // notas acima ou igual a 4.0 (critico)
      .sort((a, b) => b.score - a.score);

    return items.slice(0, 3); // retorna os 3 esquemas mais altos
  };

  if (activeView === 'evolutions' || activeView === 'forms') {
    return (
      <div className="patient-detail-view animate-fade-in">
        <button className="btn btn-secondary back-btn btn-voltar-dash" onClick={() => setActiveView('dashboard')}>
          <ArrowLeft size={18} />
          <span>Voltar para o Dashboard</span>
        </button>

        {activeView === 'evolutions' ? (
          /* TIMELINE CLÍNICA INTEGRADA */
          <div className="tab-content card">
            <div className="evolutions-tab">
              <div className="tab-header">
                <div>
                  <h3>Linha do Tempo Clínica Integrada</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                    Sessões, avaliações de esquemas YSQ-L3 e alertas do monitoramento de crises em ordem cronológica.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn btn-secondary print-action-btn" onClick={() => window.print()} title="Imprimir prontuário completo do paciente">
                    <Printer size={18} />
                    <span>Imprimir Prontuário</span>
                  </button>
                  <button type="button" className="btn btn-primary" onClick={onOpenEvolutionModal}>
                    <Plus size={18} />
                    <span>Nova Sessão / Evolução</span>
                  </button>
                </div>
              </div>

              {loadingTimeline ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: '12px' }}>
                  <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Montando linha do tempo clínica...</span>
                </div>
              ) : timelineEvents.length === 0 ? (
                <div className="empty-sub-state">
                  <FileText size={40} className="sub-empty-icon" />
                  <p>Nenhum registro clínico para este paciente ainda.</p>
                  <button className="btn btn-secondary btn-sm" onClick={onOpenEvolutionModal}>
                    Registrar Primeira Sessão
                  </button>
                </div>
              ) : (
                <div className="timeline">
                  {timelineEvents.map((event) => {
                    const eventDate = new Date(event.date);
                    
                    return (
                      <div key={`${event.type}-${event.id}`} className={`timeline-item event-${event.type}`}>
                        <div className="timeline-marker"></div>
                        <div className="timeline-content card">
                          <div className="timeline-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                              <CalendarIcon size={14} />
                              <strong>
                                {eventDate.toLocaleDateString('pt-BR', {
                                  day: '2-digit', month: 'long', year: 'numeric'
                                })} • {eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </strong>
                            </div>

                            {/* Badge do Tipo de Evento */}
                            {event.type === 'evolution' && (
                              <span className="badge-timeline event-badge-evo">Sessão / Evolução</span>
                            )}
                            {event.type === 'ysq' && (
                              <span className="badge-timeline event-badge-ysq">Avaliação YSQ-L3</span>
                            )}
                            {event.type === 'crisis' && (
                              <span className={`badge-timeline event-badge-crisis risk-${event.data.risk_level}`}>
                                Check-in de Crise ({event.data.risk_level === 'critical' ? 'Crítico' : event.data.risk_level === 'high' ? 'Alto' : event.data.risk_level === 'moderate' ? 'Moderado' : 'Baixo'})
                              </span>
                            )}
                          </div>

                          {/* Conteúdo Específico por Tipo */}
                          {event.type === 'evolution' && (
                            <p className="timeline-text" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                              {event.data.content}
                            </p>
                          )}

                          {event.type === 'ysq' && (
                            <div className="timeline-ysq-block" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <h4 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0 }}>
                                Questionário de Esquemas preenchido
                              </h4>
                              {event.data.ysq_scores && event.data.ysq_scores[0] ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                    Esquemas mais salientes (Pontuação ≥ 4.0):
                                  </span>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                                    {getCriticalYsqSchemes(event.data.ysq_scores[0]).length === 0 ? (
                                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                        Nenhum esquema clínico crítico identificado (todos abaixo de 4.0).
                                      </span>
                                    ) : (
                                      getCriticalYsqSchemes(event.data.ysq_scores[0]).map(item => (
                                        <span key={item.sigla} style={{ fontSize: '0.78rem', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', color: '#6b21a8', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                                          {item.label} ({item.score.toFixed(1)})
                                        </span>
                                      ))
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                  Escores de esquemas não calculados.
                                </span>
                              )}
                              
                              <button 
                                type="button" 
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleOpenYsqResults(event.data.id)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start', marginTop: '4px' }}
                              >
                                <Target size={14} />
                                <span>Ver Gráfico Radar e Formulação de Caso</span>
                              </button>
                            </div>
                          )}

                          {event.type === 'crisis' && (
                            <div className="timeline-crisis-block" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {/* Humor do Paciente */}
                              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <span style={{ fontSize: '0.85rem' }}>
                                  Humor Autoavaliado: <strong>{['😢', '🙁', '😐', '🙂', '😊'][event.data.mood_score - 1] || '😐'} ({event.data.mood_score}/5)</strong>
                                </span>
                                <span style={{ fontSize: '0.85rem', borderLeft: '1px solid #cbd5e1', paddingLeft: '16px' }}>
                                  Ideação Suicida: <strong style={{ color: event.data.ideation_flag ? 'var(--error)' : '#16a34a' }}>{event.data.ideation_flag ? 'Sim' : 'Não'}</strong>
                                </span>
                                {event.data.has_plan && (
                                  <span style={{ fontSize: '0.85rem', borderLeft: '1px solid #cbd5e1', paddingLeft: '16px', color: 'var(--error)', fontWeight: 800 }}>
                                    ⚠️ Possui Plano de Tentativa
                                  </span>
                                )}
                              </div>

                              {/* Depoimento em áudio */}
                              {event.data.audio_url && (
                                <div style={{ background: '#f4f7f5', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2ede5', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4a7c59', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <AudioLines size={14} /> depoimento em áudio gravado:
                                  </span>
                                  <audio src={event.data.audio_url} controls style={{ width: '100%', height: '32px' }}></audio>
                                </div>
                              )}

                              {/* Transcrição de voz */}
                              {event.data.transcript && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Transcrição:</span>
                                  <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                                    "{event.data.transcript}"
                                  </p>
                                </div>
                              )}

                              {/* Avaliação de IA */}
                              {event.data.ai_risk_assessment && (
                                <div style={{ display: 'flex', gap: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '10px 14px', borderRadius: '8px', color: '#1e3a8a', fontSize: '0.82rem', lineHeight: '1.4' }}>
                                  <Sparkles size={16} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
                                  <div>
                                    <strong>Triagem de Risco por Inteligência Artificial:</strong>
                                    <p style={{ margin: '4px 0 0 0' }}>{event.data.ai_risk_assessment}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ABA DE FORMULÁRIOS DINÂMICOS */
          <div className="tab-content card">
            <div className="forms-tab">
              <div className="tab-header">
                <div>
                  <h3>Formulários e Fichas de Anamnese</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                    Acompanhe o preenchimento de anamneses, envie links de preenchimento externo ou lance fichas em sessão.
                  </p>
                </div>
                <button className="btn btn-primary" onClick={onOpenApplyFormModal}>
                  <Clipboard size={18} />
                  <span>Aplicar Formulário</span>
                </button>
              </div>

              {appliedForms.length === 0 ? (
                <div className="empty-sub-state">
                  <FileSpreadsheet size={40} className="sub-empty-icon" />
                  <p>Nenhum formulário aplicado a este paciente ainda.</p>
                  <button className="btn btn-secondary btn-sm" onClick={onOpenApplyFormModal}>
                    Aplicar Formulário de Teste
                  </button>
                </div>
              ) : (
                <div className="applied-forms-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {appliedForms.map((form) => {
                    const isPending = form.status === 'pending';
                    
                    return (
                      <div key={form.id} className={`applied-form-item card ${isPending ? 'form-status-pending' : ''}`} style={{ border: isPending ? '1.5px dashed #f59e0b' : '1px solid var(--border-color)' }}>
                        <div className="applied-form-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 700 }}>
                              {form.template?.title || 'Formulário Personalizado'}
                              {isPending && (
                                <span style={{ fontSize: '0.72rem', backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>
                                  Link Externo Ativo
                                </span>
                              )}
                            </h4>
                            
                            <span className="filled-date" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                              {isPending ? (
                                `Link gerado em: ${new Date(form.created_at).toLocaleDateString('pt-BR')} às ${new Date(form.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`
                              ) : (
                                `Preenchido em: ${new Date(form.filled_at || form.created_at).toLocaleDateString('pt-BR')} às ${new Date(form.filled_at || form.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`
                              )}
                            </span>
                          </div>

                          {/* Ações Rápidas (Excluir, Copiar) */}
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {isPending && (
                              <>
                                <button 
                                  type="button" 
                                  className={`btn ${copiedFormId === form.id ? 'btn-success' : 'btn-secondary'} btn-sm`} 
                                  onClick={() => handleCopyFormLink(form.id)}
                                  style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', backgroundColor: copiedFormId === form.id ? '#4a7c59' : '', color: copiedFormId === form.id ? 'white' : '' }}
                                >
                                  {copiedFormId === form.id ? <Check size={12} /> : <Copy size={12} />}
                                  <span>{copiedFormId === form.id ? 'Copiado!' : 'Copiar Link'}</span>
                                </button>
                                <button 
                                  type="button" 
                                  className="btn btn-secondary btn-sm" 
                                  onClick={() => handleSendFormWhatsApp(form)}
                                  style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}
                                >
                                  <Share2 size={12} />
                                  <span>WhatsApp</span>
                                </button>
                              </>
                            )}
                            <button 
                              type="button" 
                              className="btn btn-secondary btn-sm text-error" 
                              onClick={() => handleDeleteForm(form.id)}
                              style={{ padding: '4px 8px', color: 'var(--error)', border: '1px solid #fee2fee' }}
                              title="Excluir este formulário"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Conteúdo das Respostas ou Aviso de Pendente */}
                        {isPending ? (
                          <div className="applied-form-pending-box" style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '16px', borderRadius: '8px', color: '#b45309', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                            <AlertCircle size={16} />
                            <span>
                              Aguardando o paciente responder. Você pode enviar o link acima para preenchimento no celular ou computador.
                            </span>
                          </div>
                        ) : (
                          <div className="applied-form-answers" style={{ marginTop: '14px' }}>
                            {Object.entries(form.answers).map(([label, val]) => (
                              <div key={label} className="answer-row">
                                <span className="question-lbl">{label}:</span>
                                <span className="answer-val">
                                  {typeof val === 'boolean' ? (val ? 'Sim' : 'Não') : String(val || '—')}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de Exibição de Scores do YSQ */}
        <YsqResults
          isOpen={ysqResultsOpen}
          onClose={() => setYsqResultsOpen(false)}
          submissionId={selectedYsqSubmissionId || ''}
          patientName={patient.name}
        />
      </div>
    );
  }

  return (
    <div className="patient-detail-view animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={onBack}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{patient.name}</h2>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Idade: {calculateAge(patient.birth_date)} • Paciente desde {new Date(patient.created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
        <button className="btn btn-primary" onClick={onOpenEvolutionModal}>
          <Plus size={18} />
          <span>Nova Sessão</span>
        </button>
      </div>

      <div className="dashboard-modules-container">
        {/* MÓDULO 1 */}
        <div className="module-section">
          <h4 className="module-title">Módulo 1 — Perfil e Avaliações</h4>
          <div className="module-grid">
            <div className="module-card" onClick={() => setProfileModalOpen(true)} style={{ cursor: 'pointer' }}>
              <div className="module-icon-badge">
                <User className="module-icon" size={24} />
              </div>
              <h5>Ficha do paciente</h5>
              <p>Dados pessoais, histórico clínico, queixas principais, medicamentos em uso e contatos de emergência.</p>
              <span className="badge-module badge-core">Core</span>
            </div>

            <div className="module-card ia" onClick={() => setActiveView('forms')}>
              <div className="module-icon-badge">
                <Clipboard className="module-icon" size={24} />
              </div>
              <h5>Avaliação inicial</h5>
              <p>Formulário estruturado de anamnese psicológica. Ao finalizar, gera o prontuário inteligente automaticamente.</p>
              <span className="badge-module badge-ia">IA</span>
            </div>
          </div>
        </div>

        {/* MÓDULO 2 */}
        <div className="module-section">
          <h4 className="module-title">Módulo 2 — Avaliação e Inteligência</h4>
          <div className="module-grid">
            
            <div className="module-card ia" onClick={() => openAnalysis('freud')} style={{ cursor: 'pointer' }}>
              <div className="module-icon-badge">
                <Brain className="module-icon" size={24} />
              </div>
              <h5>Análise freudiana</h5>
              <p>Mecanismos de defesa identificados, conflitos inconscientes mapeados e hipóteses psicodinâmicas com base na avaliação.</p>
              <span className="badge-module badge-ia">IA</span>
            </div>

            <div className="module-card ia" onClick={() => openAnalysis('tcc')} style={{ cursor: 'pointer' }}>
              <div className="module-icon-badge">
                <MessageSquare className="module-icon" size={24} />
              </div>
              <h5>Análise TCC (Aaron Beck)</h5>
              <p>Crenças centrais, pensamentos automáticos e distorções cognitivas identificadas. Sugestão de técnicas e intervenções.</p>
              <span className="badge-module badge-ia">IA</span>
            </div>

            <div className="module-card ia" onClick={() => openAnalysis('rogers')} style={{ cursor: 'pointer' }}>
              <div className="module-icon-badge">
                <Heart className="module-icon" size={24} />
              </div>
              <h5>Análise humanista (Carl Rogers)</h5>
              <p>Grau de congruência do paciente, condições de valor percebidas e potencial de tendência atualizante.</p>
              <span className="badge-module badge-ia">IA</span>
            </div>

            <div className="module-card ia" onClick={() => openAnalysis('synthesis')} style={{ cursor: 'pointer', border: '1px solid #7c3aed', backgroundColor: '#faf5ff' }}>
              <div className="module-icon-badge" style={{ backgroundColor: '#7c3aed', color: 'white' }}>
                <FileText className="module-icon" size={24} />
              </div>
              <h5>Síntese clínica (Editável)</h5>
              <p>Consolidação das três análises in uma síntese única que o terapeuta pode revisar, editar e salvar como avaliação final do paciente.</p>
              <span className="badge-module badge-ia" style={{ backgroundColor: '#7c3aed', color: 'white' }}>IA CORE</span>
            </div>

            <div className="module-card" onClick={() => setTestsModalOpen(true)} style={{ cursor: 'pointer' }}>
              <div className="module-icon-badge" style={{ backgroundColor: '#e6f4ea', color: '#137333' }}>
                <FileText className="module-icon" size={24} />
              </div>
              <h5>Testes Psicológicos</h5>
              <p>Registro de aplicação e resultados de testes aprovados pelo SATEPSI (fontes fundamentais de avaliação).</p>
              <span className="badge-module badge-novo">SATEPSI</span>
            </div>

          </div>
        </div>

        {/* MÓDULO 3 */}
        <div className="module-section">
          <h4 className="module-title">Módulo 3 — Análise de Sentimento e Evolução</h4>
          <div className="module-grid">
            <div className="module-card ia" onClick={() => setSentimentModalOpen(true)} style={{ cursor: 'pointer' }}>
              <div className="module-icon-badge">
                <Smile className="module-icon" size={24} />
              </div>
              <h5>Mapa emocional da sessão</h5>
              <p>Após cada sessão, o terapeuta registra notas e a IA identifica emoções predominantes, gerando um radar emocional visual.</p>
              <span className="badge-module badge-ia">IA</span>
            </div>

            <div className="module-card" onClick={() => setActiveView('evolutions')} style={{ cursor: 'pointer' }}>
              <div className="module-icon-badge">
                <TrendingUp className="module-icon" size={24} />
              </div>
              <h5>Evolução do sentimento</h5>
              <p>Gráfico de linha temporal mostrando a variação de ansiedade, depressão, autoestima e bem-estar ao longo das sessões.</p>
              <span className="badge-module badge-core">Core</span>
            </div>
          </div>
        </div>

        {/* MÓDULO 4 */}
        <div className="module-section">
          <h4 className="module-title">Módulo 4 — Métricas e Relatórios</h4>
          <div className="module-grid">
            <div className="module-card" onClick={() => setMetricsModalOpen(true)} style={{ cursor: 'pointer' }}>
              <div className="module-icon-badge">
                <BarChart2 className="module-icon" size={24} />
              </div>
              <h5>Painel de métricas</h5>
              <p>Total de sessões, frequência, faltas, duração média e engajamento do paciente.</p>
              <span className="badge-module badge-core">Core</span>
            </div>

            <div className="module-card" onClick={() => setProgressRadarModalOpen(true)} style={{ cursor: 'pointer' }}>
              <div className="module-icon-badge">
                <Target className="module-icon" size={24} />
              </div>
              <h5>Radar de progresso</h5>
              <p>Gráfico radar comparando estado inicial vs. atual em 6 dimensões psicológicas.</p>
              <span className="badge-module badge-novo">Novo</span>
            </div>

            <div className="module-card" onClick={() => setReportExportModalOpen(true)} style={{ cursor: 'pointer' }}>
              <div className="module-icon-badge">
                <Download className="module-icon" size={24} />
              </div>
              <h5>Relatório exportável</h5>
              <p>Relatório em PDF com toda a evolução do paciente, para encaminhamentos ou arquivamento.</p>
              <span className="badge-module badge-core">Core</span>
            </div>
          </div>
        </div>
      </div>

      <PatientProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        patient={patient}
        professionalId={user?.id || ''}
      />

      <SentimentModal
        isOpen={sentimentModalOpen}
        onClose={() => setSentimentModalOpen(false)}
        patient={patient}
        evolutions={evolutions}
      />

      <MetricsModal
        isOpen={metricsModalOpen}
        onClose={() => setMetricsModalOpen(false)}
        patient={patient}
        evolutions={evolutions}
      />

      <ProgressRadarModal
        isOpen={progressRadarModalOpen}
        onClose={() => setProgressRadarModalOpen(false)}
        patient={patient}
        evolutions={evolutions}
      />

      <TestsModal
        isOpen={testsModalOpen}
        onClose={() => setTestsModalOpen(false)}
        patient={patient}
        professionalId={user?.id || ''}
      />

      <ReportExportModal
        isOpen={reportExportModalOpen}
        onClose={() => setReportExportModalOpen(false)}
        patient={patient}
        evolutions={evolutions}
      />

      <AnalysisModal
        isOpen={analysisModalOpen}
        onClose={() => setAnalysisModalOpen(false)}
        type={activeAnalysisType}
        patient={patient}
        evolutions={evolutions}
        forms={appliedForms}
        professionalId={user?.id || ''}
        currentAnalysis={patientAnalysis}
        onAnalysisSaved={(updated) => setPatientAnalysis(updated)}
      />
    </div>
  );
};
