/**
 * Módulo para gerenciamento de filtros
 * Responsável por filtrar dados dos FIIs por diferentes critérios
 */

const Filters = (() => {
    'use strict';

    /**
     * Elementos DOM dos filtros
     */
    let elements = {};

    /**
     * Estado atual dos filtros
     */
    let currentFilters = {
        sector: '',
        search: '',
        minDividendYield: null,
        maxDividendYield: null,
        minPVP: null,
        maxPVP: null,
        minLiquidity: null,
        maxLiquidity: null
    };

    /**
     * Dados originais para filtragem
     */
    let originalData = [];

    /**
     * Configurações dos filtros
     */
    const CONFIG = {
        searchDebounceDelay: 300,
        enableAdvancedFilters: false,
        caseSensitiveSearch: false
    };

    /**
     * Timer para debounce da busca
     */
    let searchTimer = null;

    /**
     * Inicializa o módulo de filtros
     */
    const init = () => {
        // Busca elementos DOM
        elements = {
            controlsSection: document.getElementById('controlsSection'),
            sectorFilter: document.getElementById('sectorFilter'),
            searchInput: document.getElementById('searchInput'),
            dataSourceInfo: document.getElementById('dataSourceInfo'),
            dataSourceText: document.getElementById('dataSourceText')
        };

        // Verifica se os elementos existem
        if (!elements.sectorFilter || !elements.searchInput) {
            console.error('Elementos de filtro não encontrados');
            return false;
        }

        // Configura event listeners
        setupEventListeners();
        
        console.log('Filtros inicializados com sucesso');
        return true;
    };

    /**
     * Configura event listeners dos filtros
     */
    const setupEventListeners = () => {
        // Filtro de setor
        if (elements.sectorFilter) {
            elements.sectorFilter.addEventListener('change', handleSectorChange);
        }

        // Campo de busca
        if (elements.searchInput) {
            elements.searchInput.addEventListener('input', handleSearchInput);
            elements.searchInput.addEventListener('keydown', handleSearchKeydown);
        }

        // Event listeners para filtros customizados
        document.addEventListener('filters:apply', handleCustomFilter);
        document.addEventListener('filters:clear', handleClearFilters);
    };

    /**
     * Manipula mudança no filtro de setor
     * @param {Event} event - Evento de mudança
     */
    const handleSectorChange = (event) => {
        const selectedSector = event.target.value;
        currentFilters.sector = selectedSector;
        
        console.log(`Filtro de setor aplicado: ${selectedSector || 'Todos'}`);
        
        applyFilters();
        dispatchFilterEvent('sector:change', { sector: selectedSector });
    };

    /**
     * Manipula entrada no campo de busca
     * @param {Event} event - Evento de input
     */
    const handleSearchInput = (event) => {
        const searchTerm = event.target.value;
        
        // Debounce para evitar muitas chamadas
        if (searchTimer) {
            clearTimeout(searchTimer);
        }
        
        searchTimer = setTimeout(() => {
            currentFilters.search = searchTerm;
            console.log(`Busca aplicada: "${searchTerm}"`);
            
            applyFilters();
            dispatchFilterEvent('search:change', { search: searchTerm });
        }, CONFIG.searchDebounceDelay);
    };

    /**
     * Manipula teclas especiais no campo de busca
     * @param {Event} event - Evento de keydown
     */
    const handleSearchKeydown = (event) => {
        // Enter para aplicar busca imediatamente
        if (event.key === 'Enter') {
            if (searchTimer) {
                clearTimeout(searchTimer);
            }
            
            currentFilters.search = event.target.value;
            applyFilters();
        }
        
        // Escape para limpar busca
        if (event.key === 'Escape') {
            event.target.value = '';
            currentFilters.search = '';
            applyFilters();
        }
    };

    /**
     * Manipula filtros customizados
     * @param {CustomEvent} event - Evento customizado
     */
    const handleCustomFilter = (event) => {
        const { filterType, value } = event.detail;
        
        if (currentFilters.hasOwnProperty(filterType)) {
            currentFilters[filterType] = value;
            applyFilters();
        }
    };

    /**
     * Manipula limpeza de filtros
     * @param {CustomEvent} event - Evento de limpeza
     */
    const handleClearFilters = (event) => {
        clearAllFilters();
    };

    /**
     * Aplica todos os filtros ativos
     */
    const applyFilters = () => {
        if (!originalData || originalData.length === 0) {
            console.warn('Nenhum dado disponível para filtrar');
            return;
        }

        let filteredData = [...originalData];

        // Aplica filtro de setor
        if (currentFilters.sector) {
            filteredData = filteredData.filter(fii => 
                fii.setor === currentFilters.sector
            );
        }

        // Aplica filtro de busca
        if (currentFilters.search) {
            const searchTerm = CONFIG.caseSensitiveSearch 
                ? currentFilters.search 
                : currentFilters.search.toLowerCase();
            
            filteredData = filteredData.filter(fii => {
                const ticker = CONFIG.caseSensitiveSearch 
                    ? fii.ticker 
                    : fii.ticker.toLowerCase();
                
                const setor = CONFIG.caseSensitiveSearch 
                    ? fii.setor 
                    : fii.setor.toLowerCase();
                
                return ticker.includes(searchTerm) || setor.includes(searchTerm);
            });
        }

        // Aplica filtros numéricos (se habilitados)
        if (CONFIG.enableAdvancedFilters) {
            filteredData = applyNumericFilters(filteredData);
        }

        // Atualiza tabela com dados filtrados
        if (window.Table && typeof window.Table.applyFilter === 'function') {
            window.Table.applyFilter(() => true); // Limpa filtros da tabela
            window.Table.updateData(filteredData);
        }

        // Atualiza contadores e estatísticas
        updateFilterStats(filteredData);
        
        console.log(`Filtros aplicados: ${filteredData.length} de ${originalData.length} FIIs`);
    };

    /**
     * Aplica filtros numéricos avançados
     * @param {Array} data - Dados para filtrar
     * @returns {Array} - Dados filtrados
     */
    const applyNumericFilters = (data) => {
        let filtered = [...data];

        // Filtro de Dividend Yield
        if (currentFilters.minDividendYield !== null) {
            filtered = filtered.filter(fii => 
                fii.dividendYield >= currentFilters.minDividendYield
            );
        }
        
        if (currentFilters.maxDividendYield !== null) {
            filtered = filtered.filter(fii => 
                fii.dividendYield <= currentFilters.maxDividendYield
            );
        }

        // Filtro de P/VP
        if (currentFilters.minPVP !== null) {
            filtered = filtered.filter(fii => 
                fii.pvp >= currentFilters.minPVP
            );
        }
        
        if (currentFilters.maxPVP !== null) {
            filtered = filtered.filter(fii => 
                fii.pvp <= currentFilters.maxPVP
            );
        }

        // Filtro de Liquidez
        if (currentFilters.minLiquidity !== null) {
            filtered = filtered.filter(fii => 
                fii.liquidez >= currentFilters.minLiquidity
            );
        }
        
        if (currentFilters.maxLiquidity !== null) {
            filtered = filtered.filter(fii => 
                fii.liquidez <= currentFilters.maxLiquidity
            );
        }

        return filtered;
    };

    /**
     * Atualiza dados originais para filtragem
     * @param {Array} data - Novos dados
     */
    const updateData = (data) => {
        originalData = [...data];
        
        // Atualiza opções do filtro de setor
        populateSectorFilter(data);
        
        // Aplica filtros atuais aos novos dados
        applyFilters();
    };

    /**
     * Popula o filtro de setor com opções únicas
     * @param {Array} data - Dados dos FIIs
     */
    const populateSectorFilter = (data) => {
        if (!elements.sectorFilter) return;

        // Extrai setores únicos
        const sectors = [...new Set(data.map(fii => fii.setor))].sort();
        
        // Limpa opções existentes (exceto "Todos")
        const allOption = elements.sectorFilter.querySelector('option[value=""]');
        elements.sectorFilter.innerHTML = '';
        
        if (allOption) {
            elements.sectorFilter.appendChild(allOption);
        } else {
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Todos os setores';
            elements.sectorFilter.appendChild(defaultOption);
        }

        // Adiciona opções de setores
        sectors.forEach(sector => {
            const option = document.createElement('option');
            option.value = sector;
            option.textContent = sector;
            elements.sectorFilter.appendChild(option);
        });

        console.log(`Filtro de setor atualizado com ${sectors.length} setores`);
    };

    /**
     * Atualiza estatísticas dos filtros
     * @param {Array} filteredData - Dados filtrados
     */
    const updateFilterStats = (filteredData) => {
        // Atualiza informações na interface
        const stats = {
            total: filteredData.length,
            sectors: [...new Set(filteredData.map(fii => fii.setor))].length,
            avgDY: filteredData.length > 0 
                ? filteredData.reduce((sum, fii) => sum + fii.dividendYield, 0) / filteredData.length 
                : 0
        };

        // Dispara evento com estatísticas
        dispatchFilterEvent('stats:update', stats);
    };

    /**
     * Limpa todos os filtros
     */
    const clearAllFilters = () => {
        // Reset filtros
        currentFilters = {
            sector: '',
            search: '',
            minDividendYield: null,
            maxDividendYield: null,
            minPVP: null,
            maxPVP: null,
            minLiquidity: null,
            maxLiquidity: null
        };

        // Reset elementos da interface
        if (elements.sectorFilter) {
            elements.sectorFilter.value = '';
        }
        
        if (elements.searchInput) {
            elements.searchInput.value = '';
        }

        // Aplica filtros limpos
        applyFilters();
        
        console.log('Todos os filtros foram limpos');
        dispatchFilterEvent('filters:cleared');
    };

    /**
     * Define filtro específico
     * @param {string} filterType - Tipo do filtro
     * @param {any} value - Valor do filtro
     */
    const setFilter = (filterType, value) => {
        if (currentFilters.hasOwnProperty(filterType)) {
            currentFilters[filterType] = value;
            
            // Atualiza interface se necessário
            updateFilterUI(filterType, value);
            
            applyFilters();
        }
    };

    /**
     * Atualiza interface do filtro
     * @param {string} filterType - Tipo do filtro
     * @param {any} value - Valor do filtro
     */
    const updateFilterUI = (filterType, value) => {
        switch (filterType) {
            case 'sector':
                if (elements.sectorFilter) {
                    elements.sectorFilter.value = value || '';
                }
                break;
                
            case 'search':
                if (elements.searchInput) {
                    elements.searchInput.value = value || '';
                }
                break;
        }
    };

    /**
     * Obtém filtros ativos
     * @returns {Object} - Filtros ativos
     */
    const getActiveFilters = () => {
        const active = {};
        
        Object.keys(currentFilters).forEach(key => {
            const value = currentFilters[key];
            if (value !== null && value !== '') {
                active[key] = value;
            }
        });
        
        return active;
    };

    /**
     * Verifica se há filtros ativos
     * @returns {boolean} - Se há filtros ativos
     */
    const hasActiveFilters = () => {
        return Object.keys(getActiveFilters()).length > 0;
    };

    /**
     * Atualiza informações da fonte de dados
     * @param {string} source - Fonte dos dados
     * @param {string} timestamp - Timestamp da última atualização
     */
    const updateDataSourceInfo = (source, timestamp) => {
        if (!elements.dataSourceText) return;

        const sourceMap = {
            'direct': 'Fundamentus (Direto)',
            'cors-proxy': 'Fundamentus (Proxy)',
            'cache': 'Cache Local',
            'mock': 'Dados Demo',
            'error': 'Erro'
        };

        const sourceText = sourceMap[source] || source;
        const timeText = timestamp ? new Date(timestamp).toLocaleTimeString('pt-BR') : '';
        
        elements.dataSourceText.textContent = `${sourceText}${timeText ? ` - ${timeText}` : ''}`;
        
        // Adiciona classe CSS baseada na fonte
        if (elements.dataSourceInfo) {
            elements.dataSourceInfo.className = `px-3 py-2 rounded-md text-sm source-${source}`;
        }
    };

    /**
     * Mostra seção de controles
     */
    const showControlsSection = () => {
        if (elements.controlsSection) {
            elements.controlsSection.classList.remove('hidden');
        }
    };

    /**
     * Esconde seção de controles
     */
    const hideControlsSection = () => {
        if (elements.controlsSection) {
            elements.controlsSection.classList.add('hidden');
        }
    };

    /**
     * Dispara evento customizado dos filtros
     * @param {string} eventName - Nome do evento
     * @param {Object} detail - Detalhes do evento
     */
    const dispatchFilterEvent = (eventName, detail = {}) => {
        const event = new CustomEvent(`filters:${eventName}`, {
            detail: {
                filters: currentFilters,
                activeFilters: getActiveFilters(),
                ...detail
            }
        });
        
        document.dispatchEvent(event);
    };

    /**
     * Exporta configuração atual dos filtros
     * @returns {Object} - Configuração dos filtros
     */
    const exportConfig = () => {
        return {
            filters: { ...currentFilters },
            config: { ...CONFIG }
        };
    };

    /**
     * Importa configuração dos filtros
     * @param {Object} config - Configuração para importar
     */
    const importConfig = (config) => {
        if (config.filters) {
            currentFilters = { ...currentFilters, ...config.filters };
        }
        
        if (config.config) {
            Object.assign(CONFIG, config.config);
        }
        
        // Atualiza interface
        Object.keys(currentFilters).forEach(key => {
            updateFilterUI(key, currentFilters[key]);
        });
        
        applyFilters();
    };

    /**
     * Limpa recursos dos filtros
     */
    const destroy = () => {
        // Limpa timer
        if (searchTimer) {
            clearTimeout(searchTimer);
        }

        // Remove event listeners
        if (elements.sectorFilter) {
            elements.sectorFilter.removeEventListener('change', handleSectorChange);
        }

        if (elements.searchInput) {
            elements.searchInput.removeEventListener('input', handleSearchInput);
            elements.searchInput.removeEventListener('keydown', handleSearchKeydown);
        }

        document.removeEventListener('filters:apply', handleCustomFilter);
        document.removeEventListener('filters:clear', handleClearFilters);

        // Limpa dados
        originalData = [];
        currentFilters = {
            sector: '',
            search: '',
            minDividendYield: null,
            maxDividendYield: null,
            minPVP: null,
            maxPVP: null,
            minLiquidity: null,
            maxLiquidity: null
        };

        // Limpa referências
        elements = {};

        console.log('Filtros destruídos');
    };

    // API pública
    return {
        // Inicialização
        init,
        destroy,
        
        // Dados
        updateData,
        
        // Controle de filtros
        setFilter,
        clearAllFilters,
        applyFilters,
        
        // Estado
        getActiveFilters,
        hasActiveFilters,
        exportConfig,
        importConfig,
        
        // Interface
        updateDataSourceInfo,
        showControlsSection,
        hideControlsSection,
        
        // Configurações
        CONFIG
    };
})();

// Disponibilizar globalmente
window.Filters = Filters;