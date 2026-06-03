import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';

const DiarioEmocionalView = ({ usuario, API_BASE_URL, pacienteSelecionado }) => {
  const [listaDiarios, setListaDiarios] = useState([]);
  const [carregandoDiario, setCarregandoDiario] = useState(false);
  const [novoDiarioHumor, setNovoDiarioHumor] = useState(3);
  const [novoDiarioEmocoes, setNovoDiarioEmocoes] = useState('');
  const [novoDiarioFator, setNovoDiarioFator] = useState('');
  const [novoDiarioNota, setNovoDiarioNota] = useState('');

  const pacienteIdRef = pacienteSelecionado ? pacienteSelecionado.id : usuario ? usuario.id : null;

  const fetchDiario = async () => {
    if (!usuario || !pacienteIdRef) return;
    setCarregandoDiario(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/paciente/${pacienteIdRef}/diario`, {
        headers: { Authorization: `Bearer ${usuario.token}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        setListaDiarios(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCarregandoDiario(false);
    }
  };

  useEffect(() => {
    fetchDiario();
  }, [pacienteIdRef, usuario]);

  const handleSalvarDiario = async (e) => {
    e.preventDefault();
    if (!usuario) return;
    try {
      const payload = {
        humor: novoDiarioHumor,
        emocoes: novoDiarioEmocoes,
        fator_desencadeante: novoDiarioFator,
        nota: novoDiarioNota,
      };
      const resp = await fetch(`${API_BASE_URL}/paciente/${usuario.id}/diario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${usuario.token}`,
        },
        body: JSON.stringify(payload),
      });
      if (resp.ok) {
        alert('Registro do diário salvo com sucesso!');
        setNovoDiarioHumor(3);
        setNovoDiarioEmocoes('');
        setNovoDiarioFator('');
        setNovoDiarioNota('');
        fetchDiario();
      } else {
        alert('Erro ao salvar diário');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <MessageSquare size={24} color="var(--accent)" /> Diário Emocional
      </h2>
      <p style={{ color: 'var(--text-secondary)' }}>Registre seu humor diário, o que sentiu e os gatilhos.</p>

      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <div style={{ flex: 1 }}>
          <div className="glass-card">
            <h3>Novo Registro</h3>
            <form onSubmit={handleSalvarDiario} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label>Como você se sente hoje? (1 - Muito Mal, 5 - Muito Bem)</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={novoDiarioHumor}
                  onChange={(e) => setNovoDiarioHumor(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
                <div style={{ textAlign: 'center', fontSize: '1.2rem', color: 'var(--accent)', fontWeight: 'bold' }}>
                  {novoDiarioHumor}
                </div>
              </div>
              <div>
                <label>Quais emoções estão presentes? (Ex: Tristeza, Alívio)</label>
                <input
                  type="text"
                  value={novoDiarioEmocoes}
                  onChange={(e) => setNovoDiarioEmocoes(e.target.value)}
                  placeholder="Ex: Alegria, ansiedade..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'white',
                  }}
                />
              </div>
              <div>
                <label>Algum gatilho ou fator desencadeante?</label>
                <input
                  type="text"
                  value={novoDiarioFator}
                  onChange={(e) => setNovoDiarioFator(e.target.value)}
                  placeholder="Ex: Discussão no trabalho, insônia..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'white',
                  }}
                />
              </div>
              <div>
                <label>Anotações (Desabafo livre):</label>
                <textarea
                  value={novoDiarioNota}
                  onChange={(e) => setNovoDiarioNota(e.target.value)}
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'white',
                    resize: 'vertical',
                  }}
                />
              </div>
              <button type="submit" className="btn-primary">
                Salvar Registro
              </button>
            </form>
          </div>
        </div>

        <div style={{ width: '400px' }}>
          <div className="glass-card">
            <h3>Histórico do Diário</h3>
            {carregandoDiario ? (
              <p>Carregando...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                {listaDiarios.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>Nenhum registro ainda.</p>
                ) : null}
                {listaDiarios.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      padding: '15px',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                      borderLeft: d.alerta_crise ? '3px solid #ef4444' : '3px solid var(--accent)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85em', color: 'var(--text-secondary)' }}>{d.data}</span>
                      <strong>Humor: {d.humor}/5</strong>
                    </div>
                    <p style={{ margin: '5px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      Emoções: {d.emocoes}
                    </p>
                    {d.fator_desencadeante && (
                      <p style={{ margin: '5px 0', fontSize: '0.85rem' }}>Gatilho: {d.fator_desencadeante}</p>
                    )}
                    {d.nota && (
                      <p style={{ margin: '10px 0 0 0', fontStyle: 'italic', fontSize: '0.9rem' }}>"{d.nota}"</p>
                    )}
                    {d.alerta_crise && (
                      <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold' }}>
                        ⚠️ Alerta de Crise
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiarioEmocionalView;
