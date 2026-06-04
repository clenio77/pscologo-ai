import React, { useState, useEffect } from 'react';
import { X, Save, Edit3, User, Phone, Heart, FileText } from 'lucide-react';
import { api } from '../../services/api';
import type { Patient, PatientProfile } from '../../services/api';
import { calculateAge } from '../../utils/formatters';

interface PatientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  professionalId: string;
}

type ProfileFormData = Omit<PatientProfile, 'id' | 'patient_id' | 'professional_id' | 'created_at' | 'updated_at'>;

const emptyProfile: ProfileFormData = {
  cpf: '',
  rg: '',
  marital_status: '',
  profession: '',
  education_level: '',
  address: '',
  city: '',
  state: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  emergency_contact_relationship: '',
  main_complaint: '',
  clinical_history: '',
  family_history: '',
  medications: '',
  allergies: '',
  previous_treatments: '',
  referral_source: '',
  health_insurance: '',
};

export const PatientProfileModal: React.FC<PatientProfileModalProps> = ({
  isOpen,
  onClose,
  patient,
  professionalId,
}) => {
  const [formData, setFormData] = useState<ProfileFormData>({ ...emptyProfile });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      setIsEditing(false);
      loadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, patient.id]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const profile = await api.getPatientProfile(patient.id);
      if (profile) {
        setFormData({
          cpf: profile.cpf || '',
          rg: profile.rg || '',
          marital_status: profile.marital_status || '',
          profession: profile.profession || '',
          education_level: profile.education_level || '',
          address: profile.address || '',
          city: profile.city || '',
          state: profile.state || '',
          emergency_contact_name: profile.emergency_contact_name || '',
          emergency_contact_phone: profile.emergency_contact_phone || '',
          emergency_contact_relationship: profile.emergency_contact_relationship || '',
          main_complaint: profile.main_complaint || '',
          clinical_history: profile.clinical_history || '',
          family_history: profile.family_history || '',
          medications: profile.medications || '',
          allergies: profile.allergies || '',
          previous_treatments: profile.previous_treatments || '',
          referral_source: profile.referral_source || '',
          health_insurance: profile.health_insurance || '',
          document_requester: profile.document_requester || '',
          document_purpose: profile.document_purpose || '',
        });
      } else {
        setFormData({ ...emptyProfile });
        setIsEditing(true); // Se não existe, abre em modo edição
      }
    } catch {
      setError('Erro ao carregar perfil do paciente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.upsertPatientProfile({
        patient_id: patient.id,
        professional_id: professionalId,
        ...formData,
      });
      setSuccessMsg('Ficha salva com sucesso!');
      setIsEditing(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar ficha do paciente.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    loadProfile(); // Recarrega dados originais
  };

  if (!isOpen) return null;

  const renderField = (label: string, field: keyof ProfileFormData, type: 'text' | 'textarea' | 'select' = 'text', options?: string[]) => {
    const value = formData[field] || '';

    if (!isEditing) {
      return (
        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2px', display: 'block' }}>
            {label}
          </label>
          <span style={{ fontSize: '0.95rem', color: value ? 'var(--text-primary)' : '#94a3b8' }}>
            {value || '—'}
          </span>
        </div>
      );
    }

    if (type === 'textarea') {
      return (
        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label className="form-label">{label}</label>
          <textarea
            className="form-control"
            value={value}
            onChange={(e) => handleChange(field, e.target.value)}
            rows={3}
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>
      );
    }

    if (type === 'select' && options) {
      return (
        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label className="form-label">{label}</label>
          <select
            className="form-control"
            value={value}
            onChange={(e) => handleChange(field, e.target.value)}
          >
            <option value="">Selecione...</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div className="form-group" style={{ marginBottom: '12px' }}>
        <label className="form-label">{label}</label>
        <input
          type="text"
          className="form-control"
          value={value}
          onChange={(e) => handleChange(field, e.target.value)}
        />
      </div>
    );
  };

  const maritalOptions = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável', 'Separado(a)'];
  const educationOptions = [
    'Fundamental Incompleto', 'Fundamental Completo',
    'Médio Incompleto', 'Médio Completo',
    'Superior Incompleto', 'Superior Completo',
    'Pós-graduação', 'Mestrado', 'Doutorado'
  ];
  const stateOptions = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '850px', width: '95%' }}>
        {/* HEADER */}
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={22} />
            Ficha do Paciente
          </h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* BODY */}
        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Carregando ficha do paciente...
            </div>
          ) : (
            <>
              {/* INFORMAÇÕES DO PACIENTE (read-only, vem do Patient) */}
              <div style={{ background: 'var(--bg-secondary, #f8fafc)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <User size={18} style={{ color: 'var(--primary)' }} />
                  <h3 style={{ fontSize: '1rem', margin: 0 }}>Informações Básicas</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nome</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 500 }}>{patient.name}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Idade</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 500 }}>{calculateAge(patient.birth_date)}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Data de Nascimento</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 500 }}>
                      {patient.birth_date
                        ? new Date(patient.birth_date + 'T12:00:00').toLocaleDateString('pt-BR')
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>E-mail</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 500 }}>{patient.email || '—'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Telefone</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 500 }}>{patient.phone || '—'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Paciente desde</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 500 }}>
                      {new Date(patient.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: '24px' }}>
                  <h4 style={{ fontSize: '1rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px' }}>Emissão de Documentos (CFP)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Solicitante (Padrão para documentos)</label>
                      {isEditing ? (
                        <input
                          type="text"
                          className="form-control"
                          value={formData.document_requester || ''}
                          onChange={e => handleChange('document_requester', e.target.value)}
                          placeholder="Ex: Próprio paciente, Juiz da 2ª Vara, Empresa X"
                        />
                      ) : (
                        <p style={{ margin: '2px 0 0', color: formData.document_requester ? 'var(--text-primary)' : '#94a3b8' }}>
                          {formData.document_requester || '—'}
                        </p>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Finalidade da Avaliação/Acompanhamento</label>
                      {isEditing ? (
                        <input
                          type="text"
                          className="form-control"
                          value={formData.document_purpose || ''}
                          onChange={e => handleChange('document_purpose', e.target.value)}
                          placeholder="Ex: Acompanhamento clínico, Cirurgia Bariátrica, Concurso"
                        />
                      ) : (
                        <p style={{ margin: '2px 0 0', color: formData.document_purpose ? 'var(--text-primary)' : '#94a3b8' }}>
                          {formData.document_purpose || '—'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mensagens de erro/sucesso */}
              {error && (
                <div className="message-alert message-error" style={{ margin: 0 }}>{error}</div>
              )}
              {successMsg && (
                <div className="message-alert message-success" style={{ margin: 0, background: '#f0fdf4', color: '#166534', borderLeft: '4px solid #22c55e', padding: '12px', borderRadius: '8px' }}>
                  {successMsg}
                </div>
              )}

              {/* SEÇÃO 1: DADOS PESSOAIS */}
              <div style={{ background: 'var(--bg-secondary, #f8fafc)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <FileText size={18} style={{ color: '#8b5cf6' }} />
                  <h3 style={{ fontSize: '1rem', margin: 0 }}>Dados Pessoais</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px 16px' }}>
                  {renderField('CPF', 'cpf')}
                  {renderField('RG', 'rg')}
                  {renderField('Estado Civil', 'marital_status', 'select', maritalOptions)}
                  {renderField('Profissão', 'profession')}
                  {renderField('Escolaridade', 'education_level', 'select', educationOptions)}
                  {renderField('Endereço', 'address')}
                  {renderField('Cidade', 'city')}
                  {renderField('Estado (UF)', 'state', 'select', stateOptions)}
                </div>
              </div>

              {/* SEÇÃO 2: CONTATO DE EMERGÊNCIA */}
              <div style={{ background: 'var(--bg-secondary, #f8fafc)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Phone size={18} style={{ color: '#ef4444' }} />
                  <h3 style={{ fontSize: '1rem', margin: 0 }}>Contato de Emergência</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px 16px' }}>
                  {renderField('Nome do contato', 'emergency_contact_name')}
                  {renderField('Telefone', 'emergency_contact_phone')}
                  {renderField('Grau de parentesco', 'emergency_contact_relationship')}
                </div>
              </div>

              {/* SEÇÃO 3: DADOS CLÍNICOS */}
              <div style={{ background: 'var(--bg-secondary, #f8fafc)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Heart size={18} style={{ color: '#ec4899' }} />
                  <h3 style={{ fontSize: '1rem', margin: 0 }}>Dados Clínicos</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {renderField('Queixa principal', 'main_complaint', 'textarea')}
                  {renderField('Histórico clínico', 'clinical_history', 'textarea')}
                  {renderField('Histórico familiar', 'family_history', 'textarea')}
                  {renderField('Medicamentos em uso', 'medications', 'textarea')}
                  {renderField('Alergias', 'allergies')}
                  {renderField('Tratamentos anteriores', 'previous_treatments', 'textarea')}
                </div>
              </div>

              {/* SEÇÃO 4: INFORMAÇÕES COMPLEMENTARES */}
              <div style={{ background: 'var(--bg-secondary, #f8fafc)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <FileText size={18} style={{ color: '#0ea5e9' }} />
                  <h3 style={{ fontSize: '1rem', margin: 0 }}>Informações Complementares</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px 16px' }}>
                  {renderField('Indicação / Encaminhamento', 'referral_source')}
                  {renderField('Convênio / Plano de saúde', 'health_insurance')}
                </div>
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="modal-footer">
          {!isEditing ? (
            <>
              <button className="btn btn-secondary" onClick={onClose}>Fechar</button>
              <button className="btn btn-primary" onClick={() => setIsEditing(true)} disabled={isLoading}>
                <Edit3 size={18} />
                Editar Ficha
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={handleCancel} disabled={isSaving}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar Ficha'}
                <Save size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
