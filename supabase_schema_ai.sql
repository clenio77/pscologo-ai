-- Script para criar a tabela de análises de IA no Supabase
-- Copie este código e execute no SQL Editor do painel do Supabase.

CREATE TABLE IF NOT EXISTS public.patient_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    freud_analysis TEXT,
    tcc_analysis TEXT,
    rogers_analysis TEXT,
    synthesis TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(patient_id)
);

-- Ativar Row Level Security (RLS)
ALTER TABLE public.patient_analyses ENABLE ROW LEVEL SECURITY;

-- Política de RLS: O profissional só pode ver e editar as análises de seus próprios pacientes
CREATE POLICY "Profissionais podem ler as análises dos seus pacientes"
    ON public.patient_analyses
    FOR SELECT
    USING (professional_id = auth.uid());

CREATE POLICY "Profissionais podem inserir análises para seus pacientes"
    ON public.patient_analyses
    FOR INSERT
    WITH CHECK (professional_id = auth.uid());

CREATE POLICY "Profissionais podem atualizar análises dos seus pacientes"
    ON public.patient_analyses
    FOR UPDATE
    USING (professional_id = auth.uid())
    WITH CHECK (professional_id = auth.uid());

CREATE POLICY "Profissionais podem deletar análises dos seus pacientes"
    ON public.patient_analyses
    FOR DELETE
    USING (professional_id = auth.uid());

-- Trigger para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_patient_analyses_modtime()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_patient_analyses_modtime ON public.patient_analyses;
CREATE TRIGGER trg_update_patient_analyses_modtime
BEFORE UPDATE ON public.patient_analyses
FOR EACH ROW
EXECUTE FUNCTION public.update_patient_analyses_modtime();
