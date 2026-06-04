-- Script para criar a tabela de testes psicológicos (SATEPSI)

CREATE TABLE IF NOT EXISTS public.patient_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    test_name TEXT NOT NULL,
    application_date DATE NOT NULL,
    objective TEXT,
    results_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.patient_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profissionais podem ler testes de seus pacientes"
    ON public.patient_tests FOR SELECT
    USING (professional_id = auth.uid());

CREATE POLICY "Profissionais podem inserir testes"
    ON public.patient_tests FOR INSERT
    WITH CHECK (professional_id = auth.uid());

CREATE POLICY "Profissionais podem atualizar testes"
    ON public.patient_tests FOR UPDATE
    USING (professional_id = auth.uid())
    WITH CHECK (professional_id = auth.uid());

CREATE POLICY "Profissionais podem deletar testes"
    ON public.patient_tests FOR DELETE
    USING (professional_id = auth.uid());

CREATE OR REPLACE FUNCTION public.update_patient_tests_modtime()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_patient_tests_modtime ON public.patient_tests;
CREATE TRIGGER trg_update_patient_tests_modtime
BEFORE UPDATE ON public.patient_tests
FOR EACH ROW
EXECUTE FUNCTION public.update_patient_tests_modtime();
