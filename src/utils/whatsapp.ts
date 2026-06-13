import type { Appointment } from '../services/api';

/**
 * Envia um lembrete de consulta via WhatsApp Web.
 * @param app Objeto da consulta contendo os dados do paciente.
 * @param userName Nome do psicólogo/profissional (opcional).
 * @returns boolean Retorna true se o lembrete foi processado, ou false se o paciente não possui telefone.
 */
export const sendWhatsAppReminder = (app: Appointment, userName?: string): boolean => {
  if (!app.patient) return false;
  const phoneDigits = app.patient.phone?.replace(/\D/g, '') || '';
  if (!phoneDigits) {
    return false;
  }

  const appDateObj = new Date(app.date_time);
  const dateFormatted = appDateObj.toLocaleDateString('pt-BR');
  const timeFormatted = appDateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Verifica se a consulta é hoje para otimizar o texto do lembrete
  const isToday = new Date().toDateString() === appDateObj.toDateString();
  
  const doctorPart = userName ? ` com ${userName}` : '';
  const message = isToday
    ? `Olá, ${app.patient.name}! Passando para confirmar nossa consulta de hoje às ${timeFormatted}. Até logo!`
    : `Olá, ${app.patient.name}! Confirmamos a sua consulta${doctorPart} no dia ${dateFormatted} às ${timeFormatted}. Se precisar remarcar, por favor nos avise. Até breve!`;

  window.open(`https://web.whatsapp.com/send?phone=55${phoneDigits}&text=${encodeURIComponent(message)}`, '_blank');
  return true;
};
