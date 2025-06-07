// Seletores de Elementos Globais
const titleForm = document.getElementById('titleForm');
const generateButton = document.getElementById('generateButton');
const loadingIndicator = document.getElementById('loadingIndicator');
const resultsDiv = document.getElementById('results');
const errorMessageDiv = document.getElementById('errorMessage');

const geminiAnalysisForm = document.getElementById('geminiAnalysisForm');
const analyzeWithGeminiButton = document.getElementById('analyzeWithGeminiButton');
const geminiLoadingIndicator = document.getElementById('geminiLoadingIndicator');
const geminiErrorMessageDiv = document.getElementById('geminiErrorMessage');
const geminiAnalysisResultDiv = document.getElementById('geminiAnalysisResult');

// Constantes da API
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama3-8b-8192';
const GEMINI_API_KEY = ""; // Gerenciada pelo ambiente para gemini-2.0-flash no Canvas
const GEMINI_API_URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=';

// Constantes de Texto de Botão
const BUTTON_TEXT_GENERATING_GROQ = 'Gerando...';
const BUTTON_TEXT_ANALYZING_GEMINI = 'Analisando...';


// Event Listener para Geração de Títulos com Groq
titleForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    clearError(errorMessageDiv);
    resultsDiv.innerHTML = ''; 

    const groqApiKey = document.getElementById('apiKey').value.trim(); 
    const mainTopic = document.getElementById('mainTopic').value.trim();
    const keywords = document.getElementById('keywords').value.trim();
    const titleStyle = document.getElementById('titleStyle').value;
    const numSuggestions = parseInt(document.getElementById('numSuggestions').value);

    if (!groqApiKey || !mainTopic) {
        displayError("Por favor, preencha a Chave API Groq e o Tema Principal.", errorMessageDiv);
        return;
    }

    setLoadingState(generateButton, loadingIndicator, true, BUTTON_TEXT_GENERATING_GROQ);

    const promptContent = buildGroqPrompt(mainTopic, keywords, titleStyle, numSuggestions);
    const payload = {
        model: GROQ_MODEL,
        messages: [
            { role: "system", content: "Você é um especialista em marketing digital e criação de títulos para vídeos do YouTube, focado em otimização para viralização e CTR." },
            { role: "user", content: promptContent }
        ],
        temperature: 0.8,
        max_tokens: 200 + (numSuggestions * 35),
        n: 1
    };

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqApiKey}` },
            body: JSON.stringify(payload)
        });

        const data = await handleApiResponse(response, "Groq");
        const titlesArray = parseGroqResponse(data);
        displayTitles(titlesArray);

    } catch (error) {
        console.error('Erro ao gerar títulos com Groq:', error);
        displayError(error.message || "Ocorreu um erro ao buscar os títulos com Groq.", errorMessageDiv);
    } finally {
        setLoadingState(generateButton, loadingIndicator, false, generateButton.dataset.originalText);
    }
});

// Event Listener para Análise Geral com Gemini
geminiAnalysisForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    clearError(geminiErrorMessageDiv);
    geminiAnalysisResultDiv.innerHTML = '';

    const titleToAnalyze = document.getElementById('titleToAnalyze').value.trim();
    if (!titleToAnalyze) {
        displayError("Por favor, insira um título para ser analisado.", geminiErrorMessageDiv);
        return;
    }

    setLoadingState(analyzeWithGeminiButton, geminiLoadingIndicator, true, BUTTON_TEXT_ANALYZING_GEMINI);
    
    const promptForGemini = buildGeminiAnalysisPrompt(titleToAnalyze);
    const payload = {
        contents: [{ role: "user", parts: [{ text: promptForGemini }] }],
        generationConfig: { temperature: 0.7 }
    };
    const geminiApiUrl = `${GEMINI_API_URL_BASE}${GEMINI_API_KEY}`;

    try {
        const response = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await handleApiResponse(response, "Gemini");
        const analysisText = parseGeminiResponse(result);
        displayGeminiAnalysis(analysisText);
    } catch (error) {
        console.error('Erro ao analisar título com Gemini:', error);
        displayError(error.message || "Ocorreu um erro ao buscar a análise com Gemini.", geminiErrorMessageDiv);
    } finally {
        setLoadingState(analyzeWithGeminiButton, geminiLoadingIndicator, false, analyzeWithGeminiButton.dataset.originalText);
    }
});

// --- Funções Auxiliares ---

function buildGroqPrompt(mainTopic, keywords, titleStyle, numSuggestions) {
    let prompt = `Gere ${numSuggestions} sugestões de títulos criativos e otimizados para um vídeo do YouTube.`;
    prompt += `\nTema Principal: "${mainTopic}"`;
    if (keywords) prompt += `\nPalavras-chave: "${keywords}"`;
    prompt += `\nEstilo do Título: "${titleStyle}"`;
    prompt += `\n\nOs títulos devem ser:\n- Otimizados para SEO e CTR.\n- Seguir padrões de vídeos virais.\n- Chamativos, despertar curiosidade e/ou oferecer valor claro.\n- Adequados para YouTube.\n- Cada título em uma nova linha, sem marcadores.`;
    prompt += `\n\nExemplos (NÃO use estes):\nREVELEI O SEGREDO DOS MILIONÁRIOS!\nTOP 5 GADGETS QUE VOCÊ PRECISA TER EM 2024`;
    prompt += `\n\nPor favor, gere os ${numSuggestions} títulos agora:`;
    return prompt;
}

function buildGeminiAnalysisPrompt(titleToAnalyze) {
    return `Analise o seguinte título de vídeo do YouTube: "${titleToAnalyze}". 
