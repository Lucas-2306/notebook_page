import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

export default function NotebookView() {
  const { slug } = useParams();
  const [catalog, setCatalog] = useState([]);
  const [notebook, setNotebook] = useState(null);

  useEffect(() => {
    fetch("/generated/data/catalog.json")
      .then((res) => res.json())
      .then((data) => {
        setCatalog(data);
        const found = data.find((item) => item.slug === slug);
        setNotebook(found || null);
      })
      .catch((err) => {
        console.error("Erro ao carregar notebook:", err);
      });
  }, [slug]);

  if (!notebook) {
    return (
      <div className="page">
        <Link to="/" className="back-link">← Voltar</Link>
        <p>Notebook não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="page notebook-page">
      <Link to="/" className="back-link">← Voltar</Link>

      <div className="notebook-header">
        <h1>{notebook.title}</h1>
        <p>{notebook.description || "Sem descrição cadastrada."}</p>

        <div className="tags">
          {notebook.tags?.map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="iframe-wrapper">
        <iframe
          title={notebook.title}
          src={notebook.htmlPath}
          className="notebook-frame"
        />
      </div>
    </div>
  );
}