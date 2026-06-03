import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import type { Patient, Evolution, PatientForm, FormTemplate } from '../services/api';
import { 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  Calendar as CalendarIcon, 
  FileText, 
  Clipboard, 
  BookOpen, 
  History, 
  UserPlus, 
  ChevronRight, 
  ArrowLeft,
  X,
  FileSpreadsheet,
  Printer,
  Heart
} from 'lucide-react';
import './Patients.css';

const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

export const Patients: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Paciente Selecionado para Detalhes/Prontuário
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [evolutions, setEvolutions] = useState<Evolution[]>([]);
  const [appliedForms, setAppliedForms] = useState<PatientForm[]>([]);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  
  // Abas dentro dos detalhes do paciente
  const [activeSubTab, setActiveSubTab] = useState<'evolutions' | 'forms'>('evolutions');

  // Modais
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isEvolutionModalOpen, setIsEvolutionModalOpen] = useState(false);
  const [isApplyFormModalOpen, setIsApplyFormModalOpen] = useState(false);

  // States de Formulários do Modal de Paciente
  const [pName, setPName] = useState('');
  const [pEmail, setPEmail] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [pBirthDate, setPBirthDate] = useState('');
  const [pNotes, setPNotes] = useState('');

  // States de Formulários do Modal de Evolução
  const [evoContent, setEvoContent] = useState('');
  const [evoDate, setEvoDate] = useState(new Date().toISOString().split('T')[0]);

  // States de Formulários do Modal de Aplicar Formulário
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [formAnswers, setFormAnswers] = useState<Record<string, unknown>>({});

  const loadPatients = useCallback(async () => {
    if (!user) return;
    await Promise.resolve();
    setLoading(true);
    try {
      const data = await api.getPatients(user.id);
      setPatients(data);
    } catch (err) {
      console.error('Erro ao carregar pacientes:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPatients();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadPatients]);

  const handleSelectPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    setLoading(true);
    try {
      const [evoData, formData, templateData] = await Promise.all([
        api.getEvolutions(patient.id),
        api.getPatientForms(patient.id),
        user ? api.getFormTemplates(user.id) : []
      ]);
      setEvolutions(evoData);
      setAppliedForms(formData);
      setTemplates(templateData);
    } catch (err) {
      console.error('Erro ao carregar prontuário:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await api.createPatient({
        professional_id: user.id,
        name: pName,
        email: pEmail || undefined,
        phone: pPhone || undefined,
        birth_date: pBirthDate || undefined,
        notes: pNotes || undefined,
      });
      setIsPatientModalOpen(false);
      // Reset form
      setPName('');
      setPEmail('');
      setPPhone('');
      setPBirthDate('');
      setPNotes('');
      addToast('Paciente cadastrado com sucesso!', 'success');
      loadPatients();
    } catch (err) {
      console.error('Erro ao cadastrar paciente:', err);
      addToast('Erro ao cadastrar paciente. Verifique os dados.', 'error');
    }
  };

  const handleCreateEvolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPatient) return;
    try {
      await api.createEvolution({
        professional_id: user.id,
        patient_id: selectedPatient.id,
        content: evoContent,
        session_date: evoDate,
      });
      setIsEvolutionModalOpen(false);
      setEvoContent('');
      addToast('Evolução registrada no prontuário!', 'success');
      // Recarrega evoluções
      const updatedEvos = await api.getEvolutions(selectedPatient.id);
      setEvolutions(updatedEvos);
    } catch (err) {
      console.error('Erro ao registrar evolução:', err);
      addToast('Erro ao registrar evolução.', 'error');
    }
  };

  const handleOpenApplyFormModal = () => {
    if (templates.length === 0) {
      addToast('Você precisa criar um modelo de formulário antes na aba "Formulários / Anamnese"', 'warning');
      return;
    }
    setSelectedTemplateId(templates[0].id);
    setFormAnswers({});
    setIsApplyFormModalOpen(true);
  };

  const handleApplyForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPatient || !selectedTemplateId) return;
    try {
      await api.createPatientForm({
        professional_id: user.id,
        patient_id: selectedPatient.id,
        template_id: selectedTemplateId,
        answers: formAnswers,
      });
      setIsApplyFormModalOpen(false);
      addToast('Formulário aplicado com sucesso!', 'success');
      // Recarrega formulários aplicados
      const updatedForms = await api.getPatientForms(selectedPatient.id);
      setAppliedForms(updatedForms);
    } catch (err) {
      console.error('Erro ao aplicar formulário:', err);
      addToast('Erro ao aplicar formulário.', 'error');
    }
  };

  const handleAnswerChange = (fieldLabel: string, value: unknown) => {
    setFormAnswers(prev => ({
      ...prev,
      [fieldLabel]: value
    }));
  };

  // Filtro de pacientes
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calcula idade do paciente
  const calculateAge = (birthDateString?: string) => {
    if (!birthDateString) return 'Idade não informada';
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} anos`;
  };

  return (
    <div className="patients-page">
      {!selectedPatient ? (
        // Visualização 1: Lista de Pacientes
        <div className="patients-list-view">
          <div className="action-header">
            <div className="search-bar">
              <Search className="search-icon" size={20} />
              <input 
                type="text" 
                placeholder="Pesquisar por nome ou e-mail..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={() => setIsPatientModalOpen(true)}>
              <UserPlus size={18} />
              <span>Novo Paciente</span>
            </button>
          </div>

          {loading ? (
            <div className="loading-state">
              <span className="spinner"></span>
              <p>Carregando prontuários dos pacientes...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="empty-state card">
              <BookOpen size={48} className="empty-icon" />
              <h3>Nenhum paciente cadastrado</h3>
              <p>Comece criando o prontuário do seu primeiro paciente para gerenciar a evolução dele.</p>
              <button className="btn btn-primary" onClick={() => setIsPatientModalOpen(true)}>
                Cadastrar Paciente
              </button>
            </div>
          ) : (
            <div className="patients-grid">
              {filteredPatients.map((patient) => (
                <div key={patient.id} className="patient-card card" onClick={() => handleSelectPatient(patient)}>
                  <div className="patient-avatar-badge">
                    {patient.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="patient-card-info">
                    <h4>{patient.name}</h4>
                    <span className="patient-age">{calculateAge(patient.birth_date)}</span>
                    
                    <div className="patient-contact-links">
                      {patient.phone && (
                        <div className="contact-item">
                          <Phone size={14} />
                          <span>{patient.phone}</span>
                        </div>
                      )}
                      {patient.email && (
                        <div className="contact-item">
                          <Mail size={14} />
                          <span>{patient.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="card-arrow" size={20} />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Visualização 2: Detalhes do Paciente / Prontuário
        <div className="patient-detail-view animate-fade-in">
          <button className="btn btn-secondary back-btn" onClick={() => setSelectedPatient(null)}>
            <ArrowLeft size={18} />
            <span>Voltar para Lista</span>
          </button>

          <div className="patient-detail-grid">
            {/* Coluna Esquerda: Ficha Rápida do Paciente */}
            <div className="patient-info-sidebar">
              <div className="card sticky-card">
                <div className="patient-profile-header">
                  <div className="large-avatar">
                    {selectedPatient.name.charAt(0).toUpperCase()}
                  </div>
                  <h3>{selectedPatient.name}</h3>
                  <span className="badge badge-info">{calculateAge(selectedPatient.birth_date)}</span>
                </div>

                <div className="patient-profile-details">
                  <div className="detail-item">
                    <span className="label">E-mail</span>
                    <span className="val">{selectedPatient.email || 'Não informado'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Telefone</span>
                    <span className="val">{selectedPatient.phone || 'Não informado'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Nascimento</span>
                    <span className="val">
                      {selectedPatient.birth_date ? new Date(selectedPatient.birth_date).toLocaleDateString('pt-BR') : 'Não informada'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Notas de Entrada / Queixa Inicial</span>
                    <p className="valNotes">{selectedPatient.notes || 'Sem observações adicionais.'}</p>
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
                        <button type="button" className="btn btn-primary" onClick={() => setIsEvolutionModalOpen(true)}>
                          <Plus size={18} />
                          <span>Nova Sessão / Evolução</span>
                        </button>
                      </div>
                    </div>

                    {evolutions.length === 0 ? (
                      <div className="empty-sub-state">
                        <FileText size={40} className="sub-empty-icon" />
                        <p>Nenhuma sessão registrada para este paciente ainda.</p>
                        <button className="btn btn-secondary btn-sm" onClick={() => setIsEvolutionModalOpen(true)}>
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
                      <button className="btn btn-primary" onClick={handleOpenApplyFormModal}>
                        <Clipboard size={18} />
                        <span>Aplicar Formulário</span>
                      </button>
                    </div>

                    {appliedForms.length === 0 ? (
                      <div className="empty-sub-state">
                        <FileSpreadsheet size={40} className="sub-empty-icon" />
                        <p>Nenhum formulário aplicado a este paciente ainda.</p>
                        <button className="btn btn-secondary btn-sm" onClick={handleOpenApplyFormModal}>
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
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CADASTRAR PACIENTE */}
      {isPatientModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up">
            <div className="modal-header">
              <h3>Cadastrar Novo Paciente</h3>
              <button className="close-modal-btn" onClick={() => setIsPatientModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreatePatient}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome Completo</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ex: João da Silva" 
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    required 
                  />
                </div>
                <div className="grid grid-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">E-mail</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      placeholder="joao@email.com" 
                      value={pEmail}
                      onChange={(e) => setPEmail(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Telefone / WhatsApp</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="(11) 99999-9999" 
                      value={pPhone}
                      onChange={(e) => setPPhone(formatPhone(e.target.value))}
                      maxLength={15}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Data de Nascimento</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={pBirthDate}
                    onChange={(e) => setPBirthDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Queixa Inicial / Observações</label>
                  <textarea 
                    className="form-control" 
                    rows={3} 
                    placeholder="Breve descrição dos sintomas relatados ou histórico do paciente..."
                    value={pNotes}
                    onChange={(e) => setPNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsPatientModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Criar Prontuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTRAR EVOLUÇÃO (SESSÃO) */}
      {isEvolutionModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>Registrar Evolução de Sessão</h3>
              <button className="close-modal-btn" onClick={() => setIsEvolutionModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateEvolution}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Data da Sessão</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={evoDate}
                    onChange={(e) => setEvoDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Relato Clínico da Evolução</label>
                  <textarea 
                    className="form-control" 
                    rows={8} 
                    placeholder="Descreva as queixas, intervenções realizadas, progresso e próximos passos discutidos na sessão..."
                    value={evoContent}
                    onChange={(e) => setEvoContent(e.target.value)}
                    required
                  />
                  <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {evoContent.length} caracteres digitados.
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEvolutionModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar no Prontuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: APLICAR FORMULÁRIO DE ANAMNESE */}
      {isApplyFormModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Aplicar Ficha de Anamnese / Formulário</h3>
              <button className="close-modal-btn" onClick={() => setIsApplyFormModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleApplyForm}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Selecione o Modelo de Formulário</label>
                  <select 
                    className="form-control"
                    value={selectedTemplateId}
                    onChange={(e) => {
                      setSelectedTemplateId(e.target.value);
                      setFormAnswers({});
                    }}
                    required
                  >
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>

                <hr style={{ margin: '16px 0', borderColor: 'var(--border-color)' }} />

                {/* Renderização Dinâmica dos Campos do Formulário */}
                <div className="dynamic-form-fields" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {templates.find(t => t.id === selectedTemplateId)?.fields.map((field) => (
                    <div key={field.id} className="form-group">
                      <label className="form-label">
                        {field.label} {field.required && <span style={{ color: 'var(--error)' }}>*</span>}
                      </label>

                      {field.type === 'text' && (
                        <input 
                          type="text" 
                          className="form-control"
                          value={String(formAnswers[field.label] || '')}
                          onChange={(e) => handleAnswerChange(field.label, e.target.value)}
                          required={field.required}
                        />
                      )}

                      {field.type === 'textarea' && (
                        <textarea 
                          className="form-control"
                          rows={3}
                          value={String(formAnswers[field.label] || '')}
                          onChange={(e) => handleAnswerChange(field.label, e.target.value)}
                          required={field.required}
                        />
                      )}

                      {field.type === 'select' && (
                        <select 
                          className="form-control"
                          value={String(formAnswers[field.label] || '')}
                          onChange={(e) => handleAnswerChange(field.label, e.target.value)}
                          required={field.required}
                        >
                          <option value="">Selecione...</option>
                          {field.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}

                      {field.type === 'checkbox' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
                          <input 
                            type="checkbox"
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            checked={Boolean(formAnswers[field.label] || false)}
                            onChange={(e) => handleAnswerChange(field.label, e.target.checked)}
                          />
                          <span style={{ fontSize: '0.95rem' }}>Confirmar item</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsApplyFormModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Concluir e Salvar Respostas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CABEÇALHO E LAUDO DE IMPRESSÃO TIMBRADO (INVISÍVEL EM TELA, VISÍVEL EM IMPRESSÃO) */}
      {selectedPatient && (
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
              <div><strong>Paciente:</strong> {selectedPatient.name}</div>
              <div><strong>Idade:</strong> {calculateAge(selectedPatient.birth_date)}</div>
              {selectedPatient.email && <div><strong>E-mail:</strong> {selectedPatient.email}</div>}
              {selectedPatient.phone && <div><strong>Telefone:</strong> {selectedPatient.phone}</div>}
              {selectedPatient.birth_date && <div><strong>Data Nasc.:</strong> {new Date(selectedPatient.birth_date).toLocaleDateString('pt-BR')}</div>}
            </div>
            {selectedPatient.notes && (
              <div className="print-patient-notes">
                <strong>Queixa Inicial / Histórico:</strong>
                <p>{selectedPatient.notes}</p>
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
      )}
    </div>
  );
};

