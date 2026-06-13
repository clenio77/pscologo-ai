import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Appointment } from '../services/api';
import { sendWhatsAppReminder } from '../utils/whatsapp';
import { 
  Users, 
  Calendar as CalendarIcon, 
  Clock, 
  FileText, 
  PlusCircle, 
  Heart, 
  CheckCircle,
  MessageSquare
} from 'lucide-react';
import './Dashboard.css';

// Lista de citações inspiradoras para saúde mental
const quotes = [
  { text: "Conheça todas as teorias, domine todas as técnicas, mas ao tocar uma alma humana, seja apenas outra alma humana.", author: "Carl Jung" },
  { text: "O que é necessário para mudar uma pessoa é mudar sua consciência de si mesma.", author: "Abraham Maslow" },
  { text: "Não somos apenas o que pensamos ser. Somos mais: somos o que fazemos para mudar o que somos.", author: "Eduardo Galeano" },
  { text: "O autoconhecimento tem um caráter libertador.", author: "Nise da Silveira" },
  { text: "Ser o que somos e nos tornar o que somos capazes de nos tornar é o único fim da vida.", author: "Robert Louis Stevenson" },
];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    weekAppointments: 0,
    totalTemplates: 0
  });
  const [todayAppsList, setTodayAppsList] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Inicializa a citação de forma lazy baseada no dia do mês para evitar cascading renders
  const [quote] = useState(() => {
    const day = new Date().getDate();
    return quotes[day % quotes.length];
  });

  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    await Promise.resolve();
    setLoading(true);
    try {
      const [patientsList, appList, templatesList] = await Promise.all([
        api.getPatients(user.id),
        api.getAppointments(user.id),
        api.getFormTemplates(user.id)
      ]);

      const today = new Date().toDateString();
      
      // Cálculo de consultas da semana (próximos 7 dias)
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
      
      const todayApps = appList.filter(app => new Date(app.date_time).toDateString() === today);
      const weekApps = appList.filter(app => {
        const appDate = new Date(app.date_time);
        return appDate >= new Date() && appDate <= oneWeekFromNow;
      });

      setStats({
        totalPatients: patientsList.length,
        todayAppointments: todayApps.length,
        weekAppointments: weekApps.length,
        totalTemplates: templatesList.length
      });

      setTodayAppsList(todayApps);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDashboardData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadDashboardData]);

  const handleSendWhatsAppReminder = (app: Appointment) => {
    const success = sendWhatsAppReminder(app, user?.name);
    if (!success) {
      addToast('Este paciente não possui telefone cadastrado.', 'warning');
    }
  };

  return (
    <div className="dashboard-page">
      {/* 1. Card de Citação de Boas-Vindas */}
      <div className="welcome-quote-card card animate-slide-up">
        <div className="quote-icon-container">
          <Heart className="quote-heart-icon" size={28} />
        </div>
        <div className="quote-text-block">
          <p className="quote-text">"{quote.text}"</p>
          <span className="quote-author">— {quote.author}</span>
        </div>
      </div>

      {/* 2. Grid de Estatísticas */}
      <div className="stats-grid animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="stat-item card" onClick={() => navigate('/pacientes')}>
          <div className="stat-icon-wrapper pat-color">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-lbl">Pacientes Cadastrados</span>
            <h3>{stats.totalPatients}</h3>
          </div>
        </div>

        <div className="stat-item card" onClick={() => navigate('/agenda')}>
          <div className="stat-icon-wrapper app-today-color">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-lbl">Consultas de Hoje</span>
            <h3>{stats.todayAppointments}</h3>
          </div>
        </div>

        <div className="stat-item card" onClick={() => navigate('/agenda')}>
          <div className="stat-icon-wrapper app-week-color">
            <CalendarIcon size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-lbl">Consultas na Semana</span>
            <h3>{stats.weekAppointments}</h3>
          </div>
        </div>

        <div className="stat-item card" onClick={() => navigate('/formularios')}>
          <div className="stat-icon-wrapper temp-color">
            <FileText size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-lbl">Modelos de Formulários</span>
            <h3>{stats.totalTemplates}</h3>
          </div>
        </div>
      </div>

      {/* 3. Bloco Inferior: Consultas de Hoje e Ações Rápidas */}
      <div className="dashboard-content-split">
        {/* Lado Esquerdo: Próximos Atendimentos */}
        <div className="today-schedule-section card">
          <div className="section-header">
            <h3>Agenda de Hoje</h3>
            <span className="badge badge-info">{stats.todayAppointments} sessões</span>
          </div>

          {loading ? (
            <div className="loading-state">
              <span className="spinner"></span>
            </div>
          ) : todayAppsList.length === 0 ? (
            <div className="empty-dashboard-schedule">
              <CheckCircle size={36} style={{ color: 'var(--success)', opacity: 0.8 }} />
              <p>Nenhuma sessão agendada para hoje.</p>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/agenda')}>
                Ir para Agenda
              </button>
            </div>
          ) : (
            <div className="dashboard-apps-list">
              {todayAppsList.map((app) => {
                const appTimeStr = new Date(app.date_time).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                });
                return (
                  <div key={app.id} className={`dashboard-app-item status-border-${app.status}`}>
                    <div className="app-time-block">
                      <Clock size={14} />
                      <strong>{appTimeStr}</strong>
                    </div>
                    <div className="app-patient-block">
                      <span>{app.patient?.name}</span>
                    </div>
                    <div className="app-actions-block">
                      {app.patient?.phone && (
                        <button 
                          className="action-icon-btn whatsapp-color"
                          onClick={() => handleSendWhatsAppReminder(app)}
                          title="Enviar lembrete WhatsApp"
                        >
                          <MessageSquare size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Lado Direito: Ações Rápidas */}
        <div className="quick-actions-section card">
          <div className="section-header">
            <h3>Ações Rápidas</h3>
          </div>

          <div className="actions-button-grid">
            <button className="quick-action-btn" onClick={() => navigate('/pacientes')}>
              <PlusCircle className="act-icon" size={20} />
              <div className="act-text">
                <strong>Ver Pacientes</strong>
                <span>Registrar prontuário e evoluções</span>
              </div>
            </button>

            <button className="quick-action-btn" onClick={() => navigate('/agenda')}>
              <PlusCircle className="act-icon" size={20} />
              <div className="act-text">
                <strong>Marcar Consulta</strong>
                <span>Agendar novos horários</span>
              </div>
            </button>

            <button className="quick-action-btn" onClick={() => navigate('/formularios')}>
              <PlusCircle className="act-icon" size={20} />
              <div className="act-text">
                <strong>Criar Formulário</strong>
                <span>Modelar novas anamneses</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
