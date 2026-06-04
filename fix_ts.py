import re

# Fix Layout.tsx
with open('src/components/Layout.tsx', 'r') as f:
    content = f.read()
content = content.replace('Sparkles', 'User')
with open('src/components/Layout.tsx', 'w') as f:
    f.write(content)

# Fix Login.tsx
with open('src/pages/Login.tsx', 'r') as f:
    content = f.read()
content = content.replace(', ShieldAlert', '')
content = content.replace(', supabaseError', '')
with open('src/pages/Login.tsx', 'w') as f:
    f.write(content)

# Fix api.ts
with open('src/services/api.ts', 'r') as f:
    content = f.read()
content = content.replace(', isSupabaseConfigured', '')
content = re.sub(r'import \{ getSecureItem, setSecureItem \} from \'../utils/crypto\';\n', '', content)
content = re.sub(r'// Funções Auxiliares do LocalStorage Criptografado.*?(?=// ----------------------------------------------------)', '', content, flags=re.DOTALL)
with open('src/services/api.ts', 'w') as f:
    f.write(content)

# Clean AuthContext.tsx completely from demo references
with open('src/context/AuthContext.tsx', 'r') as f:
    content = f.read()
content = re.sub(r'  const \[setIsDemoMode\] = useState\(\!isSupabaseConfigured\);\n', '', content)
content = re.sub(r'        setIsDemoMode\(true\);\n', '', content)
# Also there might be a "if (isDemoMode) {" blocks that were left.
# Wait, my regex earlier just replaced `login`, `signUp`, etc with clean versions, but maybe there were other demo mode checks? Let's remove them.
# I will just write a very basic AuthContext.tsx if it's completely messed up.
# Let's see what's left by doing a quick replace of the whole file if needed, but the previous regex was supposed to replace the WHOLE function.
