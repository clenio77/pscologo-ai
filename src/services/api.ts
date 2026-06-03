import { supabase, isSupabaseConfigured } from './supabaseClient';

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
  filled_at: string;
  created_at: string;
  template?: { title: string };
}

// Chaves do localStorage para o Modo Demo
const STORAGE_KEYS = {
  PATIENTS: 'clinical_demo_patients',
  APPOINTMENTS: 'clinical_demo_appointments',
  EVOLUTIONS: 'clinical_demo_evolutions',
  TEMPLATES: 'clinical_demo_templates',
  PATIENT_FORMS: 'clinical_demo_patient_forms',
};

// Funções Auxiliares do LocalStorage
const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const setLocalStorage = (key: string, data: unknown) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// ----------------------------------------------------
// API SERVIÇOS
// ----------------------------------------------------

export const api = {
  // PACIENTES
  async getPatients(professionalId: string): Promise<Patient[]> {
    if (!isSupabaseConfigured) {
      const list = getLocalStorage<Patient[]>(STORAGE_KEYS.PATIENTS, []);
      // Filtrar por professional_id para simular RLS
      const filtered = list.filter(p => p.professional_id === professionalId);
      // Retorna ordenado por nome
      return filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('professional_id', professionalId)
      .order('name');
    
    if (error) throw new Error(error.message);
    return data || [];
  },

  async createPatient(patient: Omit<Patient, 'id' | 'created_at'>): Promise<Patient> {
    if (!isSupabaseConfigured) {
      const list = getLocalStorage<Patient[]>(STORAGE_KEYS.PATIENTS, []);
      const newPatient: Patient = {
        ...patient,
        id: `patient-id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
      };
      list.push(newPatient);
      setLocalStorage(STORAGE_KEYS.PATIENTS, list);
      return newPatient;
    }

    const { data, error } = await supabase
      .from('patients')
      .insert(patient)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updatePatient(id: string, patient: Partial<Omit<Patient, 'id' | 'created_at' | 'professional_id'>>): Promise<Patient> {
    if (!isSupabaseConfigured) {
      const list = getLocalStorage<Patient[]>(STORAGE_KEYS.PATIENTS, []);
      const idx = list.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Paciente não encontrado');
      
      const updated = { ...list[idx], ...patient };
      list[idx] = updated;
      setLocalStorage(STORAGE_KEYS.PATIENTS, list);
      return updated;
    }

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
    if (!isSupabaseConfigured) {
      const list = getLocalStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
      const patients = getLocalStorage<Patient[]>(STORAGE_KEYS.PATIENTS, []);
      
      // Filtra por profissional e popula dados do paciente
      const filtered = list
        .filter(a => a.professional_id === professionalId)
        .map(a => {
          const pat = patients.find(p => p.id === a.patient_id);
          return {
            ...a,
            patient: pat ? { name: pat.name, email: pat.email, phone: pat.phone } : undefined
          };
        });
      
      // Ordena por data/hora crescente
      return filtered.sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());
    }

    const { data, error } = await supabase
      .from('appointments')
      .select('*, patient:patients(name, email, phone)')
      .eq('professional_id', professionalId)
      .order('date_time', { ascending: true });

    if (error) throw new Error(error.message);
    return (data as unknown as Appointment[]) || [];
  },

  async createAppointment(appointment: Omit<Appointment, 'id' | 'created_at'>): Promise<Appointment> {
    if (!isSupabaseConfigured) {
      const list = getLocalStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
      const patients = getLocalStorage<Patient[]>(STORAGE_KEYS.PATIENTS, []);
      
      const newApp: Appointment = {
        ...appointment,
        id: `app-id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
      };
      
      list.push(newApp);
      setLocalStorage(STORAGE_KEYS.APPOINTMENTS, list);

      const pat = patients.find(p => p.id === appointment.patient_id);
      return {
        ...newApp,
        patient: pat ? { name: pat.name, email: pat.email, phone: pat.phone } : undefined
      };
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert(appointment)
      .select('*, patient:patients(name, email, phone)')
      .single();

    if (error) throw new Error(error.message);
    return data as unknown as Appointment;
  },

  async updateAppointmentStatus(id: string, status: Appointment['status']): Promise<Appointment> {
    if (!isSupabaseConfigured) {
      const list = getLocalStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
      const idx = list.findIndex(a => a.id === id);
      if (idx === -1) throw new Error('Consulta não encontrada');
      
      list[idx].status = status;
      setLocalStorage(STORAGE_KEYS.APPOINTMENTS, list);
      return list[idx];
    }

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
    if (!isSupabaseConfigured) {
      const list = getLocalStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
      const filtered = list.filter(a => a.id !== id);
      setLocalStorage(STORAGE_KEYS.APPOINTMENTS, filtered);
      return;
    }

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  // EVOLUÇÕES (PRONTUÁRIOS)
  async getEvolutions(patientId: string): Promise<Evolution[]> {
    if (!isSupabaseConfigured) {
      const list = getLocalStorage<Evolution[]>(STORAGE_KEYS.EVOLUTIONS, []);
      const filtered = list.filter(e => e.patient_id === patientId);
      // Ordena decrescente pela data da sessão (mais recentes primeiro)
      return filtered.sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());
    }

    const { data, error } = await supabase
      .from('patient_evolutions')
      .select('*')
      .eq('patient_id', patientId)
      .order('session_date', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  async createEvolution(evolution: Omit<Evolution, 'id' | 'created_at'>): Promise<Evolution> {
    if (!isSupabaseConfigured) {
      const list = getLocalStorage<Evolution[]>(STORAGE_KEYS.EVOLUTIONS, []);
      const newEvolution: Evolution = {
        ...evolution,
        id: `evo-id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
      };
      list.push(newEvolution);
      setLocalStorage(STORAGE_KEYS.EVOLUTIONS, list);
      return newEvolution;
    }

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
    if (!isSupabaseConfigured) {
      const list = getLocalStorage<FormTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
      return list.filter(t => t.professional_id === professionalId);
    }

    const { data, error } = await supabase
      .from('form_templates')
      .select('*')
      .eq('professional_id', professionalId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  async createFormTemplate(template: Omit<FormTemplate, 'id' | 'created_at'>): Promise<FormTemplate> {
    if (!isSupabaseConfigured) {
      const list = getLocalStorage<FormTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
      const newTemplate: FormTemplate = {
        ...template,
        id: `template-id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
      };
      list.push(newTemplate);
      setLocalStorage(STORAGE_KEYS.TEMPLATES, list);
      return newTemplate;
    }

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
    if (!isSupabaseConfigured) {
      const list = getLocalStorage<PatientForm[]>(STORAGE_KEYS.PATIENT_FORMS, []);
      const templates = getLocalStorage<FormTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
      
      const filtered = list
        .filter(f => f.patient_id === patientId)
        .map(f => {
          const t = templates.find(temp => temp.id === f.template_id);
          return {
            ...f,
            template: t ? { title: t.title } : undefined
          };
        });

      return filtered.sort((a, b) => new Date(b.filled_at).getTime() - new Date(a.filled_at).getTime());
    }

    const { data, error } = await supabase
      .from('patient_forms')
      .select('*, template:form_templates(title)')
      .eq('patient_id', patientId)
      .order('filled_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data as unknown as PatientForm[]) || [];
  },

  async createPatientForm(patientForm: Omit<PatientForm, 'id' | 'created_at' | 'filled_at'>): Promise<PatientForm> {
    if (!isSupabaseConfigured) {
      const list = getLocalStorage<PatientForm[]>(STORAGE_KEYS.PATIENT_FORMS, []);
      const templates = getLocalStorage<FormTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
      
      const newForm: PatientForm = {
        ...patientForm,
        id: `patform-id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        filled_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      
      list.push(newForm);
      setLocalStorage(STORAGE_KEYS.PATIENT_FORMS, list);

      const t = templates.find(temp => temp.id === patientForm.template_id);
      return {
        ...newForm,
        template: t ? { title: t.title } : undefined
      };
    }

    const { data, error } = await supabase
      .from('patient_forms')
      .insert(patientForm)
      .select('*, template:form_templates(title)')
      .single();

    if (error) throw new Error(error.message);
    return data as unknown as PatientForm;
  }
};
