-- =====================================================
-- FICHA DO PACIENTE — patient_profiles
-- Dados pessoais expandidos e dados clínicos
-- =====================================================

CREATE TABLE IF NOT EXISTS public.patient_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    -- Dados pessoais expandidos
    cpf TEXT,
    rg TEXT,
    marital_status TEXT,
    profession TEXT,
    education_level TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    -- Dados clínicos
    main_complaint TEXT,
    clinical_history TEXT,
    family_history TEXT,
    medications TEXT,
    allergies TEXT,
    previous_treatments TEXT,
    referral_source TEXT,
    health_insurance TEXT,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(patient_id)
);

ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profissionais podem ler perfis de seus pacientes"
    ON public.patient_profiles FOR SELECT
    USING (professional_id = auth.uid());

CREATE POLICY "Profissionais podem inserir perfis"
    ON public.patient_profiles FOR INSERT
    WITH CHECK (professional_id = auth.uid());

CREATE POLICY "Profissionais podem atualizar perfis"
    ON public.patient_profiles FOR UPDATE
    USING (professional_id = auth.uid())
    WITH CHECK (professional_id = auth.uid());

CREATE POLICY "Profissionais podem deletar perfis"
    ON public.patient_profiles FOR DELETE
    USING (professional_id = auth.uid());

CREATE OR REPLACE FUNCTION public.update_patient_profiles_modtime()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_patient_profiles_modtime ON public.patient_profiles;
CREATE TRIGGER trg_update_patient_profiles_modtime
BEFORE UPDATE ON public.patient_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_patient_profiles_modtime();
