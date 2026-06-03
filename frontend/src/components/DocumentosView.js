import React, { useState, useEffect } from 'react';
import { Download, Upload, FileText, Trash2, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DocumentosView({ usuario, pacienteSelecionado, API_BASE_URL }) {
  const [documentos, setDocumentos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [file, setFile] = useState(null);
  const [tipoDocumento, setTipoDocumento] = useState('Laudo');

  const fetchDocumentos = async () => {
    if (!pacienteSelecionado) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/documentos/paciente/${pacienteSelecionado.id}`);
      if (response.ok) {
        const data = await response.json();
        setDocumentos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar documentos', error);
    }
  };

  useEffect(() => {
    fetchDocumentos();
  }, [pacienteSelecionado]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !pacienteSelecionado) return;

    setCarregando(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('paciente_id', pacienteSelecionado.id);
    formData.append('psicologo_id', usuario.id);
    formData.append('tipo_documento', tipoDocumento);

    try {
      const response = await fetch(`${API_BASE_URL}/api/documentos`, {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        alert('Documento enviado com sucesso!');
        setFile(null);
        fetchDocumentos();
      } else {
        alert('Falha ao enviar documento.');
      }
    } catch (error) {
      console.error(error);
      alert('Erro de conexão.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 300px' }}>
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--glass-border)',
            padding: '2rem',
            borderRadius: '1.5rem',
          }}
        >
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={20} /> Novo Documento
          </h3>
          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label>Tipo de Documento</label>
              <select value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value)} required>
                <option value="Laudo">Laudo Psicológico</option>
                <option value="Atestado">Atestado</option>
                <option value="Receita">Receita/Encaminhamento</option>
                <option value="Contrato">Contrato Terapêutico</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <div className="form-group">
              <label>Arquivo</label>
              <input type="file" onChange={(e) => setFile(e.target.files[0])} required />
            </div>
            <button type="submit" className="auth-submit-btn" disabled={carregando || !file}>
              {carregando ? 'Enviando...' : 'Fazer Upload'}
            </button>
          </form>
        </div>
      </div>

      <div style={{ flex: '2 1 400px' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={20} /> Histórico de Arquivos
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {documentos.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Nenhum documento arquivado.</p>
          ) : (
            documentos.map((doc) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{doc.nome_arquivo}</h4>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <span
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        color: '#fff',
                      }}
                    >
                      {doc.tipo_documento}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      {new Date(doc.data_upload).toLocaleDateString('pt-BR')}
                    </span>
                  </p>
                </div>
                <div>
                  <a
                    href={`${API_BASE_URL}/api/documentos/${doc.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="nav-btn"
                    style={{
                      margin: 0,
                      padding: '8px 16px',
                      background: 'var(--accent)',
                      color: 'white',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      textDecoration: 'none',
                      borderRadius: '20px',
                    }}
                  >
                    <Download size={14} /> Baixar
                  </a>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
