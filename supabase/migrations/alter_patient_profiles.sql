-- Script para adicionar campos solicitados pela resolução CFP nº 06/2019

ALTER TABLE public.patient_profiles
ADD COLUMN IF NOT EXISTS document_requester TEXT,
ADD COLUMN IF NOT EXISTS document_purpose TEXT;
