import React from 'react';
import { X, Printer } from 'lucide-react';
import type { Patient, Evolution, PatientAnalysis } from '../../services/api';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  evolutions: Evolution[];
  patientAnalysis: PatientAnalysis | null;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  patient,
  evolutions,
  patientAnalysis
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const sortedEvolutions = [...evolutions].sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-slide-up" style={{ maxWidth: '800px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Não será impresso */}
        <div className="modal-header no-print">
          <h3>Relatório Clínico Exportável</h3>
          <button className="close-modal-btn" onClick={onClose} aria-label="Fechar modal">
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '24px', backgroundColor: '#f1f5f9' }}>
          
          <div className="no-print" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Pré-visualização do documento. Clique em Imprimir e selecione "Salvar como PDF".</p>
            <button className="btn btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Printer size={18} /> Imprimir / PDF
            </button>
          </div>

          {/* ÁREA DE IMPRESSÃO */}
          <div id="printable-report" style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', color: 'black' }}>
            
            <header style={{ borderBottom: '2px solid #1e293b', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#1e293b' }}>Relatório Psicológico</h1>
                <p style={{ margin: '5px 0 0 0', color: '#475569' }}>Confidencial</p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.9rem', color: '#475569' }}>
                Data de emissão: {new Date().toLocaleDateString('pt-BR')}
              </div>
            </header>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ fontSize: '1.2rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px' }}>Identificação do Paciente</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.95rem' }}>
                <div><strong>Nome:</strong> {patient.name}</div>
                <div><strong>E-mail:</strong> {patient.email || 'Não informado'}</div>
                <div><strong>Telefone:</strong> {patient.phone || 'Não informado'}</div>
                <div><strong>Data de Nascimento:</strong> {patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('pt-BR') : 'Não informada'}</div>
                <div><strong>Início do Tratamento:</strong> {new Date(patient.created_at).toLocaleDateString('pt-BR')}</div>
              </div>
            </section>

            {patientAnalysis && patientAnalysis.synthesis && (
              <section style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '1.2rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px' }}>Síntese Clínica</h2>
                <div style={{ fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {patientAnalysis.synthesis}
                </div>
              </section>
            )}

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ fontSize: '1.2rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px' }}>Histórico de Sessões ({evolutions.length})</h2>
              {sortedEvolutions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {sortedEvolutions.map((evo, i) => (
                    <div key={evo.id} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                      <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '4px' }}>
                        Sessão {i + 1} — {new Date(evo.session_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </strong>
                      <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>{evo.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Nenhuma sessão registrada.</p>
              )}
            </section>

            <footer style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
              <p>Este documento contém informações estritamente confidenciais e protegidas por sigilo profissional.</p>
              <div style={{ marginTop: '40px', width: '250px', margin: '40px auto 0', borderTop: '1px solid black', paddingTop: '10px' }}>
                Assinatura do Profissional
              </div>
            </footer>

          </div>
        </div>
      </div>
    </div>
  );
};
