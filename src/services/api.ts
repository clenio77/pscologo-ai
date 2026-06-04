import { supabase } from './supabaseClient';

// Interfaces de Tipo
export interface Patient {
  id: string;
  professional_id: string;
  name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  notes?: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  professional_id: string;
  patient_id: string;
  date_time: string;
  duration_minutes: number;
  status: 'scheduled' | 'completed' | 'canceled' | 'no_show';
  notes?: string;
  created_at: string;
  // Campo expandido
  patient?: { name: string; email?: string; phone?: string };
}

export interface Evolution {
  id: string;
  professional_id: string;
  patient_id: string;
  content: string;
  session_date: string;
  created_at: string;
}

export interface FormTemplate {
  id: string;
  professional_id: string;
  title: string;
  description?: string;
  fields: Array<{
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'checkbox';
    required: boolean;
    options?: string[]; // Para selects
  }>;
  created_at: string;
}

export interface PatientForm {
  id: string;
  professional_id: string;
  patient_id: string;
  template_id: string;
  answers: Record<string, unknown>;
  respondent_name?: string;
  respondent_relationship?: string;
  filled_at: string;
  created_at: string;
  template?: { title: string };
}

export interface PatientAnalysis {
  id: string;
  patient_id: string;
  professional_id: string;
  freud_analysis?: string;
  tcc_analysis?: string;
  rogers_analysis?: string;
  synthesis?: string;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------
// API SERVIÇOS
// ----------------------------------------------------

export const api = {
  // PACIENTES
  async getPatients(professionalId: string): Promise<Patient[]> {

    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('professional_id', professionalId)
      .order('name');
    
    if (error) throw new Error(error.message);
    return data || [];
  },

  async createPatient(patient: Omit<Patient, 'id' | 'created_at'>): Promise<Patient> {

    const { data, error } = await supabase
      .from('patients')
      .insert(patient)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updatePatient(id: string, patient: Partial<Omit<Patient, 'id' | 'created_at' | 'professional_id'>>): Promise<Patient> {

    const { data, error } = await supabase
      .from('patients')
      .update(patient)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // CONSULTAS / APPOINTMENTS
  async getAppointments(professionalId: string): Promise<Appointment[]> {

    const { data, error } = await supabase
      .from('appointments')
      .select('*, patient:patients(name, email, phone)')
      .eq('professional_id', professionalId)
      .order('date_time', { ascending: true });

    if (error) throw new Error(error.message);
    return (data as unknown as Appointment[]) || [];
  },

  async createAppointment(appointment: Omit<Appointment, 'id' | 'created_at'>): Promise<Appointment> {

    const { data, error } = await supabase
      .from('appointments')
      .insert(appointment)
      .select('*, patient:patients(name, email, phone)')
      .single();

    if (error) throw new Error(error.message);
    return data as unknown as Appointment;
  },

  async updateAppointmentStatus(id: string, status: Appointment['status']): Promise<Appointment> {

    const { data, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async deleteAppointment(id: string): Promise<void> {

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  // EVOLUÇÕES (PRONTUÁRIOS)
  async getEvolutions(patientId: string): Promise<Evolution[]> {

    const { data, error } = await supabase
      .from('patient_evolutions')
      .select('*')
      .eq('patient_id', patientId)
      .order('session_date', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  async createEvolution(evolution: Omit<Evolution, 'id' | 'created_at'>): Promise<Evolution> {

    const { data, error } = await supabase
      .from('patient_evolutions')
      .insert(evolution)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // MODELOS DE FORMULÁRIOS
  async getFormTemplates(professionalId: string): Promise<FormTemplate[]> {

    const { data, error } = await supabase
      .from('form_templates')
      .select('*')
      .eq('professional_id', professionalId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  async createFormTemplate(template: Omit<FormTemplate, 'id' | 'created_at'>): Promise<FormTemplate> {

    const { data, error } = await supabase
      .from('form_templates')
      .insert(template)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // FORMULÁRIOS PREENCHIDOS POR PACIENTE
  async getPatientForms(patientId: string): Promise<PatientForm[]> {

    const { data, error } = await supabase
      .from('patient_forms')
      .select('*, template:form_templates(title)')
      .eq('patient_id', patientId)
      .order('filled_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data as unknown as PatientForm[]) || [];
  },

  async createPatientForm(patientForm: Omit<PatientForm, 'id' | 'created_at' | 'filled_at'>): Promise<PatientForm> {

    const { data, error } = await supabase
      .from('patient_forms')
      .insert({
        professional_id: patientForm.professional_id,
        patient_id: patientForm.patient_id,
        template_id: patientForm.template_id,
        answers: patientForm.answers,
        respondent_name: patientForm.respondent_name || null,
        respondent_relationship: patientForm.respondent_relationship || null
      })
      .select('*, template:form_templates(title)')
      .single();

    if (error) throw new Error(error.message);
    return data as unknown as PatientForm;
  },

  // ANÁLISES COM IA (PRONTUÁRIO INTELIGENTE)
  async getPatientAnalysis(patientId: string): Promise<PatientAnalysis | null> {
    const { data, error } = await supabase
      .from('patient_analyses')
      .select('*')
      .eq('patient_id', patientId)
      .maybeSingle();

    if (error) {
      console.warn('Erro ao buscar análises (pode ser que a tabela ainda não exista):', error);
      return null;
    }
    return data;
  },

  async upsertPatientAnalysis(analysis: Partial<PatientAnalysis> & { patient_id: string, professional_id: string }): Promise<PatientAnalysis> {
    const { data, error } = await supabase
      .from('patient_analyses')
      .upsert({
        ...analysis,
        updated_at: new Date().toISOString()
      }, { onConflict: 'patient_id' })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
};
