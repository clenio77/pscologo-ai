from flask import Blueprint, jsonify
from models import db, Consulta, Usuario
from datetime import datetime, timedelta

lembrete_bp = Blueprint('lembrete_bp', __name__)

@lembrete_bp.route('/api/lembretes/enviar', methods=['POST'])
def enviar_lembretes():
    # Encontra consultas que acontecerão nas próximas 24 horas
    agora = datetime.utcnow()
    limite = agora + timedelta(hours=24)
    
    consultas = Consulta.query.filter(
        Consulta.data_hora > agora,
        Consulta.data_hora <= limite,
        Consulta.status == 'agendada'
    ).all()
    
    lembretes_enviados = 0
    for consulta in consultas:
        paciente = Usuario.query.get(consulta.paciente_id)
        if paciente:
            # Aqui entraria a integração real com Twilio (WhatsApp) ou SendGrid (E-mail)
            # Vamos simular o envio:
            print(f"ENVIADO: Lembrete de consulta para {paciente.nome} ({paciente.email}) - Data: {consulta.data_hora}")
            lembretes_enviados += 1
            
    return jsonify({
        'message': 'Lembretes processados com sucesso.',
        'quantidade_enviada': lembretes_enviados
    }), 200
