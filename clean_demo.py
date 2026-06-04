import re
import os

# Clean AuthContext.tsx
with open('src/context/AuthContext.tsx', 'r') as f:
    content = f.read()

# Remove DemoUserRecord interface
content = re.sub(r'interface DemoUserRecord extends ProfessionalProfile {.*?}\n\n', '', content, flags=re.DOTALL)

# Remove isDemoMode from context
content = content.replace('  isDemoMode: boolean;\n', '')
content = content.replace(', isDemoMode', '')
content = content.replace('isDemoMode, ', '')
content = content.replace('const [isDemoMode, setIsDemoMode] = useState(!isSupabaseConfigured);\n', '')
content = content.replace("getSecureItem<ProfessionalProfile | null>('agenda_clinical_demo_user', null)", 'null')

# Clean up login function logic
login_clean = """  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      console.error('Erro inesperado no login:', err);
      return { error: 'Ocorreu um erro inesperado ao fazer login.' };
    }
  };"""
content = re.sub(r'  const login = async \(email: string, password: string\) => \{.*?(?=  const signUp =)', login_clean + '\n\n', content, flags=re.DOTALL)

# Clean up signUp function logic
signup_clean = """  const signUp = async (email: string, password: string, name: string, specialty?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name, specialty: specialty || '' }
        }
      });
      if (error) return { error: error.message };
      
      // Auto create profile record
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          name: name,
          email: email,
          specialty: specialty || 'Psicologia Clínica',
          created_at: new Date().toISOString()
        }, { onConflict: 'id' }).select().single();
      }
      return {};
    } catch (err: any) {
      console.error('Erro inesperado no cadastro:', err);
      return { error: 'Ocorreu um erro inesperado ao fazer cadastro.' };
    }
  };"""
content = re.sub(r'  const signUp = async \(email: string, password: string, name: string, specialty\?: string\) => \{.*?(?=  const updateProfile =)', signup_clean + '\n\n', content, flags=re.DOTALL)

# Clean up updateProfile function logic
update_profile_clean = """  const updateProfile = async (updates: Partial<ProfessionalProfile>) => {
    if (!user) return { error: 'Usuário não autenticado.' };
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
        
      if (error) return { error: error.message };
      setUser(data);
      return {};
    } catch (err: any) {
      console.error('Erro inesperado na atualização do perfil:', err);
      return { error: 'Ocorreu um erro inesperado ao atualizar o perfil.' };
    }
  };"""
content = re.sub(r'  const updateProfile = async \(updates: Partial<ProfessionalProfile>\) => \{.*?(?=  const logout =)', update_profile_clean + '\n\n', content, flags=re.DOTALL)

# Clean up logout function logic
logout_clean = """  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  };"""
content = re.sub(r'  const logout = async \(\) => \{.*?(?=  return \()', logout_clean + '\n\n', content, flags=re.DOTALL)

# Remove useEffect demo fallbacks
content = re.sub(r'    // Se estiver no modo demo, não há inicialização.*?if \(isDemoMode\) \{.*?return;\n    \}\n', '', content, flags=re.DOTALL)
content = re.sub(r'        \} catch \(err\) \{\n          console\.error\(\'Erro ao buscar sessão inicial do Supabase, mudando para modo Demo:\', err\);\n          if \(\!isDemoMode\) \{\n            setIsDemoMode\(true\);\n          \}\n        \}', '} catch (err) { console.error("Erro", err); }', content, flags=re.DOTALL)
content = content.replace('  }, [isDemoMode]);', '  }, []);')

with open('src/context/AuthContext.tsx', 'w') as f:
    f.write(content)

# Clean api.ts
with open('src/services/api.ts', 'r') as f:
    api_content = f.read()

# Remove the LocalStorage keys and helper functions
api_content = re.sub(r'// Chaves do localStorage para o Modo Demo.*?(?=// -+)', '', api_content, flags=re.DOTALL)

# Remove all if (!isSupabaseConfigured) blocks
# This regex finds blocks starting with if (!isSupabaseConfigured) { ... } and removes them.
api_content = re.sub(r'\s*if \(\!isSupabaseConfigured\) \{.*?    \}\n', '\n', api_content, flags=re.DOTALL)

with open('src/services/api.ts', 'w') as f:
    f.write(api_content)

print("Cleaned AuthContext and api.ts")
