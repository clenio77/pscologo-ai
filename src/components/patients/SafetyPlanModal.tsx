import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../services/supabaseClient';
import { Loader2, Plus, Trash2, Save, ShieldAlert, X } from 'lucide-react';

interface Contact {
  name: string;
  phone: string;
  relationship: string;
}

interface SafetyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
}

export const SafetyPlanModal: React.FC<SafetyPlanModalProps> = ({ isOpen, onClose, patientId, patientName }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);

  // Campos do plano
  const [internalStrategies, setInternalStrategies] = useState('');
  const [reasonsForLiving, setReasonsForLiving] = useState('');
  const [emergencyServices, setEmergencyServices] = useState('CVV: 188, SAMU: 192, Bombeiros: 193');
  const [trustedContacts, setTrustedContacts] = useState<Contact[]>([]);

  // Campos para novo contato confiável
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRel, setNewContactRel] = useState('');

  useEffect(() => {
    if (!isOpen || !patientId) return;

    const fetchSafetyPlan = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('patient_safety_plans')
          .select('*')
          .eq('patient_id', patientId)
          .single();

        if (data) {
          setPlanId(data.id);
          setInternalStrategies(data.internal_strategies || '');
          setReasonsForLiving(data.reasons_for_living || '');
          setEmergencyServices(data.emergency_services || 'CVV: 188, SAMU: 192, Bombeiros: 193');
          setTrustedContacts(data.trusted_contacts || []);
        } else {
          // Reseta para padrão se não houver plano
          setPlanId(null);
          setInternalStrategies('');
          setReasonsForLiving('');
          setEmergencyServices('CVV: 188, SAMU: 192, Bombeiros: 193');
          setTrustedContacts([]);
        }
      } catch (err) {
        console.warn('Nenhum plano de segurança encontrado, iniciando um novo.');
      } finally {
        setLoading(false);
      }
    };

    fetchSafetyPlan();
  }, [isOpen, patientId]);

  const handleAddContact = () => {
    if (!newContactName || !newContactPhone) {
      alert('Nome e telefone são obrigatórios para adicionar um contato.');
      return;
    }
    const contact: Contact = {
      name: newContactName,
      phone: newContactPhone,
      relationship: newContactRel || 'Apoio'
    };
    setTrustedContacts([...trustedContacts, contact]);
    setNewContactName('');
    setNewContactPhone('');
    setNewContactRel('');
  };

  const handleRemoveContact = (index: number) => {
    setTrustedContacts(trustedContacts.filter((_, idx) => idx !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      const payload = {
        patient_id: patientId,
        professional_id: user.id,
        internal_strategies: internalStrategies,
        reasons_for_living: reasonsForLiving,
        emergency_services: emergencyServices,
        trusted_contacts: trustedContacts,
        updated_at: new Date().toISOString()
      };

      if (planId) {
        const { error } = await supabase
          .from('patient_safety_plans')
          .update(payload)
          .eq('id', planId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('patient_safety_plans')
          .insert(payload);
        if (error) throw error;
      }

      alert('Plano de Segurança salvo com sucesso!');
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar o Plano de Segurança.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(4px)' }}>
      <div className="modal-content" style={{ maxWidth: '700px', width: '95%', display: 'flex', flexDirection: 'column', maxHeight: '85vh', background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid #f1f5f9', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fdf2f2' }}>
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: 800, color: '#991b1b' }}>
              <ShieldAlert size={20} style={{ color: '#dc2626' }} />
              Plano de Segurança Individual
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#b91c1c' }}>
              Protocolo clínico de prevenção a crises para **{patientName}**
            </p>
          </div>
          <button className="close-btn" onClick={onClose} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '60vh' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 0' }}>
              <Loader2 size={32} className="animate-spin" style={{ color: '#dc2626' }} />
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>Carregando dados de segurança...</p>
            </div>
          ) : (
            <>
              {/* Estratégias Internas */}
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                <label className="form-label" style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#1e293b' }}>
                  💡 1. Estratégias Internas de Acalento e Distração (Paciente faz sozinho)
                </label>
                <textarea
                  className="form-control"
                  value={internalStrategies}
                  onChange={(e) => setInternalStrategies(e.target.value)}
                  placeholder="Ex: Praticar respiração 4-2-4, escutar uma playlist calma, caminhar 10 minutos ou lavar o rosto com água gelada."
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              {/* Razões para Viver */}
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                <label className="form-label" style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#1e293b' }}>
                  ❤️ 2. Razões para Viver e Continuar Firme (Âncoras emocionais)
                </label>
                <textarea
                  className="form-control"
                  value={reasonsForLiving}
                  onChange={(e) => setReasonsForLiving(e.target.value)}
                  placeholder="Ex: Relação com meus filhos, concluir minha faculdade, ver novas cidades, amor ao meu parceiro(a) ou meu pet."
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              {/* Contatos Confiáveis */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#1e293b' }}>
                  👥 3. Pessoas de Confiança para Apoio (Familiares ou amigos)
                </label>

                {/* Lista de contatos existentes */}
                {trustedContacts.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                    {trustedContacts.map((contact, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.82rem', color: '#334155' }}>
                          <strong style={{ color: '#1e293b' }}>{contact.name}</strong>
                          <span style={{ color: '#64748b', marginLeft: '6px' }}>({contact.relationship})</span>
                          <span style={{ color: '#475569', marginLeft: '12px', fontFamily: 'monospace' }}>{contact.phone}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveContact(idx)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '4px' }}
                          title="Remover contato"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '4px 0 12px' }}>Nenhum contato de emergência cadastrado ainda.</p>
                )}

                {/* Formulário para adicionar contato */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', padding: '12px', border: '1px dashed #cbd5e1', borderRadius: '10px', background: '#fafafa' }}>
                  <input
                    type="text"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    placeholder="Nome"
                    style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', background: 'white' }}
                  />
                  <input
                    type="text"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    placeholder="Telefone"
                    style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', background: 'white' }}
                  />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      value={newContactRel}
                      onChange={(e) => setNewContactRel(e.target.value)}
                      placeholder="Grau (ex: Irmã)"
                      style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', background: 'white', flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={handleAddContact}
                      style={{ padding: '8px 12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Serviços de Emergência */}
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <label className="form-label" style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#1e293b' }}>
                  🚑 4. Serviços de Emergência Padrão
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={emergencyServices}
                  onChange={(e) => setEmergencyServices(e.target.value)}
                  placeholder="Ex: CVV: 188, SAMU: 192, Bombeiros: 193"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9', padding: '16px 24px', display: 'flex', justifyContent: 'end', gap: '8px', background: '#f8fafc' }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '8px 16px', fontSize: '0.85rem', borderRadius: '6px', cursor: 'pointer', border: '1px solid #cbd5e1', background: 'white', color: '#475569' }}>
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="btn btn-primary"
            style={{ padding: '8px 18px', fontSize: '0.85rem', borderRadius: '6px', cursor: 'pointer', border: 'none', background: '#4a7c59', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(74,124,89,0.2)' }}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar Plano
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SafetyPlanModal;
