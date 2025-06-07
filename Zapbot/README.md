# 🏋️‍♂️ TreinoZap - Seu Assistente de Treinos no WhatsApp

Um chatbot inteligente especializado em treinos e exercícios físicos, integrando WhatsApp com GPT-4 usando venom-bot e a API da OpenAI.

## 📋 Funcionalidades

### 💪 Especializado em Treinos
- Dicas e orientações sobre exercícios físicos
- Sugestões de treinos personalizados
- Informações sobre saúde e bem-estar
- Respostas contextuais sobre fitness

### 🔄 Integração com WhatsApp
- Conexão automática via QR Code
- Suporte a mensagens individuais (não funciona em grupos)
- Formatação automática de números de telefone
- Sistema anti-duplicação de mensagens
- Tratamento de erros robusto
- Feedback visual "digitando" durante processamento

### 🧠 Integração com GPT-4
- Utiliza o modelo mais recente GPT-4 Turbo
- Sistema de memória persistente por usuário
- Contexto mantido através do Assistants API
- Personalidade amigável e prestativa
- Suporte a emojis nas respostas

### 💬 Gerenciamento de Conversas
- Histórico de conversa individual por usuário
- Comando "limpar" para resetar conversas
- Manutenção automática do contexto
- Respostas contextuais inteligentes

### ⚙️ Recursos Técnicos
- Sistema de threads para cada usuário
- Gerenciamento de estado via OpenAI Assistants
- Tratamento de erros em múltiplas camadas
- Logs detalhados para debugging

## 🚀 Como Usar

### Pré-requisitos
- Node.js instalado
- Conta na OpenAI com API key
- WhatsApp instalado no celular

### Instalação
1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

### Configuração
1. Crie um arquivo `.env` na raiz do projeto
2. Adicione sua chave da API OpenAI:
```env
OPENAI_API_KEY=sua_chave_aqui
```

### Executando
```bash
npm run dev
```

### Primeiro Uso
1. Ao iniciar, um QR Code será exibido no console
2. Abra o WhatsApp no seu celular
3. Vá em Menu > Aparelhos conectados
4. Escaneie o QR Code
5. Pronto! O TreinoZap está funcionando

## 📝 Comandos Disponíveis

### Comando: limpar
- **Uso**: Envie "limpar" para o bot
- **Função**: Limpa todo o histórico da conversa
- **Quando usar**: Quando quiser começar uma nova conversa do zero

### Conversas Normais
- Envie qualquer mensagem relacionada a treinos
- O TreinoZap responderá usando GPT-4
- O contexto é mantido automaticamente
- As respostas são personalizadas e contextuais

## ⚠️ Limitações
- Não funciona em grupos
- Requer conexão com internet
- Necessita de uma API key válida da OpenAI
- Uma sessão por vez no WhatsApp

## 🔒 Segurança
- Não armazena mensagens localmente
- Usa sistema seguro de tokens da OpenAI
- Proteção contra processamento duplicado de mensagens
- Tratamento seguro de números de telefone

## 🛠️ Tecnologias Utilizadas
- Node.js
- Venom-bot para WhatsApp
- OpenAI GPT-4 Turbo
- Assistants API da OpenAI
- Sistema de Threads para contexto

## 📊 Estrutura do Projeto
```
TreinoZap/
  ├── src/
  │   ├── config/
  │   │   └── venomConfig.js
  │   └── services/
  │       ├── openaiService.js
  │       └── whatsappService.js
  ├── .env
  ├── .gitignore
  └── README.md
```
