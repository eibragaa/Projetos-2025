================================================================================
                         README - KcalZap
================================================================================

KcalZap é um aplicativo acessado via WhatsApp que ajuda usuários a rastrear calorias
de refeições (enviando fotos), categorizar nutrientes (carboidratos, proteínas,
gorduras), receber sugestões de jejum intermitente e refeições básicas, e visualizar
os dados em um painel web independente. O objetivo é simplificar o controle de
alimentação de forma prática e conversacional.

--------------------------------------------------------------------------------
SOBRE O PROJETO
--------------------------------------------------------------------------------

KcalZap foi desenhado para usuários que querem monitorar sua dieta pelo WhatsApp.
Funcionalidades principais:
- Analisa fotos de refeições com IA (OpenAI API) para identificar alimentos.
- Calcula calorias e categoriza nutrientes usando uma tabela fixa.
- Faz perguntas (ex.: "Qual seu objetivo?") e sugere jejum (ex.: "Tente 16/8") ou
  refeições (ex.: "Frango com salada").
- Exibe um painel web com Visão Geral, Categorias e Últimas Refeições.
- Inclui um sistema de assinatura recorrente com Stripe.

--------------------------------------------------------------------------------
FUNCIONALIDADES
--------------------------------------------------------------------------------

BOT NO WHATSAPP:
- Reconhecimento de imagens e cálculo de calorias.
- Interação conversacional com perguntas e sugestões.
- Sugestões de jejum intermitente personalizadas.

PAINEL WEB:
- Visão Geral: calorias consumidas, meta e horas jejuadas.
- Categorias: proporção de nutrientes com gráfico.
- Últimas Refeições: lista com filtros (Hoje, Essa semana).

ASSINATURA:
- Gratuito: 5 análises/mês, sugestões básicas.
- Premium: R$ 19,90/mês, análises ilimitadas, relatórios.
- Anual: R$ 199,90/ano, com desconto.

--------------------------------------------------------------------------------
TECNOLOGIAS UTILIZADAS
--------------------------------------------------------------------------------

- Backend: Flask (Python)
- WhatsApp: Twilio API
- Reconhecimento: OpenAI API (GPT-4 Vision/GPT-4)
- Banco de Dados: SQLite (MVP)
- Painel: Flask com HTML/CSS
- Pagamentos: Stripe API
- Hospedagem: Vercel

--------------------------------------------------------------------------------
ESTRUTURA DO PROJETO
--------------------------------------------------------------------------------

kcalzap/
|-- api/
|   |-- app.py              (código principal Flask)
|   |-- (outros arquivos Python)
|-- static/                 (CSS, JS)
|-- templates/              (HTML para painel)
|   |-- visao_geral.html
|   |-- categorias.html
|   |-- ultimas_refeicoes.html
|   |-- subscribe.html
|-- kcalzap.db             (banco SQLite)
|-- requirements.txt       (dependências)
|-- vercel.json            (configuração Vercel)

--------------------------------------------------------------------------------
COMO RODAR LOCALMENTE
--------------------------------------------------------------------------------

PRE-REQUISITOS:
- Python 3.8+
- Git
- Contas: Twilio, OpenAI, Stripe, Vercel

PASSOS:
1. Clone o repositório:
   git clone https://github.com/seu-usuario/kcalzap.git
   cd kcalzap

2. Crie um ambiente virtual:
   python -m venv venv
   source venv/bin/activate  (Linux/Mac)
   venv\Scripts\activate     (Windows)

3. Instale dependências:
   pip install -r requirements.txt

4. Configure variáveis de ambiente (.env):
   OPENAI_API_KEY=sua-chave-openai
   TWILIO_SID=seu-twilio-sid
   TWILIO_TOKEN=seu-twilio-token
   STRIPE_SECRET_KEY=sua-stripe-secret-key
   STRIPE_PUBLISHABLE_KEY=sua-stripe-publishable-key
   STRIPE_WEBHOOK_SECRET=seu-webhook-secret

5. Configure o banco de dados (sqlite3 kcalzap.db):
   CREATE TABLE Usuarios (...);
   CREATE TABLE Refeicoes (...);
   CREATE TABLE Jejum (...);

6. Execute o app:
   python api/app.py
   Acesse em http://localhost:5000

--------------------------------------------------------------------------------
DEPLOY NA VERCEL
--------------------------------------------------------------------------------

1. Crie vercel.json:
   {
     "version": 2,
     "builds": [{"src": "api/app.py", "use": "@vercel/python"}],
     "routes": [{"src": "/(.*)", "dest": "api/app.py"}]
   }

2. Faça push para GitHub:
   git add .
   git commit -m "Preparando deploy"
   git push origin main

3. Importe na Vercel:
   - Novo projeto > Importe repositório.
   - Adicione variáveis de ambiente.
   - Deploy!

4. Configure webhook Twilio para https://kcalzap.vercel.app/webhook

--------------------------------------------------------------------------------
SISTEMA DE ASSINATURA
--------------------------------------------------------------------------------

- Gratuito: 5 análises/mês.
- Premium: R$ 19,90/mês, análises ilimitadas.
- Anual: R$ 199,90/ano.

Teste com cartões Stripe de teste (ex.: 4242 4242 4242 4242).

--------------------------------------------------------------------------------
PRÓXIMOS PASSOS
--------------------------------------------------------------------------------

1. Melhorar reconhecimento de imagens (ex.: estimar porções).
2. Aprimorar conversação (perguntas personalizadas).
3. Adicionar notificações (lemretes via WhatsApp).
4. Escalar banco (PostgreSQL, Firebase).
5. Marketing (beta testers, redes sociais).

--------------------------------------------------------------------------------
CONTRIBUINDO
--------------------------------------------------------------------------------

1. Faça fork do repositório.
2. Crie uma branch (git checkout -b feature/nova-func).
3. Commit (git commit -m "Adiciona nova funcionalidade").
4. Push (git push origin feature/nova-func).
5. Abra um Pull Request.

--------------------------------------------------------------------------------
CONTATO
--------------------------------------------------------------------------------

Sugestões ou dúvidas: email@example.com

--------------------------------------------------------------------------------
LICENÇA
--------------------------------------------------------------------------------

MIT License (veja LICENSE)

================================================================================