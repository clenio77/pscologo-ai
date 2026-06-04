import React, { useState, useEffect } from 'react';
import { X, Sparkles, Save, AlertTriangle } from 'lucide-react';
import type { Patient, Evolution, PatientForm, PatientAnalysis } from '../../services/api';
import { generateAnalysis } from '../../services/aiService';
import type { AnalysisType } from '../../services/aiService';
import { api } from '../../services/api';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: AnalysisType;
  patient: Patient;
  evolutions: Evolution[];
  forms: PatientForm[];
  professionalId: string;
  currentAnalysis: PatientAnalysis | null;
  onAnalysisSaved: (analysis: PatientAnalysis) => void;
}

const typeMap: Record<AnalysisType, { title: string; field: keyof PatientAnalysis }> = {
  freud: { title: 'Análise Freudiana (Psicodinâmica)', field: 'freud_analysis' },
  tcc: { title: 'Análise TCC (Aaron Beck)', field: 'tcc_analysis' },
  rogers: { title: 'Análise Humanista (Rogers)', field: 'rogers_analysis' },
  synthesis: { title: 'Síntese Clínica Integrada', field: 'synthesis' }
};

export const AnalysisModal: React.FC<AnalysisModalProps> = ({
  isOpen,
  onClose,
  type,
  patient,
  evolutions,
  forms,
  professionalId,
  currentAnalysis,
  onAnalysisSaved
}) => {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const field = typeMap[type].field;

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (currentAnalysis && currentAnalysis[field]) {
        setContent(currentAnalysis[field] as string);
      } else {
        setContent('');
      }
    }
  }, [isOpen, currentAnalysis, field]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (content && !confirm('Isso irá sobrescrever a análise atual no editor. Deseja continuar?')) {
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateAnalysis(type, patient, forms, evolutions);
      setContent(result);
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar análise.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const updated = await api.upsertPatientAnalysis({
        patient_id: patient.id,
        professional_id: professionalId,
        [field]: content
      });
      onAnalysisSaved(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar análise. Verifique se a tabela patient_analyses existe no Supabase.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
        <div className="modal-header">
          <h2>{typeMap[type].title}</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="ai-notice" style={{ background: '#f8f5ff', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #8b5cf6', fontSize: '0.9rem', color: '#4c1d95', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Atenção às Diretrizes (CFP):</strong> A inteligência artificial atua apenas como copiloto e não pode emitir diagnósticos autônomos. 
              Ao gerar um rascunho com a IA, revise, edite e complemente o texto antes de salvar. Você é o único responsável técnico por este prontuário.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Edite livremente o texto abaixo.</span>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ display: 'flex', gap: '6px', alignItems: 'center', borderColor: '#8b5cf6', color: '#8b5cf6' }}
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              <Sparkles size={16} />
              {isGenerating ? 'Gerando rascunho (IA)...' : 'Gerar Rascunho com IA'}
            </button>
          </div>

          {error && (
            <div className="message-alert message-error" style={{ margin: 0 }}>{error}</div>
          )}

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Gere um rascunho com a IA clicando no botão acima, ou digite sua análise diretamente aqui..."
            style={{ width: '100%', minHeight: '350px', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6' }}
            disabled={isGenerating}
          />

        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={isGenerating || isSaving}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={isGenerating || isSaving || !content.trim()}>
            {isSaving ? 'Salvando...' : 'Revisar e Salvar Análise'}
            <Save size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
