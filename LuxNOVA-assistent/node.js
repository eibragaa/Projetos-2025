const venom = require('venom-bot');

venom
  .create({
    session: 'LuxNOVA', // Nome da sessão (pode ser qualquer nome)
    multidevice: true, // Necessário para usar o WhatsApp Web em vários dispositivos
    headless: 'new', // Modo headless (sem interface gráfica) - 'new' é recomendado
    logQR: true, // Exibe o QR Code no terminal
    autoClose: 60000, // Fecha o navegador após 60 segundos sem atividade (opcional)
  })
  .then((client) => start(client))
  .catch((erro) => {
    console.log(erro);
  });

function start(client) {
  console.log('LuxNOVA está pronto para conversar!');

  // Aqui vamos adicionar a lógica do chatbot mais tarde
  client.onMessage((message) => {
    console.log('Mensagem recebida:', message);
    // Por enquanto, vamos apenas responder com um "Olá!"
    if (message.body === 'Olá' || message.body === 'ola' || message.body === 'Oi' || message.body === 'oi') {
      client
        .sendText(message.from, 'Olá! Sou o LuxNOVA, seu assistente virtual.')
        .then((result) => {
          console.log('Mensagem enviada:', result);
        })
        .catch((erro) => {
          console.error('Erro ao enviar mensagem:', erro);
        });
    }
  });
}
