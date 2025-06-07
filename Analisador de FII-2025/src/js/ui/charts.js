/**
 * Módulo para gerenciamento de gráficos
 * Responsável por criar e atualizar visualizações dos dados dos FIIs
 */

const Charts = (() => {
    'use strict';

    /**
     * Elementos DOM dos gráficos
     */
    let elements = {};

    /**
     * Instâncias dos gráficos Chart.js
     */
    let chartInstances = {
        sector: null,
        dividend: null,
        scatter: null
    };

    /**
     * Dados atuais para os gráficos
     */
    let currentData = [];

    /**
     * Configurações dos gráficos
     */
    const CONFIG = {
        colors: [
            '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
            '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
        ],
        animation: {
            duration: 750,
            easing: 'easeInOutQuart'
        },
        responsive: true,
        maintainAspectRatio: false
    };

    /**
     * Inicializa o módulo de gráficos
     */
    const init = () => {
        // Verifica se Chart.js está disponível
        if (typeof Chart === 'undefined') {
            console.error('Chart.js não está carregado');
            return false;
        }

        // Busca elementos DOM
        elements = {
            chartsSection: document.getElementById('chartsSection'),
            sectorChart: document.getElementById('sectorChart'),
            dividendChart: document.getElementById('dividendChart'),
            scatterChart: document.getElementById('scatterChart')
        };

        // Verifica se os elementos existem
        if (!elements.sectorChart || !elements.dividendChart || !elements.scatterChart) {
            console.error('Elementos canvas dos gráficos não encontrados');
            return false;
        }

        // Configura Chart.js globalmente
        setupChartDefaults();
        
        console.log('Gráficos inicializados com sucesso');
        return true;
    };

    /**
     * Configura padrões globais do Chart.js
     */
    const setupChartDefaults = () => {
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.font.size = 12;
        Chart.defaults.color = '#6b7280';
        Chart.defaults.plugins.legend.labels.usePointStyle = true;
        Chart.defaults.plugins.legend.labels.padding = 15;
        Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        Chart.defaults.plugins.tooltip.titleColor = '#ffffff';
        Chart.defaults.plugins.tooltip.bodyColor = '#ffffff';
        Chart.defaults.plugins.tooltip.cornerRadius = 6;
        Chart.defaults.plugins.tooltip.padding = 10;
    };

    /**
     * Atualiza dados dos gráficos
     * @param {Array} data - Dados dos FIIs
     */
    const updateData = (data) => {
        currentData = [...data];
        
        if (data.length === 0) {
            hideChartsSection();
            return;
        }

        // Cria/atualiza todos os gráficos
        createSectorChart(data);
        createDividendChart(data);
        createScatterChart(data);
        
        // Mostra seção dos gráficos
        showChartsSection();
        
        console.log(`Gráficos atualizados com ${data.length} FIIs`);
    };

    /**
     * Cria gráfico de distribuição por setor
     * @param {Array} data - Dados dos FIIs
     */
    const createSectorChart = (data) => {
        const ctx = elements.sectorChart;
        if (!ctx) return;

        // Destroi gráfico existente
        if (chartInstances.sector) {
            chartInstances.sector.destroy();
        }

        // Agrupa dados por setor
        const sectorData = groupBySector(data);
        const labels = Object.keys(sectorData);
        const values = Object.values(sectorData);

        chartInstances.sector = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: CONFIG.colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverBorderWidth: 3,
                    hoverBorderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: CONFIG.animation,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 11
                            },
                            generateLabels: function(chart) {
                                const data = chart.data;
                                if (data.labels.length && data.datasets.length) {
                                    return data.labels.map((label, i) => {
                                        const value = data.datasets[0].data[i];
                                        const percentage = ((value / data.datasets[0].data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                                        return {
                                            text: `${label} (${percentage}%)`,
                                            fillStyle: data.datasets[0].backgroundColor[i],
                                            strokeStyle: data.datasets[0].borderColor,
                                            lineWidth: data.datasets[0].borderWidth,
                                            hidden: false,
                                            index: i
                                        };
                                    });
                                }
                                return [];
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} FIIs (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%',
                onHover: (event, activeElements) => {
                    event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
                }
            }
        });
    };

    /**
     * Cria gráfico de ranking de dividend yield
     * @param {Array} data - Dados dos FIIs
     */
    const createDividendChart = (data) => {
        const ctx = elements.dividendChart;
        if (!ctx) return;

        // Destroi gráfico existente
        if (chartInstances.dividend) {
            chartInstances.dividend.destroy();
        }

        // Ordena por dividend yield e pega top 10
        const topFiis = Sorters.getTopDividendYield(data, 10);
        const labels = topFiis.map(fii => fii.ticker);
        const values = topFiis.map(fii => fii.dividendYield);

        chartInstances.dividend = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Dividend Yield (%)',
                    data: values,
                    backgroundColor: values.map(value => {
                        if (value >= 12) return '#10b981'; // Verde para DY alto
                        if (value >= 8) return '#3b82f6';  // Azul para DY médio
                        if (value >= 6) return '#f59e0b';  // Amarelo para DY baixo
                        return '#ef4444'; // Vermelho para DY muito baixo
                    }),
                    borderColor: '#ffffff',
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: CONFIG.animation,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Dividend Yield (%)',
                            font: {
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(1) + '%';
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'FIIs',
                            font: {
                                weight: 'bold'
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed.y.toFixed(2)}%`;
                            }
                        }
                    }
                },
                onHover: (event, activeElements) => {
                    event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
                },
                onClick: (event, activeElements) => {
                    if (activeElements.length > 0) {
                        const index = activeElements[0].index;
                        const ticker = labels[index];
                        dispatchChartEvent('fii:click', { ticker, type: 'dividend' });
                    }
                }
            }
        });
    };

    /**
     * Cria gráfico de dispersão P/VP vs Dividend Yield
     * @param {Array} data - Dados dos FIIs
     */
    const createScatterChart = (data) => {
        const ctx = elements.scatterChart;
        if (!ctx) return;

        // Destroi gráfico existente
        if (chartInstances.scatter) {
            chartInstances.scatter.destroy();
        }

        // Prepara dados para scatter plot
        const scatterData = data.map(fii => ({
            x: fii.pvp,
            y: fii.dividendYield,
            ticker: fii.ticker,
            setor: fii.setor
        }));

        // Agrupa por setor para cores diferentes
        const sectorGroups = groupDataBySector(scatterData);
        const datasets = Object.keys(sectorGroups).map((sector, index) => ({
            label: sector,
            data: sectorGroups[sector],
            backgroundColor: CONFIG.colors[index % CONFIG.colors.length] + '80', // 50% transparência
            borderColor: CONFIG.colors[index % CONFIG.colors.length],
            borderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointHoverBorderWidth: 3
        }));

        chartInstances.scatter = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: CONFIG.animation,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'P/VP',
                            font: {
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(2);
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Dividend Yield (%)',
                            font: {
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(1) + '%';
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                size: 10
                            },
                            padding: 10
                        }
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                return context[0].raw.ticker;
                            },
                            label: function(context) {
                                const point = context.raw;
                                return [
                                    `Setor: ${point.setor}`,
                                    `P/VP: ${point.x.toFixed(2)}`,
                                    `DY: ${point.y.toFixed(2)}%`
                                ];
                            }
                        }
                    }
                },
                onHover: (event, activeElements) => {
                    event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
                },
                onClick: (event, activeElements) => {
                    if (activeElements.length > 0) {
                        const point = activeElements[0].element.$context.raw;
                        dispatchChartEvent('fii:click', { ticker: point.ticker, type: 'scatter' });
                    }
                }
            }
        });
    };

    /**
     * Agrupa dados por setor
     * @param {Array} data - Dados dos FIIs
     * @returns {Object} - Dados agrupados por setor
     */
    const groupBySector = (data) => {
        return data.reduce((acc, fii) => {
            acc[fii.setor] = (acc[fii.setor] || 0) + 1;
            return acc;
        }, {});
    };

    /**
     * Agrupa dados de scatter por setor
     * @param {Array} data - Dados para scatter
     * @returns {Object} - Dados agrupados por setor
     */
    const groupDataBySector = (data) => {
        return data.reduce((acc, point) => {
            if (!acc[point.setor]) {
                acc[point.setor] = [];
            }
            acc[point.setor].push(point);
            return acc;
        }, {});
    };

    /**
     * Mostra seção dos gráficos
     */
    const showChartsSection = () => {
        if (elements.chartsSection) {
            elements.chartsSection.classList.remove('hidden');
            elements.chartsSection.classList.add('fade-in');
        }
    };

    /**
     * Esconde seção dos gráficos
     */
    const hideChartsSection = () => {
        if (elements.chartsSection) {
            elements.chartsSection.classList.add('hidden');
            elements.chartsSection.classList.remove('fade-in');
        }
    };

    /**
     * Redimensiona todos os gráficos
     */
    const resizeCharts = () => {
        Object.values(chartInstances).forEach(chart => {
            if (chart) {
                chart.resize();
            }
        });
    };

    /**
     * Atualiza cores dos gráficos
     * @param {Array} newColors - Nova paleta de cores
     */
    const updateColors = (newColors) => {
        if (Array.isArray(newColors) && newColors.length > 0) {
            CONFIG.colors = newColors;
            
            // Re-cria gráficos com novas cores
            if (currentData.length > 0) {
                updateData(currentData);
            }
        }
    };

    /**
     * Exporta gráfico como imagem
     * @param {string} chartType - Tipo do gráfico (sector, dividend, scatter)
     * @param {string} format - Formato da imagem (png, jpeg)
     * @returns {string} - Data URL da imagem
     */
    const exportChart = (chartType, format = 'png') => {
        const chart = chartInstances[chartType];
        if (!chart) {
            console.error(`Gráfico ${chartType} não encontrado`);
            return null;
        }

        return chart.toBase64Image(format, 1.0);
    };

    /**
     * Obtém estatísticas dos dados atuais
     * @returns {Object} - Estatísticas dos gráficos
     */
    const getChartStats = () => {
        if (currentData.length === 0) {
            return {
                totalFiis: 0,
                sectors: 0,
                avgDividendYield: 0,
                avgPVP: 0
            };
        }

        const sectors = [...new Set(currentData.map(fii => fii.setor))];
        const totalDY = currentData.reduce((sum, fii) => sum + fii.dividendYield, 0);
        const totalPVP = currentData.reduce((sum, fii) => sum + fii.pvp, 0);

        return {
            totalFiis: currentData.length,
            sectors: sectors.length,
            avgDividendYield: totalDY / currentData.length,
            avgPVP: totalPVP / currentData.length,
            sectorDistribution: groupBySector(currentData)
        };
    };

    /**
     * Dispara evento customizado dos gráficos
     * @param {string} eventName - Nome do evento
     * @param {Object} detail - Detalhes do evento
     */
    const dispatchChartEvent = (eventName, detail = {}) => {
        const event = new CustomEvent(`charts:${eventName}`, {
            detail: {
                charts: chartInstances,
                currentData: currentData,
                stats: getChartStats(),
                ...detail
            }
        });
        
        document.dispatchEvent(event);
    };

    /**
     * Limpa recursos dos gráficos
     */
    const destroy = () => {
        // Destroi todas as instâncias dos gráficos
        Object.values(chartInstances).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });

        // Limpa dados
        chartInstances = {
            sector: null,
            dividend: null,
            scatter: null
        };
        currentData = [];

        // Limpa referências
        elements = {};

        console.log('Gráficos destruídos');
    };

    // Event listener para redimensionamento da janela
    if (typeof window !== 'undefined') {
        window.addEventListener('resize', () => {
            setTimeout(resizeCharts, 100);
        });
    }

    // API pública
    return {
        // Inicialização
        init,
        destroy,
        
        // Dados
        updateData,
        
        // Controle de exibição
        showChartsSection,
        hideChartsSection,
        resizeCharts,
        
        // Customização
        updateColors,
        
        // Utilitários
        exportChart,
        getChartStats,
        
        // Configurações
        CONFIG
    };
})();

// Disponibilizar globalmente
window.Charts = Charts;