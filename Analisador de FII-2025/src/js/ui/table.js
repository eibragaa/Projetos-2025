/**
 * Módulo para gerenciamento da tabela de FIIs
 * Responsável por renderizar e manipular a exibição dos dados
 */

const Table = (() => {
    'use strict';

    /**
     * Elementos DOM da tabela
     */
    let elements = {};

    /**
     * Estado atual da tabela
     */
    let currentData = [];
    let filteredData = [];
    let currentSort = {
        column: null,
        direction: 'asc'
    };

    /**
     * Configurações da tabela
     */
    const CONFIG = {
        rowsPerPage: 50,
        currentPage: 1,
        enablePagination: false,
        enableVirtualScroll: false,
        animateRows: true
    };

    /**
     * Inicializa o módulo da tabela
     */
    const init = () => {
        // Busca elementos DOM
        elements = {
            tableSection: document.getElementById('tableSection'),
            tableBody: document.getElementById('fiiTableBody'),
            totalCount: document.getElementById('totalFiisCount'),
            sortableHeaders: document.querySelectorAll('.sortable'),
            table: document.querySelector('table')
        };

        // Verifica se os elementos existem
        if (!elements.tableBody) {
            console.error('Elemento tbody da tabela não encontrado');
            return false;
        }

        // Configura event listeners
        setupEventListeners();
        
        console.log('Tabela inicializada com sucesso');
        return true;
    };

    /**
     * Configura event listeners da tabela
     */
    const setupEventListeners = () => {
        // Event listeners para cabeçalhos ordenáveis
        elements.sortableHeaders.forEach(header => {
            header.addEventListener('click', handleHeaderClick);
            
            // Adiciona suporte para teclado
            header.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleHeaderClick(event);
                }
            });
        });

        // Event listener para cliques nas linhas
        if (elements.tableBody) {
            elements.tableBody.addEventListener('click', handleRowClick);
        }

        // Event listener para hover nas linhas (para tooltips)
        if (elements.tableBody) {
            elements.tableBody.addEventListener('mouseover', handleRowHover);
            elements.tableBody.addEventListener('mouseout', handleRowHoverOut);
        }
    };

    /**
     * Manipula clique nos cabeçalhos para ordenação
     * @param {Event} event - Evento de clique
     */
    const handleHeaderClick = (event) => {
        const header = event.currentTarget;
        const column = header.dataset.sort;
        
        if (!column) return;

        // Determina nova direção de ordenação
        let newDirection = 'asc';
        if (currentSort.column === column && currentSort.direction === 'asc') {
            newDirection = 'desc';
        }

        // Aplica ordenação
        sortData(column, newDirection);
        
        // Atualiza indicadores visuais
        updateSortIndicators(column, newDirection);
        
        // Re-renderiza tabela
        renderTable(filteredData);
    };

    /**
     * Manipula clique nas linhas da tabela
     * @param {Event} event - Evento de clique
     */
    const handleRowClick = (event) => {
        const row = event.target.closest('tr');
        if (!row) return;

        const ticker = row.dataset.ticker;
        if (ticker) {
            // Destaca a linha selecionada
            highlightRow(row);
            
            // Dispara evento customizado
            dispatchTableEvent('row:click', { ticker, row });
            
            console.log(`Linha clicada: ${ticker}`);
        }
    };

    /**
     * Manipula hover nas linhas para tooltips
     * @param {Event} event - Evento de hover
     */
    const handleRowHover = (event) => {
        const cell = event.target.closest('td');
        if (!cell) return;

        // Verifica se a célula tem texto truncado
        if (cell.scrollWidth > cell.clientWidth) {
            showTooltip(cell, cell.textContent);
        }
    };

    /**
     * Remove tooltip ao sair do hover
     * @param {Event} event - Evento de mouse out
     */
    const handleRowHoverOut = (event) => {
        hideTooltip();
    };

    /**
     * Renderiza a tabela com os dados fornecidos
     * @param {Array} data - Array de FIIs para renderizar
     */
    const renderTable = (data = []) => {
        if (!elements.tableBody) {
            console.error('Elemento tbody não encontrado');
            return;
        }

        // Limpa conteúdo atual
        elements.tableBody.innerHTML = '';

        // Atualiza contador
        updateTotalCount(data.length);

        // Se não há dados, exibe mensagem
        if (data.length === 0) {
            showEmptyState();
            return;
        }

        // Cria fragment para melhor performance
        const fragment = document.createDocumentFragment();

        // Renderiza cada linha
        data.forEach((fii, index) => {
            const row = createTableRow(fii, index);
            fragment.appendChild(row);
        });

        // Adiciona ao DOM
        elements.tableBody.appendChild(fragment);

        // Mostra seção da tabela
        showTableSection();

        // Aplica animações se habilitado
        if (CONFIG.animateRows) {
            animateTableRows();
        }

        console.log(`Tabela renderizada com ${data.length} FIIs`);
    };

    /**
     * Cria uma linha da tabela para um FII
     * @param {Object} fii - Dados do FII
     * @param {number} index - Índice da linha
     * @returns {HTMLElement} - Elemento tr da linha
     */
    const createTableRow = (fii, index) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors duration-150';
        row.dataset.ticker = fii.ticker;
        row.dataset.index = index;

        // Ticker
        const tickerCell = createCell(fii.ticker, 'cell-ticker');
        
        // Setor
        const sectorCell = createCell(
            Formatters.truncateText(fii.setor, 20), 
            'cell-sector',
            fii.setor // tooltip com texto completo
        );
        
        // Cotação
        const cotacaoCell = createCell(
            Formatters.formatCurrency(fii.cotacao),
            'cell-currency'
        );
        
        // P/VP
        const pvpCell = createCell(
            Formatters.formatPVP(fii.pvp),
            'cell-number'
        );
        
        // Dividend Yield
        const dyData = Formatters.formatDividendYield(fii.dividendYield);
        const dyCell = createCell(
            dyData.formatted,
            `cell-percentage ${dyData.cssClass}`
        );
        
        // Liquidez
        const liquidezCell = createCell(
            Formatters.formatLiquidity(fii.liquidez),
            'cell-number'
        );
        
        // Patrimônio Líquido
        const plCell = createCell(
            Formatters.formatLargeNumber(fii.patrimonioLiquido),
            'cell-currency'
        );
        
        // Vacância
        const vacanciaData = Formatters.formatVacancy(fii.vacancia);
        const vacanciaCell = createCell(
            vacanciaData.formatted,
            `cell-percentage ${vacanciaData.cssClass}`
        );

        // Adiciona células à linha
        row.appendChild(tickerCell);
        row.appendChild(sectorCell);
        row.appendChild(cotacaoCell);
        row.appendChild(pvpCell);
        row.appendChild(dyCell);
        row.appendChild(liquidezCell);
        row.appendChild(plCell);
        row.appendChild(vacanciaCell);

        return row;
    };

    /**
     * Cria uma célula da tabela
     * @param {string} content - Conteúdo da célula
     * @param {string} className - Classes CSS
     * @param {string} tooltip - Texto do tooltip (opcional)
     * @returns {HTMLElement} - Elemento td da célula
     */
    const createCell = (content, className = '', tooltip = '') => {
        const cell = document.createElement('td');
        cell.className = `table-cell ${className}`;
        cell.textContent = content;
        
        if (tooltip && tooltip !== content) {
            cell.title = tooltip;
            cell.classList.add('cell-tooltip');
            cell.dataset.tooltip = tooltip;
        }
        
        return cell;
    };

    /**
     * Ordena os dados da tabela
     * @param {string} column - Coluna para ordenação
     * @param {string} direction - Direção da ordenação
     */
    const sortData = (column, direction) => {
        currentSort = { column, direction };
        
        filteredData = Sorters.sortFiis(filteredData, column, direction);
        
        console.log(`Dados ordenados por ${column} (${direction})`);
    };

    /**
     * Atualiza indicadores visuais de ordenação
     * @param {string} activeColumn - Coluna ativa
     * @param {string} direction - Direção da ordenação
     */
    const updateSortIndicators = (activeColumn, direction) => {
        elements.sortableHeaders.forEach(header => {
            const column = header.dataset.sort;
            
            // Remove classes de ordenação existentes
            header.classList.remove('sort-asc', 'sort-desc');
            
            // Adiciona classe para coluna ativa
            if (column === activeColumn) {
                header.classList.add(`sort-${direction}`);
            }
        });
    };

    /**
     * Destaca uma linha da tabela
     * @param {HTMLElement} row - Linha a ser destacada
     */
    const highlightRow = (row) => {
        // Remove destaque de outras linhas
        elements.tableBody.querySelectorAll('.row-highlighted').forEach(r => {
            r.classList.remove('row-highlighted');
        });
        
        // Adiciona destaque à linha atual
        row.classList.add('row-highlighted');
        
        // Remove destaque após alguns segundos
        setTimeout(() => {
            row.classList.remove('row-highlighted');
        }, 3000);
    };

    /**
     * Mostra tooltip para célula
     * @param {HTMLElement} cell - Célula
     * @param {string} text - Texto do tooltip
     */
    const showTooltip = (cell, text) => {
        // Remove tooltip existente
        hideTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.className = 'table-tooltip';
        tooltip.textContent = text;
        tooltip.id = 'table-tooltip';
        
        // Posiciona tooltip
        const rect = cell.getBoundingClientRect();
        tooltip.style.position = 'fixed';
        tooltip.style.top = `${rect.top - 30}px`;
        tooltip.style.left = `${rect.left}px`;
        tooltip.style.zIndex = '1000';
        tooltip.style.backgroundColor = '#1f2937';
        tooltip.style.color = 'white';
        tooltip.style.padding = '4px 8px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.fontSize = '12px';
        tooltip.style.whiteSpace = 'nowrap';
        
        document.body.appendChild(tooltip);
    };

    /**
     * Esconde tooltip
     */
    const hideTooltip = () => {
        const tooltip = document.getElementById('table-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    };

    /**
     * Atualiza contador total de FIIs
     * @param {number} count - Número de FIIs
     */
    const updateTotalCount = (count) => {
        if (elements.totalCount) {
            elements.totalCount.textContent = count;
        }
    };

    /**
     * Mostra estado vazio da tabela
     */
    const showEmptyState = () => {
        const emptyRow = document.createElement('tr');
        emptyRow.className = 'table-empty';
        
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = 8;
        emptyCell.innerHTML = `
            <div class="text-center py-12">
                <svg class="table-empty-icon mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="mt-4 text-gray-500">Nenhum FII encontrado</p>
                <p class="text-sm text-gray-400">Tente ajustar os filtros ou recarregar os dados</p>
            </div>
        `;
        
        emptyRow.appendChild(emptyCell);
        elements.tableBody.appendChild(emptyRow);
    };

    /**
     * Mostra seção da tabela
     */
    const showTableSection = () => {
        if (elements.tableSection) {
            elements.tableSection.classList.remove('hidden');
        }
    };

    /**
     * Esconde seção da tabela
     */
    const hideTableSection = () => {
        if (elements.tableSection) {
            elements.tableSection.classList.add('hidden');
        }
    };

    /**
     * Aplica animações às linhas da tabela
     */
    const animateTableRows = () => {
        const rows = elements.tableBody.querySelectorAll('tr');
        
        rows.forEach((row, index) => {
            row.style.opacity = '0';
            row.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            }, index * 50);
        });
    };

    /**
     * Atualiza dados da tabela
     * @param {Array} data - Novos dados
     */
    const updateData = (data) => {
        currentData = [...data];
        filteredData = [...data];
        
        // Aplica ordenação atual se existir
        if (currentSort.column) {
            sortData(currentSort.column, currentSort.direction);
        }
        
        renderTable(filteredData);
    };

    /**
     * Aplica filtro aos dados
     * @param {Function} filterFn - Função de filtro
     */
    const applyFilter = (filterFn) => {
        if (typeof filterFn === 'function') {
            filteredData = currentData.filter(filterFn);
        } else {
            filteredData = [...currentData];
        }
        
        // Reaplica ordenação
        if (currentSort.column) {
            sortData(currentSort.column, currentSort.direction);
        }
        
        renderTable(filteredData);
    };

    /**
     * Limpa filtros e mostra todos os dados
     */
    const clearFilters = () => {
        filteredData = [...currentData];
        renderTable(filteredData);
    };

    /**
     * Obtém dados atualmente exibidos
     * @returns {Array} - Dados filtrados
     */
    const getCurrentData = () => [...filteredData];

    /**
     * Obtém dados originais
     * @returns {Array} - Dados originais
     */
    const getOriginalData = () => [...currentData];

    /**
     * Obtém estado atual da ordenação
     * @returns {Object} - Estado da ordenação
     */
    const getSortState = () => ({ ...currentSort });

    /**
     * Dispara evento customizado da tabela
     * @param {string} eventName - Nome do evento
     * @param {Object} detail - Detalhes do evento
     */
    const dispatchTableEvent = (eventName, detail = {}) => {
        const event = new CustomEvent(`table:${eventName}`, {
            detail: {
                table: elements.table,
                currentData: filteredData,
                sortState: currentSort,
                ...detail
            }
        });
        
        document.dispatchEvent(event);
    };

    /**
     * Limpa recursos da tabela
     */
    const destroy = () => {
        // Remove event listeners
        elements.sortableHeaders.forEach(header => {
            header.removeEventListener('click', handleHeaderClick);
        });

        if (elements.tableBody) {
            elements.tableBody.removeEventListener('click', handleRowClick);
            elements.tableBody.removeEventListener('mouseover', handleRowHover);
            elements.tableBody.removeEventListener('mouseout', handleRowHoverOut);
        }

        // Limpa dados
        currentData = [];
        filteredData = [];
        currentSort = { column: null, direction: 'asc' };

        // Limpa referências
        elements = {};

        console.log('Tabela destruída');
    };

    // API pública
    return {
        // Inicialização
        init,
        destroy,
        
        // Renderização
        renderTable,
        updateData,
        
        // Filtros e ordenação
        applyFilter,
        clearFilters,
        sortData,
        
        // Estado
        getCurrentData,
        getOriginalData,
        getSortState,
        
        // Controle de exibição
        showTableSection,
        hideTableSection,
        
        // Configurações
        CONFIG
    };
})();

// Disponibilizar globalmente
window.Table = Table;