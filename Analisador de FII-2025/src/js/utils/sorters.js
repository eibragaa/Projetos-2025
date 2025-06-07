/**
 * Utilitários para ordenação de dados
 * Responsável por algoritmos de ordenação para diferentes tipos de dados
 */

const Sorters = (() => {
    'use strict';

    /**
     * Tipos de ordenação disponíveis
     */
    const SORT_TYPES = {
        STRING: 'string',
        NUMBER: 'number',
        CURRENCY: 'currency',
        PERCENTAGE: 'percentage',
        DATE: 'date'
    };

    /**
     * Direções de ordenação
     */
    const SORT_DIRECTIONS = {
        ASC: 'asc',
        DESC: 'desc'
    };

    /**
     * Compara dois valores string (case-insensitive)
     * @param {string} a - Primeiro valor
     * @param {string} b - Segundo valor
     * @returns {number} - Resultado da comparação (-1, 0, 1)
     */
    const compareStrings = (a, b) => {
        const strA = (a || '').toString().toLowerCase().trim();
        const strB = (b || '').toString().toLowerCase().trim();
        
        return strA.localeCompare(strB, 'pt-BR', {
            numeric: true,
            sensitivity: 'base'
        });
    };

    /**
     * Compara dois valores numéricos
     * @param {number} a - Primeiro valor
     * @param {number} b - Segundo valor
     * @returns {number} - Resultado da comparação (-1, 0, 1)
     */
    const compareNumbers = (a, b) => {
        const numA = typeof a === 'number' ? a : parseFloat(a) || 0;
        const numB = typeof b === 'number' ? b : parseFloat(b) || 0;
        
        if (numA < numB) return -1;
        if (numA > numB) return 1;
        return 0;
    };

    /**
     * Compara dois valores de moeda (remove formatação antes)
     * @param {string|number} a - Primeiro valor
     * @param {string|number} b - Segundo valor
     * @returns {number} - Resultado da comparação (-1, 0, 1)
     */
    const compareCurrency = (a, b) => {
        const numA = typeof a === 'number' ? a : Formatters.parseBrazilianNumber(a.toString());
        const numB = typeof b === 'number' ? b : Formatters.parseBrazilianNumber(b.toString());
        
        return compareNumbers(numA, numB);
    };

    /**
     * Compara dois valores percentuais (remove formatação antes)
     * @param {string|number} a - Primeiro valor
     * @param {string|number} b - Segundo valor
     * @returns {number} - Resultado da comparação (-1, 0, 1)
     */
    const comparePercentages = (a, b) => {
        const numA = typeof a === 'number' ? a : Formatters.parseBrazilianPercentage(a.toString());
        const numB = typeof b === 'number' ? b : Formatters.parseBrazilianPercentage(b.toString());
        
        return compareNumbers(numA, numB);
    };

    /**
     * Compara duas datas
     * @param {Date|string} a - Primeira data
     * @param {Date|string} b - Segunda data
     * @returns {number} - Resultado da comparação (-1, 0, 1)
     */
    const compareDates = (a, b) => {
        const dateA = a instanceof Date ? a : new Date(a);
        const dateB = b instanceof Date ? b : new Date(b);
        
        // Se alguma data é inválida, coloca no final
        if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;
        
        return compareNumbers(dateA.getTime(), dateB.getTime());
    };

    /**
     * Função de comparação genérica baseada no tipo
     * @param {any} a - Primeiro valor
     * @param {any} b - Segundo valor
     * @param {string} type - Tipo de comparação
     * @returns {number} - Resultado da comparação (-1, 0, 1)
     */
    const compareByType = (a, b, type) => {
        switch (type) {
            case SORT_TYPES.STRING:
                return compareStrings(a, b);
            case SORT_TYPES.NUMBER:
                return compareNumbers(a, b);
            case SORT_TYPES.CURRENCY:
                return compareCurrency(a, b);
            case SORT_TYPES.PERCENTAGE:
                return comparePercentages(a, b);
            case SORT_TYPES.DATE:
                return compareDates(a, b);
            default:
                return compareStrings(a, b);
        }
    };

    /**
     * Ordena array de objetos por uma propriedade específica
     * @param {Array} array - Array a ser ordenado
     * @param {string} property - Propriedade para ordenação
     * @param {string} direction - Direção da ordenação (asc/desc)
     * @param {string} type - Tipo de dados para comparação
     * @returns {Array} - Array ordenado (nova instância)
     */
    const sortByProperty = (array, property, direction = SORT_DIRECTIONS.ASC, type = SORT_TYPES.STRING) => {
        if (!Array.isArray(array) || array.length === 0) {
            return [];
        }

        const sortedArray = [...array];
        
        sortedArray.sort((a, b) => {
            const valueA = getNestedProperty(a, property);
            const valueB = getNestedProperty(b, property);
            
            let comparison = compareByType(valueA, valueB, type);
            
            // Inverte o resultado se a direção for descendente
            if (direction === SORT_DIRECTIONS.DESC) {
                comparison *= -1;
            }
            
            return comparison;
        });
        
        return sortedArray;
    };

    /**
     * Obtém propriedade aninhada de um objeto usando notação de ponto
     * @param {Object} obj - Objeto fonte
     * @param {string} path - Caminho da propriedade (ex: 'user.name')
     * @returns {any} - Valor da propriedade
     */
    const getNestedProperty = (obj, path) => {
        if (!obj || !path) return undefined;
        
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    };

    /**
     * Ordena array de FIIs por múltiplas propriedades
     * @param {Array} fiis - Array de FIIs
     * @param {Array} sortCriteria - Array de critérios de ordenação
     * @returns {Array} - Array ordenado
     */
    const sortByMultipleCriteria = (fiis, sortCriteria) => {
        if (!Array.isArray(fiis) || !Array.isArray(sortCriteria) || sortCriteria.length === 0) {
            return [...fiis];
        }

        const sortedFiis = [...fiis];
        
        sortedFiis.sort((a, b) => {
            for (const criteria of sortCriteria) {
                const { property, direction = SORT_DIRECTIONS.ASC, type = SORT_TYPES.STRING } = criteria;
                
                const valueA = getNestedProperty(a, property);
                const valueB = getNestedProperty(b, property);
                
                let comparison = compareByType(valueA, valueB, type);
                
                if (direction === SORT_DIRECTIONS.DESC) {
                    comparison *= -1;
                }
                
                // Se os valores são diferentes, retorna o resultado
                if (comparison !== 0) {
                    return comparison;
                }
                
                // Se são iguais, continua para o próximo critério
            }
            
            return 0;
        });
        
        return sortedFiis;
    };

    /**
     * Configurações de ordenação para cada campo dos FIIs
     */
    const FII_SORT_CONFIG = {
        ticker: { type: SORT_TYPES.STRING },
        setor: { type: SORT_TYPES.STRING },
        cotacao: { type: SORT_TYPES.NUMBER },
        pvp: { type: SORT_TYPES.NUMBER },
        dividendYield: { type: SORT_TYPES.NUMBER },
        liquidez: { type: SORT_TYPES.NUMBER },
        patrimonioLiquido: { type: SORT_TYPES.NUMBER },
        vacancia: { type: SORT_TYPES.NUMBER }
    };

    /**
     * Ordena FIIs por uma coluna específica
     * @param {Array} fiis - Array de FIIs
     * @param {string} column - Nome da coluna
     * @param {string} direction - Direção da ordenação
     * @returns {Array} - Array ordenado
     */
    const sortFiis = (fiis, column, direction = SORT_DIRECTIONS.ASC) => {
        const config = FII_SORT_CONFIG[column];
        if (!config) {
            console.warn(`Configuração de ordenação não encontrada para a coluna: ${column}`);
            return [...fiis];
        }
        
        return sortByProperty(fiis, column, direction, config.type);
    };

    /**
     * Alterna a direção de ordenação
     * @param {string} currentDirection - Direção atual
     * @returns {string} - Nova direção
     */
    const toggleSortDirection = (currentDirection) => {
        return currentDirection === SORT_DIRECTIONS.ASC ? SORT_DIRECTIONS.DESC : SORT_DIRECTIONS.ASC;
    };

    /**
     * Verifica se uma direção de ordenação é válida
     * @param {string} direction - Direção a ser validada
     * @returns {boolean} - Se é válida
     */
    const isValidSortDirection = (direction) => {
        return Object.values(SORT_DIRECTIONS).includes(direction);
    };

    /**
     * Verifica se um tipo de ordenação é válido
     * @param {string} type - Tipo a ser validado
     * @returns {boolean} - Se é válido
     */
    const isValidSortType = (type) => {
        return Object.values(SORT_TYPES).includes(type);
    };

    /**
     * Ordena FIIs por ranking de Dividend Yield (top performers)
     * @param {Array} fiis - Array de FIIs
     * @param {number} limit - Limite de resultados
     * @returns {Array} - Top FIIs por DY
     */
    const getTopDividendYield = (fiis, limit = 10) => {
        return sortFiis(fiis, 'dividendYield', SORT_DIRECTIONS.DESC).slice(0, limit);
    };

    /**
     * Ordena FIIs por menor P/VP (mais baratos)
     * @param {Array} fiis - Array de FIIs
     * @param {number} limit - Limite de resultados
     * @returns {Array} - FIIs mais baratos por P/VP
     */
    const getCheapestByPVP = (fiis, limit = 10) => {
        return sortFiis(fiis, 'pvp', SORT_DIRECTIONS.ASC).slice(0, limit);
    };

    /**
     * Ordena FIIs por maior liquidez
     * @param {Array} fiis - Array de FIIs
     * @param {number} limit - Limite de resultados
     * @returns {Array} - FIIs com maior liquidez
     */
    const getMostLiquid = (fiis, limit = 10) => {
        return sortFiis(fiis, 'liquidez', SORT_DIRECTIONS.DESC).slice(0, limit);
    };

    /**
     * Cria um comparador personalizado para ordenação
     * @param {string} property - Propriedade para comparação
     * @param {string} direction - Direção da ordenação
     * @param {string} type - Tipo de dados
     * @returns {Function} - Função comparadora
     */
    const createComparator = (property, direction = SORT_DIRECTIONS.ASC, type = SORT_TYPES.STRING) => {
        return (a, b) => {
            const valueA = getNestedProperty(a, property);
            const valueB = getNestedProperty(b, property);
            
            let comparison = compareByType(valueA, valueB, type);
            
            if (direction === SORT_DIRECTIONS.DESC) {
                comparison *= -1;
            }
            
            return comparison;
        };
    };

    // API pública
    return {
        // Constantes
        SORT_TYPES,
        SORT_DIRECTIONS,
        FII_SORT_CONFIG,
        
        // Funções de comparação
        compareStrings,
        compareNumbers,
        compareCurrency,
        comparePercentages,
        compareDates,
        compareByType,
        
        // Funções de ordenação
        sortByProperty,
        sortByMultipleCriteria,
        sortFiis,
        
        // Utilitários
        toggleSortDirection,
        isValidSortDirection,
        isValidSortType,
        getNestedProperty,
        createComparator,
        
        // Funções específicas para FIIs
        getTopDividendYield,
        getCheapestByPVP,
        getMostLiquid
    };
})();

// Disponibilizar globalmente
window.Sorters = Sorters;