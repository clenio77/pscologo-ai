/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import type { User } from '@supabase/supabase-js';

// Tipo customizado para o perfil do profissional (SaaS/Multi-profissional)
export interface ProfessionalProfile {
  id: string;
  email: string;
  name: string;
  specialty: string;
  register_number?: string;
  phone?: string;
}

interface AuthContextType {
  user: ProfessionalProfile | null;
  loading: boolean;
  supabaseError: string | null;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string, specialty: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  updateProfile: (name: string, specialty: string, registerNumber?: string, phone?: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  // Função para buscar dados da tabela profiles
  const fetchProfile = async (supabaseUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil da tabela profiles:', error);
        // Caso ocorra erro (por exemplo, trigger do banco não executou), cria um perfil provisório
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: supabaseUser.user_metadata?.name || 'Profissional',
          specialty: supabaseUser.user_metadata?.specialty || 'Psicologia',
          register_number: supabaseUser.user_metadata?.register_number || undefined,
          phone: supabaseUser.user_metadata?.phone || undefined,
        });
      } else if (data) {
        setUser({
          id: data.id,
          email: supabaseUser.email || '',
          name: data.name,
          specialty: data.specialty || 'Psicologia',
          register_number: data.register_number || undefined,
          phone: data.phone || undefined,
        });
      }
    } catch (err) {
      console.error('Erro no fetchProfile:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Modo Supabase Real com Timeout de Segurança de 4 segundos
    const initAuth = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Supabase connection timeout')), 10000)
        );

        // Faz corrida para evitar travamento indefinido caso a rede falhe silenciosamente
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as { data: { session: any } };

        if (!isMounted) return;

        if (session?.user) {
          await fetchProfile(session.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Erro ao buscar sessão inicial do Supabase:', err);
        if (isMounted) {
          setSupabaseError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Ouvinte de mudanças na autenticação do Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      setLoading(true);
      try {
        if (session?.user) {
          await fetchProfile(session.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Erro ao processar mudanca de estado de auth:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Função de Login
  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      if (data.user) {
        await fetchProfile(data.user);
      }
      return { error: null };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao realizar login';
      return { error: errorMsg };
    }
  };

  // Função de Cadastro
  const signUp = async (
    email: string,
    password: string,
    name: string,
    specialty: string
  ): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            specialty,
          },
        },
      });

      if (error) return { error: error.message };
      
      if (data.user) {
        // Insere perfil manualmente na tabela profiles caso a trigger falhe ou demore
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            name,
            specialty,
          });
        } catch (e) {
          console.warn('Falha ao inserir perfil inicial via API, confiando na trigger de banco.', e);
        }
        await fetchProfile(data.user);
      }
      return { error: null };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao realizar cadastro';
      return { error: errorMsg };
    }
  };

  // Função para atualizar perfil profissional (com RLS fallback)
  const updateProfile = async (
    name: string,
    specialty: string,
    registerNumber?: string,
    phone?: string
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Usuário não autenticado.' };

    const updatedProfile: ProfessionalProfile = {
      ...user,
      name,
      specialty,
      register_number: registerNumber || undefined,
      phone: phone || undefined,
    };

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name,
          specialty,
          register_number: registerNumber || null,
          phone: phone || null,
        });

      if (error) {
        console.warn('Erro ao atualizar perfil completo no Supabase, tentando apenas campos essenciais:', error);
        
        // Tenta salvar apenas name e specialty
        const { error: fallbackError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            name,
            specialty,
          });
          
        if (fallbackError) return { error: fallbackError.message };
        
        setUser(updatedProfile);
        return { error: null };
      }

      setUser(updatedProfile);
      return { error: null };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao atualizar perfil';
      return { error: errorMsg };
    }
  };

  // Função de Logout
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, supabaseError, login, signUp, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
