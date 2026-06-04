import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import type { Patient, Evolution, PatientForm, FormTemplate } from '../services/api';
import { 
  Plus, 
  Search, 
  BookOpen, 
  X
} from 'lucide-react';
import { PatientCard } from '../components/patients/PatientCard';
import { PatientDetail } from '../components/patients/PatientDetail';
import { PatientModal } from '../components/patients/PatientModal';
import './Patients.css';

export const Patients: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  // Estado de Dados
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Paciente Selecionado para Detalhes/Prontuário
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [evolutions, setEvolutions] = useState<Evolution[]>([]);
  const [appliedForms, setAppliedForms] = useState<PatientForm[]>([]);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);

  // Estado de Modais
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isEvolutionModalOpen, setIsEvolutionModalOpen] = useState(false);
  const [isApplyFormModalOpen, setIsApplyFormModalOpen] = useState(false);

  // Formulário: Registrar Nova Evolução (Sessão)
  const [evoContent, setEvoContent] = useState('');
  const [evoDate, setEvoDate] = useState(new Date().toISOString().split('T')[0]);

  // Formulário: Aplicar Formulário
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [formAnswers, setFormAnswers] = useState<Record<string, unknown>>({});
  const [isRespondentThirdParty, setIsRespondentThirdParty] = useState(false);
  const [respName, setRespName] = useState('');
  const [respRelationship, setRespRelationship] = useState('');

  // Carrega lista de pacientes
  const loadPatients = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.getPatients(user.id);
      setPatients(data);
    } catch (err) {
      console.error('Erro ao carregar pacientes:', err);
      addToast('Erro ao carregar pacientes.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, addToast]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Ao selecionar um paciente, carrega seu prontuário detalhado
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
      addToast('Erro ao carregar histórico do paciente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Cadastrar Paciente (Acionado pelo subcomponente PatientModal)
  const handleCreatePatient = async (patientData: {
    name: string;
    email: string;
    phone: string;
    birthDate: string;
    notes: string;
  }) => {
    if (!user) return;
    try {
      await api.createPatient({
        professional_id: user.id,
        name: patientData.name,
        email: patientData.email || undefined,
        phone: patientData.phone || undefined,
        birth_date: patientData.birthDate || undefined,
        notes: patientData.notes || undefined,
      });
      setIsPatientModalOpen(false);
      addToast('Paciente cadastrado com sucesso!', 'success');
      loadPatients();
    } catch (err) {
      console.error('Erro ao cadastrar paciente:', err);
      addToast('Erro ao cadastrar paciente. Verifique os dados.', 'error');
      throw err; // Repassa para o modal gerenciar o estado de submitting
    }
  };

  // Registrar Evolução Clínica
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

  // Abrir o Modal de aplicar formulário clínico
  const handleOpenApplyFormModal = () => {
    if (templates.length === 0) {
      addToast('Você precisa criar um modelo de formulário antes na aba "Formulários / Anamnese"', 'warning');
      return;
    }
    setSelectedTemplateId(templates[0].id);
    setFormAnswers({});
    setIsRespondentThirdParty(false);
    setRespName('');
    setRespRelationship('');
    setIsApplyFormModalOpen(true);
  };

  // Salvar Formulário Aplicado
  const handleApplyForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPatient || !selectedTemplateId) return;
    try {
      await api.createPatientForm({
        professional_id: user.id,
        patient_id: selectedPatient.id,
        template_id: selectedTemplateId,
        answers: formAnswers,
        respondent_name: isRespondentThirdParty ? respName : undefined,
        respondent_relationship: isRespondentThirdParty ? respRelationship : undefined,
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

  // Filtro de pesquisa de pacientes
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
              <Plus size={18} />
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
                <PatientCard 
                  key={patient.id} 
                  patient={patient} 
                  onClick={() => handleSelectPatient(patient)} 
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        // Visualização 2: Detalhes do Paciente / Prontuário
        <PatientDetail 
          patient={selectedPatient}
          evolutions={evolutions}
          appliedForms={appliedForms}
          user={user}
          onBack={() => setSelectedPatient(null)}
          onOpenEvolutionModal={() => setIsEvolutionModalOpen(true)}
          onOpenApplyFormModal={handleOpenApplyFormModal}
        />
      )}

      {/* MODAL 1: CADASTRAR PACIENTE (COMPILADO / MODULARIZADO) */}
      <PatientModal 
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSubmit={handleCreatePatient}
      />

      {/* MODAL 2: REGISTRAR EVOLUÇÃO (SESSÃO) */}
      {isEvolutionModalOpen && selectedPatient && (
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
      {isApplyFormModalOpen && selectedPatient && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up" style={{ maxWidth: '700px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color, #e1ebe3)' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main, #2b3a30)' }}>Aplicar Ficha de Anamnese / Formulário</h3>
              <button className="close-modal-btn" onClick={() => setIsApplyFormModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleApplyForm} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: 'var(--bg-soft, #f7faf8)' }}>
                
                {/* Cabeçalho de Contexto do Paciente */}
                <div className="modal-patient-context" style={{ padding: '14px 18px', background: 'var(--primary-light, #6c9a75)', color: 'white', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <span>Paciente em atendimento:</span>
                  <strong>{selectedPatient.name}</strong>
                </div>

                {/* Seleção do Roteiro */}
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color, #e1ebe3)', boxShadow: '0 2px 5px rgba(43, 58, 48, 0.02)' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main, #2b3a30)', marginBottom: '8px' }}>
                      Selecione o Modelo de Formulário
                    </label>
                    <select 
                      className="form-control"
                      value={selectedTemplateId}
                      onChange={(e) => {
                        setSelectedTemplateId(e.target.value);
                        setFormAnswers({});
                      }}
                      required
                      style={{ height: '42px', fontSize: '0.95rem', borderRadius: '8px' }}
                    >
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bloco de Respondente de Terceiros */}
                <div className="respondent-selection-box" style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color, #e1ebe3)',
                  boxShadow: '0 2px 5px rgba(43, 58, 48, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input 
                      type="checkbox"
                      id="third-party-respondent"
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                      checked={isRespondentThirdParty}
                      onChange={(e) => setIsRespondentThirdParty(e.target.checked)}
                    />
                    <label htmlFor="third-party-respondent" style={{ fontSize: '0.92rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-main, #2b3a30)' }}>
                      Ficha respondida por um familiar ou terceiro (mãe, pai, filho, cuidador)
                    </label>
                  </div>
                  
                  {isRespondentThirdParty && (
                    <div className="grid grid-2 gap-4 animate-slide-up" style={{ boxSizing: 'border-box', borderTop: '1px dashed var(--border-color)', paddingTop: '14px', marginTop: '4px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>Nome do Familiar Respondente</label>
                        <input 
                          type="text"
                          className="form-control"
                          placeholder="Ex: Maria Pereira"
                          value={respName}
                          onChange={(e) => setRespName(e.target.value)}
                          required={isRespondentThirdParty}
                          style={{ backgroundColor: 'var(--bg-soft, #f7faf8)', borderRadius: '8px', height: '40px' }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>Grau de Parentesco / Vínculo</label>
                        <input 
                          type="text"
                          className="form-control"
                          placeholder="Ex: Mãe, Filho, Cuidador..."
                          value={respRelationship}
                          onChange={(e) => setRespRelationship(e.target.value)}
                          required={isRespondentThirdParty}
                          style={{ backgroundColor: 'var(--bg-soft, #f7faf8)', borderRadius: '8px', height: '40px' }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Renderização Dinâmica dos Campos do Formulário em Cards individuais */}
                <div className="dynamic-form-fields" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {templates.find(t => t.id === selectedTemplateId)?.fields.map((field) => {
                    // Helper de parsing do label (separa Título de Descrição caso haja dois pontos)
                    const hasColon = field.label.includes(':');
                    let title = field.label;
                    let subtitle = '';

                    if (hasColon) {
                      const index = field.label.indexOf(':');
                      title = field.label.substring(0, index).trim();
                      subtitle = field.label.substring(index + 1).trim();
                    }

                    // Corrige caps lock de títulos se for totalmente em maiúsculas
                    const formatTitle = (t: string) => {
                      if (t === t.toUpperCase() && t.length > 5) {
                        return t.toLowerCase().replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase());
                      }
                      return t;
                    };

                    return (
                      <div key={field.id} className="dynamic-field-card" style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color, #e1ebe3)',
                        boxShadow: '0 2px 5px rgba(43, 58, 48, 0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main, #2b3a30)' }}>
                            {formatTitle(title)} {field.required && <span style={{ color: 'var(--error, #dc3545)' }}>*</span>}
                          </label>
                          {subtitle && (
                            <span style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted, #5e6f64)', marginTop: '4px', lineHeight: '1.4' }}>
                              {subtitle}
                            </span>
                          )}
                        </div>

                        {field.type === 'text' && (
                          <input 
                            type="text" 
                            className="form-control"
                            value={String(formAnswers[field.label] || '')}
                            onChange={(e) => handleAnswerChange(field.label, e.target.value)}
                            required={field.required}
                            placeholder="Escreva a resposta curta..."
                            style={{ padding: '10px 14px', borderRadius: '8px', height: '40px' }}
                          />
                        )}

                        {field.type === 'textarea' && (
                          <textarea 
                            className="form-control"
                            rows={3}
                            value={String(formAnswers[field.label] || '')}
                            onChange={(e) => handleAnswerChange(field.label, e.target.value)}
                            required={field.required}
                            placeholder="Escreva o relato ou observação clínica do campo..."
                            style={{ padding: '12px 14px', borderRadius: '8px', minHeight: '80px', resize: 'vertical' }}
                          />
                        )}

                        {field.type === 'select' && (
                          <select 
                            className="form-control"
                            value={String(formAnswers[field.label] || '')}
                            onChange={(e) => handleAnswerChange(field.label, e.target.value)}
                            required={field.required}
                            style={{ padding: '10px 14px', borderRadius: '8px', height: '42px' }}
                          >
                            <option value="">Selecione uma opção...</option>
                            {field.options?.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}

                        {field.type === 'checkbox' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 0' }}>
                            <input 
                              type="checkbox"
                              id={`check-${field.id}`}
                              style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                              checked={Boolean(formAnswers[field.label] || false)}
                              onChange={(e) => handleAnswerChange(field.label, e.target.checked)}
                            />
                            <label htmlFor={`check-${field.id}`} style={{ fontSize: '0.9rem', color: 'var(--text-main, #2b3a30)', cursor: 'pointer' }}>
                              Confirmar / Assinalar item
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color, #e1ebe3)', backgroundColor: 'white', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsApplyFormModalOpen(false)} style={{ borderRadius: '8px', height: '40px', padding: '0 20px' }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ borderRadius: '8px', height: '40px', padding: '0 20px' }}>
                  Concluir e Salvar Respostas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
