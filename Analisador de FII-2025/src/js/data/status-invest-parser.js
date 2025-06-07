/**
 * Parser para dados do Status Invest
 * Responsável por converter dados da API do Status Invest para o formato padrão da aplicação
 */

const StatusInvestParser = (() => {
    'use strict';

    /**
     * Mapeamento dos campos do Status Invest para o formato padrão
     */
    const FIELD_MAPPING = {
        // Status Invest -> Formato Padrão
        'companyName': 'ticker',
        'sector': 'setor',
        'price': 'cotacao',
        'p_VP': 'pvp',
        'dividendYield': 'dividendYield',
        'liquidezMediaDiaria': 'liquidez',
        'patrimonioLiquido': 'patrimonioLiquido',
        'vacanciaFisica': 'vacancia'
    };

    /**
     * Converte um objeto FII do Status Invest para o formato padrão
     * @param {Object} statusInvestFii - Objeto FII do Status Invest
     * @returns {Object} - Objeto FII no formato padrão
     */
    const convertFiiObject = (statusInvestFii) => {
        if (!statusInvestFii || typeof statusInvestFii !== 'object') {
            console.warn('Objeto FII inválido do Status Invest:', statusInvestFii);
            return null;
        }

        try {
            const convertedFii = {
                // Campos obrigatórios
                ticker: extractTicker(statusInvestFii.companyName || statusInvestFii.ticker || ''),
                setor: statusInvestFii.sector || statusInvestFii.segmento || 'Não informado',
                cotacao: parseFloat(statusInvestFii.price || statusInvestFii.cotacao || 0),
                pvp: parseFloat(statusInvestFii.p_VP || statusInvestFii.pvp || 0),
                dividendYield: parseFloat(statusInvestFii.dividendYield || statusInvestFii.dy || 0),
                liquidez: parseFloat(statusInvestFii.liquidezMediaDiaria || statusInvestFii.liquidez || 0),
                patrimonioLiquido: parseFloat(statusInvestFii.patrimonioLiquido || statusInvestFii.pl || 0),
                vacancia: parseFloat(statusInvestFii.vacanciaFisica || statusInvestFii.vacancia || 0),

                // Metadados
                lastUpdate: new Date().toISOString(),
                dataSource: 'status-invest',
                
                // Campos adicionais do Status Invest
                volume: parseFloat(statusInvestFii.volume || 0),
                numeroCotas: parseInt(statusInvestFii.numeroCotas || 0),
                numeroCotistas: parseInt(statusInvestFii.numeroCotistas || 0),
                isActive: statusInvestFii.isActive !== false, // Assume ativo se não especificado
                
                // Dados de rentabilidade (se disponíveis)
                rentabilidade12m: parseFloat(statusInvestFii.rentabilidade12m || 0),
                rentabilidade24m: parseFloat(statusInvestFii.rentabilidade24m || 0),
                
                // Dados de patrimônio
                valorPatrimonial: parseFloat(statusInvestFii.valorPatrimonial || 0),
                
                // Dados de gestão
                taxaAdministracao: parseFloat(statusInvestFii.taxaAdministracao || 0)
            };

            // Validação básica
            if (!isValidFii(convertedFii)) {
                console.warn('FII convertido não passou na validação:', convertedFii);
                return null;
            }

            return convertedFii;

        } catch (error) {
            console.error('Erro ao converter FII do Status Invest:', error, statusInvestFii);
            return null;
        }
    };

    /**
     * Extrai o ticker do nome da empresa
     * @param {string} companyName - Nome da empresa
     * @returns {string} - Ticker extraído
     */
    const extractTicker = (companyName) => {
        if (!companyName || typeof companyName !== 'string') {
            return '';
        }

        // Procura por padrão XXXX11 no nome
        const tickerMatch = companyName.match(/([A-Z]{4}11)/);
        if (tickerMatch) {
            return tickerMatch[1];
        }

        // Se não encontrar, tenta extrair do início do nome
        const words = companyName.split(' ');
        const firstWord = words[0];
        
        if (firstWord && /^[A-Z]{4}11$/.test(firstWord)) {
            return firstWord;
        }

        // Fallback: retorna o primeiro "palavra" em maiúsculas
        return firstWord ? firstWord.toUpperCase() : companyName.substring(0, 6).toUpperCase();
    };

    /**
     * Valida se um objeto FII tem os campos mínimos necessários
     * @param {Object} fii - Objeto FII para validar
     * @returns {boolean} - Se é válido
     */
    const isValidFii = (fii) => {
        if (!fii || typeof fii !== 'object') {
            return false;
        }

        // Verifica campos obrigatórios
        const requiredFields = ['ticker', 'setor', 'cotacao'];
        
        for (const field of requiredFields) {
            if (!fii.hasOwnProperty(field) || fii[field] === undefined || fii[field] === null) {
                return false;
            }
        }

        // Verifica se ticker tem formato válido (pelo menos 4 caracteres)
        if (typeof fii.ticker !== 'string' || fii.ticker.length < 4) {
            return false;
        }

        // Verifica se cotação é um número positivo
        if (typeof fii.cotacao !== 'number' || fii.cotacao <= 0) {
            return false;
        }

        return true;
    };

    /**
     * Converte array de FIIs do Status Invest para formato padrão
     * @param {Array} statusInvestData - Array de FIIs do Status Invest
     * @returns {Array} - Array de FIIs no formato padrão
     */
    const parseStatusInvestData = (statusInvestData) => {
        if (!Array.isArray(statusInvestData)) {
            console.error('Dados do Status Invest não são um array:', statusInvestData);
            return [];
        }

        const convertedFiis = [];
        let successCount = 0;
        let errorCount = 0;

        statusInvestData.forEach((fiiData, index) => {
            try {
                const convertedFii = convertFiiObject(fiiData);
                
                if (convertedFii) {
                    convertedFiis.push(convertedFii);
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch (error) {
                console.error(`Erro ao processar FII no índice ${index}:`, error, fiiData);
                errorCount++;
            }
        });

        console.log(`Status Invest parsing concluído: ${successCount} FIIs convertidos, ${errorCount} erros`);

        return convertedFiis;
    };

    /**
     * Aplica filtros específicos aos dados do Status Invest
     * @param {Array} fiis - Array de FIIs
     * @param {Object} filters - Filtros a aplicar
     * @returns {Array} - FIIs filtrados
     */
    const applyFilters = (fiis, filters = {}) => {
        if (!Array.isArray(fiis)) {
            return [];
        }

        let filteredFiis = [...fiis];

        // Filtro: apenas ativos
        if (filters.onlyActive !== false) {
            filteredFiis = filteredFiis.filter(fii => fii.isActive !== false);
        }

        // Filtro: volume mínimo
        if (filters.minVolume && typeof filters.minVolume === 'number') {
            filteredFiis = filteredFiis.filter(fii => 
                (fii.liquidez || fii.volume || 0) >= filters.minVolume
            );
        }

        // Filtro: dividend yield mínimo
        if (filters.minDividendYield && typeof filters.minDividendYield === 'number') {
            filteredFiis = filteredFiis.filter(fii => 
                fii.dividendYield >= filters.minDividendYield
            );
        }

        // Filtro: dividend yield máximo
        if (filters.maxDividendYield && typeof filters.maxDividendYield === 'number') {
            filteredFiis = filteredFiis.filter(fii => 
                fii.dividendYield <= filters.maxDividendYield
            );
        }

        // Filtro: P/VP mínimo
        if (filters.minPVP && typeof filters.minPVP === 'number') {
            filteredFiis = filteredFiis.filter(fii => 
                fii.pvp >= filters.minPVP
            );
        }

        // Filtro: P/VP máximo
        if (filters.maxPVP && typeof filters.maxPVP === 'number') {
            filteredFiis = filteredFiis.filter(fii => 
                fii.pvp <= filters.maxPVP
            );
        }

        // Filtro: setores específicos
        if (filters.sectors && Array.isArray(filters.sectors) && filters.sectors.length > 0) {
            filteredFiis = filteredFiis.filter(fii => 
                filters.sectors.includes(fii.setor)
            );
        }

        // Filtro: vacância máxima
        if (filters.maxVacancy && typeof filters.maxVacancy === 'number') {
            filteredFiis = filteredFiis.filter(fii => 
                fii.vacancia <= filters.maxVacancy
            );
        }

        console.log(`Filtros aplicados: ${filteredFiis.length} de ${fiis.length} FIIs`);

        return filteredFiis;
    };

    /**
     * Normaliza dados para garantir consistência
     * @param {Array} fiis - Array de FIIs
     * @returns {Array} - FIIs normalizados
     */
    const normalizeFiis = (fiis) => {
        return fiis.map(fii => ({
            ...fii,
            ticker: fii.ticker.toUpperCase(),
            setor: fii.setor.trim(),
            cotacao: Math.max(0, fii.cotacao || 0),
            pvp: Math.max(0, fii.pvp || 0),
            dividendYield: Math.max(0, Math.min(100, fii.dividendYield || 0)), // Entre 0-100%
            liquidez: Math.max(0, fii.liquidez || 0),
            patrimonioLiquido: Math.max(0, fii.patrimonioLiquido || 0),
            vacancia: Math.max(0, Math.min(100, fii.vacancia || 0)) // Entre 0-100%
        }));
    };

    /**
     * Obtém estatísticas dos dados parseados
     * @param {Array} fiis - Array de FIIs
     * @returns {Object} - Estatísticas
     */
    const getStatistics = (fiis) => {
        if (!Array.isArray(fiis) || fiis.length === 0) {
            return {
                total: 0,
                avgDividendYield: 0,
                avgPVP: 0,
                totalVolume: 0,
                activeFiis: 0,
                sectors: []
            };
        }

        const activeFiis = fiis.filter(fii => fii.isActive !== false);
        const totalDY = fiis.reduce((sum, fii) => sum + (fii.dividendYield || 0), 0);
        const totalPVP = fiis.reduce((sum, fii) => sum + (fii.pvp || 0), 0);
        const totalVolume = fiis.reduce((sum, fii) => sum + (fii.liquidez || fii.volume || 0), 0);
        const sectors = [...new Set(fiis.map(fii => fii.setor))];

        return {
            total: fiis.length,
            avgDividendYield: totalDY / fiis.length,
            avgPVP: totalPVP / fiis.length,
            totalVolume: totalVolume,
            activeFiis: activeFiis.length,
            sectors: sectors.sort()
        };
    };

    // API pública
    return {
        // Funções principais
        parseStatusInvestData,
        convertFiiObject,
        
        // Filtros e normalização
        applyFilters,
        normalizeFiis,
        
        // Utilitários
        extractTicker,
        isValidFii,
        getStatistics,
        
        // Constantes
        FIELD_MAPPING
    };
})();

// Disponibilizar globalmente
window.StatusInvestParser = StatusInvestParser;