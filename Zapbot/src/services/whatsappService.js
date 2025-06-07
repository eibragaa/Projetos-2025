const venom = require('venom-bot');
const venomOptions = require('../config/venomConfig');
const openaiService = require('./openaiService');

class WhatsAppService {
    constructor() {
        this.client = null;
        this.processingMessages = new Set(); // Controla mensagens em processamento
        this.typingIntervals = new Map(); // Controla intervalos de "digitando"
    }

    // Função auxiliar para formatar o número do WhatsApp
    formatPhoneNumber(number) {
        // Remove tudo que não for número
        const cleaned = number.replace(/\D/g, '');
        // Verifica se já tem @c.us no final
        if (number.endsWith('@c.us')) {
            return number;
        }
        // Adiciona @c.us no final se não tiver
        return `${cleaned}@c.us`;
    }

    async startTyping(userId) {
        try {
            await this.client.startTyping(userId, true);
            // Simula "digitando" a cada 20 segundos (WhatsApp limpa o status após ~25s)
            const interval = setInterval(async () => {
                try {
                    await this.client.startTyping(userId, true);
                } catch (error) {
                    console.error('Erro ao manter status digitando:', error);
                }
            }, 20000);
            this.typingIntervals.set(userId, interval);
        } catch (error) {
            console.error('Erro ao iniciar status digitando:', error);
        }
    }

    async stopTyping(userId) {
        try {
            const interval = this.typingIntervals.get(userId);
            if (interval) {
                clearInterval(interval);
                this.typingIntervals.delete(userId);
            }
            await this.client.startTyping(userId, false);
        } catch (error) {
            console.error('Erro ao parar status digitando:', error);
        }
    }

    async initialize() {
        try {
            // Inicializa o OpenAI primeiro
            const openaiInitialized = await openaiService.initialize();
            if (!openaiInitialized) {
                throw new Error('Não foi possível conectar ao assistente TreinoZap');
            }

            // Inicializa o WhatsApp
            this.client = await venom.create(
                'treinozap-session',
                (base64Qr, asciiQR, attempts) => {
                    console.log('QR Code gerado:', asciiQR);
                },
                (statusSession) => {
                    console.log('Status:', statusSession);
                },
                venomOptions
            );

            // Configura o handler de mensagens
            this.client.onMessage(async (message) => {
                // Ignora mensagens de grupo e mensagens já em processamento
                if (message.isGroupMsg || this.processingMessages.has(message.id)) {
                    return;
                }

                this.processingMessages.add(message.id);
                const userId = this.formatPhoneNumber(message.from);

                try {
                    const text = message.body;

                    // Comando para limpar histórico
                    if (text.toLowerCase() === 'limpar') {
                        await this.startTyping(userId);
                        await openaiService.clearHistory(userId);
                        await this.stopTyping(userId);
                        await this.client.sendText(userId, '🗑️ Histórico de conversa limpo! Nova conversa iniciada com o TreinoZap.');
                        return;
                    }

                    // Inicia o status de "digitando"
                    await this.startTyping(userId);

                    // Processa com OpenAI e envia a resposta
                    const response = await openaiService.processMessage(userId, text);
                    
                    // Para o status de "digitando" e envia a resposta
                    await this.stopTyping(userId);
                    await this.client.sendText(userId, response);

                } catch (error) {
                    console.error('Erro ao processar mensagem:', error);
                    try {
                        await this.stopTyping(userId);
                        await this.client.sendText(
                            userId,
                            '❌ Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente mais tarde.'
                        );
                    } catch (sendError) {
                        console.error('Erro ao enviar mensagem de erro:', sendError);
                    }
                } finally {
                    this.processingMessages.delete(message.id);
                }
            });

            console.log('✅ Interface WhatsApp do TreinoZap inicializada com sucesso!');
            return true;
        } catch (error) {
            console.error('Erro ao inicializar interface WhatsApp do TreinoZap:', error);
            return false;
        }
    }
}

module.exports = new WhatsAppService();
