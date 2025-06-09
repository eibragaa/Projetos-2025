/**
 * Módulo principal da aplicação - Analisador Quantitativo de FIIs
 * Responsável por orquestrar todos os módulos e gerenciar o estado global
 */
import * as Formatters from './utils/formatters.js';

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
        originalFiis: [], // Formerly allFiis
        currentFiis: [],  // Formerly filteredFiis
        currentSort: {    // Formerly currentSort
            field: null,  // field instead of column
            order: 'asc' // order instead of direction
        }
    };

    /**
     * Elementos DOM principais
     */
    let ui = {
        loadingIndicator: null,
        loadingProgress: null,
        loadingMessage: null,
        loadingDetails: null,
        errorContainer: null, // Renamed from errorMessageContainer for consistency with index.html
        errorMessage: null,
        filtersSection: null, // Formerly controlsSection
        chartsSection: null,
        tableSection: null,
        segmentoFilter: null,
        pvpMaxFilter: null,
        dyMinFilter: null,
        applyFiltersButton: null,
        clearFiltersButton: null,
        fiiTableBody: null,
        fiiCount: null,
        sortableHeaders: []
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
            if (CONFIG.showWelcomeModal && window.Modal && typeof window.Modal.showCustomModal === 'function') {
                setTimeout(() => { // Delay slightly to ensure page is stable
                    window.Modal.showCustomModal({
                        title: 'Bem-vindo ao Analisador de FIIs!',
                        content: '<p>Esta ferramenta ajuda você a analisar Fundos de Investimento Imobiliário com dados atualizados.</p><p>Use os filtros para refinar sua busca e clique nos cabeçalhos da tabela para ordenar. Os gráficos oferecem visualizações úteis dos dados.</p><p><strong>Disclaimer:</strong> Fins educacionais. Não é recomendação de investimento.</p>',
                        type: 'info',
                        buttons: [{ text: 'Entendi', action: 'close', primary: true }]
                    });
                }, 500);
            }

            // Carrega dados iniciais via Web Worker
            await loadCsvDataViaWorker();

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
            loadingProgress: document.getElementById('loadingProgress'),
            loadingMessage: document.getElementById('loadingMessage'),
            loadingDetails: document.getElementById('loadingDetails'),
            errorContainer: document.getElementById('errorContainer'),
            errorMessage: document.getElementById('errorMessage'),
            filtersSection: document.getElementById('filtersSection'),
            chartsSection: document.getElementById('chartsSection'), // May not be used yet
            tableSection: document.getElementById('tableSection'),
            segmentoFilter: document.getElementById('segmentoFilter'),
            pvpMaxFilter: document.getElementById('pvpMaxFilter'),
            dyMinFilter: document.getElementById('dyMinFilter'),
            applyFiltersButton: document.getElementById('applyFilters'),
            clearFiltersButton: document.getElementById('clearFilters'),
            fiiTableBody: document.getElementById('fiiTableBody'), // Will be managed by Table.js mostly
            fiiCount: document.getElementById('fiiCount'), // Will be managed by Table.js or app.js via Table module
            // sortableHeaders: document.querySelectorAll('.sortable') // Table.js should handle its own sortable headers
        };

        // Verifica elementos essenciais
        const requiredElements = [
            'loadingIndicator', 'errorContainer', 'filtersSection', 'tableSection',
            'segmentoFilter', 'pvpMaxFilter', 'dyMinFilter', 'applyFiltersButton',
            'clearFiltersButton', 'fiiTableBody', 'fiiCount'
        ];
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
            { name: 'Modal', module: window.Modal }, // Keep for now, might be used later
            { name: 'Table', module: window.Table }, // Keep for now
            { name: 'Filters', module: window.Filters }, // Keep for now
            { name: 'Charts', module: window.Charts } // Keep for now
        ];

        for (const { name, module } of modules) {
            if (module && typeof module.init === 'function') {
                try {
                    const success = module.init();
                    if (!success) {
                        console.warn(`Falha na inicialização do módulo ${name} (retornou false)`);
                    } else {
                        console.log(`✅ Módulo ${name} inicializado`);
                    }
                } catch (error) {
                    console.error(`❌ Erro ao inicializar módulo ${name}:`, error);
                    // Continue initializing other modules even if one fails
                }
            } else {
                console.warn(`Módulo ${name} não encontrado ou não possui método init. Será ignorado.`);
            }
        }
        return true; // Return true even if some optional modules fail
    };

    /**
     * Configura event listeners globais (adaptado do index.html)
     */
    const setupGlobalEventListeners = () => {
        if (ui.applyFiltersButton) {
            ui.applyFiltersButton.addEventListener('click', applyFilters);
        }
        if (ui.clearFiltersButton) {
            ui.clearFiltersButton.addEventListener('click', clearFilters);
        }

        // Enter key on filter inputs (still managed by app.js for its filter logic)
        if (ui.pvpMaxFilter) {
            ui.pvpMaxFilter.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') applyFilters();
            });
        }
        if (ui.dyMinFilter) {
            ui.dyMinFilter.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') applyFilters();
            });
        }

        // Sorting event listeners are removed from app.js
        // ui.sortableHeaders.forEach(th => {
        //     th.addEventListener('click', () => {
        //         const field = th.getAttribute('data-field');
        //         sortData(field); // sortData is being removed from app.js
        //     });
        // });

        // Event listeners para erros globais (manter)
        window.addEventListener('error', handleGlobalError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        // Event listener para visibilidade da página (manter)
        document.addEventListener('visibilitychange', handleVisibilityChange);

        console.log('Event listeners globais configurados');
    };


    // Worker para CSV
    const csvWorker = new Worker('public/csv.worker.js'); // Path relative to index.html

    csvWorker.onmessage = function(event) {
        console.log("Mensagem recebida do worker");
        hideLoading(); // Hide loading indicator as soon as worker responds

        if (event.data.success) {
            console.log("Worker processou CSV com sucesso");
            appState.originalFiis = event.data.data;
            // Log added as per subtask instructions
            console.log("app.js: CSV data successfully processed by worker. First item:", appState.originalFiis[0]);
            console.log("Total de registros:", appState.originalFiis.length);
            appState.currentFiis = [...appState.originalFiis];
            appState.hasData = true;
            appState.dataSource = 'csv-local';
            appState.lastUpdate = new Date().toISOString();

            // Update UI Modules with new data
            if (window.Filters && typeof window.Filters.updateData === 'function') {
                console.log("Atualizando Filters com dados do worker...");
                window.Filters.updateData(appState.originalFiis); // This should also populate segments
            } else {
                console.warn("Filters module não encontrado ou sem updateData. Filtro de segmento pode não ser populado.");
                // Fallback to direct population if Filters module is not behaving as expected (TEMPORARY)
                // populateSegmentFilter(); // This function is being removed
            }

            if (window.Table && typeof window.Table.updateData === 'function') {
                console.log("Atualizando Table com dados do worker...");
                window.Table.updateData(appState.currentFiis); // Table will render itself
            } else {
                console.warn("Table module não encontrado ou sem updateData. Tabela não será renderizada.");
                // Fallback to direct rendering if Table module is not behaving (TEMPORARY)
                // renderTable(); // This function is being removed
            }

            if (window.Charts && typeof window.Charts.updateData === 'function') {
                console.log("app.js: Atualizando Charts com dados...");
                window.Charts.updateData(appState.originalFiis); // Use originalFiis for overall charts
            } else {
                console.warn("app.js: Charts module não encontrado ou sem updateData.");
            }

            console.log("Mostrando conteúdo...");
            showContent(); // This just unhides sections
            dispatchAppEvent('data:loaded', { data: appState.originalFiis, source: appState.dataSource });

        } else {
            console.error("Erro no worker:", event.data.error);
            showError(`Erro ao processar CSV: ${event.data.error}`);
            dispatchAppEvent('app:error', { error: event.data.error });
        }
    };

    csvWorker.onerror = function(error) {
        // Log added as per subtask instructions
        console.error("app.js: csvWorker.onerror triggered. Error event:", error);
        showError(`Erro crítico no worker: ${error.message}. Verifique o console do worker.`);
        hideLoading();
        dispatchAppEvent('app:error', { error: error.message });
    };

    async function loadCsvDataViaWorker() {
        console.log("Mostrando indicador de carregamento");
        showLoadingScreen("Carregando dados do CSV...", 0); // Use new loading screen function
        clearErrorMessage(); // Clear previous errors
        console.log("Iniciando carregamento do CSV...");

        try {
            console.log("Iniciando fetch do CSV (statusinvest-busca-avancada.csv)...");
            // Path relative to index.html as it's a fetch operation by the browser
            const response = await fetch('statusinvest-busca-avancada.csv');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} ao buscar statusinvest-busca-avancada.csv`);
            }
            updateLoadingScreen("CSV baixado, processando...", 50);

            console.log("Fetch do CSV completo. Obtendo texto...");
            const csvText = await response.text();
            console.log("Texto do CSV obtido. Tamanho:", csvText.length);

            console.log("Enviando CSV para o worker...");
            csvWorker.postMessage({ csvText });
            updateLoadingScreen("Enviado para processamento...", 75);
            console.log("CSV enviado para o worker");

        } catch (error) {
            // Log added as per subtask instructions
            console.error("app.js: Error in loadCsvDataViaWorker fetch/setup:", error);
            showError(`Erro ao carregar dados: ${error.message}`);
            hideLoading(); // Ensure loading is hidden on fetch error
            dispatchAppEvent('app:error', { error: error.message });
        }
    }

    // REMOVE/COMMENT OLD DATA LOADING
    // const loadInitialData = async () => { ... };
    // const processDataSuccess = async (result) => { ... }; // Old function, removed
    // const refreshData = async () => { ... }; // Old function, removed


    function updateLoadingScreen(message, progress) {
        if (ui.loadingProgress) ui.loadingProgress.textContent = `${progress}%`;
        if (ui.loadingMessage) ui.loadingMessage.textContent = message;
    }

    function showLoadingScreen(initialMessage = "Carregando dados dos FIIs...", initialProgress = 0) {
        appState.isLoading = true;
        if (ui.loadingIndicator) {
            ui.loadingIndicator.classList.remove('hidden');
        }
        if (ui.errorContainer) ui.errorContainer.classList.add('hidden');
        if (ui.filtersSection) ui.filtersSection.classList.add('hidden');
        if (ui.tableSection) ui.tableSection.classList.add('hidden');
        updateLoadingScreen(initialMessage, initialProgress);
        dispatchAppEvent('loading:show', { message: initialMessage });
    }

    const hideLoading = () => {
        appState.isLoading = false;
        if (ui.loadingIndicator) {
            ui.loadingIndicator.classList.add('hidden');
        }
        dispatchAppEvent('loading:hide');
    };

    const showContent = () => {
        if (ui.filtersSection) ui.filtersSection.classList.remove('hidden');
        if (ui.tableSection) ui.tableSection.classList.remove('hidden');
         // Show table section is also handled by Table.js if it has showTableSection method
        if (window.Table && typeof window.Table.showTableSection === 'function') {
            // window.Table.showTableSection(); // Table.js might do this itself upon data update
        }
    };

    const showError = (message) => {
        appState.error = message;
        if (ui.errorContainer && ui.errorMessage) {
            ui.errorMessage.innerHTML = message; // Keep simple error display
            ui.errorContainer.classList.remove('hidden');
        }
        // Also show error in a modal
        if (window.Modal && typeof window.Modal.showError === 'function') {
            window.Modal.showError(message);
        } else {
            console.warn("app.js: Modal module não encontrado ou sem showError para exibir erro em modal.");
        }
        dispatchAppEvent('error:show', { message });
    };

    const clearErrorMessage = () => {
        appState.error = null;
        if (ui.errorContainer) {
            ui.errorContainer.classList.add('hidden');
        }
        dispatchAppEvent('error:clear');
    };

    // populateSegmentFilter is removed from app.js, Filters.js handles its own segment population via updateData.

    // Filter functions (P/VP and DY filters are still managed by app.js for now)
    function applyFilters() {
        if (!ui.segmentoFilter || !ui.pvpMaxFilter || !ui.dyMinFilter) return;

        const segmentoFilterValue = ui.segmentoFilter.value;
        const pvpMaxFilterValue = ui.pvpMaxFilter.value;
        const dyMinFilterValue = ui.dyMinFilter.value;

        appState.currentFiis = appState.originalFiis.filter(fii => {
            // Use fii.setor for filtering, as this is the mapped property name
            if (segmentoFilterValue && fii.setor !== segmentoFilterValue) {
                return false;
            }

            // P/VP Max Filter
            // const pvp = parseFloat(String(fii.p_vp).replace(',', '.')) || Infinity; // Old parsing
            const currentFiiPvp = fii.pvp; // Should be a number from worker, or null
            const maxPvp = parseFloat(pvpMaxFilterValue);
            if (pvpMaxFilterValue) { // Only apply if there's a filter value
                if (currentFiiPvp === null || isNaN(maxPvp) || currentFiiPvp > maxPvp) {
                    return false;
                }
            }

            // DY Min Filter
            // const dy = parseFloat(String(fii.dy).replace(',', '.')) || -Infinity; // Old parsing
            const currentFiiDy = fii.dividendYield; // Should be a number from worker, or null
            const minDy = parseFloat(dyMinFilterValue);
            if (dyMinFilterValue) { // Only apply if there's a filter value
                if (currentFiiDy === null || isNaN(minDy) || currentFiiDy < minDy) {
                    return false;
                }
            }
            return true;
        });

        if (window.Table && typeof window.Table.updateData === 'function') {
            window.Table.updateData(appState.currentFiis);
        } else {
            console.warn("Table module não encontrado para aplicar filtros.");
        }
        // Update FII count displayed by app.js (if Table.js doesn't do it)
        if(ui.fiiCount) ui.fiiCount.textContent = appState.currentFiis.length;

        dispatchAppEvent('filters:applied');
    }

    function clearFilters() {
        if (!ui.segmentoFilter || !ui.pvpMaxFilter || !ui.dyMinFilter) return;

        ui.segmentoFilter.value = '';
        ui.pvpMaxFilter.value = '';
        ui.dyMinFilter.value = '';

        appState.currentFiis = [...appState.originalFiis];

        if (window.Table && typeof window.Table.updateData === 'function') {
            window.Table.updateData(appState.currentFiis);
        } else {
            console.warn("Table module não encontrado para limpar filtros.");
        }
        // Update FII count displayed by app.js
        if(ui.fiiCount) ui.fiiCount.textContent = appState.currentFiis.length;

        dispatchAppEvent('filters:cleared');
    }

    // Sorting functions (sortData, updateSortIndicators) are removed from app.js
    // Table.js should handle its own sorting logic and indicators if its headers are clicked.

    // Render table function is removed from app.js
    // Table.js module is responsible for rendering the table.

    /**
     * Configura auto-refresh dos dados
     */
    const setupAutoRefresh = () => {
        // Commented out as refreshData which relied on Fetcher.js is removed for now.
        // if (refreshTimer) {
        //     clearInterval(refreshTimer);
        // }
        // refreshTimer = setInterval(() => {
        //     if (!document.hidden && appState.isInitialized && !appState.isLoading) {
        //         console.log('🔄 Auto-refresh executado');
        //         refreshData(); // refreshData is currently removed
        //     }
        // }, CONFIG.autoRefreshInterval);
        // console.log(`Auto-refresh configurado para ${CONFIG.autoRefreshInterval / 1000}s (atualmente desabilitado)`);
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

    // Event Handlers (Alguns são mantidos, outros como filter/table clicks são agora diretos)

    /**
     * Manipula erros globais
     * @param {ErrorEvent} event - Evento de erro
     */
    const handleGlobalError = (event) => {
        console.error('Erro global capturado:', event.error);
        if (CONFIG.debugMode || !appState.isInitialized) { // Show error if in debug or before init
            // Using showError which is the corrected function name for displaying errors in UI
            showError(`Erro global: ${event.error?.message || 'Erro desconhecido'}`);
        }
    };

    /**
     * Manipula promises rejeitadas
     * @param {PromiseRejectionEvent} event - Evento de promise rejeitada
     */
    const handleUnhandledRejection = (event) => {
        console.error('Promise rejeitada:', event.reason);
        if (CONFIG.debugMode || !appState.isInitialized) {
            // Using showError which is the corrected function name for displaying errors in UI
            showError(`Promise rejeitada: ${event.reason?.message || 'Erro desconhecido'}`);
        }
    };

    // Removed duplicate handleGlobalError and handleUnhandledRejection

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

        // Destroi módulos (se existirem e tiverem destroy)
        ['Modal', 'Table', 'Filters', 'Charts'].forEach(moduleName => {
            if (window[moduleName] && typeof window[moduleName].destroy === 'function') {
                try {
                    window[moduleName].destroy();
                    console.log(`Módulo ${moduleName} destruído.`);
                } catch (e) {
                    console.error(`Erro ao destruir módulo ${moduleName}:`, e);
                }
            }
        });

        // Remove event listeners
        if (ui.applyFiltersButton) ui.applyFiltersButton.removeEventListener('click', applyFilters);
        if (ui.clearFiltersButton) ui.clearFiltersButton.removeEventListener('click', clearFilters);
        // TODO: Add removal for keypress and sortable header listeners if necessary, though typically they are gone with the elements.

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
        
        // Controle de dados (refreshData removido por enquanto)
        // refreshData,
        
        // Estado
        getAppState,
        getAppStats,
        
        // Controle de interface
        showLoading: showLoadingScreen, // Use the more detailed one as default showLoading
        hideLoading,
        showError, // Renamed
        clearErrorMessage,
        
        // Auto-refresh
        // setupAutoRefresh, // Commented out as it's not functional without refreshData
        stopAutoRefresh,
        
        // Configurações
        CONFIG
    };
})();

// Inicializa a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    if (FiiAnalyzerApp && typeof FiiAnalyzerApp.init === 'function') {
        FiiAnalyzerApp.init();
    } else {
        console.error("FiiAnalyzerApp não está definido ou não pôde ser inicializado.");
        // Fallback UI error message if app can't load
        const loadingIndicator = document.getElementById('loadingIndicator');
        const errorContainer = document.getElementById('errorContainer');
        const errorMessage = document.getElementById('errorMessage');

        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        if (errorContainer && errorMessage) {
            errorMessage.textContent = "Erro crítico: A aplicação principal não pôde ser carregada. Verifique o console para detalhes.";
            errorContainer.classList.remove('hidden');
        }
    }
});

// Disponibilizar globalmente para debug (opcional, pode ser removido em produção)
window.FiiAnalyzerApp = FiiAnalyzerApp;