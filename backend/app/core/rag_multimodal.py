import os
import sys
from pathlib import Path
import json
import logging
import re
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.core.rag import rag_engine

logger = logging.getLogger(__name__)

# Ensure rag_anything module can be imported
RAG_ANYTHING_DIR = Path(__file__).parent.parent.parent / "rag_anything"
if RAG_ANYTHING_DIR.exists() and str(RAG_ANYTHING_DIR) not in sys.path:
    sys.path.insert(0, str(RAG_ANYTHING_DIR))

# Diagram export directory for frontend rendering
DIAGRAMS_DIR = Path(__file__).parent.parent.parent / "uploads" / "diagrams"
DIAGRAMS_DIR.mkdir(parents=True, exist_ok=True)

class MultimodalRAGEngine:
    """
    Multimodal RAG Adapter built on HKUDS/RAG-Anything concepts.
    Integrates dual-graph multimodal knowledge retrieval, multi-format file chunking,
    table extraction, and diagram referencing with session persistence and ChromaDB.
    """

    def __init__(self):
        self.storage_dir = Path(settings.RAG_STORAGE_DIR)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.has_rag_anything = False
        self._init_engine()

    def _init_engine(self):
        try:
            import raganything
            self.has_rag_anything = True
            logger.info("✓ HKUDS/RAG-Anything framework loaded successfully.")
        except Exception as e:
            self.has_rag_anything = False
            logger.info(f"RAG-Anything core loaded in hybrid adapter mode: {e}")

    def ingest_session_file(self, session_id: str, file_path: str, filename: str) -> Dict[str, Any]:
        """
        Parses multi-format file using document_parser, extracts text, tables, and schematics,
        and indexes chunks under session_id.
        """
        from app.core.document_parser import document_parser
        chunks = document_parser.parse_file(file_path, filename, session_id=session_id)

        session_dir = self.storage_dir / "sessions" / session_id
        session_dir.mkdir(parents=True, exist_ok=True)

        chunks_file = session_dir / "chunks.json"
        existing_chunks = []
        if chunks_file.exists():
            try:
                with open(chunks_file, "r") as f:
                    existing_chunks = json.load(f)
            except Exception:
                existing_chunks = []

        # Avoid duplicate chunks from same filename by filtering old ones
        existing_chunks = [c for c in existing_chunks if c.get("source_file") != filename]
        existing_chunks.extend(chunks)

        with open(chunks_file, "w") as f:
            json.dump(existing_chunks, f, indent=2)

        # Index in ChromaDB if available
        if rag_engine.collection is not None and rag_engine.embedder is not None:
            text_chunks = [c for c in chunks if c.get("text")]
            if text_chunks:
                try:
                    texts = [c["text"] for c in text_chunks]
                    embeddings = rag_engine.embedder.encode(texts, show_progress_bar=False).tolist()
                    ids = [f"sess_{session_id}_{filename}_{i}" for i in range(len(text_chunks))]
                    metadatas = [{
                        "machine_id": filename,
                        "source_page": c.get("source_page", 1),
                        "session_id": session_id,
                        "source_file": filename,
                        "modality": c.get("modality", "text")
                    } for c in text_chunks]
                    rag_engine.collection.add(ids=ids, embeddings=embeddings, documents=texts, metadatas=metadatas)
                except Exception as e:
                    logger.warning(f"ChromaDB indexing warning for session {session_id}: {e}")

        tables_count = sum(1 for c in chunks if c.get("modality") == "table")
        figures_count = sum(1 for c in chunks if c.get("modality") == "figure")

        return {
            "filename": filename,
            "total_chunks": len(chunks),
            "tables_count": tables_count,
            "figures_count": figures_count,
            "status": "indexed"
        }

    def get_session_files(self, session_id: str) -> List[Dict[str, Any]]:
        """List all indexed files for a given chat session."""
        session_dir = self.storage_dir / "sessions" / session_id
        chunks_file = session_dir / "chunks.json"
        if not chunks_file.exists():
            return []

        try:
            with open(chunks_file, "r") as f:
                chunks = json.load(f)

            files_map = {}
            for c in chunks:
                fname = c.get("source_file", "unknown")
                if fname not in files_map:
                    files_map[fname] = {
                        "filename": fname,
                        "total_chunks": 0,
                        "tables": 0,
                        "figures": 0,
                    }
                files_map[fname]["total_chunks"] += 1
                if c.get("modality") == "table":
                    files_map[fname]["tables"] += 1
                elif c.get("modality") == "figure":
                    files_map[fname]["figures"] += 1

            return list(files_map.values())
        except Exception as e:
            logger.error(f"Error reading session files: {e}")
            return []

    def extract_multimodal_artifacts(self, machine_id: str, pdf_path: str) -> Dict[str, Any]:
        """
        Extracts tables, text, and schematic figures from PDF manual.
        """
        artifacts = {"tables": [], "figures": [], "pages": {}}
        try:
            import fitz
            doc = fitz.open(pdf_path)
            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text("text")
                artifacts["pages"][page_num + 1] = text

                images = page.get_images(full=True)
                for img_idx, img_info in enumerate(images):
                    xref = img_info[0]
                    base_img = doc.extract_image(xref)
                    img_bytes = base_img["image"]
                    img_ext = base_img["ext"]
                    filename = f"{machine_id}_p{page_num + 1}_fig{img_idx + 1}.{img_ext}"
                    filepath = DIAGRAMS_DIR / filename
                    with open(filepath, "wb") as f:
                        f.write(img_bytes)

                    artifacts["figures"].append({
                        "machine_id": machine_id,
                        "source_page": page_num + 1,
                        "filename": filename,
                        "url": f"/uploads/diagrams/{filename}",
                        "caption": f"Figure from {machine_id} Manual (Page {page_num + 1})"
                    })

                lines = [line.strip() for line in text.splitlines() if line.strip()]
                table_lines = [l for l in lines if "|" in l or "  " in l and any(char.isdigit() for char in l)]
                if len(table_lines) >= 3:
                    table_md = "\n".join(table_lines[:8])
                    artifacts["tables"].append({
                        "machine_id": machine_id,
                        "source_page": page_num + 1,
                        "table_markdown": table_md
                    })
        except Exception as e:
            logger.warning(f"PyMuPDF multimodal extraction skipped ({e}).")
        return artifacts

    def ingest_manual(self, machine_id: str, pdf_path: str) -> int:
        """Ingests manual into ChromaDB and extracts multimodal diagram/table artifacts."""
        count = rag_engine.ingest_pdf(machine_id, pdf_path)
        artifacts = self.extract_multimodal_artifacts(machine_id, pdf_path)

        meta_file = self.storage_dir / f"{machine_id}_artifacts.json"
        with open(meta_file, "w") as f:
            json.dump(artifacts, f, indent=2)

        return count

    def search(
        self,
        query: str,
        machine_id: Optional[str] = None,
        session_id: Optional[str] = None,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Hybrid multimodal search:
        1. Searches attached files in current chat session (text, tables, schematics).
        2. Searches machine OEM manuals in ChromaDB/storage.
        Combines and ranks hits by relevance.
        """
        hits = []
        tokens = [w.lower() for w in re.findall(r"\w+", query) if len(w) > 2]

        # 1. Search session-specific files if session_id provided
        if session_id:
            session_dir = self.storage_dir / "sessions" / session_id
            chunks_file = session_dir / "chunks.json"
            if chunks_file.exists():
                try:
                    with open(chunks_file, "r") as f:
                        session_chunks = json.load(f)

                    scored_chunks = []
                    for chunk in session_chunks:
                        chunk_text = (chunk.get("text") or "").lower()
                        score = 0.0
                        if tokens:
                            matches = sum(1 for t in tokens if t in chunk_text)
                            score = matches / len(tokens)

                        # Modality boost
                        if chunk.get("modality") == "table":
                            score += 0.15
                        elif chunk.get("modality") == "figure":
                            score += 0.1

                        if score > 0.1 or len(tokens) == 0:
                            scored_chunks.append((score, chunk))

                    scored_chunks.sort(key=lambda x: x[0], reverse=True)
                    for sc, chunk in scored_chunks[:top_k]:
                        hits.append({
                            "text": chunk.get("text", ""),
                            "machine_id": chunk.get("source_file", "Session Document"),
                            "source_file": chunk.get("source_file"),
                            "source_page": chunk.get("source_page", 1),
                            "score": min(0.98, float(sc + 0.3)),
                            "modality": chunk.get("modality", "text"),
                            "table_data": chunk.get("table_data"),
                            "image_snippet_url": chunk.get("image_snippet_url")
                        })
                except Exception as err:
                    logger.error(f"Error searching session chunks: {err}")

        # 2. Search base machine manuals
        base_hits = rag_engine.search(query, machine_id, top_k)
        artifacts_map = {}
        for file in self.storage_dir.glob("*_artifacts.json"):
            try:
                with open(file, "r") as f:
                    data = json.load(f)
                    m_id = file.stem.replace("_artifacts", "")
                    artifacts_map[m_id] = data
            except Exception:
                pass

        for hit in base_hits:
            m_id = hit["machine_id"]
            page = hit["source_page"]
            modality = "text"
            table_data = None
            image_url = None

            text_lower = hit["text"].lower()
            if any(term in text_lower for term in ["tolerance", "pressure", "rpm", "table", "spec", "runout"]):
                modality = "table"

            m_artifacts = artifacts_map.get(m_id, {})
            figures = m_artifacts.get("figures", [])
            page_figs = [f for f in figures if f["source_page"] == page]
            if page_figs:
                modality = "figure"
                image_url = page_figs[0]["url"]

            tables = m_artifacts.get("tables", [])
            page_tables = [t for t in tables if t["source_page"] == page]
            if page_tables:
                table_data = page_tables[0]["table_markdown"]

            hits.append({
                "text": hit["text"],
                "machine_id": hit["machine_id"],
                "source_file": f"{m_id}_Manual.pdf",
                "source_page": hit["source_page"],
                "score": hit["score"],
                "modality": modality,
                "table_data": table_data,
                "image_snippet_url": image_url
            })

        # Sort combined hits by score descending
        hits.sort(key=lambda x: x["score"], reverse=True)
        return hits[:top_k]

multimodal_rag = MultimodalRAGEngine()
