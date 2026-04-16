import json
import re
import shutil
import subprocess
from pathlib import Path
import tempfile

ROOT = Path(__file__).resolve().parent.parent
NOTEBOOKS_DIR = ROOT / "notebooks"
OUTPUT_HTML_DIR = ROOT / "public" / "generated" / "notebooks"
OUTPUT_DATA_DIR = ROOT / "public" / "generated" / "data"
CATALOG_PATH = OUTPUT_DATA_DIR / "catalog.json"
METADATA_JSON_PATH = ROOT / "notebooks_metadata.json"


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[-\s]+", "-", text)
    return text


def extract_text_from_markdown_cell(cell_source):
    if isinstance(cell_source, list):
        return "".join(cell_source)
    return cell_source or ""


def parse_metadata(notebook_data: dict, fallback_title: str) -> dict:
    """
    Convenção opcional no primeiro markdown do notebook:

    # Título do Projeto

    Descrição: texto aqui
    Tags: classificação, xgboost, séries temporais
    Cover: /images/minha-capa.png
    """

    metadata = {
        "title": fallback_title,
        "description": "",
        "tags": [],
        "cover": "",
    }

    cells = notebook_data.get("cells", [])
    markdown_cells = [c for c in cells if c.get("cell_type") == "markdown"]

    if not markdown_cells:
        return metadata

    first_md = extract_text_from_markdown_cell(markdown_cells[0].get("source", ""))
    lines = [line.strip() for line in first_md.splitlines() if line.strip()]

    if lines:
        first_line = lines[0]
        if first_line.startswith("#"):
            metadata["title"] = first_line.lstrip("#").strip() or fallback_title

    description_match = re.search(r"^Descrição:\s*(.+)$", first_md, re.MULTILINE | re.IGNORECASE)
    if description_match:
        metadata["description"] = description_match.group(1).strip()

    tags_match = re.search(r"^Tags:\s*(.+)$", first_md, re.MULTILINE | re.IGNORECASE)
    if tags_match:
        metadata["tags"] = [tag.strip() for tag in tags_match.group(1).split(",") if tag.strip()]

    cover_match = re.search(r"^Cover:\s*(.+)$", first_md, re.MULTILINE | re.IGNORECASE)
    if cover_match:
        metadata["cover"] = cover_match.group(1).strip()

    return metadata

def clean_notebook(notebook_path: Path) -> Path:
    with open(notebook_path, "r", encoding="utf-8") as f:
        nb = json.load(f)

    # Remove só a metadata problemática de widgets
    if "metadata" in nb and "widgets" in nb["metadata"]:
        del nb["metadata"]["widgets"]

    # Também remove widget metadata em células, se existir
    for cell in nb.get("cells", []):
        if "metadata" in cell and "widgets" in cell["metadata"]:
            del cell["metadata"]["widgets"]

    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".ipynb")
    with open(temp_file.name, "w", encoding="utf-8") as f:
        json.dump(nb, f)

    return Path(temp_file.name)


def convert_notebook_to_html(notebook_path: Path, output_path: Path):
    output_path.parent.mkdir(parents=True, exist_ok=True)
    clean_path = None

    try:
        clean_path = clean_notebook(notebook_path)

        cmd = [
            "jupyter",
            "nbconvert",
            "--to",
            "html",
            "--template=classic",
            str(clean_path),
            "--output",
            output_path.stem,
            "--output-dir",
            str(output_path.parent),
        ]

        subprocess.run(cmd, check=True)
        print(f"✅ Convertido: {notebook_path.name}")

    except Exception as e:
        print(f"❌ Erro em {notebook_path.name}: {e}")

    finally:
        if clean_path and clean_path.exists():
            clean_path.unlink()

def load_json_metadata(path: Path) -> dict:
    if not path.exists():
        return {}

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def main():
    OUTPUT_HTML_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DATA_DIR.mkdir(parents=True, exist_ok=True)

    notebook_files = sorted(NOTEBOOKS_DIR.glob("*.ipynb"))
    catalog = []

    if not notebook_files:
        CATALOG_PATH.write_text("[]", encoding="utf-8")
        print("Nenhum notebook encontrado.")
        return
    
    json_metadata = load_json_metadata(METADATA_JSON_PATH)

    for notebook_path in notebook_files:
        fallback_title = notebook_path.stem.replace("_", " ").replace("-", " ").title()
        slug = slugify(notebook_path.stem)
        html_output_path = OUTPUT_HTML_DIR / f"{slug}.html"

        with open(notebook_path, "r", encoding="utf-8") as f:
            notebook_data = json.load(f)

        parsed = parse_metadata(notebook_data, fallback_title)

        extra_metadata = json_metadata.get(notebook_path.name, {})

        convert_notebook_to_html(notebook_path, html_output_path)

        catalog.append({
            "slug": slug,
            "title": parsed["title"],
            "description": extra_metadata.get("description") or parsed["description"],
            "tags": parsed["tags"],
            "cover": parsed["cover"],
            "htmlPath": f"/generated/notebooks/{slug}.html",
            "sourceFile": notebook_path.name,
            "area": extra_metadata.get("area", []),
            "arquitetura": extra_metadata.get("arquitetura", []),
            "ano": extra_metadata.get("ano"),
            "tipo": extra_metadata.get("tipo"),
            "colaboracao": extra_metadata.get("colaboracao"),
            "ordem": extra_metadata.get("ordem"),
        })

        print(f"Convertido: {notebook_path.name} -> {html_output_path.name}")

    with open(CATALOG_PATH, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

    print(f"Catálogo gerado em: {CATALOG_PATH}")


if __name__ == "__main__":
    main()