/**
 * Parser para dados do Fundamentus
 * Responsável por extrair dados dos FIIs do HTML do site
 */

import * as Formatters from '../utils/formatters.js';

const Parser = (() => {
    'use strict';
    
    // Usar o módulo Formatters diretamente
    const {
        parseBrazilianNumber,
        parseBrazilianPercentage,
        isValidNumber,
        formatTicker
    } = Formatters;

    /**
     * Mapeamento das colunas do Fundamentus para propriedades do objeto FII
     */
    const COLUMN_MAPPING = {
        0: 'ticker',           // Papel
        1: 'setor',            // Segmento
        2: 'cotacao',          // Cotação
        3: 'pvp',              // P/VP
        4: 'dividendYield',    // Dividend Yield
        5: 'liquidez',         // Liquidez Média Diária
        6: 'patrimonioLiquido', // Patrimônio Líquido
        7: 'vacancia'          // Vacância Física
    };

    /**
     * Tipos de dados para cada coluna (para conversão adequada)
     */
    const COLUMN_TYPES = {
        ticker: 'string',
        setor: 'string',
        cotacao: 'currency',
        pvp: 'number',
        dividendYield: 'percentage',
        liquidez: 'currency',
        patrimonioLiquido: 'currency',
        vacancia: 'percentage'
    };

    /**
     * Extrai texto limpo de um elemento HTML
     * @param {Element} element - Elemento HTML
     * @returns {string} - Texto limpo
     */
    const extractCleanText = (element) => {
        if (!element) return '';
        
        // Se é um link, pega o texto do link
        const link = element.querySelector('a');
        if (link) {
            return link.textContent.trim();
        }
        
        return element.textContent.trim();
    };

    /**
     * Converte valor baseado no tipo especificado
     * @param {string} value - Valor a ser convertido
     * @param {string} type - Tipo de conversão
     * @returns {any} - Valor convertido
     */
    const convertValue = (value, type) => {
        if (!value || value === '-' || value === 'N/A') {
            return type === 'string' ? '' : 0;
        }

        switch (type) {
            case 'string':
                return value.toString().trim();
            
            case 'currency':
                return parseBrazilianNumber(value);
            
            case 'number':
                return parseBrazilianNumber(value);
            
            case 'percentage':
                return parseBrazilianPercentage(value);
            
            default:
                return value;
        }
    };

    /**
     * Valida se uma linha da tabela contém dados válidos de FII
     * @param {Object} fiiData - Dados do FII extraídos
     * @returns {boolean} - Se os dados são válidos
     */
    const validateFiiData = (fiiData) => {
        // Verifica se tem ticker válido (formato XXXX11)
        if (!fiiData.ticker || !/^[A-Z]{4}11$/.test(fiiData.ticker)) {
            return false;
        }

        // Verifica se tem setor
        if (!fiiData.setor || fiiData.setor.length === 0) {
            return false;
        }

        // Verifica se tem cotação válida
        if (!isValidNumber(fiiData.cotacao) || fiiData.cotacao <= 0) {
            return false;
        }

        return true;
    };

    /**
     * Processa uma linha da tabela e extrai dados do FII
     * @param {Element} row - Linha da tabela (tr)
     * @returns {Object|null} - Dados do FII ou null se inválido
     */
    const processTableRow = (row) => {
        const cells = row.querySelectorAll('td');
        
        // Verifica se a linha tem o número esperado de colunas
        if (cells.length < Object.keys(COLUMN_MAPPING).length) {
            console.warn('Linha da tabela com número insuficiente de colunas:', cells.length);
            return null;
        }

        const fiiData = {};

        // Extrai dados de cada célula
        cells.forEach((cell, index) => {
            const property = COLUMN_MAPPING[index];
            if (property) {
                const rawValue = extractCleanText(cell);
                const type = COLUMN_TYPES[property];
                fiiData[property] = convertValue(rawValue, type);
            }
        });

        // Valida os dados extraídos
        if (!validateFiiData(fiiData)) {
            console.warn('Dados de FII inválidos:', fiiData);
            return null;
        }

        // Adiciona metadados
        fiiData.lastUpdate = new Date().toISOString();
        fiiData.dataSource = 'fundamentus';

        return fiiData;
    };

    /**
     * Encontra a tabela de resultados no HTML
     * @param {Document} doc - Documento HTML parseado
     * @returns {Element|null} - Elemento da tabela ou null
     */
    const findResultTable = (doc) => {
        // Tenta encontrar por ID (estrutura atual do Fundamentus)
        let table = doc.querySelector('#resultado table');
        
        if (!table) {
            // Fallback: procura por classe
            table = doc.querySelector('table.resultado');
        }
        
        if (!table) {
            // Fallback: procura qualquer tabela com dados de FII
            const tables = doc.querySelectorAll('table');
            for (const t of tables) {
                const firstRow = t.querySelector('tbody tr');
                if (firstRow) {
                    const firstCell = firstRow.querySelector('td');
                    if (firstCell && /^[A-Z]{4}11$/.test(extractCleanText(firstCell))) {
                        table = t;
                        break;
                    }
                }
            }
        }

        return table;
    };

    /**
     * Extrai cabeçalhos da tabela para validação
     * @param {Element} table - Elemento da tabela
     * @returns {Array} - Array de cabeçalhos
     */
    const extractTableHeaders = (table) => {
        const headerRow = table.querySelector('thead tr') || table.querySelector('tr');
        if (!headerRow) return [];

        const headers = [];
        const headerCells = headerRow.querySelectorAll('th, td');
        
        headerCells.forEach(cell => {
            headers.push(extractCleanText(cell).toLowerCase());
        });

        return headers;
    };

    /**
     * Valida se a tabela tem a estrutura esperada
     * @param {Element} table - Elemento da tabela
     * @returns {boolean} - Se a estrutura é válida
     */
    const validateTableStructure = (table) => {
        const headers = extractTableHeaders(table);
        
        // Palavras-chave que devem estar presentes nos cabeçalhos
        const expectedKeywords = ['papel', 'segmento', 'cotação', 'p/vp', 'dividend', 'yield'];
        
        const foundKeywords = expectedKeywords.filter(keyword => 
            headers.some(header => header.includes(keyword))
        );

        // Deve ter pelo menos 4 das 6 palavras-chave esperadas
        return foundKeywords.length >= 4;
    };

    /**
     * Função principal para parsear HTML do Fundamentus
     * @param {string} htmlString - String HTML do Fundamentus
     * @returns {Array} - Array de objetos FII
     */
    const parseFundamentusHTML = (htmlString) => {
        if (!htmlString || typeof htmlString !== 'string') {
            console.error('HTML inválido fornecido para parsing');
            return [];
        }

        try {
            // Cria parser DOM
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlString, 'text/html');

            // Verifica se houve erro no parsing
            const parserError = doc.querySelector('parsererror');
            if (parserError) {
                console.error('Erro ao parsear HTML:', parserError.textContent);
                return [];
            }

            // Encontra a tabela de resultados
            const table = findResultTable(doc);
            if (!table) {
                console.error('Tabela de resultados não encontrada no HTML');
                return [];
            }

            // Valida estrutura da tabela
            if (!validateTableStructure(table)) {
                console.warn('Estrutura da tabela não corresponde ao esperado');
                // Continua mesmo assim, pode ser uma mudança menor no site
            }

            // Extrai dados das linhas
            const tbody = table.querySelector('tbody') || table;
            const rows = tbody.querySelectorAll('tr');
            
            if (rows.length === 0) {
                console.warn('Nenhuma linha de dados encontrada na tabela');
                return [];
            }

            const fiis = [];
            let processedCount = 0;
            let errorCount = 0;

            rows.forEach((row, index) => {
                try {
                    const fiiData = processTableRow(row);
                    if (fiiData) {
                        fiis.push(fiiData);
                        processedCount++;
                    } else {
                        errorCount++;
                    }
                } catch (error) {
                    console.error(`Erro ao processar linha ${index}:`, error);
                    errorCount++;
                }
            });

            console.log(`Parsing concluído: ${processedCount} FIIs processados, ${errorCount} erros`);

            return fiis;

        } catch (error) {
            console.error('Erro geral no parsing do HTML:', error);
            return [];
        }
    };

    /**
     * Parseia dados mock (para fallback)
     * @returns {Array} - Array de objetos FII dos dados mock
     */
    const parseMockData = () => {
        try {
            return parseFundamentusHTML(MockData.MOCK_FUNDAMENTUS_TABLE_HTML);
        } catch (error) {
            console.error('Erro ao parsear dados mock:', error);
            // Fallback final: retorna dados estruturados
            return MockData.MOCK_FIIS_DATA.map(fii => ({
                ...fii,
                lastUpdate: new Date().toISOString(),
                dataSource: 'mock-structured'
            }));
        }
    };

    /**
     * Detecta mudanças na estrutura do site
     * @param {string} htmlString - HTML para análise
     * @returns {Object} - Relatório de mudanças detectadas
     */
    const detectStructureChanges = (htmlString) => {
        const report = {
            hasChanges: false,
            issues: [],
            suggestions: []
        };

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlString, 'text/html');
            
            // Verifica se a tabela principal existe
            const table = findResultTable(doc);
            if (!table) {
                report.hasChanges = true;
                report.issues.push('Tabela de resultados não encontrada');
                report.suggestions.push('Verificar se o seletor #resultado ainda é válido');
            }

            // Verifica estrutura dos cabeçalhos
            if (table && !validateTableStructure(table)) {
                report.hasChanges = true;
                report.issues.push('Estrutura dos cabeçalhos mudou');
                report.suggestions.push('Atualizar mapeamento de colunas');
            }

            // Verifica se há dados
            const rows = table ? table.querySelectorAll('tbody tr, tr') : [];
            if (rows.length === 0) {
                report.hasChanges = true;
                report.issues.push('Nenhuma linha de dados encontrada');
                report.suggestions.push('Verificar se o site está retornando dados');
            }

        } catch (error) {
            report.hasChanges = true;
            report.issues.push(`Erro no parsing: ${error.message}`);
            report.suggestions.push('Verificar se o HTML está bem formado');
        }

        return report;
    };

    /**
     * Limpa e normaliza dados de FII
     * @param {Array} fiis - Array de FIIs para limpar
     * @returns {Array} - Array de FIIs limpos
     */
    const cleanFiiData = (fiis) => {
        return fiis.map(fii => ({
            ...fii,
            ticker: Formatters.formatTicker(fii.ticker),
            setor: fii.setor.trim(),
            cotacao: Math.max(0, fii.cotacao || 0),
            pvp: Math.max(0, fii.pvp || 0),
            dividendYield: Math.max(0, fii.dividendYield || 0),
            liquidez: Math.max(0, fii.liquidez || 0),
            patrimonioLiquido: Math.max(0, fii.patrimonioLiquido || 0),
            vacancia: Math.max(0, Math.min(100, fii.vacancia || 0)) // Limita entre 0-100%
        }));
    };

    // API pública
    return {
        // Função principal
        parseFundamentusHTML,
        parseMockData,
        
        // Utilitários
        extractCleanText,
        convertValue,
        validateFiiData,
        cleanFiiData,
        
        // Diagnóstico
        detectStructureChanges,
        validateTableStructure,
        extractTableHeaders,
        
        // Constantes
        COLUMN_MAPPING,
        COLUMN_TYPES
    };
})();

export default Parser;