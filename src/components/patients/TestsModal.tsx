import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, FileText, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';
import type { Patient, PatientTest } from '../../services/api';

interface TestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  professionalId: string;
}

export const TestsModal: React.FC<TestsModalProps> = ({
  isOpen,
  onClose,
  patient,
  professionalId
}) => {
  const [tests, setTests] = useState<PatientTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newTest, setNewTest] = useState({
    test_name: '',
    application_date: new Date().toISOString().split('T')[0],
    objective: '',
    results_summary: ''
  });

  const loadTests = async () => {
    setLoading(true);
    try {
      const data = await api.getPatientTests(patient.id);
      setTests(data);
    } catch (e) {
      console.error('Falha ao carregar testes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTests();
    }
  }, [isOpen, patient.id]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addPatientTest({
        patient_id: patient.id,
        professional_id: professionalId,
        test_name: newTest.test_name,
        application_date: newTest.application_date,
        objective: newTest.objective,
        results_summary: newTest.results_summary
      });
      await loadTests();
      setIsAdding(false);
      setNewTest({
        test_name: '',
        application_date: new Date().toISOString().split('T')[0],
        objective: '',
        results_summary: ''
      });
    } catch (error) {
      console.error('Erro ao salvar teste', error);
      alert('Falha ao salvar teste');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este teste?')) return;
    try {
      await api.deletePatientTest(id);
      await loadTests();
    } catch (error) {
      console.error('Erro ao deletar teste', error);
      alert('Falha ao deletar teste');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-slide-up" style={{ maxWidth: '800px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <h3>Testes Psicológicos (SATEPSI) — {patient.name}</h3>
          <button className="close-modal-btn" onClick={onClose} aria-label="Fechar modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '24px', backgroundColor: '#f8fafc' }}>
          
          <div style={{ background: '#e6f4ea', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #137333', fontSize: '0.88rem', color: '#0d5323', display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '20px' }}>
            <CheckCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Recomendação (CFP):</strong> Registre aqui apenas instrumentos e testes psicológicos favoráveis pelo SATEPSI. Estas informações são fontes fundamentais e subsidiam a elaboração de laudos psicológicos.
            </div>
          </div>

          {!isAdding && (
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '1.1rem', color: '#1e293b' }}>Histórico de Testagens</h4>
              <button className="btn btn-primary" onClick={() => setIsAdding(true)} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <Plus size={16} /> Adicionar Teste
              </button>
            </div>
          )}

          {isAdding && (
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
              <h4 style={{ fontSize: '1rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px' }}>Registro de Novo Teste</h4>
              <form onSubmit={handleSave}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Nome do Teste / Sigla (Ex: HTP, WAIS-III)</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={newTest.test_name}
                      onChange={e => setNewTest({...newTest, test_name: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Data de Aplicação</label>
                    <input
                      type="date"
                      required
                      className="form-control"
                      value={newTest.application_date}
                      onChange={e => setNewTest({...newTest, application_date: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Objetivo da Aplicação / Construto Avaliado</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Avaliação de traços de personalidade"
                    value={newTest.objective}
                    onChange={e => setNewTest({...newTest, objective: e.target.value})}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Síntese dos Resultados (Percentis, Escores, Conclusão do Instrumento)</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={newTest.results_summary}
                    onChange={e => setNewTest({...newTest, results_summary: e.target.value})}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsAdding(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Salvar Registro</button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <p>Carregando testes...</p>
          ) : tests.length === 0 && !isAdding ? (
            <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#94a3b8' }}>
              <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p>Nenhum teste registrado para este paciente.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {!isAdding && tests.map(test => (
                <div key={test.id} style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', margin: '0 0 4px', color: '#1e293b' }}>{test.test_name}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#64748b' }}>
                        <Calendar size={14} />
                        Data de Aplicação: {new Date(test.application_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(test.id)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                      title="Excluir registro"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {test.objective && (
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: '#475569', display: 'block', marginBottom: '2px' }}>Objetivo:</strong>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e293b' }}>{test.objective}</p>
                    </div>
                  )}

                  {test.results_summary && (
                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#475569', display: 'block', marginBottom: '4px' }}>Resultados:</strong>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e293b', whiteSpace: 'pre-wrap' }}>{test.results_summary}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