Forneça uma análise detalhada considerando:
1.  **Pontos Fortes:** (SEO, CTR, clareza, curiosidade, engajamento)
2.  **Pontos de Melhoria:** (Seja específico)
3.  **Sugestões Alternativas:** (2-3 sugestões otimizadas com justificativa)
4.  **Potencial de Viralização:** (Baixo, Médio, Alto e por quê?)
Formate a resposta em markdown claro.`;
}

function buildGeminiRefinementPrompt(title) {
    return `Analise brevemente o seguinte título de vídeo do YouTube: "${title}".
Destaque 1 ponto forte e 1 ponto de melhoria.
Em seguida, ofereça 2-3 sugestões de títulos alternativos otimizados para maior engajamento e CTR.
Formate a resposta de forma concisa, usando markdown para cabeçalhos simples (###) e listas.`;
}

async function handleApiResponse(response, apiName) {
    const data = await response.json().catch(() => ({ message: response.statusText }));
    if (!response.ok) {
        console.error(`API ${apiName} Error Data:`, data);
        let errorMsg = `Erro na API ${apiName}: ${response.status} - ${data.error?.message || data.message || 'Erro desconhecido'}`;
        if (response.status === 401) errorMsg = `Erro de Autenticação ${apiName}: Verifique sua Chave API, se aplicável.`;
        if (response.status === 429) errorMsg = `Limite de requisições da API ${apiName} atingido.`;
        if (data.error?.message?.includes("Model not found")) errorMsg = `Modelo ${apiName} não encontrado ou não disponível.`;
        throw new Error(errorMsg);
    }
    return data;
}

function parseGroqResponse(data) {
    if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
        return data.choices[0].message.content.split('\n').map(t => t.trim()).filter(t => t.length > 0 && !t.startsWith("Aqui estão") && !t.startsWith("Claro,"));
    }
    console.error('Resposta da API Groq inesperada:', data);
    throw new Error("A API Groq não retornou sugestões no formato esperado.");
}

function parseGeminiResponse(result) {
    if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
        return result.candidates[0].content.parts[0].text;
    }
    console.error('Resposta da API Gemini inesperada:', result);
    throw new Error("A API Gemini não retornou uma resposta no formato esperado.");
}

