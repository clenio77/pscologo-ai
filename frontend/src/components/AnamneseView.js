import React, { useState, useEffect } from 'react';
import { ClipboardList, Sparkles } from 'lucide-react';

const AnamneseView = ({ usuario, API_BASE_URL, pacienteSelecionado }) => {
  const [anamneseData, setAnamneseData] = useState({
    queixa_principal: '',
    historico_sintomas: '',
    historico_familiar: '',
    historico_medico: '',
    relacionamentos_sociais: '',
    expectativas_terapia: '',
    observacoes_gerais: ''
  });
  const [carregandoAnamnese, setCarregandoAnamnese] = useState(false);
  const [salvandoAnamnese, setSalvandoAnamnese] = useState(false);

  const fetchAnamnese = async () => {
    if (!usuario || !pacienteSelecionado) return;
    setCarregandoAnamnese(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/paciente/${pacienteSelecionado.id}/anamnese`, {
        headers: {
          'Authorization': `Bearer ${usuario.token}`
        }
      });
      if (resp.status === 401) {
        // Handle logout if needed, for now just fail silently
        return;
      }
      if (resp.ok) {
        const data = await resp.json();
        setAnamneseData(data);
      } else {
        setAnamneseData({
          queixa_principal: '',
          historico_sintomas: '',
          historico_familiar: '',
          historico_medico: '',
          relacionamentos_sociais: '',
          expectativas_terapia: '',
          observacoes_gerais: ''
        });
      }
    } catch (err) {
      console.error("Erro ao buscar anamnese:", err);
    } finally {
      setCarregandoAnamnese(false);
    }
  };

  useEffect(() => {
    fetchAnamnese();
  }, [pacienteSelecionado, usuario]);

  const handleSalvarAnamnese = async (e) => {
    e.preventDefault();
    if (!usuario || !pacienteSelecionado) return;
    setSalvandoAnamnese(true);

    try {
      const resp = await fetch(`${API_BASE_URL}/paciente/${pacienteSelecionado.id}/anamnese`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usuario.token}`
        },
        body: JSON.stringify(anamneseData)
      });
      
      const data = await resp.json();
      if (resp.ok) {
        setAnamneseData({
          ...anamneseData,
          data_atualizacao: data.data_atualizacao || new Date().toLocaleString()
        });
        alert(data.mensagem || "Anamnese salva com sucesso!");
      } else {
        alert(data.erro || "Erro ao salvar anamnese");
      }
    } catch (err) {
      console.error("Erro ao salvar anamnese:", err);
      alert("Erro ao conectar com o servidor.");
    } finally {
      setSalvandoAnamnese(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--glass-border)', padding: '2rem', borderRadius: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '2rem' }}>
          <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ClipboardList size={24} style={{ color: 'var(--accent)' }} /> Ficha de Anamnese (Primeira Consulta)
          </h3>
          {anamneseData.data_atualizacao && (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Última atualização: {anamneseData.data_atualizacao}
            </span>
          )}
        </div>

        {carregandoAnamnese ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>Carregando dados da anamnese...</p>
        ) : (
          <form onSubmit={handleSalvarAnamnese} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="anamnese-grid">
              
              {/* Queixa Principal */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: 500 }}>1. Queixa Principal e Motivo da Consulta</label>
                <textarea
                  placeholder="Descreva o motivo principal que levou o paciente a buscar terapia, sintomas iniciais relatados e a duração do problema..."
                  value={anamneseData.queixa_principal || ''}
                  onChange={(e) => setAnamneseData({ ...anamneseData, queixa_principal: e.target.value })}
                  rows={4}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--glass-border)',
                    color: 'white',
                    borderRadius: '0.8rem',
                    padding: '0.75rem',
                    resize: 'vertical',
                    fontSize: '0.9rem',
                    lineHeight: '1.5'
                  }}
                />
              </div>

              {/* Histórico dos Sintomas */}
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: 500 }}>2. Histórico e Evolução dos Sintomas</label>
                <textarea
                  placeholder="Quando os sintomas começaram? Fatores desencadeantes, intensidade, frequência e tentativas anteriores de manejo..."
                  value={anamneseData.historico_sintomas || ''}
                  onChange={(e) => setAnamneseData({ ...anamneseData, historico_sintomas: e.target.value })}
                  rows={4}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--glass-border)',
                    color: 'white',
                    borderRadius: '0.8rem',
                    padding: '0.75rem',
                    resize: 'vertical',
                    fontSize: '0.9rem',
                    lineHeight: '1.5'
                  }}
                />
              </div>

              {/* Histórico Familiar */}
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: 500 }}>3. Histórico Familiar e Dinâmica Relacional</label>
                <textarea
                  placeholder="Antecedentes psiquiátricos na família, relacionamento com parents/irmãos, ambiente familiar de infância e dinâmica atual..."
                  value={anamneseData.historico_familiar || ''}
                  onChange={(e) => setAnamneseData({ ...anamneseData, historico_familiar: e.target.value })}
                  rows={4}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--glass-border)',
                    color: 'white',
                    borderRadius: '0.8rem',
                    padding: '0.75rem',
                    resize: 'vertical',
                    fontSize: '0.9rem',
                    lineHeight: '1.5'
                  }}
                />
              </div>

              {/* Histórico Médico */}
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: 500 }}>4. Histórico Médico e Clínico Geral</label>
                <textarea
                  placeholder="Uso de medicamentos contínuos, comorbidades, tratamentos médicos/psiquiátricos anteriores, sono e alimentação..."
                  value={anamneseData.historico_medico || ''}
                  onChange={(e) => setAnamneseData({ ...anamneseData, historico_medico: e.target.value })}
                  rows={4}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--glass-border)',
                    color: 'white',
                    borderRadius: '0.8rem',
                    padding: '0.75rem',
                    resize: 'vertical',
                    fontSize: '0.9rem',
                    lineHeight: '1.5'
                  }}
                />
              </div>

              {/* Relações Sociais */}
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: 500 }}>5. Relações Sociais e Trabalho/Estudo</label>
                <textarea
                  placeholder="Rede de apoio (amigos, parceiro), ambiente de trabalho, satisfação profissional, atividades de lazer e hobbies..."
                  value={anamneseData.relacionamentos_sociais || ''}
                  onChange={(e) => setAnamneseData({ ...anamneseData, relacionamentos_sociais: e.target.value })}
                  rows={4}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--glass-border)',
                    color: 'white',
                    borderRadius: '0.8rem',
                    padding: '0.75rem',
                    resize: 'vertical',
                    fontSize: '0.9rem',
                    lineHeight: '1.5'
                  }}
                />
              </div>

              {/* Expectativas Terapia */}
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: 500 }}>6. Expectativas e Objetivos da Terapia</label>
                <textarea
                  placeholder="O que o paciente espera alcançar com a psicoterapia? Metas de curto e longo prazo acordadas..."
                  value={anamneseData.expectativas_terapia || ''}
                  onChange={(e) => setAnamneseData({ ...anamneseData, expectativas_terapia: e.target.value })}
                  rows={4}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--glass-border)',
                    color: 'white',
                    borderRadius: '0.8rem',
                    padding: '0.75rem',
                    resize: 'vertical',
                    fontSize: '0.9rem',
                    lineHeight: '1.5'
                  }}
                />
              </div>

              {/* Observações Gerais */}
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: 500 }}>7. Observações Gerais do Terapeuta</label>
                <textarea
                  placeholder="Postura do paciente, nível de engajamento, percepções iniciais do terapeuta e hipóteses diagnósticas preliminares..."
                  value={anamneseData.observacoes_gerais || ''}
                  onChange={(e) => setAnamneseData({ ...anamneseData, observacoes_gerais: e.target.value })}
                  rows={4}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--glass-border)',
                    color: 'white',
                    borderRadius: '0.8rem',
                    padding: '0.75rem',
                    resize: 'vertical',
                    fontSize: '0.9rem',
                    lineHeight: '1.5'
                  }}
                />
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
              <button
                type="submit"
                disabled={salvandoAnamnese}
                className="action-btn-success"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--accent)',
                  color: 'white',
                  borderColor: 'var(--accent)',
                  cursor: 'pointer',
                  padding: '0.8rem 2rem',
                  borderRadius: '0.8rem',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
              >
                {salvandoAnamnese ? (
                  'Salvando...'
                ) : (
                  <>
                    <Sparkles size={18} /> Salvar Ficha de Anamnese
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AnamneseView;
