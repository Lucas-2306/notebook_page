import { useEffect, useMemo, useState } from "react";
import NotebookCard from "../components/NotebookCard";

export default function Home() {
  const [catalog, setCatalog] = useState([]);
  const [search, setSearch] = useState("");

  const [selectedArea, setSelectedArea] = useState("");
  const [selectedArquitetura, setSelectedArquitetura] = useState("");
  const [selectedAno, setSelectedAno] = useState("");

  useEffect(() => {
    fetch("/generated/data/catalog.json")
      .then((res) => res.json())
      .then((data) => setCatalog(data))
      .catch((err) => {
        console.error("Erro ao carregar catálogo:", err);
        setCatalog([]);
      });
  }, []);

  const areaOptions = useMemo(() => {
    const values = new Set();
    catalog.forEach((item) => {
      (item.area || []).forEach((value) => values.add(value));
    });
    return Array.from(values).sort();
  }, [catalog]);

  const arquiteturaOptions = useMemo(() => {
    const values = new Set();
    catalog.forEach((item) => {
      (item.arquitetura || []).forEach((value) => values.add(value));
    });
    return Array.from(values).sort();
  }, [catalog]);

  const anoOptions = useMemo(() => {
    const values = new Set();
    catalog.forEach((item) => {
      if (item.ano) values.add(String(item.ano));
    });
    return Array.from(values).sort((a, b) => Number(b) - Number(a));
  }, [catalog]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();

    return catalog
      .filter((item) => {
        const haystack = [
          item.title,
          item.description,
          ...(item.tags || []),
          ...(item.area || []),
          ...(item.arquitetura || []),
          item.ano ? String(item.ano) : "",
          item.tipo || "",
          item.colaboracao || "",
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch = !term || haystack.includes(term);
        const matchesArea =
          !selectedArea || (item.area || []).includes(selectedArea);
        const matchesArquitetura =
          !selectedArquitetura ||
          (item.arquitetura || []).includes(selectedArquitetura);
        const matchesAno =
          !selectedAno || String(item.ano || "") === selectedAno;

        return (
          matchesSearch &&
          matchesArea &&
          matchesArquitetura &&
          matchesAno
        );
      })
      .sort((a, b) => {
        if ((a.ordem ?? 999) !== (b.ordem ?? 999)) {
          return (a.ordem ?? 999) - (b.ordem ?? 999);
        }

        if ((b.ano ?? 0) !== (a.ano ?? 0)) {
          return (b.ano ?? 0) - (a.ano ?? 0);
        }

        return (a.title || "").localeCompare(b.title || "");
      });
  }, [catalog, search, selectedArea, selectedArquitetura, selectedAno]);

  return (
    <div className="page">
      <header className="hero">
        <h1>Study Desk</h1>
        <p>
          Minha mesa de estudos com notebooks de aprendizado de máquina,
          análise de dados e experimentos organizados como um catálogo visual.
        </p>

        <div className="filters">
          <input
            className="search"
            type="text"
            placeholder="Buscar por título, descrição, área..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="filter-select"
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
          >
            <option value="">Todas as áreas</option>
            {areaOptions.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={selectedArquitetura}
            onChange={(e) => setSelectedArquitetura(e.target.value)}
          >
            <option value="">Todas as arquiteturas</option>
            {arquiteturaOptions.map((arquitetura) => (
              <option key={arquitetura} value={arquitetura}>
                {arquitetura}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={selectedAno}
            onChange={(e) => setSelectedAno(e.target.value)}
          >
            <option value="">Todos os anos</option>
            {anoOptions.map((ano) => (
              <option key={ano} value={ano}>
                {ano}
              </option>
            ))}
          </select>

          <button
            className="clear-filters"
            onClick={() => {
              setSearch("");
              setSelectedArea("");
              setSelectedArquitetura("");
              setSelectedAno("");
            }}
          >
            Limpar filtros
          </button>
        </div>
      </header>

      <main className="grid">
        {filtered.length > 0 ? (
          filtered.map((notebook) => (
            <NotebookCard key={notebook.slug} notebook={notebook} />
          ))
        ) : (
          <p>Nenhum notebook encontrado com esses filtros.</p>
        )}
      </main>
    </div>
  );
}