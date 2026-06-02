import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")

supabase_client: Client = None

if url and key:
    try:
        supabase_client = create_client(url, key)
        print("✅ Supabase configurado com sucesso.")
    except Exception as e:
        print(f"⚠️ Erro ao configurar Supabase: {e}")
