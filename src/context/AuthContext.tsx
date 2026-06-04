/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { getSecureItem, setSecureItem } from '../utils/crypto';

// Tipo customizado para o perfil do profissional (SaaS/Multi-profissional)
export interface ProfessionalProfile {
  id: string;
  email: string;
  name: string;
  specialty: string;
  register_number?: string;
  phone?: string;
}

interface DemoUserRecord extends ProfessionalProfile {
  password?: string;
}

interface AuthContextType {
  user: ProfessionalProfile | null;
  loading: boolean;
  isDemoMode: boolean;
  supabaseError: string | null;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string, specialty: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  updateProfile: (name: string, specialty: string, registerNumber?: string, phone?: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(!isSupabaseConfigured);
  const [user, setUser] = useState<ProfessionalProfile | null>(() => {
    if (!isSupabaseConfigured) {
      return getSecureItem<ProfessionalProfile | null>('agenda_clinical_demo_user', null);
    }
    return null;
  });
  const [loading, setLoading] = useState(isSupabaseConfigured);
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
    // Se estiver no modo demo, não há inicialização de Supabase a fazer
    if (isDemoMode) {
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setIsDemoMode(true);
      setLoading(false);
      return;
    }

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
        console.error('Erro ao buscar sessão inicial do Supabase, mudando para modo Demo:', err);
        if (isMounted) {
          setSupabaseError(err instanceof Error ? err.message : String(err));
          setIsDemoMode(true);
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
  }, [isDemoMode]);

  // Função de Login
  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (isDemoMode) {
      // Login Simulado
      if (email === 'demo@agenda.com' && password === '123456') {
        const mockProfile: ProfessionalProfile = {
          id: 'demo-professional-id',
          email: 'demo@agenda.com',
          name: 'Dra. Clarice (Psicóloga)',
          specialty: 'Psicologia Clínica',
        };
        setSecureItem('agenda_clinical_demo_user', mockProfile);
        setUser(mockProfile);
        return { error: null };
      }
      // Permite criar logins fictícios em modo demo também para facilitar
      const demoUsers = getSecureItem<DemoUserRecord[]>('agenda_clinical_demo_users_list', []);
      const foundUser = demoUsers.find((u: DemoUserRecord) => u.email === email && u.password === password);
      
      if (foundUser) {
        const mockProfile: ProfessionalProfile = {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.name,
          specialty: foundUser.specialty,
        };
        setSecureItem('agenda_clinical_demo_user', mockProfile);
        setUser(mockProfile);
        return { error: null };
      }

      return { error: 'E-mail ou senha incorretos (No modo demo, use demo@agenda.com / 123456 ou cadastre uma conta).' };
    }

    // Login Supabase Real
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
    if (isDemoMode) {
      // Cadastro Simulado
      const newId = `demo-id-${Date.now()}`;
      const newProfile: ProfessionalProfile = {
        id: newId,
        email,
        name,
        specialty,
      };

      // Salva na lista global de usuários demo do navegador
      const demoUsers = getSecureItem<DemoUserRecord[]>('agenda_clinical_demo_users_list', []);
      if (demoUsers.some((u: DemoUserRecord) => u.email === email)) {
        return { error: 'Este e-mail já está cadastrado no modo demo.' };
      }
      
      demoUsers.push({ id: newId, email, password, name, specialty });
      setSecureItem('agenda_clinical_demo_users_list', demoUsers);
      
      // Define como usuário ativo
      setSecureItem('agenda_clinical_demo_user', newProfile);
      setUser(newProfile);
      return { error: null };
    }

    // Cadastro Supabase Real
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
      
      // Nota: Com Supabase Auth, se o e-mail precisar de confirmação, o usuário pode não ser logado imediatamente.
      // Mas exibiremos um aviso ou faremos login automático se o Supabase estiver configurado para autologin.
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

    if (isDemoMode) {
      // Atualiza usuário ativo
      setSecureItem('agenda_clinical_demo_user', updatedProfile);
      
      // Atualiza lista global de usuários demo
      const demoUsers = getSecureItem<DemoUserRecord[]>('agenda_clinical_demo_users_list', []);
      const idx = demoUsers.findIndex((u) => u.id === user.id);
      if (idx !== -1) {
        demoUsers[idx] = {
          ...demoUsers[idx],
          name,
          specialty,
          register_number: registerNumber || undefined,
          phone: phone || undefined,
        };
        setSecureItem('agenda_clinical_demo_users_list', demoUsers);
      }
      
      setUser(updatedProfile);
      return { error: null };
    }

    // Modo Supabase Real
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
    if (isDemoMode) {
      localStorage.removeItem('agenda_clinical_demo_user');
      setUser(null);
      return;
    }

    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isDemoMode, supabaseError, login, signUp, logout, updateProfile }}>
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
