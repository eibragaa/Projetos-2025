const whatsappService = require('../services/whatsappService');

class WhatsAppController {
    async sendMessage(req, res) {
        try {
            const { to, message } = req.body;
            
            if (!to || !message) {
                return res.status(400).json({ error: 'Número e mensagem são obrigatórios' });
            }

            const result = await whatsappService.sendMessage(to, message);
            
            if (result) {
                return res.status(200).json({ success: true, message: 'Mensagem enviada com sucesso' });
            } else {
                return res.status(500).json({ error: 'Erro ao enviar mensagem' });
            }
        } catch (error) {
            console.error('Erro no controller:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
}

module.exports = new WhatsAppController();
