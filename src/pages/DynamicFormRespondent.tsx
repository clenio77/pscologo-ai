import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import type { PatientForm } from '../services/api';
import { Heart, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export const DynamicFormRespondent: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [form, setForm] = useState<PatientForm | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [savingStatus, setSavingStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [completed, setCompleted] = useState(false);
  const [validateTriggered, setValidateTriggered] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      if (!token) {
        setErrorMsg('Link de formulário inválido.');
        setLoading(false);
        return;
      }

      try {
        const data = await api.getPatientFormById(token);
        if (data.status === 'completed') {
          setCompleted(true);
        } else {
          setForm(data);
          setAnswers(data.answers || {});
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Não foi possível carregar o formulário. Verifique o link ou se ele já foi respondido.');
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [token]);

  // Função para salvar progresso automático em background
  const saveProgress = async (newAnswers: Record<string, unknown>) => {
    if (!token) return;
    setSavingStatus('saving');
    try {
      await api.updatePatientForm(token, {
        answers: newAnswers,
        status: 'in_progress',
        current_page: 1
      });
      setSavingStatus('saved');
    } catch (err) {
      console.error('Erro ao salvar progresso:', err);
      setSavingStatus('error');
    }
  };

  const handleInputChange = (fieldId: string, value: unknown) => {
    const nextAnswers = { ...answers, [fieldId]: value };
    setAnswers(nextAnswers);
    saveProgress(nextAnswers);
  };

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidateTriggered(true);

    if (!form || !form.template?.fields || !token) return;

    // Validar campos obrigatórios
    const unansweredRequired = form.template.fields.filter(
      f => f.required && (answers[f.id] === undefined || answers[f.id] === '' || answers[f.id] === false)
    );

    if (unansweredRequired.length > 0) {
      const firstUnanswered = unansweredRequired[0];
      const element = document.getElementById(firstUnanswered.id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      return;
    }

    setLoading(true);
    try {
      await api.updatePatientForm(token, {
        answers,
        status: 'completed',
        current_page: 1,
        completed_at: new Date().toISOString()
      });
      setCompleted(true);
    } catch (err) {
      console.error('Erro ao finalizar formulário:', err);
      alert('Ocorreu um erro ao finalizar o formulário. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Cálculo de progresso de preenchimento
  const getProgress = () => {
    if (!form || !form.template?.fields) return 0;
    const fields = form.template.fields;
    if (fields.length === 0) return 0;

    let filledCount = 0;
    fields.forEach(f => {
      const val = answers[f.id];
      if (val !== undefined && val !== '' && val !== false) {
        filledCount++;
      }
    });

    return Math.round((filledCount / fields.length) * 100);
  };

  if (loading) {
    return (
      <div className="dynamic-form-loading">
        <Loader2 className="spinner-icon animate-spin" size={48} />
        <h3>Carregando formulário...</h3>
        <p>Buscando perguntas personalizadas do seu terapeuta...</p>
        <style>{`
          .dynamic-form-loading {
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #eaf2eb 0%, #dce8dd 100%);
            color: #2b3a30;
            gap: 16px;
            font-family: 'Inter', sans-serif;
          }
          .spinner-icon {
            color: #4a7c59;
          }
          .animate-spin {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="dynamic-form-error">
        <AlertCircle size={64} className="error-icon" />
        <h2>Ops! Ocorreu um problema</h2>
        <p>{errorMsg}</p>
        <style>{`
          .dynamic-form-error {
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #fdf8f7 0%, #faece9 100%);
            color: #5c2518;
            padding: 24px;
            text-align: center;
            gap: 16px;
            font-family: 'Inter', sans-serif;
          }
          .error-icon {
            color: #d9381e;
          }
          .dynamic-form-error p {
            max-width: 480px;
            color: #7d3c30;
          }
        `}</style>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="dynamic-form-success">
        <CheckCircle2 size={72} className="success-icon animate-scale-up" />
        <h2>Formulário Concluído!</h2>
        <p>Muito obrigado. Suas respostas foram salvas e enviadas com segurança diretamente para o prontuário do seu terapeuta.</p>
        <p className="sub-text">Você já pode fechar esta janela com tranquilidade.</p>
        <style>{`
          .dynamic-form-success {
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #eaf2eb 0%, #dce8dd 100%);
            color: #2b3a30;
            padding: 24px;
            text-align: center;
            gap: 16px;
            font-family: 'Inter', sans-serif;
          }
          .success-icon {
            color: #4a7c59;
          }
          .dynamic-form-success p {
            max-width: 520px;
            font-size: 1.1rem;
            color: #5e6f64;
          }
          .dynamic-form-success .sub-text {
            font-size: 0.9rem;
            margin-top: 12px;
            color: #8fa094;
          }
          .animate-scale-up {
            animation: scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
          @keyframes scaleUp {
            from { transform: scale(0.5); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  const progress = getProgress();

  return (
    <div className="respondent-page-container">
      {/* Header Fixo com Progresso */}
      <header className="respondent-header-fixed">
        <div className="header-inner">
          <div className="brand-logo">
            <Heart size={20} className="logo-heart" />
            <div className="logo-text">
              <strong>Agenda Clinical</strong>
              <span>Formulário do Paciente</span>
            </div>
          </div>

          <div className="saving-status-bar">
            {savingStatus === 'saving' && (
              <span className="saving-badge status-saving">
                <Loader2 className="animate-spin" size={14} />
                Salvando progresso...
              </span>
            )}
            {savingStatus === 'saved' && (
              <span className="saving-badge status-saved">
                <CheckCircle2 size={14} />
                Alterações salvas
              </span>
            )}
            {savingStatus === 'error' && (
              <span className="saving-badge status-error">
                <AlertCircle size={14} />
                Erro de conexão (salvo local)
              </span>
            )}
          </div>

          <div className="progress-section">
            <div className="progress-track">
              <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="progress-pct">{progress}%</span>
          </div>
        </div>
      </header>

      {/* Corpo Principal */}
      <main className="respondent-content-area">
        <form onSubmit={handleFinalize} className="respondent-card-form">
          <div className="form-intro-card">
            <h1>{form?.template?.title}</h1>
            {form?.template?.description && <p className="intro-desc">{form.template.description}</p>}
            {form?.patient?.name && (
              <div className="patient-welcome">
                Olá, <strong>{form.patient.name}</strong>! Preencha os campos abaixo com as informações solicitadas pelo seu psicólogo.
              </div>
            )}
          </div>

          <div className="fields-wrapper">
            {form?.template?.fields?.map((field, index) => {
              const hasError = validateTriggered && field.required && (answers[field.id] === undefined || answers[field.id] === '' || answers[field.id] === false);
              
              return (
                <div key={field.id} className={`question-block-card ${hasError ? 'field-error' : ''}`}>
                  <label className="field-question-label" htmlFor={field.id}>
                    <span className="question-number">{index + 1}.</span>
                    <span className="question-text">
                      {field.label}
                      {field.required && <span className="req-asterisk">*</span>}
                    </span>
                  </label>

                  <div className="field-input-container">
                    {field.type === 'text' && (
                       <input 
                         type="text" 
                         id={field.id}
                         className="form-input-text"
                         placeholder="Escreva sua resposta curta aqui..."
                         value={(answers[field.id] as string) || ''}
                         onChange={(e) => handleInputChange(field.id, e.target.value)}
                       />
                    )}
 
                    {field.type === 'textarea' && (
                       <textarea 
                         id={field.id}
                         className="form-input-textarea"
                         rows={4}
                         placeholder="Escreva sua resposta detalhada aqui..."
                         value={(answers[field.id] as string) || ''}
                         onChange={(e) => handleInputChange(field.id, e.target.value)}
                       />
                    )}
 
                    {field.type === 'select' && (
                       <select 
                         id={field.id}
                         className="form-input-select"
                         value={(answers[field.id] as string) || ''}
                         onChange={(e) => handleInputChange(field.id, e.target.value)}
                       >
                         <option value="">Selecione uma opção...</option>
                         {field.options?.map(opt => (
                           <option key={opt} value={opt}>{opt}</option>
                         ))}
                       </select>
                    )}

                    {field.type === 'checkbox' && (
                      <div className="form-input-checkbox-row">
                        <input 
                          type="checkbox" 
                          id={field.id}
                          checked={!!answers[field.id]}
                          onChange={(e) => handleInputChange(field.id, e.target.checked)}
                          className="form-checkbox-control"
                        />
                        <label htmlFor={field.id} className="checkbox-label-text">
                          Confirmar / Assinalar esta opção
                        </label>
                      </div>
                    )}

                    {hasError && (
                      <span className="error-hint-message">
                        Esta pergunta é obrigatória e precisa ser respondida.
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="form-actions-footer">
            <button type="submit" className="btn-submit-finalize">
              Finalizar e Enviar Questionário
            </button>
          </div>
        </form>
      </main>

      <style>{`
        /* ESTILOS PREMIUM VANILLA CSS PARA O FORMULÁRIO DINÂMICO */
        .respondent-page-container {
          min-height: 100vh;
          background-color: #f4f7f5;
          font-family: 'Outfit', 'Inter', sans-serif;
          color: #2b3a30;
          padding-top: 80px;
          padding-bottom: 60px;
        }

        /* Header Fixo com Glassmorphism */
        .respondent-header-fixed {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 70px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(74, 124, 89, 0.12);
          z-index: 1000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
        }

        .header-inner {
          max-width: 800px;
          margin: 0 auto;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .logo-heart {
          color: #4a7c59;
        }

        .logo-text {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }

        .logo-text strong {
          font-size: 0.95rem;
          color: #2b3a30;
        }

        .logo-text span {
          font-size: 0.72rem;
          color: #5e6f64;
        }

        .saving-status-bar {
          display: flex;
          align-items: center;
        }

        .saving-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 999px;
        }

        .status-saving {
          background-color: #fef3c7;
          color: #d97706;
        }

        .status-saved {
          background-color: #d1fae5;
          color: #065f46;
        }

        .status-error {
          background-color: #fee2e2;
          color: #991b1b;
        }

        .progress-section {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 140px;
        }

        .progress-track {
          flex: 1;
          height: 6px;
          background-color: #e8efe9;
          border-radius: 999px;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          background-color: #4a7c59;
          border-radius: 999px;
          transition: width 0.3s ease;
        }

        .progress-pct {
          font-size: 0.82rem;
          font-weight: 700;
          color: #4a7c59;
          min-width: 35px;
          text-align: right;
        }

        /* Area de Conteudo */
        .respondent-content-area {
          max-width: 800px;
          margin: 0 auto;
          padding: 24px;
        }

        .respondent-card-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-intro-card {
          background: white;
          padding: 32px;
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.04);
          box-shadow: 0 10px 30px rgba(43, 58, 48, 0.04);
        }

        .form-intro-card h1 {
          font-size: 1.8rem;
          color: #2b3a30;
          margin-bottom: 12px;
          font-weight: 800;
        }

        .intro-desc {
          font-size: 1.05rem;
          color: #5e6f64;
          line-height: 1.5;
        }

        .patient-welcome {
          margin-top: 18px;
          padding: 12px 18px;
          background-color: #eaf2eb;
          color: #2e4d37;
          border-radius: 10px;
          font-size: 0.95rem;
          border-left: 4px solid #4a7c59;
        }

        .fields-wrapper {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .question-block-card {
          background: white;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.04);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }

        .question-block-card:hover {
          border-color: rgba(74, 124, 89, 0.2);
          box-shadow: 0 6px 20px rgba(43, 58, 48, 0.05);
        }

        .field-question-label {
          display: flex;
          gap: 10px;
          font-size: 1.05rem;
          font-weight: 600;
          line-height: 1.4;
          margin-bottom: 16px;
          color: #2b3a30;
          cursor: pointer;
        }

        .question-number {
          color: #4a7c59;
          font-weight: 800;
        }

        .req-asterisk {
          color: #d9381e;
          margin-left: 4px;
        }

        .field-input-container {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        /* Inputs Estilizados */
        .form-input-text, .form-input-textarea, .form-input-select {
          width: 100%;
          border: 1.5px solid #d8e2dc;
          background-color: #fafdfb;
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 0.98rem;
          color: #2b3a30;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
          outline: none;
        }

        .form-input-text:focus, .form-input-textarea:focus, .form-input-select:focus {
          border-color: #4a7c59;
          box-shadow: 0 0 0 4px rgba(74, 124, 89, 0.1);
          background-color: white;
        }

        .form-input-textarea {
          resize: vertical;
        }

        .form-input-checkbox-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
        }

        .form-checkbox-control {
          width: 20px;
          height: 20px;
          accent-color: #4a7c59;
          cursor: pointer;
        }

        .checkbox-label-text {
          font-size: 0.95rem;
          color: #5e6f64;
          cursor: pointer;
          user-select: none;
        }

        /* Erros de Validação */
        .field-error {
          border-color: #fecaca !important;
          background-color: #fffafb;
        }

        .error-hint-message {
          font-size: 0.8rem;
          color: #d9381e;
          font-weight: 600;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* Botao de Envio */
        .form-actions-footer {
          display: flex;
          justify-content: flex-end;
          margin-top: 12px;
        }

        .btn-submit-finalize {
          background-color: #4a7c59;
          color: white;
          border: none;
          padding: 16px 32px;
          font-size: 1.05rem;
          font-weight: 700;
          border-radius: 12px;
          cursor: pointer;
          box-shadow: 0 8px 25px rgba(74, 124, 89, 0.2);
          transition: background-color 0.2s, transform 0.2s, box-shadow 0.2s;
        }

        .btn-submit-finalize:hover {
          background-color: #3b6347;
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(74, 124, 89, 0.3);
        }

        .btn-submit-finalize:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};
