/**
 * Dados mock para demonstração e fallback
 * Simula dados reais do Fundamentus para quando o web scraping falhar
 */

const MockData = (() => {
    'use strict';

    /**
     * HTML mock simulando a estrutura da tabela do Fundamentus
     * Baseado na estrutura real do site para testar o parser
     */
    const MOCK_FUNDAMENTUS_TABLE_HTML = `
        <div id="resultado">
            <table class="resultado">
                <thead>
                    <tr>
                        <th>Papel</th>
                        <th>Segmento</th>
                        <th>Cotação</th>
                        <th>P/VP</th>
                        <th>Dividend Yield</th>
                        <th>Liquidez Média Diária</th>
                        <th>Patrimônio Líquido</th>
                        <th>Vacância Física</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><a href="/detalhes.php?papel=MXRF11">MXRF11</a></td>
                        <td>Papel e Celulose</td>
                        <td>10,30</td>
                        <td>1,02</td>
                        <td>12,1%</td>
                        <td>2.500.000</td>
                        <td>1.200.000.000</td>
                        <td>5,2%</td>
                    </tr>
                    <tr>
                        <td><a href="/detalhes.php?papel=HGLG11">HGLG11</a></td>
                        <td>Logística</td>
                        <td>165,50</td>
                        <td>0,98</td>
                        <td>8,7%</td>
                        <td>15.800.000</td>
                        <td>3.450.000.000</td>
                        <td>2,1%</td>
                    </tr>
                    <tr>
                        <td><a href="/detalhes.php?papel=XPML11">XPML11</a></td>
                        <td>Lajes Corporativas</td>
                        <td>98,75</td>
                        <td>0,89</td>
                        <td>9,2%</td>
                        <td>8.200.000</td>
                        <td>2.100.000.000</td>
                        <td>8,5%</td>
                    </tr>
                    <tr>
                        <td><a href="/detalhes.php?papel=BTLG11">BTLG11</a></td>
                        <td>Logística</td>
                        <td>102,45</td>
                        <td>1,15</td>
                        <td>7,8%</td>
                        <td>12.500.000</td>
                        <td>1.850.000.000</td>
                        <td>3,7%</td>
                    </tr>
                    <tr>
                        <td><a href="/detalhes.php?papel=VISC11">VISC11</a></td>
                        <td>Shoppings</td>
                        <td>89,20</td>
                        <td>0,76</td>
                        <td>10,5%</td>
                        <td>6.800.000</td>
                        <td>980.000.000</td>
                        <td>12,3%</td>
                    </tr>
                    <tr>
                        <td><a href="/detalhes.php?papel=KNRI11">KNRI11</a></td>
                        <td>Lajes Corporativas</td>
                        <td>145,80</td>
                        <td>1,08</td>
                        <td>6,9%</td>
                        <td>18.200.000</td>
                        <td>4.200.000.000</td>
                        <td>4,2%</td>
                    </tr>
                    <tr>
                        <td><a href="/detalhes.php?papel=BCFF11">BCFF11</a></td>
                        <td>Títulos e Val. Mob.</td>
                        <td>95,60</td>
                        <td>1,00</td>
                        <td>11,3%</td>
                        <td>22.100.000</td>
                        <td>1.650.000.000</td>
                        <td>0,0%</td>
                    </tr>
                    <tr>
                        <td><a href="/detalhes.php?papel=HGRE11">HGRE11</a></td>
                        <td>Lajes Corporativas</td>
                        <td>132,75</td>
                        <td>0,94</td>
                        <td>8,1%</td>
                        <td>14.600.000</td>
                        <td>2.800.000.000</td>
                        <td>6,8%</td>
                    </tr>
                    <tr>
                        <td><a href="/detalhes.php?papel=XPLG11">XPLG11</a></td>
                        <td>Logística</td>
                        <td>118,90</td>
                        <td>1,12</td>
                        <td>7,5%</td>
                        <td>9.400.000</td>
                        <td>1.920.000.000</td>
                        <td>1,8%</td>
                    </tr>
                    <tr>
                        <td><a href="/detalhes.php?papel=MALL11">MALL11</a></td>
                        <td>Shoppings</td>
                        <td>76,85</td>
                        <td>0,68</td>
                        <td>13,2%</td>
                        <td>4.200.000</td>
                        <td>750.000.000</td>
                        <td>15,6%</td>
                    </tr>
                    <tr>
                        <td><a href="/detalhes.php?papel=RBRR11">RBRR11</a></td>
                        <td>Lajes Corporativas</td>
                        <td>58,45</td>
                        <td>0,82</td>
                        <td>14,8%</td>
                        <td>3.100.000</td>
                        <td>420.000.000</td>
                        <td>18,9%</td>
                    </tr>
                    <tr>
                        <td><a href="/detalhes.php?papel=VILG11">VILG11</a></td>
                        <td>Logística</td>
                        <td>95,30</td>
                        <td>0,91</td>
                        <td>9,8%</td>
                        <td>7.800.000</td>
                        <td>1.340.000.000</td>
                        <td>2,5%</td>
                    </tr>
                    <tr>
                        <td><a href="/detalhes.php?papel=JSRE11">JSRE11</a></td>
                        <td>Lajes Corporativas</td>
                        <td>42,15</td>
                        <td>0,75</td>
                        <td>16,2%</td>
                        <td>1.900.000</td>
                        <td>280.000.000</td>
                        <td>22,4%</td>
                    </tr>
                    <tr>
                        <td><a href="/detalhes.php?papel=URPR11">URPR11</a></td>
                        <td>Outros</td>
                        <td>125,60</td>
                        <td>1,05</td>
                        <td>6,3%</td>
                        <td>11.200.000</td>
                        <td>2.650.000.000</td>
                        <td>7,1%</td>
                    </tr>
                    <tr>
                        <td><a href="/detalhes.php?papel=GGRC11">GGRC11</a></td>
                        <td>Lajes Corporativas</td>
                        <td>87,90</td>
                        <td>0,86</td>
                        <td>11,7%</td>
                        <td>5.600.000</td>
                        <td>890.000.000</td>
                        <td>9,3%</td>
                    </tr>
                    <tr>
                        <td><a href="/detalhes.php?papel=ALZR11">ALZR11</a></td>
                        <td>Residencial</td>
                        <td>112,40</td>
                        <td>1,18</td>
                        <td>5,9%</td>
                        <td>16.800.000</td>
                        <td>3.100.000.000</td>
                        <td>3,2%</td>
                    </tr>
                    <tr>
                        <td><a href="/detalhes.php?papel=KNCR11">KNCR11</a></td>
                        <td>Lajes Corporativas</td>
                        <td>98,15</td>
                        <td>0,93</td>
                        <td>8,9%</td>
                        <td>13.400.000</td>
                        <td>1.780.000.000</td>
                        <td>5,8%</td>
                    </tr>
                    <tr>
                        <td><a href="/detalhes.php?papel=RECT11">RECT11</a></td>
                        <td>Recebíveis</td>
                        <td>105,75</td>
                        <td>1,01</td>
                        <td>10,1%</td>
                        <td>8.900.000</td>
                        <td>1.560.000.000</td>
                        <td>0,0%</td>
                    </tr>
                    <tr>
                        <td><a href="/detalhes.php?papel=TGAR11">TGAR11</a></td>
                        <td>Logística</td>
                        <td>89,65</td>
                        <td>0,88</td>
                        <td>12,4%</td>
                        <td>6.200.000</td>
                        <td>1.120.000.000</td>
                        <td>4,6%</td>
                    </tr>
                    <tr>
                        <td><a href="/detalhes.php?papel=BRCR11">BRCR11</a></td>
                        <td>Lajes Corporativas</td>
                        <td>67,30</td>
                        <td>0,79</td>
                        <td>15,1%</td>
                        <td>2.800.000</td>
                        <td>380.000.000</td>
                        <td>19,7%</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;

    /**
     * Dados estruturados dos FIIs para uso direto (sem parsing)
     * Útil para testes e desenvolvimento offline
     */
    const MOCK_FIIS_DATA = [
        {
            ticker: 'MXRF11',
            setor: 'Papel e Celulose',
            cotacao: 10.30,
            pvp: 1.02,
            dividendYield: 12.1,
            liquidez: 2500000,
            patrimonioLiquido: 1200000000,
            vacancia: 5.2
        },
        {
            ticker: 'HGLG11',
            setor: 'Logística',
            cotacao: 165.50,
            pvp: 0.98,
            dividendYield: 8.7,
            liquidez: 15800000,
            patrimonioLiquido: 3450000000,
            vacancia: 2.1
        },
        {
            ticker: 'XPML11',
            setor: 'Lajes Corporativas',
            cotacao: 98.75,
            pvp: 0.89,
            dividendYield: 9.2,
            liquidez: 8200000,
            patrimonioLiquido: 2100000000,
            vacancia: 8.5
        },
        {
            ticker: 'BTLG11',
            setor: 'Logística',
            cotacao: 102.45,
            pvp: 1.15,
            dividendYield: 7.8,
            liquidez: 12500000,
            patrimonioLiquido: 1850000000,
            vacancia: 3.7
        },
        {
            ticker: 'VISC11',
            setor: 'Shoppings',
            cotacao: 89.20,
            pvp: 0.76,
            dividendYield: 10.5,
            liquidez: 6800000,
            patrimonioLiquido: 980000000,
            vacancia: 12.3
        },
        {
            ticker: 'KNRI11',
            setor: 'Lajes Corporativas',
            cotacao: 145.80,
            pvp: 1.08,
            dividendYield: 6.9,
            liquidez: 18200000,
            patrimonioLiquido: 4200000000,
            vacancia: 4.2
        },
        {
            ticker: 'BCFF11',
            setor: 'Títulos e Val. Mob.',
            cotacao: 95.60,
            pvp: 1.00,
            dividendYield: 11.3,
            liquidez: 22100000,
            patrimonioLiquido: 1650000000,
            vacancia: 0.0
        },
        {
            ticker: 'HGRE11',
            setor: 'Lajes Corporativas',
            cotacao: 132.75,
            pvp: 0.94,
            dividendYield: 8.1,
            liquidez: 14600000,
            patrimonioLiquido: 2800000000,
            vacancia: 6.8
        },
        {
            ticker: 'XPLG11',
            setor: 'Logística',
            cotacao: 118.90,
            pvp: 1.12,
            dividendYield: 7.5,
            liquidez: 9400000,
            patrimonioLiquido: 1920000000,
            vacancia: 1.8
        },
        {
            ticker: 'MALL11',
            setor: 'Shoppings',
            cotacao: 76.85,
            pvp: 0.68,
            dividendYield: 13.2,
            liquidez: 4200000,
            patrimonioLiquido: 750000000,
            vacancia: 15.6
        },
        {
            ticker: 'RBRR11',
            setor: 'Lajes Corporativas',
            cotacao: 58.45,
            pvp: 0.82,
            dividendYield: 14.8,
            liquidez: 3100000,
            patrimonioLiquido: 420000000,
            vacancia: 18.9
        },
        {
            ticker: 'VILG11',
            setor: 'Logística',
            cotacao: 95.30,
            pvp: 0.91,
            dividendYield: 9.8,
            liquidez: 7800000,
            patrimonioLiquido: 1340000000,
            vacancia: 2.5
        },
        {
            ticker: 'JSRE11',
            setor: 'Lajes Corporativas',
            cotacao: 42.15,
            pvp: 0.75,
            dividendYield: 16.2,
            liquidez: 1900000,
            patrimonioLiquido: 280000000,
            vacancia: 22.4
        },
        {
            ticker: 'URPR11',
            setor: 'Outros',
            cotacao: 125.60,
            pvp: 1.05,
            dividendYield: 6.3,
            liquidez: 11200000,
            patrimonioLiquido: 2650000000,
            vacancia: 7.1
        },
        {
            ticker: 'GGRC11',
            setor: 'Lajes Corporativas',
            cotacao: 87.90,
            pvp: 0.86,
            dividendYield: 11.7,
            liquidez: 5600000,
            patrimonioLiquido: 890000000,
            vacancia: 9.3
        },
        {
            ticker: 'ALZR11',
            setor: 'Residencial',
            cotacao: 112.40,
            pvp: 1.18,
            dividendYield: 5.9,
            liquidez: 16800000,
            patrimonioLiquido: 3100000000,
            vacancia: 3.2
        },
        {
            ticker: 'KNCR11',
            setor: 'Lajes Corporativas',
            cotacao: 98.15,
            pvp: 0.93,
            dividendYield: 8.9,
            liquidez: 13400000,
            patrimonioLiquido: 1780000000,
            vacancia: 5.8
        },
        {
            ticker: 'RECT11',
            setor: 'Recebíveis',
            cotacao: 105.75,
            pvp: 1.01,
            dividendYield: 10.1,
            liquidez: 8900000,
            patrimonioLiquido: 1560000000,
            vacancia: 0.0
        },
        {
            ticker: 'TGAR11',
            setor: 'Logística',
            cotacao: 89.65,
            pvp: 0.88,
            dividendYield: 12.4,
            liquidez: 6200000,
            patrimonioLiquido: 1120000000,
            vacancia: 4.6
        },
        {
            ticker: 'BRCR11',
            setor: 'Lajes Corporativas',
            cotacao: 67.30,
            pvp: 0.79,
            dividendYield: 15.1,
            liquidez: 2800000,
            patrimonioLiquido: 380000000,
            vacancia: 19.7
        }
    ];

    /**
     * Obtém lista de setores únicos dos dados mock
     * @returns {Array} - Array de setores únicos
     */
    const getUniqueSectors = () => {
        const sectors = MOCK_FIIS_DATA.map(fii => fii.setor);
        return [...new Set(sectors)].sort();
    };

    /**
     * Filtra FIIs mock por setor
     * @param {string} sector - Setor para filtrar
     * @returns {Array} - FIIs filtrados
     */
    const getFiisBySector = (sector) => {
        if (!sector) return MOCK_FIIS_DATA;
        return MOCK_FIIS_DATA.filter(fii => fii.setor === sector);
    };

    /**
     * Obtém estatísticas dos dados mock
     * @returns {Object} - Estatísticas dos dados
     */
    const getStatistics = () => {
        const fiis = MOCK_FIIS_DATA;
        
        if (fiis.length === 0) {
            return {
                total: 0,
                avgDividendYield: 0,
                avgPVP: 0,
                totalPatrimonio: 0,
                sectors: []
            };
        }

        const totalDY = fiis.reduce((sum, fii) => sum + fii.dividendYield, 0);
        const totalPVP = fiis.reduce((sum, fii) => sum + fii.pvp, 0);
        const totalPatrimonio = fiis.reduce((sum, fii) => sum + fii.patrimonioLiquido, 0);

        return {
            total: fiis.length,
            avgDividendYield: totalDY / fiis.length,
            avgPVP: totalPVP / fiis.length,
            totalPatrimonio: totalPatrimonio,
            sectors: getUniqueSectors()
        };
    };

    /**
     * Simula delay de rede para tornar o mock mais realista
     * @param {number} ms - Milissegundos de delay
     * @returns {Promise} - Promise que resolve após o delay
     */
    const simulateNetworkDelay = (ms = 1000) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    /**
     * Simula erro de rede aleatório
     * @param {number} errorRate - Taxa de erro (0-1)
     * @returns {boolean} - Se deve simular erro
     */
    const shouldSimulateError = (errorRate = 0.1) => {
        return Math.random() < errorRate;
    };

    /**
     * Obtém dados mock com simulação de rede
     * @param {Object} options - Opções de simulação
     * @returns {Promise} - Promise com os dados
     */
    const getMockDataWithSimulation = async (options = {}) => {
        const {
            delay = 1000,
            errorRate = 0,
            useStructuredData = false
        } = options;

        // Simula delay de rede
        if (delay > 0) {
            await simulateNetworkDelay(delay);
        }

        // Simula erro de rede
        if (shouldSimulateError(errorRate)) {
            throw new Error('Erro simulado de rede');
        }

        // Retorna dados estruturados ou HTML mock
        return useStructuredData ? MOCK_FIIS_DATA : MOCK_FUNDAMENTUS_TABLE_HTML;
    };

    /**
     * Valida estrutura de um objeto FII
     * @param {Object} fii - Objeto FII para validar
     * @returns {boolean} - Se a estrutura é válida
     */
    const validateFiiStructure = (fii) => {
        const requiredFields = [
            'ticker', 'setor', 'cotacao', 'pvp', 
            'dividendYield', 'liquidez', 'patrimonioLiquido', 'vacancia'
        ];

        return requiredFields.every(field => 
            fii.hasOwnProperty(field) && fii[field] !== undefined
        );
    };

    /**
     * Adiciona timestamps aos dados mock para simular dados em tempo real
     * @returns {Array} - Dados com timestamps
     */
    const getMockDataWithTimestamps = () => {
        const now = new Date();
        return MOCK_FIIS_DATA.map(fii => ({
            ...fii,
            lastUpdate: now.toISOString(),
            dataSource: 'mock'
        }));
    };

    // API pública
    return {
        // Dados mock
        MOCK_FUNDAMENTUS_TABLE_HTML,
        MOCK_FIIS_DATA,
        
        // Funções utilitárias
        getUniqueSectors,
        getFiisBySector,
        getStatistics,
        
        // Simulação de rede
        simulateNetworkDelay,
        shouldSimulateError,
        getMockDataWithSimulation,
        
        // Validação e utilitários
        validateFiiStructure,
        getMockDataWithTimestamps
    };
})();

// Disponibilizar globalmente
window.MockData = MockData;