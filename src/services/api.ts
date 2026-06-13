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
  template?: { 
    title: string;
    description?: string;
    fields?: Array<{
      id: string;
      label: string;
      type: 'text' | 'textarea' | 'select' | 'checkbox';
      required: boolean;
      options?: string[];
    }>;
  };
  patient?: {
    name: string;
  };
  status?: string;
  current_page?: number;
  completed_at?: string | null;
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

export interface PatientProfile {
  id: string;
  patient_id: string;
  professional_id: string;
  cpf?: string;
  rg?: string;
  marital_status?: string;
  profession?: string;
  education_level?: string;
  address?: string;
  city?: string;
  state?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  main_complaint?: string;
  clinical_history?: string;
  family_history?: string;
  medications?: string;
  allergies?: string;
  previous_treatments?: string;
  referral_source?: string;
  health_insurance?: string;
  document_requester?: string;
  document_purpose?: string;
  created_at: string;
  updated_at: string;
}

export interface PatientTest {
  id: string;
  patient_id: string;
  professional_id: string;
  test_name: string;
  application_date: string;
  objective?: string;
  results_summary?: string;
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
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data as unknown as PatientForm[]) || [];
  },

  async createPatientForm(patientForm: Omit<PatientForm, 'id' | 'created_at' | 'filled_at'> & { status?: string, current_page?: number, completed_at?: string | null }): Promise<PatientForm> {

    const { data, error } = await supabase
      .from('patient_forms')
      .insert({
        professional_id: patientForm.professional_id,
        patient_id: patientForm.patient_id,
        template_id: patientForm.template_id,
        answers: patientForm.answers,
        respondent_name: patientForm.respondent_name || null,
        respondent_relationship: patientForm.respondent_relationship || null,
        status: patientForm.status || 'completed',
        current_page: patientForm.current_page || 1,
        completed_at: patientForm.completed_at || null
      })
      .select('*, template:form_templates(title)')
      .single();

    if (error) throw new Error(error.message);
    return data as unknown as PatientForm;
  },

  async getPatientFormById(id: string): Promise<PatientForm> {
    const { data, error } = await supabase
      .from('patient_forms')
      .select('*, template:form_templates(title, description, fields), patient:patients(name)')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data as unknown as PatientForm;
  },

  async updatePatientForm(
    id: string, 
    payload: { 
      answers: Record<string, unknown>; 
      status?: string; 
      current_page?: number; 
      completed_at?: string | null 
    }
  ): Promise<PatientForm> {
    const { data, error } = await supabase
      .from('patient_forms')
      .update({
        answers: payload.answers,
        status: payload.status,
        current_page: payload.current_page,
        completed_at: payload.completed_at
      })
      .eq('id', id)
      .select('*, template:form_templates(title)')
      .single();

    if (error) throw new Error(error.message);
    return data as unknown as PatientForm;
  },

  async deletePatientForm(id: string): Promise<void> {
    const { error } = await supabase
      .from('patient_forms')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
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
  },

  // FICHA DO PACIENTE (PERFIL CLÍNICO EXPANDIDO)
  async getPatientProfile(patientId: string): Promise<PatientProfile | null> {
    const { data, error } = await supabase
      .from('patient_profiles')
      .select('*')
      .eq('patient_id', patientId)
      .maybeSingle();

    if (error) {
      console.warn('Erro ao buscar perfil do paciente:', error);
      return null;
    }
    return data;
  },

  async upsertPatientProfile(profile: Partial<PatientProfile> & { patient_id: string, professional_id: string }): Promise<PatientProfile> {
    const { data, error } = await supabase
      .from('patient_profiles')
      .upsert({
        ...profile,
        updated_at: new Date().toISOString()
      }, { onConflict: 'patient_id' })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // TESTES PSICOLÓGICOS (SATEPSI)
  async getPatientTests(patientId: string): Promise<PatientTest[]> {
    const { data, error } = await supabase
      .from('patient_tests')
      .select('*')
      .eq('patient_id', patientId)
      .order('application_date', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  async addPatientTest(test: Omit<PatientTest, 'id' | 'created_at' | 'updated_at'>): Promise<PatientTest> {
    const { data, error } = await supabase
      .from('patient_tests')
      .insert([test])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async deletePatientTest(testId: string): Promise<void> {
    const { error } = await supabase
      .from('patient_tests')
      .delete()
      .eq('id', testId);

    if (error) throw new Error(error.message);
  }
};
