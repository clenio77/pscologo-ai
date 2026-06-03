import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validação simples para evitar quebras silenciosas na inicialização
export const isSupabaseConfigured = 
  Boolean(supabaseUrl) && 
  supabaseUrl !== 'SUA_SUPABASE_URL_AQUI' && 
  supabaseUrl !== 'https://seu-projeto-id.supabase.co' &&
  Boolean(supabaseAnonKey) && 
  supabaseAnonKey !== 'SUA_SUPABASE_ANON_KEY_AQUI' &&
  supabaseAnonKey !== 'sua-chave-anonima-aqui';

if (!isSupabaseConfigured) {
  console.warn(
    '[Agenda Clinical] Supabase não está configurado. Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.local'
  );
}

// Inicializa o cliente com placeholders seguros se não estiver devidamente configurado
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder-project-id.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder-key'
);
