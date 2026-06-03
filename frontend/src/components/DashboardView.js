import React, { useMemo } from 'react';
import { LayoutDashboard, Brain, Activity, Target } from 'lucide-react';
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area } from 'recharts';

const DashboardView = ({ historico, setCurrentView }) => {
  const chartData = useMemo(() => {
    return [...historico].reverse().map((item) => ({
      data: item.data.split(' ')[0],
      sentimento: item.sentimento,
      valor: item.sentimento === 'Feliz' ? 3 : item.sentimento === 'Neutro' ? 2 : 1,
    }));
  }, [historico]);

  const stats = useMemo(() => {
    return {
      total: historico.length,
      hoje: historico.filter((i) => i.data.startsWith(new Date().toLocaleDateString('pt-BR'))).length,
      dominante:
        historico.length > 0
          ? Object.entries(
              historico.reduce((acc, curr) => {
                acc[curr.sentimento] = (acc[curr.sentimento] || 0) + 1;
                return acc;
              }, {}),
            ).sort((a, b) => b[1] - a[1])[0][0]
          : 'Nenhum',
    };
  }, [historico]);

  return (
    <div className="dashboard-view" style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '2.2rem',
              marginBottom: '0.5rem',
              background: 'linear-gradient(to right, #fff, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Seu Diário de Evolução
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Acompanhe sua jornada emocional e os insights da sua terapia.</p>
        </div>
        <button className="reset-btn" onClick={() => setCurrentView('app')}>
          Nova Sessão / Chat
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '1rem' }}>
        <div
          className="stat-card"
          style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(0,0,0,0.2) 100%)' }}
        >
          <Activity size={28} style={{ color: '#a78bfa', marginBottom: '1rem' }} />
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Registros Totais</span>
        </div>
        <div
          className="stat-card"
          style={{ background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(0,0,0,0.2) 100%)' }}
        >
          <Target size={28} style={{ color: '#ec4899', marginBottom: '1rem' }} />
          <span className="stat-value">{stats.hoje}</span>
          <span className="stat-label">Desabafos Hoje</span>
        </div>
        <div
          className="stat-card"
          style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(0,0,0,0.2) 100%)' }}
        >
          <Brain size={28} style={{ color: '#60a5fa', marginBottom: '1rem' }} />
          <span
            className="stat-value"
            style={{
              fontSize: '1.8rem',
              background: 'linear-gradient(to right, #60a5fa, #a855f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {stats.dominante}
          </span>
          <span className="stat-label">Humor Dominante</span>
        </div>
      </div>

      <div className="chart-container" style={{ position: 'relative' }}>
        <h3
          style={{
            marginBottom: '1.5rem',
            fontFamily: 'Outfit, sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Activity size={18} color="var(--accent)" /> Gráfico de Oscilação de Humor
        </h3>
        {historico.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '250px',
              color: 'var(--text-muted)',
            }}
          >
            Faça seu primeiro desabafo para ver seu gráfico!
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.05} vertical={false} />
              <XAxis dataKey="data" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis hide domain={[0, 4]} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '13px',
                  backdropFilter: 'blur(10px)',
                }}
                itemStyle={{ color: '#a78bfa' }}
              />
              <Area
                type="monotone"
                dataKey="valor"
                stroke="#a78bfa"
                fillOpacity={1}
                fill="url(#colorVal)"
                strokeWidth={3}
                activeDot={{ r: 6, fill: '#ec4899', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default DashboardView;
