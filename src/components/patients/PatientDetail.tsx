import React, { useState } from 'react';
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
  Download
} from 'lucide-react';
import { api } from '../../services/api';
import type { Patient, Evolution, PatientForm } from '../../services/api';
import type { ProfessionalProfile } from '../../context/AuthContext';
import { calculateAge } from '../../utils/formatters';

interface PatientDetailProps {
  patient: Patient;
  evolutions: Evolution[];
  appliedForms: PatientForm[];
  user: ProfessionalProfile | null;
  onBack: () => void;
  onOpenEvolutionModal: () => void;
  onOpenApplyFormModal: () => void;
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

export const PatientDetail: React.FC<PatientDetailProps> = ({
  patient,
  evolutions,
  appliedForms,
  user,
  onBack,
  onOpenEvolutionModal,
  onOpenApplyFormModal,
}) => {
  // Para fins de mockup, se clicar em um card não implementado mostra um toast ou console log, mas vamos usar um estado para views se quisermos
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

  React.useEffect(() => {
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

  const openAnalysis = (type: AnalysisType) => {
    setActiveAnalysisType(type);
    setAnalysisModalOpen(true);
  };

  if (activeView === 'evolutions' || activeView === 'forms') {
    return (
      <div className="patient-detail-view animate-fade-in">
        <button className="btn btn-secondary back-btn btn-voltar-dash" onClick={() => setActiveView('dashboard')}>
          <ArrowLeft size={18} />
          <span>Voltar para o Dashboard</span>
        </button>
        {activeView === 'evolutions' ? (
          <div className="tab-content card">
            <div className="evolutions-tab">
              <div className="tab-header">
                <h3>Histórico de Evolução Clínico</h3>
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

              {evolutions.length === 0 ? (
                <div className="empty-sub-state">
                  <FileText size={40} className="sub-empty-icon" />
                  <p>Nenhuma sessão registrada para este paciente ainda.</p>
                  <button className="btn btn-secondary btn-sm" onClick={onOpenEvolutionModal}>
                    Registrar Primeira Sessão
                  </button>
                </div>
              ) : (
                <div className="timeline">
                  {evolutions.map((evo) => (
                    <div key={evo.id} className="timeline-item">
                      <div className="timeline-marker"></div>
                      <div className="timeline-content card">
                        <div className="timeline-meta">
                          <CalendarIcon size={14} />
                          <strong>
                            {new Date(evo.session_date + 'T12:00:00').toLocaleDateString('pt-BR', {
                              day: '2-digit', month: 'long', year: 'numeric'
                            })}
                          </strong>
                        </div>
                        <p className="timeline-text">{evo.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="tab-content card">
            <div className="forms-tab">
              <div className="tab-header">
                <h3>Formulários e Fichas de Anamnese</h3>
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
                <div className="applied-forms-list">
                  {appliedForms.map((form) => (
                    <div key={form.id} className="applied-form-item card">
                      <div className="applied-form-header">
                        <div>
                          <h4>{form.template?.title || 'Formulário Personalizado'}</h4>
                          <span className="filled-date">
                            Preenchido em: {new Date(form.filled_at).toLocaleDateString('pt-BR')} às {new Date(form.filled_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>
                      <div className="applied-form-answers">
                        {Object.entries(form.answers).map(([label, val]) => (
                          <div key={label} className="answer-row">
                            <span className="question-lbl">{label}:</span>
                            <span className="answer-val">
                              {typeof val === 'boolean' ? (val ? 'Sim' : 'Não') : String(val || '—')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
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
              <p>Consolidação das três análises em uma síntese única que o terapeuta pode revisar, editar e salvar como avaliação final do paciente.</p>
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

