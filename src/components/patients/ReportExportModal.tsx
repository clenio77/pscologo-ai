import React, { useState, useEffect } from 'react';
import { X, Printer, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import type { Patient, Evolution, PatientProfile, PatientTest } from '../../services/api';
import { generateCFPDocument } from '../../services/aiService';
import type { CFPDocumentType, CFPDocumentDraft } from '../../services/aiService';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  evolutions: Evolution[];
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  patient,
  evolutions
}) => {
  const [docType, setDocType] = useState<CFPDocumentType>('relatorio');
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [tests, setTests] = useState<PatientTest[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [draft, setDraft] = useState<CFPDocumentDraft>({
    procedimento: '',
    analise: '',
    conclusao: ''
  });

  const [localFormData, setLocalFormData] = useState({
    document_requester: '',
    document_purpose: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, patient.id]);

  const loadData = async () => {
    try {
      const p = await api.getPatientProfile(patient.id);
      if (p) {
        setProfile(p);
        setLocalFormData({
          document_requester: p.document_requester || '',
          document_purpose: p.document_purpose || ''
        });
      }
      const t = await api.getPatientTests(patient.id);
      setTests(t);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateDraft = async () => {
    setIsGenerating(true);
    try {
      const result = await generateCFPDocument(docType, patient, evolutions, tests);
      setDraft({
        procedimento: result.procedimento || '',
        analise: result.analise || '',
        conclusao: result.conclusao || ''
      });
    } catch (error) {
      console.error(error);
      alert('Falha ao gerar rascunho com a IA.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const getDocTitle = () => {
    switch (docType) {
      case 'declaracao': return 'DECLARAÇÃO';
      case 'atestado': return 'ATESTADO PSICOLÓGICO';
      case 'relatorio': return 'RELATÓRIO PSICOLÓGICO';
      case 'laudo': return 'LAUDO PSICOLÓGICO';
      default: return '';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-slide-up" style={{ maxWidth: '900px', width: '95%', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* CABEÇALHO NÃO IMPRESSO */}
        <div className="modal-header no-print">
          <h3>Gerador de Documentos Oficiais (CFP)</h3>
          <button className="close-modal-btn" onClick={onClose} aria-label="Fechar modal">
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '24px', backgroundColor: '#f1f5f9', display: 'flex', gap: '24px' }}>
          
          {/* CONTROLES LATERAIS (NÃO IMPRESSOS) */}
          <div className="no-print" style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', display: 'block', marginBottom: '8px' }}>Tipo de Documento</label>
              <select 
                className="form-control" 
                value={docType} 
                onChange={(e) => setDocType(e.target.value as CFPDocumentType)}
              >
                <option value="declaracao">Declaração</option>
                <option value="atestado">Atestado Psicológico</option>
                <option value="relatorio">Relatório Psicológico</option>
                <option value="laudo">Laudo Psicológico</option>
              </select>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '8px', lineHeight: 1.4 }}>
                {docType === 'declaracao' && 'Informa comparecimento/acompanhamento. Vedado registro de sintomas.'}
                {docType === 'atestado' && 'Certifica situação psicológica para aptidão, afastamento ou justificativa.'}
                {docType === 'relatorio' && 'Comunica atuação profissional com foco na evolução do caso e encaminhamentos.'}
                {docType === 'laudo' && 'Resultado de avaliação psicológica baseada em testes com diagnóstico/prognóstico.'}
              </p>
            </div>

            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', display: 'block', marginBottom: '8px' }}>Solicitante</label>
              <input 
                type="text" 
                className="form-control" 
                value={localFormData.document_requester} 
                onChange={e => setLocalFormData({...localFormData, document_requester: e.target.value})}
                placeholder="Ex: O próprio, Justiça, Escola"
              />
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', display: 'block', margin: '16px 0 8px' }}>Finalidade</label>
              <input 
                type="text" 
                className="form-control" 
                value={localFormData.document_purpose} 
                onChange={e => setLocalFormData({...localFormData, document_purpose: e.target.value})}
                placeholder="Ex: Acompanhamento clínico"
              />
            </div>

            {docType !== 'declaracao' && (
              <button 
                className="btn btn-primary" 
                onClick={handleGenerateDraft} 
                disabled={isGenerating}
                style={{ width: '100%', display: 'flex', gap: '8px', justifyContent: 'center' }}
              >
                <Sparkles size={18} />
                {isGenerating ? 'Gerando rascunho...' : 'Gerar Rascunho c/ IA'}
              </button>
            )}

            <button 
              className="btn btn-secondary" 
              onClick={handlePrint}
              style={{ width: '100%', display: 'flex', gap: '8px', justifyContent: 'center', backgroundColor: '#1e293b', color: 'white' }}
            >
              <Printer size={18} /> Imprimir / Salvar PDF
            </button>
          </div>

          {/* ÁREA DE PREVIEW / IMPRESSÃO */}
          <div id="printable-report" style={{ flex: 1, backgroundColor: 'white', padding: '40px 50px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', color: 'black', minHeight: '800px' }}>
            
            <header style={{ borderBottom: '2px solid #1e293b', paddingBottom: '20px', marginBottom: '30px', textAlign: 'center' }}>
              <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#1e293b', letterSpacing: '1px' }}>{getDocTitle()}</h1>
            </header>

            <section style={{ marginBottom: '24px', fontSize: '1rem', lineHeight: 1.6 }}>
              <h2 style={{ fontSize: '1.1rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '12px' }}>1. Identificação</h2>
              <div><strong>Nome:</strong> {patient.name}</div>
              {profile?.cpf && <div><strong>CPF:</strong> {profile.cpf}</div>}
              <div><strong>Solicitante:</strong> {localFormData.document_requester || 'Não informado'}</div>
              <div><strong>Finalidade:</strong> {localFormData.document_purpose || 'Não informada'}</div>
              <div><strong>Autor(a):</strong> {`[SEU NOME AQUI - CRP XX/XXXXX]`}</div>
            </section>

            {docType === 'declaracao' ? (
              <section style={{ marginBottom: '24px', fontSize: '1rem', lineHeight: 1.6 }}>
                <p>Declaro, para os devidos fins de direito ({localFormData.document_purpose || 'acompanhamento clínico'}), que o(a) Sr(a). <strong>{patient.name}</strong> encontra-se em acompanhamento psicológico sob meus cuidados.</p>
                <p>Início do acompanhamento: {new Date(patient.created_at).toLocaleDateString('pt-BR')}.</p>
                <p>Compareceu às sessões nas seguintes datas recentes:</p>
                <ul>
                  {evolutions.slice(0, 5).map(e => (
                    <li key={e.id}>{new Date(e.session_date + 'T12:00:00').toLocaleDateString('pt-BR')}</li>
                  ))}
                </ul>
              </section>
            ) : (
              <>
                <section style={{ marginBottom: '24px', fontSize: '1rem', lineHeight: 1.6 }}>
                  <h2 style={{ fontSize: '1.1rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '12px' }}>2. Descrição da Demanda</h2>
                  <textarea 
                    className="no-print"
                    style={{ width: '100%', padding: '10px', minHeight: '80px', fontFamily: 'inherit', border: '1px dashed #cbd5e1' }}
                    defaultValue={`O documento foi solicitado para fins de ${localFormData.document_purpose || '...'} pela fonte solicitante: ${localFormData.document_requester || '...'}. O paciente apresenta demanda inicial de ...`}
                  />
                  <div className="print-only" style={{ whiteSpace: 'pre-wrap' }}>
                    O documento foi solicitado para fins de {localFormData.document_purpose || '...'} pela fonte solicitante: {localFormData.document_requester || '...'}. O paciente apresenta demanda inicial de ...
                  </div>
                </section>

                {(docType === 'relatorio' || docType === 'laudo') && (
                  <>
                    <section style={{ marginBottom: '24px', fontSize: '1rem', lineHeight: 1.6 }}>
                      <h2 style={{ fontSize: '1.1rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '12px' }}>3. Procedimento</h2>
                      <textarea 
                        className="no-print"
                        value={draft.procedimento}
                        onChange={e => setDraft({...draft, procedimento: e.target.value})}
                        style={{ width: '100%', padding: '10px', minHeight: '120px', fontFamily: 'inherit', border: '1px dashed #cbd5e1' }}
                        placeholder="Descreva as técnicas, número de encontros e testes aplicados."
                      />
                      <div className="print-only" style={{ whiteSpace: 'pre-wrap' }}>{draft.procedimento}</div>
                    </section>

                    <section style={{ marginBottom: '24px', fontSize: '1rem', lineHeight: 1.6 }}>
                      <h2 style={{ fontSize: '1.1rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '12px' }}>4. Análise</h2>
                      <textarea 
                        className="no-print"
                        value={draft.analise}
                        onChange={e => setDraft({...draft, analise: e.target.value})}
                        style={{ width: '100%', padding: '10px', minHeight: '180px', fontFamily: 'inherit', border: '1px dashed #cbd5e1' }}
                        placeholder="Exposição analítica dos dados colhidos."
                      />
                      <div className="print-only" style={{ whiteSpace: 'pre-wrap' }}>{draft.analise}</div>
                    </section>
                  </>
                )}

                <section style={{ marginBottom: '24px', fontSize: '1rem', lineHeight: 1.6 }}>
                  <h2 style={{ fontSize: '1.1rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '12px' }}>
                    {docType === 'atestado' ? 'Descrição das Condições Psicológicas' : '5. Conclusão'}
                  </h2>
                  <textarea 
                    className="no-print"
                    value={draft.conclusao}
                    onChange={e => setDraft({...draft, conclusao: e.target.value})}
                    style={{ width: '100%', padding: '10px', minHeight: '120px', fontFamily: 'inherit', border: '1px dashed #cbd5e1' }}
                    placeholder="Resultados, diagnóstico, encaminhamentos."
                  />
                  <div className="print-only" style={{ whiteSpace: 'pre-wrap' }}>{draft.conclusao}</div>
                </section>

                {docType === 'laudo' && (
                  <section style={{ marginBottom: '24px', fontSize: '1rem', lineHeight: 1.6 }}>
                    <h2 style={{ fontSize: '1.1rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '12px' }}>6. Referências</h2>
                    <textarea 
                      className="no-print"
                      style={{ width: '100%', padding: '10px', minHeight: '80px', fontFamily: 'inherit', border: '1px dashed #cbd5e1' }}
                      defaultValue={tests.length > 0 ? tests.map(t => `- Manual do Teste ${t.test_name}`).join('\n') : '- Referências bibliográficas utilizadas...'}
                    />
                    <div className="print-only" style={{ whiteSpace: 'pre-wrap' }}>
                      {tests.length > 0 ? tests.map(t => `- Manual do Teste ${t.test_name}`).join('\n') : '- Referências bibliográficas utilizadas...'}
                    </div>
                  </section>
                )}
              </>
            )}

            <footer style={{ marginTop: '60px', paddingTop: '20px', textAlign: 'center', fontSize: '0.9rem', color: '#1e293b' }}>
              <p>Este documento é confidencial e sigiloso.</p>
              <div style={{ marginTop: '50px', width: '300px', margin: '50px auto 0', borderTop: '1px solid black', paddingTop: '10px' }}>
                Local e Data: _________________, ___/___/______<br/><br/>
                Assinatura e Carimbo
              </div>
            </footer>

          </div>
        </div>
      </div>
    </div>
  );
};
