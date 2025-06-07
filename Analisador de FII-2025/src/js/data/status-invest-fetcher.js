/**
 * Módulo para buscar dados de FIIs do Status Invest.
 * Utiliza a API de busca avançada para obter dados filtrados.
 */

const StatusInvestFetcher = (() => {
    'use strict';

    const BASE_URL = 'https://statusinvest.com.br/category/advancedsearchresult';
    const HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Content-Type': 'application/json;charset=UTF-8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
    };
    const TIMEOUT = 20000; // 20 segundos de timeout

    /**
     * Cria um controller para timeout de requisições.
     * @param {number} timeout - Timeout em milissegundos.
     * @returns {AbortController} - Controller para cancelar requisição.
     */
    const createTimeoutController = (timeout) => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), timeout);
        return controller;
    };

    /**
     * Faz uma requisição HTTP com timeout.
     * @param {string} url - URL para requisição.
     * @param {Object} options - Opções da requisição.
     * @returns {Promise<Response>} - Response da requisição.
     */
    const fetchWithTimeout = async (url, options = {}) => {
        const controller = createTimeoutController(TIMEOUT);
        
        const fetchOptions = {
            method: 'GET',
            headers: HEADERS,
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
                throw new Error('Timeout: Requisição ao Status Invest demorou mais que o esperado.');
            }
            throw error;
        }
    };

    /**
     * Constrói a URL de busca avançada com base nos filtros.
     * @param {Object} filters - Objeto de filtros.
     * @returns {string} - URL completa para a API do Status Invest.
     */
    const buildSearchUrl = (filters) => {
        const params = new URLSearchParams();
        
        // Tipo de categoria (FIIs)
        params.append('CategoryType', filters.CategoryType || '2'); // 2 para FIIs

        // Apenas ativos
        params.append('IsActive', filters.IsActive ? 'true' : 'false');

        // Volume Mínimo Diário
        if (filters.MinDailyLiquidez) {
            params.append('MinDailyLiquidez', filters.MinDailyLiquidez);
        }

        // Outros filtros podem ser adicionados aqui conforme necessário
        // Ex: params.append('Sector', filters.Sector);
        // Ex: params.append('MinDividendYield', filters.MinDividendYield);

        return `${BASE_URL}?${params.toString()}`;
    };

    /**
     * Busca dados de FIIs do Status Invest.
     * @param {Object} filters - Filtros para a busca (ex: { MinDailyLiquidez: 10000, IsActive: true }).
     * @returns {Promise<Array>} - Array de objetos FII.
     */
    const fetchFiis = async (filters = {}) => {
        try {
            console.log('Buscando dados do Status Invest...');
            
            const defaultFilters = {
                CategoryType: 2, // FIIs
                IsActive: true,  // Apenas ativos
                MinDailyLiquidez: 10000 // Volume acima de R$ 10.000
            };

            const finalFilters = { ...defaultFilters, ...filters };
            const url = buildSearchUrl(finalFilters);

            const response = await fetchWithTimeout(url);
            const data = await response.json(); // Status Invest retorna JSON

            if (!Array.isArray(data)) {
                throw new Error('Formato de dados inesperado do Status Invest.');
            }

            console.log(`Dados do Status Invest obtidos: ${data.length} FIIs`);
            return data;

        } catch (error) {
            console.error('Erro ao buscar dados do Status Invest:', error);
            throw error;
        }
    };

    // API pública
    return {
        fetchFiis,
        BASE_URL,
        HEADERS,
        TIMEOUT
    };
})();

// Disponibilizar globalmente
window.StatusInvestFetcher = StatusInvestFetcher;