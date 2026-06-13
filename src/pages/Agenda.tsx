import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import type { Appointment, Patient } from '../services/api';
import { sendWhatsAppReminder } from '../utils/whatsapp';
import { AppointmentModal } from '../components/calendar/AppointmentModal';
import { AppointmentDetailModal } from '../components/calendar/AppointmentDetailModal';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  User, 
  MessageSquare
} from 'lucide-react';
import './Agenda.css';

export const Agenda: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Data de referência do calendário
  const [currentDate, setCurrentDate] = useState(new Date());
  // Dia atualmente selecionado para exibição lateral
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Modais
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    await Promise.resolve();
    setLoading(true);
    try {
      const [appData, patientData] = await Promise.all([
        api.getAppointments(user.id),
        api.getPatients(user.id)
      ]);
      setAppointments(appData);
      setPatients(patientData);
    } catch (err) {
      console.error('Erro ao carregar dados da agenda:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);


  // Funções de navegação do calendário
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Lógica para montar os dias do mês
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Primeiro dia do mês
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Quantidade de dias no mês
    const totalDays = new Date(year, month + 1, 0).getDate();
    // Quantidade de dias no mês anterior
    const prevTotalDays = new Date(year, month, 0).getDate();

    const days = [];

    // Preencher dias do mês anterior para alinhar a grade (cinza)
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevTotalDays - i),
        isCurrentMonth: false,
      });
    }

    // Preencher dias do mês atual
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Preencher dias do mês seguinte para completar o grid (geralmente 42 células)
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  // Filtra consultas de uma data específica
  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((app) => {
      const appDateObj = new Date(app.date_time);
      return (
        appDateObj.getFullYear() === date.getFullYear() &&
        appDateObj.getMonth() === date.getMonth() &&
        appDateObj.getDate() === date.getDate()
      );
    });
  };

  const handleCreateAppointment = async (data: {
    patientId: string;
    date: string;
    time: string;
    duration: number;
    notes: string;
  }) => {
    if (!user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const dateTimeString = `${data.date}T${data.time}:00`;
      const newStart = new Date(dateTimeString);
      const newEnd = new Date(newStart.getTime() + data.duration * 60000);

      // Verifica colisão de horários
      const hasOverlap = appointments.some(app => {
        // Ignora os agendamentos que foram cancelados
        if (app.status === 'canceled') return false;

        const appStart = new Date(app.date_time);
        const appEnd = new Date(appStart.getTime() + (app.duration_minutes || 50) * 60000);

        if (newStart.getTime() === appStart.getTime()) return true;

        return newStart < appEnd && newEnd > appStart;
      });

      if (hasOverlap) {
        addToast('Conflito de horário! Você já possui uma consulta agendada que sobrepõe este período.', 'error');
        setIsSubmitting(false);
        return;
      }

      await api.createAppointment({
        professional_id: user.id,
        patient_id: data.patientId,
        date_time: newStart.toISOString(),
        duration_minutes: data.duration,
        status: 'scheduled',
        notes: data.notes || undefined,
      });
      setIsAppointmentModalOpen(false);
      addToast('Consulta agendada com sucesso!', 'success');
      loadData();
    } catch (err) {
      console.error('Erro ao agendar consulta:', err);
      addToast('Erro ao agendar consulta. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (appointmentId: string, status: Appointment['status']) => {
    try {
      await api.updateAppointmentStatus(appointmentId, status);
      setIsDetailModalOpen(false);
      addToast('Status da consulta atualizado!', 'success');
      loadData();
    } catch (err) {
      console.error('Erro ao atualizar status da consulta:', err);
      addToast('Erro ao atualizar status da consulta.', 'error');
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este agendamento?')) return;
    try {
      await api.deleteAppointment(appointmentId);
      setIsDetailModalOpen(false);
      addToast('Agendamento excluído!', 'success');
      loadData();
    } catch (err) {
      console.error('Erro ao deletar consulta:', err);
      addToast('Erro ao excluir agendamento.', 'error');
    }
  };

  // Abre modal com detalhes da consulta
  const handleOpenDetail = (app: Appointment) => {
    setSelectedAppointment(app);
    setIsDetailModalOpen(true);
  };

  // Função para abrir o WhatsApp Web para enviar o lembrete
  const handleSendWhatsAppReminder = (app: Appointment) => {
    const success = sendWhatsAppReminder(app, user?.name);
    if (!success) {
      addToast('Este paciente não possui telefone cadastrado.', 'warning');
    }
  };

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
        return <span className="badge badge-info">Agendado</span>;
      case 'completed':
        return <span className="badge badge-success">Realizado</span>;
      case 'canceled':
        return <span className="badge badge-error">Cancelado</span>;
      case 'no_show':
        return <span className="badge badge-warning">Falta</span>;
      default:
        return null;
    }
  };

  const days = getDaysInMonth();
  const selectedDateAppointments = getAppointmentsForDate(selectedDate);

  return (
    <div className="agenda-page">
      <div className="agenda-grid">
        {/* Coluna Principal: O Calendário */}
        <div className="calendar-main card">
          <div className="calendar-header">
            <div className="calendar-title-nav">
              <h2 className="calendar-month-year">
                {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="nav-buttons">
                <button onClick={prevMonth} className="btn-icon"><ChevronLeft size={20} /></button>
                <button onClick={nextMonth} className="btn-icon"><ChevronRight size={20} /></button>
              </div>
            </div>

            <button className="btn btn-primary" onClick={() => setIsAppointmentModalOpen(true)}>
              <Plus size={18} />
              <span>Agendar Sessão</span>
            </button>
          </div>

          <div className="calendar-grid-header">
            <span>Dom</span>
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
          </div>

          <div className="calendar-grid-body">
            {days.map((dayItem, index) => {
              const isToday = new Date().toDateString() === dayItem.date.toDateString();
              const isSelected = selectedDate.toDateString() === dayItem.date.toDateString();
              const dayApps = getAppointmentsForDate(dayItem.date);

              return (
                <div 
                  key={index} 
                  className={`calendar-cell ${dayItem.isCurrentMonth ? '' : 'outside-month'} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => setSelectedDate(dayItem.date)}
                >
                  <span className="day-number">{dayItem.date.getDate()}</span>
                  
                  <div className="cell-appointments">
                    {dayApps.slice(0, 3).map((app) => (
                      <div 
                        key={app.id} 
                        className={`cell-app-bullet app-${app.status}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(app);
                        }}
                        title={`${app.patient?.name} - ${new Date(app.date_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                      >
                        {new Date(app.date_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} {app.patient?.name.split(' ')[0]}
                      </div>
                    ))}
                    {dayApps.length > 3 && (
                      <span className="more-apps-indicator">+{dayApps.length - 3} mais</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coluna Lateral: Consultas do Dia Selecionado */}
        <div className="agenda-day-details card">
          <div className="day-header">
            <h3>Consultas do Dia</h3>
            <span className="selected-day-lbl">
              {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
          </div>

          {loading ? (
            <div className="loading-state">
              <span className="spinner"></span>
            </div>
          ) : selectedDateAppointments.length === 0 ? (
            <div className="empty-day-state">
              <CalendarIcon size={32} className="empty-day-icon" />
              <p>Nenhuma consulta agendada para este dia.</p>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsAppointmentModalOpen(true)}>
                Agendar para hoje
              </button>
            </div>
          ) : (
            <div className="day-appointments-list">
              {selectedDateAppointments.map((app) => {
                const appTimeStr = new Date(app.date_time).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                });
                return (
                  <div 
                    key={app.id} 
                    className={`day-app-card status-border-${app.status}`}
                    onClick={() => handleOpenDetail(app)}
                  >
                    <div className="day-app-time">
                      <Clock size={14} />
                      <span>{appTimeStr} ({app.duration_minutes} min)</span>
                    </div>
                    <div className="day-app-patient">
                      <User size={16} className="patient-avatar-icon" />
                      <h4>{app.patient?.name || 'Paciente'}</h4>
                    </div>
                    <div className="day-app-footer">
                      {getStatusBadge(app.status)}
                      <div className="day-app-actions">
                        <button 
                          className="action-icon-btn whatsapp-color"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendWhatsAppReminder(app);
                          }}
                          title="Enviar lembrete pelo WhatsApp"
                        >
                          <MessageSquare size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: MARCAR CONSULTA */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        patients={patients}
        isSubmitting={isSubmitting}
        initialDate={selectedDate.toISOString().split('T')[0]}
        onSubmit={handleCreateAppointment}
      />

      {/* MODAL: DETALHES E AÇÕES DA CONSULTA */}
      <AppointmentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        appointment={selectedAppointment}
        onUpdateStatus={handleUpdateStatus}
        onSendWhatsApp={handleSendWhatsAppReminder}
        onDelete={handleDeleteAppointment}
        getStatusBadge={getStatusBadge}
      />


    </div>
  );
};
