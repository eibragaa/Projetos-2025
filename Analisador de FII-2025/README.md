# 📊 Analisador Quantitativo de FIIs

Uma aplicação web moderna para análise quantitativa de Fundos de Investimento Imobiliário (FIIs) com dados obtidos do site Fundamentus.

## 🚀 Funcionalidades

### 📈 Análise de Dados
- **Coleta Automática**: Busca dados em tempo real do site Fundamentus
- **Fallback Inteligente**: Dados mock para demonstração quando a busca falha
- **Indicadores Principais**: Cotação, P/VP, Dividend Yield, Liquidez, Patrimônio Líquido, Vacância

### 🔍 Visualização e Filtros
- **Tabela Interativa**: Ordenação por qualquer coluna com indicadores visuais
- **Filtros Dinâmicos**: Por setor e busca por ticker
- **Gráficos Modernos**: Distribuição por setor, ranking de DY, scatter plot P/VP vs DY

### 🎨 Interface Moderna
- **Design Responsivo**: Adaptável a diferentes tamanhos de tela
- **Tailwind CSS**: Estilização moderna e consistente
- **Animações Suaves**: Transições e efeitos visuais elegantes
- **Acessibilidade**: Suporte completo para navegação por teclado e leitores de tela

## 🏗️ Arquitetura

### Estrutura Modular
```
src/
├── js/
│   ├── app.js              # Módulo principal (IIFE)
│   ├── data/
│   │   ├── fetcher.js      # Coleta de dados com proxy CORS
│   │   ├── parser.js       # Parsing do HTML do Fundamentus
│   │   └── mock-data.js    # Dados mock para fallback
│   ├── ui/
│   │   ├── table.js        # Renderização da tabela
│   │   ├── filters.js      # Lógica de filtros
│   │   ├── charts.js       # Gráficos com Chart.js
│   │   └── modal.js        # Modal informativo
│   └── utils/
│       ├── formatters.js   # Formatação de números brasileiros
│       └── sorters.js      # Algoritmos de ordenação
└── css/
    ├── main.css           # Estilos principais
    └── components/        # Estilos por componente
```

### Princípios de Clean Code
- **Modularidade**: Cada módulo tem responsabilidade única
- **IIFE**: Encapsulamento para evitar poluição do escopo global
- **Nomenclatura Descritiva**: Variáveis e funções com nomes claros
- **Separação de Responsabilidades**: UI, dados e lógica separados
- **Tratamento de Erros**: Fallbacks e mensagens informativas

## 🛠️ Tecnologias

### Core
- **HTML5**: Estrutura semântica
- **CSS3**: Estilização moderna
- **JavaScript ES6+**: Lógica da aplicação
- **Tailwind CSS**: Framework CSS utility-first

### Bibliotecas
- **Chart.js**: Gráficos interativos e responsivos
- **CORS Proxy**: Para desenvolvimento (cors-anywhere)

## 📊 Indicadores Analisados

| Indicador | Descrição | Formato |
|-----------|-----------|---------|
| **Papel** | Ticker do FII | XXXX11 |
| **Setor** | Segmento de atuação | Texto |
| **Cotação** | Preço atual da cota | R$ XX,XX |
| **P/VP** | Preço sobre Valor Patrimonial | X,XX |
| **Dividend Yield** | Rendimento anual | XX,X% |
| **Liquidez** | Volume médio diário | XXX.XXX |
| **Patrimônio Líquido** | PL do fundo | R$ XXX.XXX.XXX |
| **Vacância** | Taxa de vacância física | XX,X% |

## 🚦 Como Executar

### Método 1: Arquivo Local
1. Baixe todos os arquivos do projeto
2. Abra o arquivo `index.html` em um navegador moderno
3. A aplicação tentará buscar dados do Fundamentus (pode falhar por CORS)
4. Em caso de falha, utilizará dados mock para demonstração

### Método 2: Servidor Local
```bash
# Com Python 3
python -m http.server 8000

# Com Node.js (http-server)
npx http-server

# Com PHP
php -S localhost:8000
```

Acesse: `http://localhost:8000`

## 🔧 Configuração

### Proxy CORS (Desenvolvimento)
A aplicação usa proxies CORS públicos para contornar limitações do navegador:
- `cors-anywhere.herokuapp.com`
- `api.allorigins.win`
- `corsproxy.io`

⚠️ **Importante**: Estes proxies são instáveis e apenas para demonstração.

### Produção
Para ambiente de produção, implemente um servidor backend próprio:

```javascript
// Exemplo com Express.js
app.get('/api/fundamentus', async (req, res) => {
  try {
    const response = await fetch('https://fundamentus.com.br/fii_resultado.php');
    const html = await response.text();
    res.send(html);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 📈 Gráficos Disponíveis

### 1. Distribuição por Setor
- **Tipo**: Gráfico de rosca (doughnut)
- **Dados**: Quantidade de FIIs por setor
- **Interatividade**: Hover com percentuais

### 2. Ranking Dividend Yield
- **Tipo**: Gráfico de barras
- **Dados**: Top 10 FIIs por DY
- **Cores**: Baseadas no valor do DY
  - Verde: DY ≥ 12%
  - Azul: DY ≥ 8%
  - Amarelo: DY ≥ 6%
  - Vermelho: DY < 6%

### 3. P/VP vs Dividend Yield
- **Tipo**: Gráfico de dispersão
- **Dados**: Correlação entre P/VP e DY
- **Agrupamento**: Por setor com cores diferentes

## 🎯 Funcionalidades Avançadas

### Filtros Inteligentes
- **Busca em Tempo Real**: Debounce de 300ms
- **Filtro por Setor**: Dropdown dinâmico
- **Busca por Ticker**: Case-insensitive

### Ordenação Avançada
- **Multi-critério**: Suporte a ordenação por múltiplas colunas
- **Tipos de Dados**: String, número, moeda, percentual
- **Indicadores Visuais**: Setas de ordenação nos cabeçalhos

### Cache Inteligente
- **LocalStorage**: Cache local de 5 minutos
- **Fallback**: Dados mock sempre disponíveis
- **Refresh**: Atualização manual e automática

## 🔍 Tratamento de Dados

### Parsing Robusto
```javascript
// Exemplo de conversão de dados brasileiros
const parseBrazilianNumber = (value) => {
  const cleaned = value.replace(/[^\d,.-]/g, '');
  const normalized = cleaned.replace(/\./g, '').replace(',', '.');
  return parseFloat(normalized) || 0;
};
```

### Validação de Dados
- **Estrutura**: Validação de formato do ticker (XXXX11)
- **Valores**: Verificação de números válidos
- **Consistência**: Limpeza e normalização automática

## 🎨 Customização

### Cores dos Gráficos
```javascript
const colors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
];
```

### Configurações da Aplicação
```javascript
const CONFIG = {
  autoRefreshInterval: 5 * 60 * 1000, // 5 minutos
  enableAutoRefresh: false,
  showWelcomeModal: true,
  debugMode: false
};
```

## 🚨 Limitações e Considerações

### CORS (Cross-Origin Resource Sharing)
- **Problema**: Navegadores bloqueiam requisições diretas ao Fundamentus
- **Solução Atual**: Proxies CORS públicos (instáveis)
- **Solução Recomendada**: Backend próprio em produção

### Web Scraping
- **Fragilidade**: Mudanças no HTML do site podem quebrar o parser
- **Manutenção**: Necessária verificação periódica da estrutura
- **Alternativa**: APIs financeiras (quando disponíveis)

### Performance
- **Dados**: Otimizado para até 500 FIIs
- **Gráficos**: Lazy loading e debounce implementados
- **Memória**: Cache limitado para evitar vazamentos

## 📱 Responsividade

### Breakpoints
- **Desktop**: > 1024px - Todas as funcionalidades
- **Tablet**: 768px - 1024px - Layout adaptado
- **Mobile**: < 768px - Colunas essenciais apenas

### Otimizações Mobile
- **Tabela**: Scroll horizontal e colunas ocultas
- **Gráficos**: Redimensionamento automático
- **Filtros**: Layout vertical em telas pequenas

## 🔒 Segurança

### Sanitização
- **HTML**: DOMParser para parsing seguro
- **XSS**: Prevenção via textContent
- **Validação**: Verificação de tipos e formatos

### Privacidade
- **Dados**: Nenhum dado pessoal coletado
- **Analytics**: Desabilitado por padrão
- **Cache**: Apenas dados públicos dos FIIs

## 🧪 Testes

### Testes Manuais
1. **Carregamento**: Verificar dados mock em caso de falha
2. **Filtros**: Testar busca e filtro por setor
3. **Ordenação**: Clicar em todos os cabeçalhos
4. **Responsividade**: Testar em diferentes tamanhos
5. **Gráficos**: Verificar interatividade e tooltips

### Debugging
```javascript
// Ativar modo debug
FiiAnalyzerApp.CONFIG.debugMode = true;

// Verificar estado da aplicação
console.log(FiiAnalyzerApp.getAppState());

// Verificar dados atuais
console.log(Table.getCurrentData());
```

## 📄 Disclaimer

⚠️ **Importante**: Esta aplicação é desenvolvida para fins educacionais e de demonstração. Não constitui qualquer tipo de recomendação de investimento. As decisões de investimento devem ser tomadas com base em análise própria e, preferencialmente, com o auxílio de um profissional qualificado.

Os dados obtidos via web scraping podem não ser precisos ou estar desatualizados. Sempre consulte fontes oficiais antes de tomar decisões financeiras.

## 🤝 Contribuição

### Como Contribuir
1. Fork do repositório
2. Crie uma branch para sua feature
3. Implemente seguindo os padrões de Clean Code
4. Teste em diferentes navegadores
5. Submeta um Pull Request

### Padrões de Código
- **ESLint**: Configuração recomendada
- **Prettier**: Formatação automática
- **Comentários**: JSDoc para funções públicas
- **Nomenclatura**: camelCase para variáveis, PascalCase para classes

## 📞 Suporte

Para dúvidas, sugestões ou problemas:
- Abra uma issue no repositório
- Verifique a documentação do código
- Consulte o console do navegador para erros

---

**Desenvolvido com ❤️ para análise quantitativa de FIIs**

*Versão: 1.0.0 | Última atualização: Janeiro 2025*