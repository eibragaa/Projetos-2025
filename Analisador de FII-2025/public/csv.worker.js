self.addEventListener('message', (event) => {
    console.log("Worker recebeu mensagem do main thread");
    const { csvText } = event.data;
    console.log("Tamanho do CSV recebido:", csvText.length);
    
    try {
        console.log("Importando parser...");
        importScripts('./src/js/data/parser.js');
        console.log("Parser importado com sucesso");
        
        console.log("Iniciando parsing do CSV...");
        const result = self.parseCSV(csvText);
        console.log("Parsing concluído. Número de registros:", result.length);
        
        console.log("Enviando resultado para main thread");
        self.postMessage({ success: true, data: result });
    } catch (e) {
        console.error("Erro no worker:", e);
        self.postMessage({ success: false, error: e.message });
    }
    
    console.log("Worker finalizando processamento");
});