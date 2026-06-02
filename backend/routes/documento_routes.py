from flask import Blueprint, request, jsonify, send_file
import os
from werkzeug.utils import secure_filename
from models import db, Documento, Paciente, Usuario
from datetime import datetime

documento_bp = Blueprint('documento_bp', __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@documento_bp.route('/api/documentos', methods=['POST'])
def upload_documento():
    if 'file' not in request.files:
        return jsonify({'error': 'Nenhum arquivo enviado'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Nenhum arquivo selecionado'}), 400

    paciente_id = request.form.get('paciente_id')
    psicologo_id = request.form.get('psicologo_id')
    tipo_documento = request.form.get('tipo_documento', 'Outros')

    if not paciente_id or not psicologo_id:
        return jsonify({'error': 'paciente_id e psicologo_id são obrigatórios'}), 400

    # Sanitização do arquivo
    allowed_extensions = {'.pdf', '.png', '.jpg', '.jpeg'}
    filename, file_extension = os.path.splitext(file.filename)
    if file_extension.lower() not in allowed_extensions:
        return jsonify({'error': f'Formato não permitido. Formatos válidos: {", ".join(allowed_extensions)}'}), 400

    # Limite manual (já que request.max_content_length pode ser bypassado antes de ler, dependendo do WSGI)
    file.seek(0, os.SEEK_END)
    file_length = file.tell()
    if file_length > 5 * 1024 * 1024:  # 5MB
        return jsonify({'error': 'Arquivo excede o limite de 5MB'}), 413
    file.seek(0)  # reseta ponteiro para salvar

    filename = secure_filename(file.filename)
    # Add timestamp to prevent overwriting
    unique_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
    filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
    
    from supabase_client import supabase_client
    
    try:
        if supabase_client:
            # Upload para Supabase Storage (bucket 'documentos')
            file.seek(0)
            file_bytes = file.read()
            # Precisamos criar o bucket 'documentos' no Supabase se não existir
            res = supabase_client.storage.from_('documentos').upload(
                path=unique_filename,
                file=file_bytes,
                file_options={"content-type": file.content_type}
            )
            # Pegar a URL pública (ou assinada, para segurança)
            # Vamos salvar apenas o path no banco de dados e usar supabase_client.storage.from_('documentos').create_signed_url(doc.caminho_arquivo, 60) no download
            caminho_para_salvar = unique_filename
        else:
            # Upload Local (Fallback)
            file.seek(0)
            file.save(filepath)
            caminho_para_salvar = filepath

        novo_doc = Documento(
            paciente_id=paciente_id,
            psicologo_id=psicologo_id,
            nome_arquivo=filename,
            caminho_arquivo=caminho_para_salvar,
            tipo_documento=tipo_documento
        )
        db.session.add(novo_doc)
        db.session.commit()
        return jsonify({'message': 'Documento salvo com sucesso', 'id': novo_doc.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@documento_bp.route('/api/documentos/paciente/<int:paciente_id>', methods=['GET'])
def listar_documentos(paciente_id):
    documentos = Documento.query.filter_by(paciente_id=paciente_id).order_by(Documento.data_upload.desc()).all()
    result = []
    for doc in documentos:
        result.append({
            'id': doc.id,
            'nome_arquivo': doc.nome_arquivo,
            'tipo_documento': doc.tipo_documento,
            'data_upload': doc.data_upload.isoformat()
        })
    return jsonify(result), 200

@documento_bp.route('/api/documentos/<int:doc_id>/download', methods=['GET'])
def download_documento(doc_id):
    doc = Documento.query.get_or_404(doc_id)
    from supabase_client import supabase_client
    
    if supabase_client and not os.path.isabs(doc.caminho_arquivo):
        # Baixar do Supabase
        try:
            res = supabase_client.storage.from_('documentos').create_signed_url(doc.caminho_arquivo, 60) # URL válida por 60 seg
            if res.get('signedURL'):
                from flask import redirect
                return redirect(res['signedURL'])
            else:
                return jsonify({'error': 'Falha ao gerar URL de download'}), 500
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        # Baixar local (Fallback)
        if not os.path.exists(doc.caminho_arquivo):
            return jsonify({'error': 'Arquivo não encontrado localmente'}), 404
        return send_file(doc.caminho_arquivo, as_attachment=True, download_name=doc.nome_arquivo)
