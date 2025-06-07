/**
 * Módulo principal da aplicação - Analisador Quantitativo de FIIs
 * Responsável por orquestrar todos os módulos e gerenciar o estado global
 */

const FiiAnalyzerApp = (() => {
    'use strict';

    /**
     * Estado global da aplicação
     */
    let appState = {
        isInitialized: false,
        isLoading: false,
        hasData: false,
        lastUpdate: null,
        dataSource: null,
        error: null,
        originalFiis: [],
        currentFiis: [],
        currentSort: {
            column: null,
            direction: 'asc'
        }
    };

    /**
     * Elementos DOM principais
     */
    let ui = {
        loadingIndicator: null,
        errorMessageContainer: null,
        errorMessage: null,
        controlsSection: null,
        chartsSection: null,
        tableSection: null
    };

    /**
     * Configurações da aplicação
     */
    const CONFIG = {
        autoRefreshInterval: 5 * 60 * 1000, // 5 minutos
        enableAutoRefresh: false,
        showWelcomeModal: true,
        enableAnalytics: false,
        debugMode: false
    };

    /**
     * Timer para auto-refresh
     */
    let refreshTimer = null;

    /**
     * Inicializa a aplicação
     */
    const init = async () => {
        try {
            console.log('🚀 Iniciando Analisador Quantitativo de FIIs...');

            // Busca elementos DOM
            if (!initializeDOM()) {
                throw new Error('Falha ao inicializar elementos DOM');
            }

            // Inicializa módulos
            if (!initializeModules()) {
                throw new Error('Falha ao inicializar módulos');
            }

            // Configura event listeners globais
            setupGlobalEventListeners();

            // Mostra modal de boas-vindas se habilitado
            if (CONFIG.showWelcomeModal) {
                showWelcomeModal();
            }

            // Carrega dados iniciais
            await loadInitialData();

            // Configura auto-refresh se habilitado
            if (CONFIG.enableAutoRefresh) {
                setupAutoRefresh();
            }

            // Marca como inicializado
            appState.isInitialized = true;

            console.log('✅ Aplicação inicializada com sucesso');
            dispatchAppEvent('app:initialized');

        } catch (error) {
            console.error('❌ Erro na inicialização da aplicação:', error);
            showErrorMessage(`Erro na inicialização: ${error.message}`);
            dispatchAppEvent('app:error', { error });
        }
    };

    /**
     * Inicializa elementos DOM
     * @returns {boolean} - Sucesso na inicialização
     */
    const initializeDOM = () => {
        ui = {
            loadingIndicator: document.getElementById('loadingIndicator'),
            errorMessageContainer: document.getElementById('errorMessageContainer'),
            errorMessage: document.getElementById('errorMessage'),
            controlsSection: document.getElementById('controlsSection'),
            chartsSection: document.getElementById('chartsSection'),
            tableSection: document.getElementById('tableSection')
        };

        // Verifica elementos essenciais
        const requiredElements = ['loadingIndicator', 'errorMessageContainer'];
        for (const elementKey of requiredElements) {
            if (!ui[elementKey]) {
                console.error(`Elemento DOM obrigatório não encontrado: ${elementKey}`);
                return false;
            }
        }

        return true;
    };

    /**
     * Inicializa todos os módulos
     * @returns {boolean} - Sucesso na inicialização
     */
    const initializeModules = () => {
        const modules = [
            { name: 'Modal', module: window.Modal },
            { name: 'Table', module: window.Table },
            { name: 'Filters', module: window.Filters },
            { name: 'Charts', module: window.Charts }
        ];

        for (const { name, module } of modules) {
            if (!module || typeof module.init !== 'function') {
                console.error(`Módulo ${name} não encontrado ou não possui método init`);
                return false;
            }

            try {
                const success = module.init();
                if (!success) {
                    console.error(`Falha na inicialização do módulo ${name}`);
                    return false;
                }
                console.log(`✅ Módulo ${name} inicializado`);
            } catch (error) {
                console.error(`❌ Erro ao inicializar módulo ${name}:`, error);
                return false;
            }
        }

        return true;
    };

    /**
     * Configura event listeners globais
     */
    const setupGlobalEventListeners = () => {
        // Event listeners para filtros
        document.addEventListener('filters:sector:change', handleSectorFilter);
        document.addEventListener('filters:search:change', handleSearchFilter);
        document.addEventListener('filters:stats:update', handleFilterStats);

        // Event listeners para tabela
        document.addEventListener('table:row:click', handleTableRowClick);

        // Event listeners para gráficos
        document.addEventListener('charts:fii:click', handleChartClick);

        // Event listeners para modal
        document.addEventListener('modal:open', handleModalOpen);
        document.addEventListener('modal:close', handleModalClose);

        // Event listeners para erros globais
        window.addEventListener('error', handleGlobalError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        // Event listener para visibilidade da página (para pausar/retomar auto-refresh)
        document.addEventListener('visibilitychange', handleVisibilityChange);

        console.log('Event listeners globais configurados');
    };

    /**
     * Carrega dados iniciais
     */
    const loadInitialData = async () => {
        try {
            showLoading('Carregando dados dos FIIs...');
            clearErrorMessage();

            const result = await Fetcher.fetchFiisData({
                useCache: true,
                useMockFallback: true
            });

            if (result.success && result.data.length > 0) {
                await processDataSuccess(result);
            } else {
                throw new Error(result.error || 'Nenhum dado foi retornado');
            }

        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
            showErrorMessage(`Erro ao carregar dados: ${error.message}`);
            
            // Tenta carregar dados mock como último recurso
            try {
                const mockData = Parser.parseMockData();
                if (mockData.length > 0) {
                    await processDataSuccess({
                        data: mockData,
                        source: 'mock-fallback',
                        timestamp: Date.now(),
                        success: true,
                        warning: 'Usando dados de demonstração devido a erro na busca'
                    });
                }
            } catch (mockError) {
                console.error('Erro ao carregar dados mock:', mockError);
            }
        } finally {
            hideLoading();
        }
    };

    /**
     * Processa dados carregados com sucesso
     * @param {Object} result - Resultado da busca de dados
     */
    const processDataSuccess = async (result) => {
        const { data, source, timestamp, warning } = result;

        // Atualiza estado global
        appState.originalFiis = [...data];
        appState.currentFiis = [...data];
        appState.hasData = true;
        appState.lastUpdate = timestamp;
        appState.dataSource = source;
        appState.error = null;

        // Atualiza módulos com os novos dados
        Table.updateData(data);
        Filters.updateData(data);
        Charts.updateData(data);

        // Atualiza informações da fonte de dados
        Filters.updateDataSourceInfo(source, timestamp);

        // Mostra seções da interface
        Filters.showControlsSection();
        Charts.showChartsSection();
        Table.showTableSection();

        // Mostra aviso se necessário
        if (warning) {
            setTimeout(() => {
                Modal.showWarning(warning);
            }, 1000);
        }

        console.log(`✅ Dados processados: ${data.length} FIIs de fonte ${source}`);
        dispatchAppEvent('data:loaded', { data, source, timestamp });
    };

    /**
     * Atualiza dados da aplicação
     */
    const refreshData = async () => {
        if (appState.isLoading) {
            console.log('Atualização já em andamento, ignorando...');
            return;
        }

        try {
            showLoading('Atualizando dados...');
            clearErrorMessage();

            const result = await Fetcher.refreshData();

            if (result.success && result.data.length > 0) {
                await processDataSuccess(result);
                Modal.showSuccess('Dados atualizados com sucesso!');
            } else {
                throw new Error(result.error || 'Falha na atualização dos dados');
            }

        } catch (error) {
            console.error('Erro ao atualizar dados:', error);
            showErrorMessage(`Erro na atualização: ${error.message}`);
        } finally {
            hideLoading();
        }
    };

    /**
     * Mostra indicador de carregamento
     * @param {string} message - Mensagem de carregamento
     */
    const showLoading = (message = 'Carregando...') => {
        appState.isLoading = true;
        
        if (ui.loadingIndicator) {
            ui.loadingIndicator.classList.remove('hidden');
            
            const loadingText = ui.loadingIndicator.querySelector('span');
            if (loadingText) {
                loadingText.textContent = message;
            }
        }

        dispatchAppEvent('loading:show', { message });
    };

    /**
     * Esconde indicador de carregamento
     */
    const hideLoading = () => {
        appState.isLoading = false;
        
        if (ui.loadingIndicator) {
            ui.loadingIndicator.classList.add('hidden');
        }

        dispatchAppEvent('loading:hide');
    };

    /**
     * Mostra mensagem de erro
     * @param {string} message - Mensagem de erro
     */
    const showErrorMessage = (message) => {
        appState.error = message;
        
        if (ui.errorMessageContainer && ui.errorMessage) {
            ui.errorMessage.textContent = message;
            ui.errorMessageContainer.classList.remove('hidden');
        }

        dispatchAppEvent('error:show', { message });
    };

    /**
     * Limpa mensagem de erro
     */
    const clearErrorMessage = () => {
        appState.error = null;
        
        if (ui.errorMessageContainer) {
            ui.errorMessageContainer.classList.add('hidden');
        }

        dispatchAppEvent('error:clear');
    };

    /**
     * Mostra modal de boas-vindas
     */
    const showWelcomeModal = () => {
        setTimeout(() => {
            Modal.showInfoModal();
        }, 500);
    };

    /**
     * Configura auto-refresh dos dados
     */
    const setupAutoRefresh = () => {
        if (refreshTimer) {
            clearInterval(refreshTimer);
        }

        refreshTimer = setInterval(() => {
            if (!document.hidden && appState.isInitialized && !appState.isLoading) {
                console.log('🔄 Auto-refresh executado');
                refreshData();
            }
        }, CONFIG.autoRefreshInterval);

        console.log(`Auto-refresh configurado para ${CONFIG.autoRefreshInterval / 1000}s`);
    };

    /**
     * Para auto-refresh
     */
    const stopAutoRefresh = () => {
        if (refreshTimer) {
            clearInterval(refreshTimer);
            refreshTimer = null;
            console.log('Auto-refresh parado');
        }
    };

    // Event Handlers

    /**
     * Manipula filtro de setor
     * @param {CustomEvent} event - Evento de filtro
     */
    const handleSectorFilter = (event) => {
        const { sector } = event.detail;
        console.log(`Filtro de setor aplicado: ${sector || 'Todos'}`);
    };

    /**
     * Manipula filtro de busca
     * @param {CustomEvent} event - Evento de busca
     */
    const handleSearchFilter = (event) => {
        const { search } = event.detail;
        console.log(`Busca aplicada: "${search}"`);
    };

    /**
     * Manipula atualização de estatísticas dos filtros
     * @param {CustomEvent} event - Evento de estatísticas
     */
    const handleFilterStats = (event) => {
        const { total, sectors, avgDY } = event.detail;
        console.log(`Estatísticas atualizadas: ${total} FIIs, ${sectors} setores, DY médio: ${avgDY.toFixed(2)}%`);
    };

    /**
     * Manipula clique em linha da tabela
     * @param {CustomEvent} event - Evento de clique
     */
    const handleTableRowClick = (event) => {
        const { ticker } = event.detail;
        console.log(`FII selecionado: ${ticker}`);
        
        // Aqui poderia abrir modal com detalhes do FII
        // Modal.showCustomModal({
        //     title: `Detalhes - ${ticker}`,
        //     content: `Informações detalhadas sobre ${ticker}...`
        // });
    };

    /**
     * Manipula clique em gráfico
     * @param {CustomEvent} event - Evento de clique
     */
    const handleChartClick = (event) => {
        const { ticker, type } = event.detail;
        console.log(`FII clicado no gráfico ${type}: ${ticker}`);
    };

    /**
     * Manipula abertura de modal
     * @param {CustomEvent} event - Evento de modal
     */
    const handleModalOpen = (event) => {
        console.log('Modal aberto');
    };

    /**
     * Manipula fechamento de modal
     * @param {CustomEvent} event - Evento de modal
     */
    const handleModalClose = (event) => {
        console.log('Modal fechado');
    };

    /**
     * Manipula erros globais
     * @param {ErrorEvent} event - Evento de erro
     */
    const handleGlobalError = (event) => {
        console.error('Erro global capturado:', event.error);
        
        if (CONFIG.debugMode) {
            showErrorMessage(`Erro: ${event.error?.message || 'Erro desconhecido'}`);
        }
    };

    /**
     * Manipula promises rejeitadas
     * @param {PromiseRejectionEvent} event - Evento de promise rejeitada
     */
    const handleUnhandledRejection = (event) => {
        console.error('Promise rejeitada:', event.reason);
        
        if (CONFIG.debugMode) {
            showErrorMessage(`Promise rejeitada: ${event.reason?.message || 'Erro desconhecido'}`);
        }
    };

    /**
     * Manipula mudança de visibilidade da página
     */
    const handleVisibilityChange = () => {
        if (document.hidden) {
            console.log('Página oculta - pausando operações');
        } else {
            console.log('Página visível - retomando operações');
        }
    };

    /**
     * Obtém estado atual da aplicação
     * @returns {Object} - Estado da aplicação
     */
    const getAppState = () => {
        return { ...appState };
    };

    /**
     * Obtém estatísticas da aplicação
     * @returns {Object} - Estatísticas
     */
    const getAppStats = () => {
        return {
            totalFiis: appState.originalFiis.length,
            currentFiis: appState.currentFiis.length,
            lastUpdate: appState.lastUpdate,
            dataSource: appState.dataSource,
            isLoading: appState.isLoading,
            hasError: !!appState.error,
            uptime: appState.isInitialized ? Date.now() - appState.lastUpdate : 0
        };
    };

    /**
     * Dispara evento customizado da aplicação
     * @param {string} eventName - Nome do evento
     * @param {Object} detail - Detalhes do evento
     */
    const dispatchAppEvent = (eventName, detail = {}) => {
        const event = new CustomEvent(`app:${eventName}`, {
            detail: {
                appState: getAppState(),
                timestamp: Date.now(),
                ...detail
            }
        });
        
        document.dispatchEvent(event);
    };

    /**
     * Limpa recursos da aplicação
     */
    const destroy = () => {
        // Para auto-refresh
        stopAutoRefresh();

        // Destroi módulos
        if (window.Modal?.destroy) window.Modal.destroy();
        if (window.Table?.destroy) window.Table.destroy();
        if (window.Filters?.destroy) window.Filters.destroy();
        if (window.Charts?.destroy) window.Charts.destroy();

        // Remove event listeners
        document.removeEventListener('filters:sector:change', handleSectorFilter);
        document.removeEventListener('filters:search:change', handleSearchFilter);
        document.removeEventListener('filters:stats:update', handleFilterStats);
        document.removeEventListener('table:row:click', handleTableRowClick);
        document.removeEventListener('charts:fii:click', handleChartClick);
        document.removeEventListener('modal:open', handleModalOpen);
        document.removeEventListener('modal:close', handleModalClose);
        window.removeEventListener('error', handleGlobalError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        document.removeEventListener('visibilitychange', handleVisibilityChange);

        // Limpa estado
        appState = {
            isInitialized: false,
            isLoading: false,
            hasData: false,
            lastUpdate: null,
            dataSource: null,
            error: null,
            originalFiis: [],
            currentFiis: [],
            currentSort: { column: null, direction: 'asc' }
        };

        console.log('Aplicação destruída');
    };

    // API pública
    return {
        // Inicialização
        init,
        destroy,
        
        // Controle de dados
        refreshData,
        
        // Estado
        getAppState,
        getAppStats,
        
        // Controle de interface
        showLoading,
        hideLoading,
        showErrorMessage,
        clearErrorMessage,
        
        // Auto-refresh
        setupAutoRefresh,
        stopAutoRefresh,
        
        // Configurações
        CONFIG
    };
})();

// Inicializa a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    FiiAnalyzerApp.init();
});

// Disponibilizar globalmente para debug
window.FiiAnalyzerApp = FiiAnalyzerApp;