function setLoadingState(button, loaderElement, isLoading, buttonText) {
    if (isLoading) {
        loaderElement.classList.remove('hidden');
        button.disabled = true;
        button.textContent = buttonText;
    } else {
        loaderElement.classList.add('hidden');
        button.disabled = false;
        button.textContent = button.dataset.originalText; 
    }
}
// Guardar texto original do botão para restaurar
document.addEventListener('DOMContentLoaded', () => {
    [generateButton, analyzeWithGeminiButton].forEach(btn => {
        if (btn) btn.dataset.originalText = btn.textContent;
    });
});


function displayTitles(titles) {
    resultsDiv.innerHTML = '<h2 class="results-title">Sugestões de Títulos (Groq)</h2>';
    if (titles.length === 0) {
        resultsDiv.innerHTML += '<p class="text-gray-600 text-center">Nenhuma sugestão de título foi gerada pelo Groq.</p>';
        return;
    }
    const ul = document.createElement('ul');
    ul.className = 'space-y-3';
    titles.forEach((title, index) => {
        const li = document.createElement('li');
        li.className = 'md3-card flex flex-col p-4';
        
        const titleRow = document.createElement('div');
        titleRow.className = 'flex justify-between items-center w-full';

        const titleSpan = document.createElement('span');
        titleSpan.textContent = title;
        titleSpan.className = 'flex-grow mr-4 text-gray-800 text-base';
        
        const viralScore = Math.floor(Math.random() * 101);
        const scoreBadge = createScoreBadge(viralScore);

        const copyButton = createActionButton('Copiar', 'copy-button', () => copyToClipboard(title, copyButton));
        const refineButton = createActionButton('✨ Analisar/Refinar', 'md3-button-tertiary flex-shrink-0', () => handleIndividualTitleRefinement(title, `refinement-result-${index}`, refineButton));
        
        const actionsWrapper = document.createElement('div');
        actionsWrapper.className = 'flex items-center flex-shrink-0';
        actionsWrapper.appendChild(scoreBadge);
        actionsWrapper.appendChild(refineButton);
        actionsWrapper.appendChild(copyButton);
        
        titleRow.appendChild(titleSpan);
        titleRow.appendChild(actionsWrapper); 
        li.appendChild(titleRow);

        const refinementResultContainer = document.createElement('div');
        refinementResultContainer.id = `refinement-result-${index}`;
        refinementResultContainer.className = 'w-full mt-3';
        li.appendChild(refinementResultContainer);

        ul.appendChild(li);
    });
    resultsDiv.appendChild(ul);
}

function createScoreBadge(score) {
    const badge = document.createElement('div');
    badge.textContent = score;
    badge.className = 'score-badge flex-shrink-0';
    if (score <= 40) badge.classList.add('score-red');
    else if (score <= 70) badge.classList.add('score-yellow');
    else badge.classList.add('score-green');
    return badge;
}

function createActionButton(text, className, onClickHandler) {
    const button = document.createElement('button');
    button.innerHTML = text; // Use innerHTML para emojis
    button.className = className;
    button.onclick = onClickHandler;
    button.dataset.originalText = text; // Para restaurar após "Copiado!" ou loading
    return button;
}

