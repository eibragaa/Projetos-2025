from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv
import os
import openai
from twilio.rest import Client
import stripe
from datetime import datetime
import sqlite3
from pathlib import Path
import requests
from io import BytesIO
from PIL import Image
import base64

# Carrega variáveis de ambiente
load_dotenv()

# Configuração das APIs
openai.api_key = os.getenv('OPENAI_API_KEY')
twilio_client = Client(os.getenv('TWILIO_SID'), os.getenv('TWILIO_TOKEN'))
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

app = Flask(__name__)

# Configuração do banco de dados
def get_db():
    db = sqlite3.connect('kcalzap.db')
    db.row_factory = sqlite3.Row
    return db

def init_db():
    db = get_db()
    with app.open_resource('schema.sql', mode='r') as f:
        db.cursor().executescript(f.read())
    db.commit()

def get_or_create_user(telefone):
    db = get_db()
    cursor = db.cursor()
    
    # Tenta encontrar o usuário
    cursor.execute('SELECT * FROM usuarios WHERE telefone = ?', (telefone,))
    user = cursor.fetchone()
    
    if user is None:
        # Cria novo usuário se não existir
        cursor.execute('''
            INSERT INTO usuarios (telefone, meta_calorias, analises_restantes)
            VALUES (?, 2000, 5)
        ''', (telefone,))
        db.commit()
        
        cursor.execute('SELECT * FROM usuarios WHERE telefone = ?', (telefone,))
        user = cursor.fetchone()
    
    return dict(user)

def analisar_imagem_com_gpt4(image_url):
    try:
        # Baixa a imagem
        response = requests.get(image_url)
        img = Image.open(BytesIO(response.content))
        
        # Converte a imagem para base64
        buffered = BytesIO()
        img.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        # Faz a análise com GPT-4 Vision
        response = openai.chat.completions.create(
            model="gpt-4-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Analise esta imagem de refeição e forneça as seguintes informações em formato JSON:\n"
                                  "1. Descrição breve da refeição\n"
                                  "2. Calorias totais estimadas\n"
                                  "3. Gramas de carboidratos\n"
                                  "4. Gramas de proteínas\n"
                                  "5. Gramas de gorduras"
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{img_str}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=500
        )
        
        # Extrai a resposta do GPT-4
        analise = response.choices[0].message.content
        return analise
    except Exception as e:
        print(f"Erro ao analisar imagem: {e}")
        return None

