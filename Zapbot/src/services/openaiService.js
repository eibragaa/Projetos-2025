const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

class OpenAIService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        
        this.assistant = null;
        this.threads = new Map(); // Mantém apenas referência temporária das threads ativas
    }

    async initialize() {
        try {
            // Conecta ao assistente TreinoZap existente na OpenAI
            const assistants = await this.openai.beta.assistants.list();
            this.assistant = assistants.data.find(a => a.name === 'TreinoZap');

            if (!this.assistant) {
                throw new Error('Assistente TreinoZap não encontrado na OpenAI. Por favor, crie o assistente primeiro.');
            }

            console.log('✅ Conectado ao assistente TreinoZap com sucesso!');
            return true;
        } catch (error) {
            console.error('❌ Erro ao conectar ao TreinoZap:', error);
            return false;
        }
    }

    async processMessage(userId, message) {
        try {
            let threadId = this.threads.get(userId);
            let maxRetries = 3;
            let attempt = 0;
            
            if (!threadId) {
                // Cria uma nova thread com metadata
                const thread = await this.openai.beta.threads.create({
                    metadata: {
                        userId: userId,
                        platform: 'whatsapp',
                        createdAt: new Date().toISOString()
                    }
                });
                threadId = thread.id;
                this.threads.set(userId, threadId);
            }

            while (attempt < maxRetries) {
                try {
                    // Adiciona a mensagem à thread
                    await this.openai.beta.threads.messages.create(threadId, {
                        role: 'user',
                        content: message,
                        metadata: {
                            timestamp: new Date().toISOString(),
                            platform: 'whatsapp'
                        }
                    });

                    // Executa o assistente com configurações específicas
                    const run = await this.openai.beta.threads.runs.create(threadId, {
                        assistant_id: this.assistant.id
                    });

                    // Aguarda a conclusão do processamento
                    let runStatus = await this.openai.beta.threads.runs.retrieve(threadId, run.id);
                    let maxStatusChecks = 30; // 30 segundos no máximo
                    let statusChecks = 0;
                    
                    while (runStatus.status !== 'completed' && statusChecks < maxStatusChecks) {
                        if (runStatus.status === 'failed') {
                            throw new Error('Falha ao processar mensagem');
                        }
                        if (runStatus.status === 'expired') {
                            throw new Error('Tempo de processamento expirou');
                        }
                        
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        runStatus = await this.openai.beta.threads.runs.retrieve(threadId, run.id);
                        statusChecks++;
                    }

                    if (statusChecks >= maxStatusChecks) {
                        throw new Error('Tempo limite excedido');
                    }

                    // Obtém as mensagens mais recentes com todo o contexto
                    const messages = await this.openai.beta.threads.messages.list(threadId);
                    const lastMessage = messages.data[0];

                    return lastMessage.content[0].text.value;

                } catch (error) {
                    attempt++;
                    console.error(`Tentativa ${attempt} falhou:`, error);
                    
                    if (attempt === maxRetries) {
                        throw error;
                    }
                    
                    // Espera um pouco antes de tentar novamente
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        } catch (error) {
            console.error('Erro ao processar mensagem com OpenAI:', error);
            return 'Desculpe, tive um problema ao processar sua mensagem. Pode tentar novamente?';
        }
    }

    async clearHistory(userId) {
        try {
            const threadId = this.threads.get(userId);
            if (threadId) {
                // Deleta a thread antiga na OpenAI
                await this.openai.beta.threads.del(threadId);
                this.threads.delete(userId);
                
                // Cria uma nova thread com metadata
                const thread = await this.openai.beta.threads.create({
                    metadata: {
                        userId: userId,
                        platform: 'whatsapp',
                        createdAt: new Date().toISOString()
                    }
                });
                this.threads.set(userId, thread.id);
            }
        } catch (error) {
            console.error('Erro ao limpar histórico:', error);
            throw error;
        }
    }
}

module.exports = new OpenAIService();
