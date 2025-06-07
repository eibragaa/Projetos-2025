const https = require('https');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const URL = 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm';
const OUTPUT = path.join(__dirname, '../src/codigo-penal.json');

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function extrairArtigos(html) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const artigos = [];
  // Seleciona todos os elementos que começam com "Art. "
  const regexArtigo = /^Art\.\s*(\d+[A-Z]?)\s*-?\s*/i;
  const nodes = Array.from(document.querySelectorAll('p, span, div, font'));

  for (const node of nodes) {
    const text = node.textContent.trim();
    const match = regexArtigo.exec(text);
    if (match) {
      artigos.push({
        number: match[1],
        text: text.replace(regexArtigo, '').trim()
      });
    }
  }
  return artigos;
}

async function main() {
  try {
    console.log('Baixando Código Penal do Planalto...');
    const html = await fetchHtml(URL);
    console.log('Extraindo artigos...');
    const articles = extrairArtigos(html);
    if (!articles.length) throw new Error('Nenhum artigo encontrado!');
    fs.writeFileSync(OUTPUT, JSON.stringify({ articles }, null, 2), 'utf-8');
    console.log(`Arquivo atualizado com ${articles.length} artigos.`);
  } catch (err) {
    console.error('Erro ao atualizar:', err);
  }
}

main();
