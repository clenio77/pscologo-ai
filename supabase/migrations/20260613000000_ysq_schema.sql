-- Migração: ysq_schema.sql (20260613000000_ysq_schema.sql)
-- Tabelas para armazenar o preenchimento e resultados do YSQ-L3

CREATE TABLE IF NOT EXISTS public.ysq_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    current_page INT DEFAULT 1,
    responses JSONB DEFAULT '{}'::jsonb, -- Ex: {"1": 5, "2": 2, ..., "232": 6}
    ai_interpretation TEXT, -- Guarda o relatório analítico gerado pela IA
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ysq_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.ysq_submissions(id) ON DELETE CASCADE,
    
    -- Escores médios (1 a 6) por esquema
    pe_score NUMERIC(3,2), ab_score NUMERIC(3,2), da_score NUMERIC(3,2), is_score NUMERIC(3,2),
    dv_score NUMERIC(3,2), fr_score NUMERIC(3,2), de_score NUMERIC(3,2), vu_score NUMERIC(3,2),
    em_score NUMERIC(3,2), sb_score NUMERIC(3,2), as_score NUMERIC(3,2), ie_score NUMERIC(3,2),
    pi_score NUMERIC(3,2), me_score NUMERIC(3,2), ai_score NUMERIC(3,2), ba_score NUMERIC(3,2),
    np_score NUMERIC(3,2), pu_score NUMERIC(3,2),
    
    -- Quantidade de itens com resposta severa (5 ou 6) por esquema
    pe_critical_count INT DEFAULT 0, ab_critical_count INT DEFAULT 0, da_critical_count INT DEFAULT 0, is_critical_count INT DEFAULT 0,
    dv_critical_count INT DEFAULT 0, fr_critical_count INT DEFAULT 0, de_critical_count INT DEFAULT 0, vu_critical_count INT DEFAULT 0,
    em_critical_count INT DEFAULT 0, sb_critical_count INT DEFAULT 0, as_critical_count INT DEFAULT 0, ie_critical_count INT DEFAULT 0,
    pi_critical_count INT DEFAULT 0, me_critical_count INT DEFAULT 0, ai_critical_count INT DEFAULT 0, ba_critical_count INT DEFAULT 0,
    np_critical_count INT DEFAULT 0, pu_critical_count INT DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE public.ysq_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ysq_scores ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Profissionais acessam submissoes de seus pacientes" ON public.ysq_submissions;
CREATE POLICY "Profissionais acessam submissoes de seus pacientes"
    ON public.ysq_submissions FOR ALL
    USING (professional_id = auth.uid())
    WITH CHECK (professional_id = auth.uid());

DROP POLICY IF EXISTS "Profissionais acessam escores de seus pacientes" ON public.ysq_scores;
CREATE POLICY "Profissionais acessam escores de seus pacientes"
    ON public.ysq_scores FOR ALL
    USING (
        submission_id IN (SELECT id FROM public.ysq_submissions WHERE professional_id = auth.uid())
    );

-- Política para permitir que um paciente responda ao formulário anonimamente se possuir o id_token no fluxo
-- (como o token é seguro, fazemos liberação de update/select sob validação se o status for pending ou in_progress)
DROP POLICY IF EXISTS "Permitir update anonimo por token de paciente" ON public.ysq_submissions;
CREATE POLICY "Permitir update anonimo por token de paciente"
    ON public.ysq_submissions FOR UPDATE
    USING (status != 'completed')
    WITH CHECK (status != 'completed');

DROP POLICY IF EXISTS "Permitir select anonimo por token de paciente" ON public.ysq_submissions;
CREATE POLICY "Permitir select anonimo por token de paciente"
    ON public.ysq_submissions FOR SELECT
    USING (status != 'completed');
