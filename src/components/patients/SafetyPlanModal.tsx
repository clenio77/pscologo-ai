import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-[#f4f7f5] rounded-t-2xl">
          <div>
            <h3 className="font-extrabold text-[#2b3a30] text-lg">Plano de Segurança de Emergência</h3>
            <p className="text-xs text-gray-500 mt-1">Defina o protocolo de crise para o paciente: **{patientName}**</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-lg">×</button>
        </div>

        {/* Corpo */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#4a7c59]" />
              <p className="text-sm text-gray-500 mt-2">Buscando plano de segurança...</p>
            </div>
          ) : (
            <>
              {/* Estratégias Internas */}
              <div>
                <label className="block text-xs font-bold text-[#2b3a30] uppercase tracking-wider mb-2">
                  💡 1. Estratégias Internas de Distração/Acalento (O que o paciente pode fazer sozinho)
                </label>
                <textarea
                  value={internalStrategies}
                  onChange={(e) => setInternalStrategies(e.target.value)}
                  placeholder="Ex: Exercícios de respiração diafragmática (4-2-4), tomar um banho frio, escutar música instrumental, fazer uma caminhada de 10 minutos."
                  rows={3}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-[#4a7c59] focus:border-[#4a7c59] text-sm"
                ></textarea>
              </div>

              {/* Razões para Viver */}
              <div>
                <label className="block text-xs font-bold text-[#2b3a30] uppercase tracking-wider mb-2">
                  ❤️ 2. Razões para Viver (Lembretes emocionais importantes)
                </label>
                <textarea
                  value={reasonsForLiving}
                  onChange={(e) => setReasonsForLiving(e.target.value)}
                  placeholder="Ex: Meus filhos, ver o pôr do sol, concluir meu projeto pessoal, a afeição do meu cachorro, meu progresso pessoal."
                  rows={3}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-[#4a7c59] focus:border-[#4a7c59] text-sm"
                ></textarea>
              </div>

              {/* Contatos Confiáveis */}
              <div className="border-t pt-4">
                <label className="block text-xs font-bold text-[#2b3a30] uppercase tracking-wider mb-2">
                  👥 3. Pessoas de Confiança para Apoio em Crise
                </label>

                {/* Lista de contatos existentes */}
                {trustedContacts.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {trustedContacts.map((contact, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border">
                        <div className="text-sm">
                          <span className="font-bold text-gray-800">{contact.name}</span>
                          <span className="text-gray-500 mx-2">({contact.relationship})</span>
                          <span className="text-gray-400 font-mono">{contact.phone}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveContact(idx)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mb-4">Nenhum contato de confiança cadastrado.</p>
                )}

                {/* Formulário para adicionar contato */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-[#f9fbf9] p-3 rounded-xl border border-dashed">
                  <input
                    type="text"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    placeholder="Nome"
                    className="p-2 border rounded-lg text-sm bg-white"
                  />
                  <input
                    type="text"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    placeholder="Telefone"
                    className="p-2 border rounded-lg text-sm bg-white"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newContactRel}
                      onChange={(e) => setNewContactRel(e.target.value)}
                      placeholder="Grau (ex: Irmão)"
                      className="p-2 border rounded-lg text-sm bg-white flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddContact}
                      className="p-2 bg-[#4a7c59] hover:bg-[#3d664a] text-white rounded-lg flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Serviços de Emergência */}
              <div className="border-t pt-4">
                <label className="block text-xs font-bold text-[#2b3a30] uppercase tracking-wider mb-2">
                  🚑 4. Serviços de Emergência (Telefones padrão)
                </label>
                <input
                  type="text"
                  value={emergencyServices}
                  onChange={(e) => setEmergencyServices(e.target.value)}
                  placeholder="Ex: CVV: 188, SAMU: 192, Bombeiros: 193"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-[#4a7c59] focus:border-[#4a7c59] text-sm"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-[#f9faf9] rounded-b-2xl flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-600"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-5 py-2 bg-[#4a7c59] hover:bg-[#3d664a] disabled:opacity-50 text-white rounded-lg font-bold text-sm flex items-center gap-1.5 shadow-sm transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar Plano
          </button>
        </div>
      </div>
    </div>
  );
};
export default SafetyPlanModal;
