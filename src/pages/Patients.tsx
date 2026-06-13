import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import type { Patient, Evolution, PatientForm, FormTemplate } from '../services/api';
import { 
  Plus, 
  Search, 
  BookOpen
} from 'lucide-react';
import { PatientCard } from '../components/patients/PatientCard';
import { PatientDetail } from '../components/patients/PatientDetail';
import { PatientModal } from '../components/patients/PatientModal';
import { EvolutionModal } from '../components/patients/EvolutionModal';
import { ApplyFormModal } from '../components/patients/ApplyFormModal';
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

  // Os estados e lógica do formulário de evolução e de anamnese foram movidos para subcomponentes modais isolados.



  // Formulário: Aplicar Formulário
  // Os estados foram encapsulados no ApplyFormModal.tsx.

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
  const handleCreateEvolution = async (data: { sessionDate: string; content: string }) => {
    if (!user || !selectedPatient) return;
    try {
      await api.createEvolution({
        professional_id: user.id,
        patient_id: selectedPatient.id,
        content: data.content,
        session_date: data.sessionDate,
      });
      addToast('Evolução registrada no prontuário!', 'success');
      
      // Recarrega evoluções
      const updatedEvos = await api.getEvolutions(selectedPatient.id);
      setEvolutions(updatedEvos);
    } catch (err) {
      console.error('Erro ao registrar evolução:', err);
      addToast('Erro ao registrar evolução.', 'error');
      throw err;
    }
  };

  // Abrir o Modal de aplicar formulário clínico
  const handleOpenApplyFormModal = () => {
    if (templates.length === 0) {
      addToast('Você precisa criar um modelo de formulário antes na aba "Formulários / Anamnese"', 'warning');
      return;
    }
    setIsApplyFormModalOpen(true);
  };

  // Salvar Formulário Aplicado
  const handleApplyForm = async (data: {
    templateId: string;
    answers: Record<string, unknown>;
    respondentName?: string;
    respondentRelationship?: string;
    status?: string;
  }): Promise<string> => {
    if (!user || !selectedPatient) return '';
    try {
      const res = await api.createPatientForm({
        professional_id: user.id,
        patient_id: selectedPatient.id,
        template_id: data.templateId,
        answers: data.answers,
        respondent_name: data.respondentName,
        respondent_relationship: data.respondentRelationship,
        status: data.status || 'completed',
        current_page: 1,
        completed_at: data.status === 'pending' ? null : new Date().toISOString()
      });
      addToast(
        data.status === 'pending' 
          ? 'Link de preenchimento externo gerado!' 
          : 'Formulário aplicado com sucesso!', 
        'success'
      );
      
      // Recarrega formulários aplicados
      const updatedForms = await api.getPatientForms(selectedPatient.id);
      setAppliedForms(updatedForms);
      return res.id;
    } catch (err) {
      console.error('Erro ao aplicar formulário:', err);
      addToast('Erro ao aplicar formulário.', 'error');
      throw err;
    }
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
          onRefreshForms={async () => {
            if (selectedPatient) {
              const f = await api.getPatientForms(selectedPatient.id);
              setAppliedForms(f);
            }
          }}
        />
      )}

      {/* MODAL 1: CADASTRAR PACIENTE (COMPILADO / MODULARIZADO) */}
      <PatientModal 
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSubmit={handleCreatePatient}
      />

      {/* MODAL 2: REGISTRAR EVOLUÇÃO (SESSÃO) */}
      <EvolutionModal
        isOpen={isEvolutionModalOpen}
        onClose={() => setIsEvolutionModalOpen(false)}
        patient={selectedPatient}
        onSubmit={handleCreateEvolution}
      />

      {/* MODAL 3: APLICAR FORMULÁRIO DE ANAMNESE */}
      <ApplyFormModal
        isOpen={isApplyFormModalOpen}
        onClose={() => setIsApplyFormModalOpen(false)}
        patient={selectedPatient}
        templates={templates}
        onSubmit={handleApplyForm}
      />
    </div>
  );
};
