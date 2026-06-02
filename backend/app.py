from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os
import secrets
import re
import tempfile
import speech_recognition as sr
from pydub import AudioSegment
from google import genai
from dotenv import load_dotenv
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from functools import wraps

# Carregar variáveis de ambiente
load_dotenv()

app = Flask(__name__)
# Permitir acesso apenas do frontend local e prod (configure os domínios reais aqui depois)
origens_permitidas = ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"]
CORS(app, resources={r"/*": {"origins": origens_permitidas}})

# Configurações do app
# Evitar secret key default vulnerável em produção
secret_env = os.getenv("JWT_SECRET_KEY")
app.config['SECRET_KEY'] = secret_env if secret_env else secrets.token_hex(32)
# Usa PostgreSQL se definido, senão cai para SQLite (desenvolvimento)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///terapia.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

from extensions import db, migrate
from models import *

db.init_app(app)
migrate.init_app(app, db)

# Criar o banco de dados se não existir
with app.app_context():
    db.create_all()

# Configurar Gemini (Novo SDK google.genai)
try:
    gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    app.config['gemini_client'] = gemini_client
    app.config['gemini_model_name'] = 'gemini-2.5-flash'
    print(f"✅ Google GenAI SDK configurado.")
except Exception as e:
    print(f"⚠️ Falha ao configurar Google GenAI SDK: {e}")

# DECORATOR PARA PROTEGER ROTAS
def token_requerido(f):
    @wraps(f)
    def decorador(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'erro': 'Token de autorização malformado'}), 401
        
        if not token:
            return jsonify({'erro': 'Token de acesso ausente'}), 401
        
        try:
            dados = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            usuario_atual = Usuario.query.filter_by(id=dados['id']).first()
            if not usuario_atual:
                return jsonify({'erro': 'Usuário correspondente ao token não existe'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'erro': 'O Token expirou'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'erro': 'Token inválido'}), 401
            
        return f(usuario_atual, *args, **kwargs)
    return decorador












































from routes.auth_routes import auth_bp
from routes.paciente_routes import paciente_bp
from routes.agenda_routes import agenda_bp
from routes.financeiro_routes import financeiro_bp
from routes.ai_routes import ai_bp
from routes.sessao_routes import sessao_bp
from routes.documento_routes import documento_bp
from routes.lembrete_routes import lembrete_bp

app.register_blueprint(auth_bp)
app.register_blueprint(paciente_bp)
app.register_blueprint(agenda_bp)
app.register_blueprint(financeiro_bp)
app.register_blueprint(ai_bp)
app.register_blueprint(sessao_bp)
app.register_blueprint(documento_bp)
app.register_blueprint(lembrete_bp)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
