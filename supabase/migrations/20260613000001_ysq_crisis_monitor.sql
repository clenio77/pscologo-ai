-- Migração: ysq_crisis_monitor.sql (20260613000001_ysq_crisis_monitor.sql)
-- Tabelas para o Plano de Segurança de Emergência e Check-ins de Crise diários

-- 1. Plano de Segurança (Safety Plan) da Terapia Cognitivo-Comportamental
CREATE TABLE IF NOT EXISTS public.patient_safety_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    internal_strategies TEXT, -- Estratégias que o paciente pode usar sozinho (respiração, caminhada)
    reasons_for_living TEXT, -- Razões que o paciente tem para continuar vivendo
    trusted_contacts JSONB DEFAULT '[]'::jsonb, -- Contatos de confiança (Nome, Telefone, Relação)
    professional_contacts JSONB DEFAULT '[]'::jsonb, -- Contatos profissionais de apoio
    emergency_services TEXT DEFAULT 'CVV: 188, SAMU: 192, Bombeiros: 193',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(patient_id)
);

-- 2. Check-ins de Crise Diários (Crisis Check-ins)
CREATE TABLE IF NOT EXISTS public.patient_crisis_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    mood_score INT NOT NULL CHECK (mood_score BETWEEN 1 AND 5), -- 1: Muito Mal, 5: Muito Bem
    ideation_flag BOOLEAN DEFAULT FALSE, -- Pensamentos de autolesão (Sim/Não)
    has_plan BOOLEAN DEFAULT FALSE, -- Plano de tentativa (Sim/Não)
    transcript TEXT, -- Transcrição do áudio gravado
    audio_url TEXT, -- Arquivo de áudio no Supabase Storage
    ai_risk_assessment TEXT, -- Análise conceitual do áudio
    risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE public.patient_safety_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_crisis_checkins ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Profissionais acessam planos de segurança" ON public.patient_safety_plans;
CREATE POLICY "Profissionais acessam planos de segurança"
    ON public.patient_safety_plans FOR ALL
    USING (professional_id = auth.uid())
    WITH CHECK (professional_id = auth.uid());

DROP POLICY IF EXISTS "Profissionais acessam checkins de crise" ON public.patient_crisis_checkins;
CREATE POLICY "Profissionais acessam checkins de crise"
    ON public.patient_crisis_checkins FOR ALL
    USING (professional_id = auth.uid())
    WITH CHECK (professional_id = auth.uid());

-- Permitir que o paciente acesse anonimamente o próprio plano de segurança na rota de crise
DROP POLICY IF EXISTS "Permitir select anonimo do plano de segurança" ON public.patient_safety_plans;
CREATE POLICY "Permitir select anonimo do plano de segurança"
    ON public.patient_safety_plans FOR SELECT
    USING (true);

-- Permitir que o paciente insira anonimamente o check-in na rota de crise
DROP POLICY IF EXISTS "Permitir insert anonimo de checkin de crise" ON public.patient_crisis_checkins;
CREATE POLICY "Permitir insert anonimo de checkin de crise"
    ON public.patient_crisis_checkins FOR INSERT
    WITH CHECK (true);
    
DROP POLICY IF EXISTS "Permitir select anonimo de checkins de crise" ON public.patient_crisis_checkins;
CREATE POLICY "Permitir select anonimo de checkins de crise"
    ON public.patient_crisis_checkins FOR SELECT
    USING (true);
