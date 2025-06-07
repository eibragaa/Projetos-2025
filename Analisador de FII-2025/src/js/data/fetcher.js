/**
 * Fetcher para coleta de dados do Fundamentus
 * Responsável por buscar dados externos com fallback para dados mock
 */

const Fetcher = (() => {
    'use strict';

    /**
     * URLs e configurações para coleta de dados
     */
    const CONFIG = {
        // URL principal do Fundamentus
        FUNDAMENTUS_URL: 'https://fundamentus.com.br/fii_resultado.php',
        
        // Proxies CORS para desenvolvimento (instáveis, apenas para demo)
        CORS_PROXIES: [
            'https://cors-anywhere.herokuapp.com/',
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?'
        ],
        
        // Timeout para requisições
        TIMEOUT: 15000,
        
        // Número máximo de tentativas
        MAX_RETRIES: 2,
        
        // Headers para requisições
        HEADERS: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
    };

    /**
     * Estados de carregamento
     */
    const LOADING_STATES = {
        IDLE: 'idle',
        LOADING: 'loading',
        SUCCESS: 'success',
        ERROR: 'error'
    };

    /**
     * Estado atual do fetcher
     */
    let currentState = LOADING_STATES.IDLE;
    let lastFetchTime = null;
    let cachedData = null;
    let cacheExpiry = 5 * 60 * 1000; // 5 minutos

    /**
     * Cria um controller para timeout de requisições
     * @param {number} timeout - Timeout em milissegundos
     * @returns {AbortController} - Controller para cancelar requisição
     */
    const createTimeoutController = (timeout) => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), timeout);
        return controller;
    };

    /**
     * Faz requisição HTTP com timeout e retry
     * @param {string} url - URL para requisição
     * @param {Object} options - Opções da requisição
     * @returns {Promise<Response>} - Response da requisição
     */
    const fetchWithTimeout = async (url, options = {}) => {
        const controller = createTimeoutController(CONFIG.TIMEOUT);
        
        const fetchOptions = {
            method: 'GET',
            headers: CONFIG.HEADERS,
            signal: controller.signal,
            mode: 'cors',
            cache: 'no-cache',
            ...options
        };

        try {
            const response = await fetch(url, fetchOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return response;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Timeout: Requisição demorou mais que o esperado');
            }
            throw error;
        }
    };

    /**
     * Tenta buscar dados usando diferentes proxies CORS
     * @returns {Promise<string>} - HTML do Fundamentus
     */
    const fetchWithCorsProxy = async () => {
        const errors = [];
        
        for (const proxy of CONFIG.CORS_PROXIES) {
            try {
                console.log(`Tentando buscar dados via proxy: ${proxy}`);
                
                const proxyUrl = proxy + encodeURIComponent(CONFIG.FUNDAMENTUS_URL);
                const response = await fetchWithTimeout(proxyUrl);
                const html = await response.text();
                
                // Valida se o HTML contém dados de FII
                if (html.includes('resultado') || html.includes('MXRF11') || html.includes('Papel')) {
                    console.log('Dados obtidos com sucesso via proxy CORS');
                    return html;
                }
                
                throw new Error('HTML retornado não contém dados esperados');
                
            } catch (error) {
                console.warn(`Erro com proxy ${proxy}:`, error.message);
                errors.push(`${proxy}: ${error.message}`);
            }
        }
        
        throw new Error(`Todos os proxies falharam: ${errors.join('; ')}`);
    };

    /**
     * Tenta buscar dados diretamente (pode falhar por CORS)
     * @returns {Promise<string>} - HTML do Fundamentus
     */
    const fetchDirect = async () => {
        try {
            console.log('Tentando buscar dados diretamente do Fundamentus...');
            
            const response = await fetchWithTimeout(CONFIG.FUNDAMENTUS_URL);
            const html = await response.text();
            
            console.log('Dados obtidos com sucesso diretamente');
            return html;
            
        } catch (error) {
            console.warn('Busca direta falhou (esperado devido ao CORS):', error.message);
            throw error;
        }
    };

    /**
     * Verifica se os dados em cache ainda são válidos
     * @returns {boolean} - Se o cache é válido
     */
    const isCacheValid = () => {
        if (!cachedData || !lastFetchTime) return false;
        return (Date.now() - lastFetchTime) < cacheExpiry;
    };

    /**
     * Salva dados no cache
     * @param {Array} data - Dados para cachear
     */
    const saveToCache = (data) => {
        cachedData = data;
        lastFetchTime = Date.now();
        
        // Salva no localStorage também (se disponível)
        try {
            localStorage.setItem('fii_cache', JSON.stringify({
                data: data,
                timestamp: lastFetchTime
            }));
        } catch (error) {
            console.warn('Não foi possível salvar no localStorage:', error);
        }
    };

    /**
     * Carrega dados do cache (localStorage)
     * @returns {Array|null} - Dados do cache ou null
     */
    const loadFromCache = () => {
        try {
            const cached = localStorage.getItem('fii_cache');
            if (!cached) return null;
            
            const { data, timestamp } = JSON.parse(cached);
            
            // Verifica se o cache não expirou
            if ((Date.now() - timestamp) < cacheExpiry) {
                cachedData = data;
                lastFetchTime = timestamp;
                return data;
            }
            
            // Remove cache expirado
            localStorage.removeItem('fii_cache');
            return null;
            
        } catch (error) {
            console.warn('Erro ao carregar cache:', error);
            return null;
        }
    };

    /**
     * Função principal para buscar dados dos FIIs
     * @param {Object} options - Opções de busca
     * @returns {Promise<Object>} - Resultado com dados e metadados
     */
    const fetchFiisData = async (options = {}) => {
        const {
            useCache = true,
            forceFresh = false,
            useMockFallback = true,
            timeout = CONFIG.TIMEOUT
        } = options;

        // Atualiza timeout se fornecido
        if (timeout !== CONFIG.TIMEOUT) {
            CONFIG.TIMEOUT = timeout;
        }

        try {
            currentState = LOADING_STATES.LOADING;

            // Verifica cache primeiro (se habilitado)
            if (useCache && !forceFresh) {
                const cached = isCacheValid() ? cachedData : loadFromCache();
                if (cached) {
                    console.log('Usando dados do cache');
                    currentState = LOADING_STATES.SUCCESS;
                    return {
                        data: cached,
                        source: 'cache',
                        timestamp: lastFetchTime,
                        success: true
                    };
                }
            }

            let html = null;
            let source = 'unknown';

            // Tenta buscar dados ao vivo
            try {
                // Primeiro tenta busca direta
                try {
                    html = await fetchDirect();
                    source = 'direct';
                } catch (directError) {
                    // Se falhar, tenta com proxy CORS
                    html = await fetchWithCorsProxy();
                    source = 'cors-proxy';
                }

                // Parseia o HTML obtido
                const fiis = Parser.parseFundamentusHTML(html);
                
                if (fiis.length === 0) {
                    throw new Error('Nenhum FII encontrado no HTML retornado');
                }

                // Limpa e valida os dados
                const cleanedFiis = Parser.cleanFiiData(fiis);
                
                // Salva no cache
                saveToCache(cleanedFiis);
                
                currentState = LOADING_STATES.SUCCESS;
                
                console.log(`Dados obtidos com sucesso via ${source}: ${cleanedFiis.length} FIIs`);
                
                return {
                    data: cleanedFiis,
                    source: source,
                    timestamp: Date.now(),
                    success: true
                };

            } catch (fetchError) {
                console.error('Erro ao buscar dados ao vivo:', fetchError.message);
                
                // Se falhou e tem fallback habilitado, usa dados mock
                if (useMockFallback) {
                    console.log('Usando dados mock como fallback');
                    
                    const mockFiis = Parser.parseMockData();
                    
                    currentState = LOADING_STATES.SUCCESS;
                    
                    return {
                        data: mockFiis,
                        source: 'mock',
                        timestamp: Date.now(),
                        success: true,
                        warning: 'Dados obtidos de fonte mock devido a erro na busca ao vivo'
                    };
                }
                
                throw fetchError;
            }

        } catch (error) {
            currentState = LOADING_STATES.ERROR;
            
            console.error('Erro geral na busca de dados:', error);
            
            return {
                data: [],
                source: 'error',
                timestamp: Date.now(),
                success: false,
                error: error.message
            };
        }
    };

    /**
     * Força atualização dos dados (ignora cache)
     * @returns {Promise<Object>} - Resultado da busca
     */
    const refreshData = () => {
        return fetchFiisData({ forceFresh: true, useCache: false });
    };

    /**
     * Limpa cache de dados
     */
    const clearCache = () => {
        cachedData = null;
        lastFetchTime = null;
        
        try {
            localStorage.removeItem('fii_cache');
        } catch (error) {
            console.warn('Erro ao limpar cache do localStorage:', error);
        }
        
        console.log('Cache limpo');
    };

    /**
     * Obtém informações sobre o estado atual
     * @returns {Object} - Informações de estado
     */
    const getStatus = () => {
        return {
            state: currentState,
            hasCache: !!cachedData,
            cacheAge: lastFetchTime ? Date.now() - lastFetchTime : null,
            cacheValid: isCacheValid(),
            lastFetch: lastFetchTime ? new Date(lastFetchTime).toISOString() : null
        };
    };

    /**
     * Configura tempo de expiração do cache
     * @param {number} minutes - Minutos para expiração
     */
    const setCacheExpiry = (minutes) => {
        cacheExpiry = minutes * 60 * 1000;
        console.log(`Cache expiry definido para ${minutes} minutos`);
    };

    /**
     * Testa conectividade com o Fundamentus
     * @returns {Promise<Object>} - Resultado do teste
     */
    const testConnectivity = async () => {
        const results = {
            direct: false,
            corsProxy: false,
            errors: []
        };

        // Testa busca direta
        try {
            await fetchDirect();
            results.direct = true;
        } catch (error) {
            results.errors.push(`Direct: ${error.message}`);
        }

        // Testa proxies CORS
        try {
            await fetchWithCorsProxy();
            results.corsProxy = true;
        } catch (error) {
            results.errors.push(`CORS Proxy: ${error.message}`);
        }

        return results;
    };

    /**
     * Detecta mudanças na estrutura do site
     * @returns {Promise<Object>} - Relatório de mudanças
     */
    const detectSiteChanges = async () => {
        try {
            const result = await fetchFiisData({ useCache: false, useMockFallback: false });
            
            if (!result.success) {
                return {
                    canDetect: false,
                    error: result.error
                };
            }

            // Busca HTML novamente para análise estrutural
            const html = await fetchWithCorsProxy();
            const changeReport = Parser.detectStructureChanges(html);
            
            return {
                canDetect: true,
                ...changeReport,
                dataCount: result.data.length
            };
            
        } catch (error) {
            return {
                canDetect: false,
                error: error.message
            };
        }
    };

    // API pública
    return {
        // Função principal
        fetchFiisData,
        refreshData,
        
        // Gerenciamento de cache
        clearCache,
        setCacheExpiry,
        
        // Utilitários
        getStatus,
        testConnectivity,
        detectSiteChanges,
        
        // Constantes
        LOADING_STATES,
        CONFIG
    };
})();

// Disponibilizar globalmente
window.Fetcher = Fetcher;