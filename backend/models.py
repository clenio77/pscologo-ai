from extensions import db
from datetime import datetime

class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    senha_hash = db.Column(db.String(256), nullable=False)
    nome = db.Column(db.String(100), nullable=False)
    tipo = db.Column(db.String(20), nullable=False) # 'psicologo' ou 'paciente'
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)

class Paciente(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), unique=True, nullable=False)
    psicologo_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=True) # Psicólogo responsável
    
    # Relacionamentos
    usuario = db.relationship('Usuario', foreign_keys=[usuario_id], backref=db.backref('paciente_perfil', uselist=False))
    psicologo = db.relationship('Usuario', foreign_keys=[psicologo_id], backref=db.backref('pacientes_atendidos', lazy=True))

class Sessao(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    paciente_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False) # Vinculado ao Usuario do paciente
    transcricao = db.Column(db.Text, nullable=False)
    exercicio = db.Column(db.Text, nullable=False)
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    sentimento = db.Column(db.String(50)) # Opcional: para busca filtrada

class Consulta(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    paciente_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    psicologo_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    data_hora = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='agendada') # 'agendada', 'concluida', 'cancelada'
    observacoes = db.Column(db.Text)
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)

    # Relacionamentos
    paciente = db.relationship('Usuario', foreign_keys=[paciente_id], backref=db.backref('consultas_paciente', lazy=True))
    psicologo = db.relationship('Usuario', foreign_keys=[psicologo_id], backref=db.backref('consultas_psicologo', lazy=True))

class Financeiro(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tipo = db.Column(db.String(20), nullable=False) # 'receita' ou 'despesa'
    categoria = db.Column(db.String(50), nullable=False) # 'sessao', 'aluguel', 'sistemas', 'impostos', 'outros'
    valor = db.Column(db.Float, nullable=False)
    data = db.Column(db.DateTime, default=datetime.utcnow)
    descricao = db.Column(db.Text)
    status = db.Column(db.String(20), default='pago') # 'pago', 'pendente', 'atrasado'
    paciente_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=True)
    psicologo_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    consulta_id = db.Column(db.Integer, db.ForeignKey('consulta.id'), nullable=True)

    # Relacionamentos
    paciente = db.relationship('Usuario', foreign_keys=[paciente_id], backref=db.backref('financeiro_paciente', lazy=True))
    psicologo = db.relationship('Usuario', foreign_keys=[psicologo_id], backref=db.backref('financeiro_psicologo', lazy=True))

class Pacote(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    paciente_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    psicologo_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    total_sessoes = db.Column(db.Integer, nullable=False)
    sessoes_restantes = db.Column(db.Integer, nullable=False)
    valor_total = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='ativo') # 'ativo', 'concluido'
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)

    # Relacionamentos
    paciente = db.relationship('Usuario', foreign_keys=[paciente_id], backref=db.backref('pacotes_paciente', lazy=True))
    psicologo = db.relationship('Usuario', foreign_keys=[psicologo_id], backref=db.backref('pacotes_psicologo', lazy=True))

class ProntuarioConsolidado(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    paciente_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    psicologo_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    conteudo = db.Column(db.Text, nullable=False)
    data_atualizacao = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamentos
    paciente = db.relationship('Usuario', foreign_keys=[paciente_id], backref=db.backref('prontuario_consolidado', uselist=False))

class NotaClinica(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    paciente_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    psicologo_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    conteudo = db.Column(db.Text, nullable=False)
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)

    # Relacionamentos
    paciente = db.relationship('Usuario', foreign_keys=[paciente_id], backref=db.backref('notas_clinicas_paciente', lazy=True))

class TarefaClinica(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    paciente_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    psicologo_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    titulo = db.Column(db.String(150), nullable=False)
    descricao = db.Column(db.Text, nullable=False)
    concluida = db.Column(db.Boolean, default=False)
    data_conclusao = db.Column(db.DateTime, nullable=True)
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)

    # Relacionamentos
    paciente = db.relationship('Usuario', foreign_keys=[paciente_id], backref=db.backref('tarefas_paciente', lazy=True))

class Anamnese(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    paciente_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), unique=True, nullable=False)
    psicologo_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    
    queixa_principal = db.Column(db.Text, nullable=True)
    historico_sintomas = db.Column(db.Text, nullable=True)
    historico_familiar = db.Column(db.Text, nullable=True)
    historico_medico = db.Column(db.Text, nullable=True) # Medicamentos, tratamentos anteriores, etc.
    relacionamentos_sociais = db.Column(db.Text, nullable=True)
    expectativas_terapia = db.Column(db.Text, nullable=True)
    observacoes_gerais = db.Column(db.Text, nullable=True)
    
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    data_atualizacao = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamento
    paciente = db.relationship('Usuario', foreign_keys=[paciente_id], backref=db.backref('anamnese', uselist=False))

class AvaliacaoPsicometrica(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    paciente_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    psicologo_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    tipo_escala = db.Column(db.String(50), nullable=False) # 'PHQ-9', 'GAD-7'
    respostas_json = db.Column(db.Text, nullable=False)
    escore_total = db.Column(db.Integer, nullable=False)
    classificacao = db.Column(db.String(100), nullable=False)
    data = db.Column(db.DateTime, default=datetime.utcnow)

    paciente = db.relationship('Usuario', foreign_keys=[paciente_id], backref=db.backref('avaliacoes', lazy=True))

class DiarioEmocional(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    paciente_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    humor = db.Column(db.Integer, nullable=False) # 1 a 5
    emocoes = db.Column(db.String(255), nullable=True)
    nota = db.Column(db.Text, nullable=True)
    fator_desencadeante = db.Column(db.Text, nullable=True)
    alerta_crise = db.Column(db.Boolean, default=False)
    data = db.Column(db.DateTime, default=datetime.utcnow)

    paciente = db.relationship('Usuario', foreign_keys=[paciente_id], backref=db.backref('diarios', lazy=True))

class TermoConsentimento(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    paciente_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)

class Documento(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    paciente_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    psicologo_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    nome_arquivo = db.Column(db.String(255), nullable=False)
    caminho_arquivo = db.Column(db.String(512), nullable=False)
    tipo_documento = db.Column(db.String(50), nullable=True) # Laudo, Atestado, Receita, etc.
    data_upload = db.Column(db.DateTime, default=datetime.utcnow)

    paciente = db.relationship('Usuario', foreign_keys=[paciente_id], backref=db.backref('documentos', lazy=True))

    assinado = db.Column(db.Boolean, default=False)
    data_assinatura = db.Column(db.DateTime, nullable=True)
    ip_assinatura = db.Column(db.String(50), nullable=True)
    
    paciente = db.relationship('Usuario', foreign_keys=[paciente_id], backref=db.backref('termo', uselist=False))

class PlanoTerapeutico(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    paciente_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    psicologo_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    objetivos = db.Column(db.Text, nullable=False)
    intervencoes = db.Column(db.Text, nullable=False)
    frequencia = db.Column(db.String(50), nullable=True)
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    
    paciente = db.relationship('Usuario', foreign_keys=[paciente_id], backref=db.backref('plano_terapeutico', uselist=False))
