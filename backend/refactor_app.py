import re
import os

with open("app.py", "r", encoding="utf-8") as f:
    content = f.read()

# Dictionary to map route URL patterns to blueprint names
route_mapping = {
    r'"/cadastro"': "auth",
    r'"/login"': "auth",
    r'"/psicologos"': "auth",
    
    r'"/psicologo/cadastrar-paciente"': "paciente",
    r'"/pacientes"': "paciente",
    r'"/paciente/<int:paciente_id>/notas"': "paciente",
    r'"/notas/<int:id>"': "paciente",
    r'"/paciente/<int:paciente_id>/tarefas"': "paciente",
    r'"/tarefas/<int:id>/concluir"': "paciente",
    r'"/tarefas/<int:id>"': "paciente",
    r'"/paciente/<int:paciente_id>/anamnese"': "paciente",
    r'"/paciente/<int:paciente_id>/avaliacoes"': "paciente",
    r'"/paciente/<int:paciente_id>/diario"': "paciente",
    r'"/diario"': "paciente",
    r'"/paciente/<int:paciente_id>/resumo_pre_sessao"': "paciente",
    r'"/paciente/<int:paciente_id>/tcle"': "paciente",
    r'"/paciente/<int:paciente_id>/plano"': "paciente",
    
    r'"/horarios-disponiveis"': "agenda",
    r'"/consultas"': "agenda",
    r'"/consultas/<int:id>"': "agenda",
    
    r'"/financeiro"': "financeiro",
    r'"/financeiro/<int:id>"': "financeiro",
    r'"/pacotes"': "financeiro",
    
    r'"/transcribe"': "ai",
    r'"/sugerir-exercicio"': "ai",
    r'"/paciente/<int:paciente_id>/prontuario-ia"': "ai",
    r'"/paciente/<int:paciente_id>/prontuario-ia/gerar"': "ai",
    r'"/paciente/<int:paciente_id>/insights"': "ai",
    
    r'"/historico"': "sessao",
    r'"/sessao/<int:id>"': "sessao",
}

# Find all routes
route_pattern = re.compile(r'(@app\.route\([^)]+\)[\s\S]*?(?=\n@app\.route|\Z))')
matches = route_pattern.findall(content)

blueprints = {
    "auth": [],
    "paciente": [],
    "agenda": [],
    "financeiro": [],
    "ai": [],
    "sessao": [],
    "app": [] # Leftovers
}

for match in matches:
    # Which blueprint?
    bp_name = "app"
    for url, b_name in route_mapping.items():
        if url in match.split('\n')[0]:
            bp_name = b_name
            break
    
    # Replace @app.route with @{bp_name}_bp.route
    if bp_name != "app":
        new_match = match.replace("@app.route", f"@{bp_name}_bp.route")
        # Also remove @token_requerido if we need to? No, we will import it.
        blueprints[bp_name].append(new_match)
    else:
        blueprints["app"].append(match)

# Make directory
os.makedirs("routes", exist_ok=True)

# Generate Blueprints
imports_header = """from flask import Blueprint, request, jsonify, current_app
from models import *
from utils import token_requerido
from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
import re
import os
import google.generativeai as genai

{bp_name}_bp = Blueprint('{bp_name}', __name__)
"""

for bp_name, routes in blueprints.items():
    if bp_name == "app": continue
    with open(f"routes/{bp_name}_routes.py", "w", encoding="utf-8") as f:
        f.write(imports_header.format(bp_name=bp_name))
        f.write("\n")
        for route in routes:
            f.write(route)
            f.write("\n")

# Now strip all routes from app.py
new_app_content = re.sub(route_pattern, "", content)
new_app_content = new_app_content.replace("# ROTAS DE AUTENTICAÇÃO E CADASTROS", "")
new_app_content = new_app_content.replace("# ROTAS DA APLICAÇÃO CLÍNICA", "")

# Add register_blueprints to app.py
blueprint_registration = """
from routes.auth_routes import auth_bp
from routes.paciente_routes import paciente_bp
from routes.agenda_routes import agenda_bp
from routes.financeiro_routes import financeiro_bp
from routes.ai_routes import ai_bp
from routes.sessao_routes import sessao_bp

app.register_blueprint(auth_bp)
app.register_blueprint(paciente_bp)
app.register_blueprint(agenda_bp)
app.register_blueprint(financeiro_bp)
app.register_blueprint(ai_bp)
app.register_blueprint(sessao_bp)
"""

with open("app_new.py", "w", encoding="utf-8") as f:
    f.write(new_app_content)
    f.write(blueprint_registration)
    f.write("\nif __name__ == '__main__':\n    app.run(debug=True, port=5000)\n")

print("Refactoring complete.")