async function handleIndividualTitleRefinement(title, resultContainerId, buttonElement) {
    const resultContainer = document.getElementById(resultContainerId);
    resultContainer.innerHTML = ''; 
    
    const tempLoader = document.createElement('div');
    tempLoader.className = 'loader loader-gemini loader-gemini-small inline-block';
    buttonElement.parentNode.insertBefore(tempLoader, buttonElement.nextSibling);
    buttonElement.disabled = true;
    const originalButtonText = buttonElement.dataset.originalText; 

    const geminiApiUrl = `${GEMINI_API_URL_BASE}${GEMINI_API_KEY}`;
    const promptForRefinement = buildGeminiRefinementPrompt(title);
    const payload = {
        contents: [{ role: "user", parts: [{ text: promptForRefinement }] }],
        generationConfig: { temperature: 0.75 }
    };

    try {
        const response = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await handleApiResponse(response, "Gemini (Refinar)");
        const refinementText = parseGeminiResponse(result);
        displayIndividualRefinement(refinementText, resultContainer);
    } catch (error) {
        console.error('Erro ao refinar título com Gemini:', error);
        resultContainer.innerHTML = `<p class="text-red-600 text-sm p-2 bg-red-100 rounded">${error.message}</p>`;
    } finally {
        if (tempLoader) tempLoader.remove();
        buttonElement.disabled = false;
        buttonElement.innerHTML = originalButtonText; 
    }
}

function displayIndividualRefinement(refinementText, containerElement) {
    const htmlContent = formatMarkdownToHtml(refinementText);
    containerElement.innerHTML = `<div class="gemini-refinement-result">${htmlContent}</div>`;
}

function displayGeminiAnalysis(analysisText) {
    const htmlContent = formatMarkdownToHtml(analysisText);
    geminiAnalysisResultDiv.innerHTML = `<div class="gemini-analysis-result">${htmlContent}</div>`;
}

function formatMarkdownToHtml(markdownText) {
    let htmlContent = markdownText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
        .replace(/\*(.*?)\*/g, '<em>$1</em>')       
        .replace(/^### (.*?$)/gm, '<h3>$1</h3>')     
        .replace(/^## (.*?$)/gm, '<h2>$1</h2>')       
        .replace(/^# (.*?$)/gm, '<h1>$1</h1>')        
        .replace(/^- (.*?$)/gm, '<li>$1</li>')      
        .replace(/\n/g, '<br>');                     

    // Envolve blocos de <li> em <ul>, tratando múltiplos blocos
    htmlContent = htmlContent.replace(/((<li>.*?<\/li>)(<br><li>.*?<\/li>)*)/gs, (match) => {
        return '<ul>' + match.replace(/<\/li><br><li>/g, '</li><li>') + '</ul>';
    });
    return htmlContent;
}


function copyToClipboard(text, buttonElement) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    const originalText = buttonElement.dataset.originalText;
                    buttonElement.textContent = 'Copiado!';
                    setTimeout(() => { buttonElement.textContent = originalText; }, 2000);
                })
                .catch(err => {
                    console.warn('navigator.clipboard.writeText falhou, tentando fallback:', err);
                    fallbackCopyTextToClipboard(text, buttonElement);
                });
        } else {
            fallbackCopyTextToClipboard(text, buttonElement);
        }
    } catch (e) {
        console.error('Erro ao tentar copiar:', e);
        fallbackCopyTextToClipboard(text, buttonElement); 
    }
}

function fallbackCopyTextToClipboard(text, buttonElement) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed"; // Previne scroll
    textArea.style.opacity = "0"; // Torna invisível

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        const originalText = buttonElement.dataset.originalText;
        if (successful) {
            buttonElement.textContent = 'Copiado!';
        } else {
            buttonElement.textContent = 'Falhou!';
            console.warn('Fallback copy command failed.');
        }
        setTimeout(() => { buttonElement.textContent = originalText; }, 2000);
    } catch (err) {
        console.error('Erro no fallback execCommand:', err);
        const originalText = buttonElement.dataset.originalText;
        buttonElement.textContent = 'Erro!';
        setTimeout(() => { buttonElement.textContent = originalText; }, 2000);
    }
    document.body.removeChild(textArea);
}

function displayError(message, element) {
    if (element) {
        element.textContent = message;
        element.classList.remove('hidden');
    } else {
        console.error("Elemento de erro não fornecido para a mensagem:", message);
    }
}

function clearError(element) {
    if (element) {
        element.textContent = '';
        element.classList.add('hidden');
    }
}