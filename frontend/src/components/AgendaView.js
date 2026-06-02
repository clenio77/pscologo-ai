import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

const AgendaView = ({ usuario, API_BASE_URL, pacienteSelecionado, listaPacientes }) => {
  const [listaConsultas, setListaConsultas] = useState([]);
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
  const [horarioSelecionado, setHorarioSelecionado] = useState('');
  const [obsConsulta, setObsConsulta] = useState('');
  const [pacienteConsultaId, setPacienteConsultaId] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (usuario) {
      fetchConsultas();
    }
  }, [usuario, pacienteSelecionado]);

  useEffect(() => {
    if (dataSelecionada) {
      fetchHorariosDisponiveis(dataSelecionada);
    } else {
      setHorariosDisponiveis([]);
      setHorarioSelecionado('');
    }
  }, [dataSelecionada]);

  const fetchConsultas = async () => {
    if (!usuario) return;
    try {
      let url = `${API_BASE_URL}/consultas`;
      if (usuario.tipo === 'psicologo' && pacienteSelecionado) {
        url += `?paciente_id=${pacienteSelecionado.id}`;
      }

      const resp = await fetch(url, {
        headers: { 'Authorization': `Bearer ${usuario.token}` }
      });
      if (resp.status === 401) return;
      const data = await resp.json();
      setListaConsultas(data);
    } catch (err) {
      console.error("Erro ao carregar consultas:", err);
    }
  };

  const fetchHorariosDisponiveis = async (dataStr) => {
    if (!usuario || !dataStr) return;
    const psicologoId = usuario.tipo === 'paciente' ? usuario.psicologo_id : usuario.id;

    try {
      const resp = await fetch(`${API_BASE_URL}/horarios-disponiveis?psicologo_id=${psicologoId}&data=${dataStr}`, {
        headers: { 'Authorization': `Bearer ${usuario.token}` }
      });
      if (resp.status === 401) return;
      const data = await resp.json();
      setHorariosDisponiveis(data);
      setHorarioSelecionado('');
    } catch (err) {
      console.error("Erro ao buscar horários livres:", err);
    }
  };

  const handleAgendarConsulta = async (e) => {
    e.preventDefault();
    if (!dataSelecionada || !horarioSelecionado) return;
    
    const isPsicologo = usuario.tipo === 'psicologo';
    const targetPacienteId = pacienteSelecionado ? pacienteSelecionado.id : (isPsicologo ? pacienteConsultaId : null);
    
    if (isPsicologo && !targetPacienteId) {
      alert("Por favor, selecione o paciente.");
      return;
    }

    setCarregando(true);
    try {
      const payload = {
        data_hora: `${dataSelecionada} ${horarioSelecionado}`,
        observacoes: obsConsulta
      };
      
      if (isPsicologo) {
        payload.paciente_id = targetPacienteId;
      }

      const resp = await fetch(`${API_BASE_URL}/consultas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usuario.token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await resp.json();
      if (resp.ok) {
        alert("Consulta agendada com sucesso!");
        setDataSelecionada('');
        setHorarioSelecionado('');
        setObsConsulta('');
        setPacienteConsultaId('');
        fetchConsultas();
      } else {
        alert(data.erro || "Erro ao agendar consulta");
      }
    } catch (err) {
      console.error("Erro ao agendar:", err);
    } finally {
      setCarregando(false);
    }
  };

  const handleAlterarStatusConsulta = async (id, status) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/consultas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usuario.token}`
        },
        body: JSON.stringify({ status })
      });
      if (resp.ok) {
        fetchConsultas();
      } else {
        const data = await resp.json();
        alert(data.erro || "Erro ao atualizar consulta");
      }
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    }
  };

  const handleCancelarConsulta = async (id) => {
    if (!window.confirm("Deseja realmente cancelar esta consulta?")) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/consultas/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${usuario.token}` }
      });
      if (resp.ok) {
        fetchConsultas();
      }
    } catch (err) {
      console.error("Erro ao cancelar:", err);
    }
  };

  const dataMinima = new Date().toISOString().split('T')[0];

  return (
    <div className="agenda-layout">
      {(usuario.tipo === 'paciente' || (usuario.tipo === 'psicologo' && !pacienteSelecionado)) && (
        <div className="agenda-form-side">
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} style={{ color: 'var(--accent)' }} /> Agendar Consulta
          </h3>
          <form onSubmit={handleAgendarConsulta} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {usuario.tipo === 'psicologo' && !pacienteSelecionado && (
              <div className="form-group">
                <label>Selecione o Paciente</label>
                <select
                  value={pacienteConsultaId}
                  onChange={(e) => setPacienteConsultaId(e.target.value)}
                  required
                >
                  <option value="">-- Escolha o Paciente --</option>
                  {listaPacientes.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Selecione a Data</label>
              <input
                type="date"
                min={dataMinima}
                value={dataSelecionada}
                onChange={(e) => setDataSelecionada(e.target.value)}
                required
              />
            </div>

            {dataSelecionada && (
              <div className="form-group">
                <label>Selecione o Horário</label>
                {horariosDisponiveis.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Nenhum horário livre para esta data.
                  </p>
                ) : (
                  <div className="time-grid">
                    {horariosDisponiveis.map((hora) => (
                      <div
                        key={hora}
                        className={`time-chip ${horarioSelecionado === hora ? 'active' : ''}`}
                        onClick={() => setHorarioSelecionado(hora)}
                      >
                        {hora}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label>Observações Clínicas (Opcional)</label>
              <input
                type="text"
                placeholder="Ex: Gostaria de falar sobre..."
                value={obsConsulta}
                onChange={(e) => setObsConsulta(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={carregando || !dataSelecionada || !horarioSelecionado}
              style={{ marginTop: '0.5rem' }}
            >
              {carregando ? 'Agendando...' : 'Confirmar Consulta'}
            </button>
          </form>
        </div>
      )}

      <div className="agenda-list-side" style={{ flex: usuario.tipo === 'psicologo' ? 1 : 1.2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4rem', margin: 0 }}>
            {usuario.tipo === 'paciente' ? 'Suas Consultas' : (pacienteSelecionado ? 'Agenda do Paciente' : 'Agenda Geral')}
          </h3>
          {usuario.tipo === 'psicologo' && !pacienteSelecionado && (
            <button 
              className="nav-btn" 
              style={{ margin: 0, padding: '8px 16px', background: 'var(--accent)', color: 'white', borderRadius: '20px' }}
              onClick={async () => {
                try {
                  const res = await fetch(`${API_BASE_URL}/api/lembretes/enviar`, { method: 'POST' });
                  const data = await res.json();
                  alert(`Lembretes enviados: ${data.quantidade_enviada}`);
                } catch(e) {
                  alert('Erro ao enviar lembretes.');
                }
              }}
            >
              Disparar Lembretes
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '550px', overflowY: 'auto' }}>
          {listaConsultas.map((c) => (
            <div key={c.id} className="appointment-card">
              <div className="appointment-info">
                <span className="appointment-date">{c.data_hora}</span>
                <span className="appointment-meta">
                  {usuario.tipo === 'paciente' ? `Psicólogo: Dr(a). ${c.psicologo_nome}` : `Paciente: ${c.paciente_nome}`}
                </span>
                {c.observacoes && (
                  <span className="appointment-meta" style={{ fontStyle: 'italic', marginTop: '4px' }}>
                    Obs: "{c.observacoes}"
                  </span>
                )}
              </div>

              <div className="actions-container">
                <span className={`status-badge ${c.status}`}>
                  {c.status === 'agendada' ? 'Agendada' : c.status === 'concluida' ? 'Concluída' : 'Cancelada'}
                </span>

                {c.status === 'agendada' && (
                  <>
                    {usuario.tipo === 'psicologo' && (
                      <button
                        className="action-btn-success"
                        onClick={() => handleAlterarStatusConsulta(c.id, 'concluida')}
                      >
                        Concluir
                      </button>
                    )}
                    <button
                      className="logout-btn"
                      style={{ padding: '6px 12px', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                      onClick={() => {
                        if (usuario.tipo === 'psicologo') {
                          handleAlterarStatusConsulta(c.id, 'cancelada');
                        } else {
                          handleCancelarConsulta(c.id);
                        }
                      }}
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {listaConsultas.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1.2rem', border: '1px solid var(--glass-border)' }}>
              <Calendar size={32} style={{ color: 'var(--accent)', opacity: 0.4, marginBottom: '0.75rem' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhuma consulta agendada.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgendaView;
