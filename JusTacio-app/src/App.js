import React, { useState, useEffect } from "react";
import "./App.css";
import { IconSearch, IconFavorite, IconSave, IconBack } from "./icons";

function App() {
  const [search, setSearch] = useState("");
  const [articles, setArticles] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState("penal");
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    fetch("/categories.json").then(res => res.json()).then(setCategories);
  }, []);

  useEffect(() => {
    fetch(`/codigo-${selectedCat}.json`).then(res => res.json()).then((data) => {
      // Garante que sempre haverá um array
      setArticles((data && Array.isArray(data.articles)) ? data.articles : []);
      setFiltered((data && Array.isArray(data.articles)) ? data.articles : []);
    }).catch(() => {
      setArticles([]);
      setFiltered([]);
    });
  }, [selectedCat]);

  useEffect(() => {
    if (!search) {
      setFiltered(articles);
    } else {
      setFiltered(
        articles.filter((a) =>
          a.text.toLowerCase().includes(search.toLowerCase()) ||
          a.number.toString().includes(search)
        )
      );
    }
  }, [search, articles]);

  function toggleFavorite(num) {
    setFavorites((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    );
  }

  return (
    <div className="app-container">
      <div className="header">
        <div className="logo">JusTacio</div>
        <div className="title">Consulta Jurídica</div>
        <div className="subtitle">Busca inteligente e rápida das principais leis brasileiras</div>
      </div>
      <div className="category-bar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={"category-btn" + (selectedCat === cat.id ? " selected" : "")}
            style={selectedCat === cat.id ? {background: `linear-gradient(90deg,${cat.color} 60%,#43a047 100%)`, color: '#fff'} : {}}
            onClick={() => setSelectedCat(cat.id)}
          >{cat.name}</button>
        ))}
      </div>
      <div className="search-bar">
        <IconSearch />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar artigo, número ou termo..."
        />
      </div>
      <div className="articles-list">
        {filtered.length === 0 && <p>Nenhum artigo encontrado.</p>}
        {filtered.map((a) => (
          <div key={a.number} className="article-card">
            <div className="article-number">Art. {a.number}
              <button className="icon-btn" onClick={() => toggleFavorite(a.number)} title="Favoritar"><IconFavorite filled={favorites.includes(a.number)}/></button>
              <button className="icon-btn" title="Salvar"><IconSave /></button>
            </div>
            <div className="article-text">{a.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
