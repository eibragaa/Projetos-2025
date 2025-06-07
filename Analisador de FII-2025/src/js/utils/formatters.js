/**
 * Utilitários para formatação de dados brasileiros
 * Responsável por converter e formatar números, moedas e percentuais
 */

/**
 * Converte string de número brasileiro para float
 * Ex: "1.234,56" -> 1234.56
 * @param {string} value - Valor em formato brasileiro
 * @returns {number} - Número convertido
 */
export const parseBrazilianNumber = (value) => {
    if (!value || typeof value !== 'string') return 0;
    
    // Remove espaços e caracteres especiais, exceto vírgulas e pontos
    const cleaned = value.replace(/[^\d,.-]/g, '');
    
    // Se não há vírgula, assume que é um número inteiro ou com ponto decimal americano
    if (!cleaned.includes(',')) {
        return parseFloat(cleaned) || 0;
    }
    
    // Se há vírgula, assume formato brasileiro
    // Remove pontos (separadores de milhares) e substitui vírgula por ponto
    const normalized = cleaned.replace(/\./g, '').replace(',', '.');
    return parseFloat(normalized) || 0;
};

/**
 * Converte string de percentual brasileiro para float
 * Ex: "12,5%" -> 12.5
 * @param {string} value - Valor percentual em formato brasileiro
 * @returns {number} - Percentual como número
 */
export const parseBrazilianPercentage = (value) => {
    if (!value || typeof value !== 'string') return 0;
    
    // Remove o símbolo % e espaços
    const cleaned = value.replace(/%/g, '').trim();
    return parseBrazilianNumber(cleaned);
};

/**
 * Formata número como moeda brasileira
 * @param {number} value - Valor numérico
 * @param {boolean} showSymbol - Se deve mostrar o símbolo R$
 * @returns {string} - Valor formatado como moeda
 */
export const formatCurrency = (value, showSymbol = true) => {
    if (typeof value !== 'number' || isNaN(value)) return showSymbol ? 'R$ 0,00' : '0,00';
    
    const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
    
    return showSymbol ? formatted : formatted.replace('R$', '').trim();
};

/**
 * Formata número como percentual brasileiro
 * @param {number} value - Valor numérico
 * @param {number} decimals - Número de casas decimais
 * @returns {string} - Valor formatado como percentual
 */
export const formatPercentage = (value, decimals = 1) => {
    if (typeof value !== 'number' || isNaN(value)) return '0,0%';
    
    return new Intl.NumberFormat('pt-BR', {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value / 100);
};

/**
 * Formata número com separadores brasileiros
 * @param {number} value - Valor numérico
 * @param {number} decimals - Número de casas decimais
 * @returns {string} - Número formatado
 */
export const formatNumber = (value, decimals = 2) => {
    if (typeof value !== 'number' || isNaN(value)) return '0';
    
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
};

/**
 * Formata números grandes com sufixos (K, M, B)
 * @param {number} value - Valor numérico
 * @param {number} decimals - Número de casas decimais
 * @returns {string} - Número formatado com sufixo
 */
export const formatLargeNumber = (value, decimals = 1) => {
    if (typeof value !== 'number' || isNaN(value)) return '0';
    
    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    
    if (abs >= 1e9) {
        return sign + formatNumber(abs / 1e9, decimals) + 'B';
    } else if (abs >= 1e6) {
        return sign + formatNumber(abs / 1e6, decimals) + 'M';
    } else if (abs >= 1e3) {
        return sign + formatNumber(abs / 1e3, decimals) + 'K';
    }
    
    return sign + formatNumber(abs, 0);
};

/**
 * Formata valor de liquidez (volume)
 * @param {number} value - Valor de liquidez
 * @returns {string} - Liquidez formatada
 */
export const formatLiquidity = (value) => {
    if (typeof value !== 'number' || isNaN(value)) return '0';
    
    return formatLargeNumber(value, 0);
};

/**
 * Formata P/VP com validação
 * @param {number} value - Valor P/VP
 * @returns {string} - P/VP formatado
 */
export const formatPVP = (value) => {
    if (typeof value !== 'number' || isNaN(value)) return '0,00';
    
    return formatNumber(value, 2);
};

/**
 * Formata Dividend Yield com cor baseada no valor
 * @param {number} value - Valor do DY
 * @returns {object} - Objeto com valor formatado e classe CSS
 */
export const formatDividendYield = (value) => {
    if (typeof value !== 'number' || isNaN(value)) {
        return {
            formatted: '0,0%',
            cssClass: ''
        };
    }
    
    const formatted = formatPercentage(value, 1);
    let cssClass = '';
    
    if (value >= 8) {
        cssClass = 'text-green-600 font-semibold';
    } else if (value >= 6) {
        cssClass = 'text-green-500';
    } else if (value >= 4) {
        cssClass = 'text-yellow-600';
    } else {
        cssClass = 'text-red-500';
    }
    
    return { formatted, cssClass };
};

/**
 * Formata vacância com cor baseada no valor
 * @param {number} value - Valor da vacância
 * @returns {object} - Objeto com valor formatado e classe CSS
 */
export const formatVacancy = (value) => {
    if (typeof value !== 'number' || isNaN(value)) {
        return {
            formatted: '0,0%',
            cssClass: ''
        };
    }
    
    const formatted = formatPercentage(value, 1);
    let cssClass = '';
    
    if (value <= 5) {
        cssClass = 'text-green-600';
    } else if (value <= 10) {
        cssClass = 'text-yellow-600';
    } else if (value <= 20) {
        cssClass = 'text-orange-500';
    } else {
        cssClass = 'text-red-500';
    }
    
    return { formatted, cssClass };
};

/**
 * Trunca texto longo com reticências
 * @param {string} text - Texto a ser truncado
 * @param {number} maxLength - Comprimento máximo
 * @returns {string} - Texto truncado
 */
export const truncateText = (text, maxLength = 20) => {
    if (!text || typeof text !== 'string') return '';
    
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength - 3) + '...';
};

/**
 * Formata ticker do FII (sempre maiúsculo)
 * @param {string} ticker - Ticker do FII
 * @returns {string} - Ticker formatado
 */
export const formatTicker = (ticker) => {
    if (!ticker || typeof ticker !== 'string') return '';
    
    return ticker.toUpperCase().trim();
};

/**
 * Valida se um valor é um número válido
 * @param {any} value - Valor a ser validado
 * @returns {boolean} - Se é um número válido
 */
export const isValidNumber = (value) => {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
};

/**
 * Formata data para formato brasileiro
 * @param {Date|string} date - Data a ser formatada
 * @returns {string} - Data formatada
 */
export const formatDate = (date) => {
    if (!date) return '';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) return '';
    
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(dateObj);
};

/**
 * Formata timestamp para formato brasileiro com hora
 * @param {Date|string|number} timestamp - Timestamp a ser formatado
 * @returns {string} - Timestamp formatado
 */
export const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const dateObj = new Date(timestamp);
    
    if (isNaN(dateObj.getTime())) return '';
    
    // Definir opções de formatação em variável separada
    const formatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return new Intl.DateTimeFormat('pt-BR', formatOptions).format(dateObj);
};