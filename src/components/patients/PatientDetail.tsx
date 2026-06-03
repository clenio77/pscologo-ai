import React, { useState } from 'react';
import { 
  ArrowLeft, 
  History, 
  Clipboard, 
  Printer, 
  Plus, 
  Calendar as CalendarIcon, 
  FileText, 
  FileSpreadsheet,
  Heart
} from 'lucide-react';
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

export const PatientDetail: React.FC<PatientDetailProps> = ({
  patient,
  evolutions,
  appliedForms,
  user,
  onBack,
  onOpenEvolutionModal,
  onOpenApplyFormModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'evolutions' | 'forms'>('evolutions');

  return (
    <div className="patient-detail-view animate-fade-in">
      <button className="btn btn-secondary back-btn" onClick={onBack}>
        <ArrowLeft size={18} />
        <span>Voltar para Lista</span>
      </button>

      <div className="patient-detail-grid">
        {/* Coluna Esquerda: Ficha Rápida do Paciente */}
        <div className="patient-info-sidebar">
          <div className="card sticky-card">
            <div className="patient-profile-header">
              <div className="large-avatar">
                {patient.name.charAt(0).toUpperCase()}
              </div>
              <h3>{patient.name}</h3>
              <span className="badge badge-info">{calculateAge(patient.birth_date)}</span>
            </div>

            <div className="patient-profile-details">
              <div className="detail-item">
                <span className="label">E-mail</span>
                <span className="val">{patient.email || 'Não informado'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Telefone</span>
                <span className="val">{patient.phone || 'Não informado'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Nascimento</span>
                <span className="val">
                  {patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('pt-BR') : 'Não informada'}
                </span>
              </div>
              <div className="detail-item">
                <span className="label">Notas de Entrada / Queixa Inicial</span>
                <p className="valNotes">{patient.notes || 'Sem observações adicionais.'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Abas de Prontuário e Formulários */}
        <div className="patient-records-section">
          <div className="records-tabs">
            <button 
              className={`tab-btn ${activeSubTab === 'evolutions' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('evolutions')}
            >
              <History size={18} />
              <span>Evolução Clínica ({evolutions.length})</span>
            </button>
            <button 
              className={`tab-btn ${activeSubTab === 'forms' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('forms')}
            >
              <Clipboard size={18} />
              <span>Formulários Aplicados ({appliedForms.length})</span>
            </button>
          </div>

          <div className="tab-content card">
            {activeSubTab === 'evolutions' ? (
              /* ABA 1: LINHA DO TEMPO DAS EVOLUÇÕES */
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
            ) : (
              /* ABA 2: FORMULÁRIOS APLICADOS */
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
                            {form.respondent_name && (
                              <div className="respondent-badge" style={{ fontSize: '0.8rem', color: '#4a7c59', marginTop: '4px', fontWeight: 600 }}>
                                Respondido por: {form.respondent_name} ({form.respondent_relationship || 'Familiar'})
                              </div>
                            )}
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
            )}
          </div>
        </div>
      </div>

      {/* CABEÇALHO E LAUDO DE IMPRESSÃO TIMBRADO (INVISÍVEL EM TELA, VISÍVEL EM IMPRESSÃO) */}
      <div className="print-only-prontuario">
        <div className="print-header">
          <div className="print-brand">
            <Heart size={32} style={{ color: '#4a7c59' }} />
            <div className="print-brand-text">
              <h2>Agenda Clinical</h2>
              <span>Gestão Integrada de Consultórios</span>
            </div>
          </div>
          <div className="print-professional-details">
            <h3>{user?.name}</h3>
            <p>{user?.specialty}</p>
            {user?.register_number && <p className="print-register-badge">{user.register_number}</p>}
            {user?.phone && <p>Contato: {user.phone}</p>}
            {user?.email && <p>E-mail: {user.email}</p>}
          </div>
        </div>

        <div className="print-divider"></div>

        <div className="print-patient-card">
          <h3>DADOS DO PACIENTE</h3>
          <div className="print-patient-grid">
            <div><strong>Paciente:</strong> {patient.name}</div>
            <div><strong>Idade:</strong> {calculateAge(patient.birth_date)}</div>
            {patient.email && <div><strong>E-mail:</strong> {patient.email}</div>}
            {patient.phone && <div><strong>Telefone:</strong> {patient.phone}</div>}
            {patient.birth_date && <div><strong>Data Nasc.:</strong> {new Date(patient.birth_date).toLocaleDateString('pt-BR')}</div>}
          </div>
          {patient.notes && (
            <div className="print-patient-notes">
              <strong>Queixa Inicial / Histórico:</strong>
              <p>{patient.notes}</p>
            </div>
          )}
        </div>

        <div className="print-divider"></div>

        <div className="print-evolutions-list">
          <h3>HISTÓRICO DE EVOLUÇÕES CLÍNICAS</h3>
          {evolutions.length === 0 ? (
            <p className="print-empty">Nenhum registro de evolução encontrado para este paciente.</p>
          ) : (
            evolutions.map((evo) => (
              <div key={evo.id} className="print-evo-item">
                <div className="print-evo-meta">
                  <strong>Sessão em:</strong> {new Date(evo.session_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
                <p className="print-evo-content">{evo.content}</p>
              </div>
            ))
          )}
        </div>

        <div className="print-footer">
          <p>Documento oficial emitido em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.</p>
          <p className="print-signature-line">Assinatura do Profissional: _________________________________________</p>
        </div>
      </div>
    </div>
  );
};
