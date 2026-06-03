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

                <div className="form-group" style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="checkbox"
                      id="third-party-respondent"
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      checked={isRespondentThirdParty}
                      onChange={(e) => setIsRespondentThirdParty(e.target.checked)}
                    />
                    <label htmlFor="third-party-respondent" style={{ fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
                      Respondido por um familiar / responsável (Terceiros)
                    </label>
                  </div>
                </div>

                {isRespondentThirdParty && (
                  <div className="grid grid-2 gap-4 animate-slide-up" style={{ marginTop: '12px', background: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.82rem' }}>Nome do Responsável</label>
                      <input 
                        type="text"
                        className="form-control"
                        placeholder="Ex: Maria Pereira"
                        value={respName}
                        onChange={(e) => setRespName(e.target.value)}
                        required={isRespondentThirdParty}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.82rem' }}>Parentesco / Vínculo</label>
                      <input 
                        type="text"
                        className="form-control"
                        placeholder="Ex: Mãe, Filho, Cuidador..."
                        value={respRelationship}
                        onChange={(e) => setRespRelationship(e.target.value)}
                        required={isRespondentThirdParty}
                      />
                    </div>
                  </div>
                )}

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
    </div>
  );
};
