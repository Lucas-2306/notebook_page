import { Link } from "react-router-dom";

export default function NotebookCard({ notebook }) {
  return (
    <div className="card">
      {notebook.cover ? (
        <img className="card-cover" src={notebook.cover} alt={notebook.title} />
      ) : (
        <div className="card-cover placeholder">Notebook</div>
      )}

      <div className="card-body">
        <h2>{notebook.title}</h2>
        <p>{notebook.description || "Sem descrição cadastrada."}</p>

        <div className="tags">
          {notebook.tags?.map((tag) => (
            <span className="tag" key={`tag-${tag}`}>
              {tag}
            </span>
          ))}

          {notebook.area?.map((item) => (
            <span className="tag area" key={`area-${item}`}>
              {item}
            </span>
          ))}

          {notebook.arquitetura?.map((item) => (
            <span className="tag arquitetura" key={`arq-${item}`}>
              {item}
            </span>
          ))}

          {notebook.ano && (
            <span className="tag ano">{notebook.ano}</span>
          )}
        </div>

        <div className="card-actions">
          <Link to={`/notebook/${notebook.slug}`} className="button primary">
            Ver detalhes
          </Link>

          <a
            href={notebook.htmlPath}
            target="_blank"
            rel="noreferrer"
            className="button"
          >
            Abrir HTML
          </a>
        </div>
      </div>
    </div>
  );
}