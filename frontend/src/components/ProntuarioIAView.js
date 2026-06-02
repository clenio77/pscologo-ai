import React, { useState, useEffect } from 'react';
import { ClipboardList, Sparkles, Trash2, Calendar } from 'lucide-react';

const ProntuarioIAView = ({ usuario, API_BASE_URL, pacienteSelecionado }) => {
  const [prontuarioConteudo, setProntuarioConteudo] = useState('');
  const [prontuarioData, setProntuarioData] = useState('');
  const [gerandoProntuario, setGerandoProntuario] = useState(false);
  
  const [listaNotas, setListaNotas] = useState([]);
  const [novaNotaConteudo, setNovaNotaConteudo] = useState('');
  const [carregandoNotas, setCarregandoNotas] = useState(false);
  
  const [abordagemSelecionada, setAbordagemSelecionada] = useState('padrao');
  const [resumoPreSessao, setResumoPreSessao] = useState('');
  const [gerandoResumo, setGerandoResumo] = useState(false);

  useEffect(() => {
    if (pacienteSelecionado && usuario) {
      fetchProntuarioIA();
      fetchNotas();
    } else {
      setProntuarioConteudo('');
      setProntuarioData('');
      setListaNotas([]);
      setResumoPreSessao('');
    }
  }, [pacienteSelecionado, usuario]);

  const fetchProntuarioIA = async () => {
    if (!usuario || usuario.tipo !== 'psicologo' || !pacienteSelecionado) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/paciente/${pacienteSelecionado.id}/prontuario-ia`, {
        headers: { 'Authorization': `Bearer ${usuario.token}` }
      });
      if (resp.status === 401) return;
      const data = await resp.json();
      setProntuarioConteudo(data.conteudo || '');
      setProntuarioData(data.data_atualizacao || '');
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNotas = async () => {
    if (!usuario || usuario.tipo !== 'psicologo' || !pacienteSelecionado) return;
    setCarregandoNotas(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/paciente/${pacienteSelecionado.id}/notas`, {
        headers: { 'Authorization': `Bearer ${usuario.token}` }
      });
      if (resp.status === 401) return;
      if (resp.ok) {
        const data = await resp.json();
        setListaNotas(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCarregandoNotas(false);
    }
  };

  const handleAdicionarNota = async (e) => {
    e.preventDefault();
    if (!novaNotaConteudo || !usuario || !pacienteSelecionado) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/paciente/${pacienteSelecionado.id}/notas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usuario.token}`
        },
        body: JSON.stringify({ conteudo: novaNotaConteudo })
      });
      const data = await resp.json();
      if (resp.ok) {
        setListaNotas([data.nota, ...listaNotas]);
        setNovaNotaConteudo('');
      } else {
        alert(data.erro);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com o servidor.");
    }
  };

  const handleRemoverNota = async (notaId) => {
    if (!window.confirm("Tem certeza que deseja excluir esta nota?")) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/notas/${notaId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${usuario.token}` }
      });
      if (resp.ok) {
        setListaNotas(listaNotas.filter(n => n.id !== notaId));
      } else {
        const data = await resp.json();
        alert(data.erro || "Erro ao excluir nota");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com o servidor.");
    }
  };

  const gerarResumoPreSessao = async () => {
    if (!usuario || !pacienteSelecionado) return;
    setGerandoResumo(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/paciente/${pacienteSelecionado.id}/resumo-diarios`, {
        headers: { 'Authorization': `Bearer ${usuario.token}` }
      });
      const data = await resp.json();
      if (resp.ok) {
        setResumoPreSessao(data.resumo);
      } else {
        alert(data.erro || 'Erro ao gerar resumo');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGerandoResumo(false);
    }
  };

  const handleGerarProntuarioIA = async () => {
    if (!pacienteSelecionado) return;
    setGerandoProntuario(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/paciente/${pacienteSelecionado.id}/prontuario-ia/gerar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usuario.token}`
        },
        body: JSON.stringify({ abordagem: abordagemSelecionada })
      });
      if (resp.status === 401) return;
      const data = await resp.json();
      if (resp.ok) {
        setProntuarioConteudo(data.conteudo);
        setProntuarioData(data.data_atualizacao);
        alert("Prontuário consolidado com IA atualizado!");
      } else {
        alert(data.erro || "Erro ao gerar prontuário");
      }
    } catch (err) {
      console.error(err);
      alert("Erro na conexão com a IA.");
    } finally {
      setGerandoProntuario(false);
    }
  };

  const handleExportarPDF = () => {
    if (!pacienteSelecionado || !prontuarioConteudo) {
      alert("Gere o prontuário consolidado com IA antes de exportar.");
      return;
    }

    const printWindow = window.open('', '_blank');
    let notasHTML = "";
    if (listaNotas.length === 0) {
      notasHTML = "<p>Nenhuma anotação de sessão presencial registrada.</p>";
    } else {
      listaNotas.forEach(n => {
        notasHTML += `
          <div class="nota-item">
            <div class="nota-date">${n.data}</div>
            <p>${n.conteudo.replace(/\n/g, '<br>')}</p>
          </div>
        `;
      });
    }

    let prontuarioHTML = prontuarioConteudo
      .replace(/### (.*)/g, '<h3>$1</h3>')
      .replace(/## (.*)/g, '<h2>$1</h2>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.*)/gm, '<li>$1</li>')
      .replace(/\n/g, '<br>');

    const title = `Prontuario_Clinico_${pacienteSelecionado.nome.replace(/\s+/g, '_')}`;
    const dataEmissao = `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 2rem; line-height: 1.6; font-size: 11pt; }
            .header-doc { text-align: center; border-bottom: 2px solid #8b5cf6; padding-bottom: 1.5rem; margin-bottom: 2rem; }
            .header-doc h1 { margin: 0; font-size: 20pt; color: #0f172a; }
            .header-doc p { margin: 0.5rem 0 0 0; color: #64748b; font-size: 10pt; }
            .section { margin-bottom: 2rem; }
            .section-title { font-size: 14pt; color: #8b5cf6; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; margin-bottom: 1rem; }
            .nota-item { background: #f8fafc; border: 1px solid #e2e8f0; padding: 1rem; margin-bottom: 1rem; border-radius: 8px; page-break-inside: avoid; }
            .nota-date { font-size: 9pt; color: #64748b; font-weight: 600; margin-bottom: 0.5rem; }
            .nota-item p { margin: 0; font-size: 10.5pt; }
            .prontuario-ai { background: #f0f9ff; border: 1px solid #bae6fd; padding: 1.5rem; border-radius: 8px; }
            .footer { margin-top: 3rem; text-align: center; font-size: 9pt; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 1rem; }
            .assinatura { margin-top: 4rem; text-align: center; width: 300px; margin-left: auto; margin-right: auto; }
            .assinatura-linha { border-top: 1px solid #000; margin-bottom: 0.5rem; }
          </style>
        </head>
        <body>
          <div class="header-doc">
            <h1>Prontuário Clínico</h1>
            <p>Documento gerado eletronicamente em ${dataEmissao}</p>
          </div>
          
          <div class="section">
            <h2 class="section-title">Identificação</h2>
            <p><strong>Paciente:</strong> ${pacienteSelecionado.nome}</p>
            <p><strong>Profissional:</strong> Dr(a). ${usuario.nome}</p>
          </div>

          <div class="section">
            <h2 class="section-title">Evolução Consolidada (Análise IA - Abordagem: ${abordagemSelecionada})</h2>
            <div class="prontuario-ai">
              ${prontuarioHTML}
            </div>
            <p style="font-size: 8pt; color: #64748b; text-align: right; margin-top: 0.5rem;">Última atualização da IA: ${prontuarioData}</p>
          </div>

          <div class="section" style="page-break-before: always;">
            <h2 class="section-title">Relatos Presenciais Brutos (Histórico)</h2>
            ${notasHTML}
          </div>

          <div class="assinatura">
            <div class="assinatura-linha"></div>
            <strong>Dr(a). ${usuario.nome}</strong><br/>
            Psicólogo(a) Clínico(a)<br/>
            CRP: _______/___
          </div>

          <div class="footer">
            Documento confidencial. O sigilo das informações aqui contidas é protegido pelo Código de Ética Profissional do Psicólogo (Resolução CFP nº 10/2005).
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const formatarProntuarioIA = (texto) => {
    if (!texto) return null;
    const linhas = texto.split('\n');
    return (
      <div className="clinical-report-markdown" style={{ lineHeight: '1.7', color: '#e2e8f0', maxHeight: '550px', overflowY: 'auto', paddingRight: '10px' }}>
        {linhas.map((linha, idx) => {
          const l = linha.trim();
          if (l.startsWith('###')) {
            return <h3 key={idx} style={{ color: 'var(--accent)', fontFamily: 'Outfit, sans-serif', fontSize: '1.25rem', marginTop: '1.5rem', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px', display: 'flex', alignItems: 'center' }}>{l.replace('###', '').trim()}</h3>;
          }
          if (l.startsWith('##')) {
            return <h2 key={idx} style={{ color: 'white', fontFamily: 'Outfit, sans-serif', fontSize: '1.4rem', marginTop: '2rem', marginBottom: '1rem' }}>{l.replace('##', '').trim()}</h2>;
          }
          if (l.startsWith('-') || l.startsWith('*')) {
            return <li key={idx} style={{ marginLeft: '1.5rem', marginBottom: '0.4rem', listStyleType: 'disc' }}>{l.replace(/^[-*]\s*/, '')}</li>;
          }
          if (l === '') {
            return <div key={idx} style={{ height: '0.4rem' }} />;
          }
          
          const partes = l.split('**');
          if (partes.length > 1) {
            return (
              <p key={idx} style={{ marginBottom: '0.75rem' }}>
                {partes.map((p, i) => i % 2 === 1 ? <strong key={i} style={{ color: 'white' }}>{p}</strong> : p)}
              </p>
            );
          }
          
          return <p key={idx} style={{ marginBottom: '0.75rem' }}>{l}</p>;
        })}
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', alignItems: 'stretch' }} className="prontuario-grid">
      
      {/* Painel Esquerdo: Anotações Clínicas / Relatos Presenciais */}
      <div style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--glass-border)', padding: '2rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ margin: '0 0 1.5rem 0', fontFamily: 'Outfit, sans-serif', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          <ClipboardList size={20} style={{ color: 'var(--accent)' }} /> Relatos e Notas da Sessão
        </h3>

        {/* Form para adicionar nova nota clínica */}
        <form onSubmit={handleAdicionarNota} style={{ marginBottom: '2rem' }}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Escrever nova anotação clínica da sessão presencial:</label>
            <textarea
              value={novaNotaConteudo}
              onChange={(e) => setNovaNotaConteudo(e.target.value)}
              placeholder="Ex: Paciente relatou melhora significativa na ansiedade social esta semana..."
              rows={4}
              required
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid var(--glass-border)',
                borderRadius: '0.8rem',
                padding: '1rem',
                color: 'white',
                resize: 'vertical',
                fontFamily: 'inherit',
                fontSize: '0.9rem',
                lineHeight: '1.5'
              }}
            />
          </div>
          <button
            type="submit"
            className="action-btn-success"
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: 'white', borderColor: 'var(--primary)', cursor: 'pointer' }}
          >
            <ClipboardList size={16} /> Salvar Relato Clínico
          </button>
        </form>

        {/* Lista de notas passadas */}
        <h4 style={{ fontSize: '1rem', color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          Histórico de Anotações <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({listaNotas.length})</span>
        </h4>
        
        <div style={{ flex: 1, overflowY: 'auto', maxHeight: '350px', paddingRight: '5px' }}>
          {carregandoNotas ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>Carregando notas...</p>
          ) : listaNotas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'rgba(255,255,255,0.01)', borderRadius: '1rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Nenhum relato presencial anotado para este paciente.</p>
            </div>
          ) : (
            listaNotas.map((nota) => (
              <div key={nota.id} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '0.8rem', padding: '1rem', marginBottom: '0.75rem', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 'bold' }}>{nota.data}</span>
                  <button
                    onClick={() => handleRemoverNota(nota.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                    title="Excluir relato"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{nota.conteudo}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Painel Direito: Consolidação do Prontuário IA */}
      <div style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--glass-border)', padding: '2rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} style={{ color: 'var(--accent)' }} /> Prontuário IA Híbrido
            </h3>
            {prontuarioData && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Última consolidação: {prontuarioData}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {prontuarioConteudo && (
              <button
                className="action-btn"
                onClick={handleExportarPDF}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', padding: '0.5rem 1rem', fontSize: '0.9rem', borderRadius: '0.5rem' }}
              >
                Exportar PDF (CFP) 🖨️
              </button>
            )}
            <button
              className="action-btn-success"
              onClick={handleGerarProntuarioIA}
              disabled={gerandoProntuario}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)', cursor: 'pointer', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
            >
              {gerandoProntuario ? 'Processando IA...' : prontuarioConteudo ? 'Atualizar Prontuário' : 'Gerar Prontuário'}
            </button>
          </div>
        </div>

        {/* Resumo Pré-Sessão IA */}
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '1rem', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}><Sparkles size={16} color="#8b5cf6" /> Resumo Pré-Sessão IA (Baseado no Diário)</h4>
            <button onClick={gerarResumoPreSessao} disabled={gerandoResumo} style={{ padding: '6px 12px', background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '1px solid #8b5cf6', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
              {gerandoResumo ? 'Analisando...' : 'Gerar Resumo'}
            </button>
          </div>
          {resumoPreSessao && (
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', fontStyle: 'italic', lineHeight: '1.5', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
              {resumoPreSessao}
            </p>
          )}
        </div>

        {/* Seletor de Lente Clínica/Abordagem */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '0.8rem',
          padding: '0.75rem 1rem',
          marginBottom: '1.5rem',
          gap: '12px'
        }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Método de Análise (CFP):</span>
          <select
            value={abordagemSelecionada}
            onChange={(e) => setAbordagemSelecionada(e.target.value)}
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--glass-border)',
              borderRadius: '0.5rem',
              padding: '6px 12px',
              color: 'white',
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            <option value="padrao">Padrão CFP (Res. 01/2009)</option>
            <option value="tcc">Análise Funcional (TCC)</option>
            <option value="psicanalise">Análise Psicodinâmica</option>
            <option value="humanista">Existencial/Humanista</option>
            <option value="psicopatologia">Estado Mental/Psicopatológico</option>
          </select>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: gerandoProntuario || !prontuarioConteudo ? 'center' : 'flex-start' }}>
          {gerandoProntuario ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="spinner" style={{ border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid var(--accent)', borderRadius: '50%', width: '32px', height: '32px', margin: '0 auto 1rem auto', animation: 'spin 1s linear infinite' }} />
              <span className="loading-dots" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Consolidando anotações do terapeuta e desabafos do paciente com Gemini</span>
            </div>
          ) : prontuarioConteudo ? (
            formatarProntuarioIA(prontuarioConteudo)
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <Sparkles size={40} style={{ color: 'var(--accent)', opacity: 0.3, marginBottom: '1rem', display: 'block', margin: '0 auto' }} />
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'white' }}>Nenhum prontuário gerado</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto 1.5rem auto', lineHeight: '1.5' }}>
                Este prontuário inteligente funde as <strong>anotações clínicas presenciais</strong> que você salva à esquerda com os <strong>diários de áudio gravados</strong> pelo próprio paciente no aplicativo, traçando padrões evolutivos com o Gemini.
              </p>
              <button className="auth-submit-btn" style={{ maxWidth: '220px', margin: '0 auto' }} onClick={handleGerarProntuarioIA}>
                Gerar Prontuário com IA 🪄
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default ProntuarioIAView;