def salvar_refeicao(user_id, foto_url, analise):
    try:
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute('''
            INSERT INTO refeicoes (usuario_id, foto_url, descricao, calorias, carboidratos, proteinas, gorduras)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, foto_url, analise['descricao'], analise['calorias'], 
              analise['carboidratos'], analise['proteinas'], analise['gorduras']))
        
        db.commit()
        return True
    except Exception as e:
        print(f"Erro ao salvar refeição: {e}")
        return False

def atualizar_analises_restantes(user_id):
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('''
        UPDATE usuarios 
        SET analises_restantes = analises_restantes - 1 
        WHERE id = ? AND analises_restantes > 0
    ''', (user_id,))
    
    db.commit()
    return cursor.rowcount > 0

# Rotas principais
@app.route('/')
def index():
    # Dados mockados para teste inicial
    dados = {
        'calorias_hoje': 0,
        'meta_calorias': 2000,
        'horas_jejum': 0,
        'meta_jejum': 16,
        'analises_restantes': 5,
        'plano': 'gratuito',
        'carboidratos': 0,
        'proteinas': 0,
        'gorduras': 0,
        'ultimas_refeicoes': []
    }
    return render_template('visao_geral.html', **dados)

@app.route('/categorias')
def categorias():
    return render_template('categorias.html')

@app.route('/ultimas-refeicoes')
def ultimas_refeicoes():
    return render_template('ultimas_refeicoes.html')

# Webhook do WhatsApp (Twilio)
@app.route('/webhook', methods=['POST'])
def webhook():
    try:
        message = request.form.get('Body', '').lower()
        media_url = request.form.get('MediaUrl0', '')
        from_number = request.form.get('From', '')
        
        # Obtém ou cria usuário
        user = get_or_create_user(from_number)
        
        # Se recebeu uma imagem
        if media_url:
            # Verifica se usuário tem análises disponíveis
            if user['plano'] == 'gratuito' and user['analises_restantes'] <= 0:
                resposta = ("Você atingiu o limite de análises gratuitas. "
                          "Faça upgrade para o plano premium para análises ilimitadas: "
                          "https://seu-site.com/subscribe")
            else:
                # Analisa a imagem
                analise = analisar_imagem_com_gpt4(media_url)
                if analise:
                    # Salva a refeição
                    if salvar_refeicao(user['id'], media_url, analise):
                        # Atualiza contagem de análises restantes para usuários gratuitos
                        if user['plano'] == 'gratuito':
                            atualizar_analises_restantes(user['id'])
                        
                        resposta = (f"Análise da sua refeição:\n\n"
                                  f"🍽 {analise['descricao']}\n"
                                  f"📊 Calorias: {analise['calorias']}kcal\n"
                                  f"🥖 Carboidratos: {analise['carboidratos']}g\n"
                                  f"🥩 Proteínas: {analise['proteinas']}g\n"
                                  f"🥑 Gorduras: {analise['gorduras']}g")
                    else:
                        resposta = "Desculpe, ocorreu um erro ao salvar sua refeição."
                else:
                    resposta = "Desculpe, não consegui analisar esta imagem. Tente enviar outra foto."
        
        # Se recebeu uma mensagem de texto
        elif message:
            if 'oi' in message or 'olá' in message:
                resposta = ("Olá! Bem-vindo ao KcalZap! 📱\n\n"
                          "Envie uma foto da sua refeição para eu analisar as calorias e nutrientes! 📸\n\n"
                          "Você também pode:\n"
                          "- Digite 'status' para ver seu progresso\n"
                          "- Digite 'ajuda' para ver todos os comandos\n"
                          "- Digite 'premium' para conhecer nosso plano premium")
            
            elif message == 'status':
                resposta = (f"Seu Status:\n\n"
                          f"📊 Plano: {user['plano'].title()}\n"
                          f"🎯 Meta de calorias: {user['meta_calorias']}kcal\n"
                          f"📸 Análises restantes: {user['analises_restantes'] if user['plano'] == 'gratuito' else 'Ilimitadas'}")
            
            elif message == 'ajuda':
                resposta = ("Comandos disponíveis:\n\n"
                          "📸 Envie uma foto para análise\n"
                          "📊 'status' - Ver seu progresso\n"
                          "💎 'premium' - Conhecer plano premium\n"
                          "🎯 'meta XXX' - Definir meta de calorias\n"
                          "❓ 'ajuda' - Ver esta mensagem")
            
            elif message == 'premium':
                resposta = ("🌟 Plano Premium KcalZap:\n\n"
                          "✨ Análises ilimitadas de refeições\n"
                          "📊 Relatórios detalhados\n"
                          "🎯 Sugestões personalizadas\n"
                          "💪 Suporte prioritário\n\n"
                          "Apenas R$19,90/mês!\n"
                          "Acesse: https://seu-site.com/subscribe")
            
            elif message.startswith('meta '):
                try:
                    nova_meta = int(message.split('meta ')[1])
                    if 1000 <= nova_meta <= 5000:
                        db = get_db()
                        cursor = db.cursor()
                        cursor.execute('UPDATE usuarios SET meta_calorias = ? WHERE id = ?', 
                                     (nova_meta, user['id']))
                        db.commit()
                        resposta = f"✅ Meta atualizada para {nova_meta} calorias!"
                    else:
                        resposta = "❌ Por favor, defina uma meta entre 1000 e 5000 calorias."
                except ValueError:
                    resposta = "❌ Formato inválido. Use 'meta XXX' onde XXX é o número de calorias."
            
            else:
                resposta = ("Não entendi. Envie uma foto da sua refeição ou digite 'ajuda' "
                          "para ver os comandos disponíveis.")
        
        else:
            resposta = "Por favor, envie uma foto da sua refeição ou digite 'ajuda' para ver os comandos disponíveis."
        
        # Envia resposta via Twilio
        twilio_client.messages.create(
            body=resposta,
            from_='whatsapp:+14155238886',  # Substitua pelo número do Sandbox do Twilio
            to=from_number
        )
        
        return '', 204
        
    except Exception as e:
        print(f"Erro no webhook: {e}")
        return '', 500

# Rotas da API
@app.route('/api/analisar-foto', methods=['POST'])
def analisar_foto():
    # TODO: Implementar análise de fotos com OpenAI
    pass

@app.route('/api/sugerir-jejum', methods=['POST'])
def sugerir_jejum():
    # TODO: Implementar sugestões de jejum
    pass

# Rotas de pagamento
@app.route('/subscribe')
def subscribe():
    return render_template('subscribe.html')

@app.route('/webhook-stripe', methods=['POST'])
def webhook_stripe():
    # TODO: Implementar webhook do Stripe
    pass

if __name__ == '__main__':
    # Verifica se o banco de dados existe
    if not Path('kcalzap.db').exists():
        init_db()
    app.run(debug=True)
