require('dotenv').config();
const whatsappService = require('./services/whatsappService');

// Verifica se a chave da API OpenAI está configurada
if (!process.env.OPENAI_API_KEY) {
    console.error('⚠️ A chave da API OpenAI não está configurada! Configure a variável de ambiente OPENAI_API_KEY');
    process.exit(1);
}

const startBot = async () => {
    try {
        console.log('🤖 Iniciando o bot...');
        
        // Inicializa o serviço do WhatsApp
        const initialized = await whatsappService.initialize();
        if (!initialized) {
            console.error('❌ Não foi possível inicializar o serviço do WhatsApp');
            process.exit(1);
        }

        console.log('✅ Bot iniciado com sucesso!');
        console.log('📱 Aguardando mensagens...');
        
    } catch (error) {
        console.error('❌ Erro ao iniciar o bot:', error);
        process.exit(1);
    }
};

startBot();
