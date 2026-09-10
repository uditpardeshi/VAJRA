from typing import List, Dict, Any, Optional
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class RAGEngine:
    def __init__(self):
        self._client = None
        self._collection = None
        self._embedder = None

    @property
    def client(self):
        if self._client is None:
            try:
                import chromadb
                from chromadb.config import Settings as ChromaSettings
                self._client = chromadb.PersistentClient(
                    path=settings.CHROMA_PERSIST_DIR,
                    settings=ChromaSettings(anonymized_telemetry=False)
                )
            except Exception as e:
                logger.warning(f"ChromaDB not initialized: {e}")
                return None
        return self._client

    @property
    def collection(self):
        if self._collection is None and self.client is not None:
            try:
                self._collection = self.client.get_or_create_collection(
                    name="manufacturing_manuals",
                    metadata={"hnsw:space": "cosine"}
                )
            except Exception as e:
                logger.warning(f"Could not get Chroma collection: {e}")
                return None
        return self._collection

    @property
    def embedder(self):
        if self._embedder is None:
            try:
                from sentence_transformers import SentenceTransformer
                logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
                self._embedder = SentenceTransformer(settings.EMBEDDING_MODEL)
            except Exception as e:
                logger.warning(f"Could not load SentenceTransformer: {e}")
                return None
        return self._embedder

    def ingest_pdf(self, machine_id: str, pdf_path: str, chunk_size: int = 500, overlap: int = 50) -> int:
        """Extract text from PDF, chunk, embed, store. Returns chunk count."""
        from pypdf import PdfReader
        
        reader = PdfReader(pdf_path)
        full_text = ""
        for i, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            full_text += f"\n[PAGE {i+1}] {text}"
        
        # Simple chunking
        chunks = []
        for i in range(0, len(full_text), chunk_size - overlap):
            chunk = full_text[i:i + chunk_size]
            if chunk.strip():
                chunks.append({
                    "text": chunk.strip(),
                    "machine_id": machine_id,
                    "source_page": (i // chunk_size) + 1
                })
        
        if not chunks or self.collection is None or self.embedder is None:
            return 0
        
        texts = [c["text"] for c in chunks]
        embeddings = self.embedder.encode(texts, show_progress_bar=False).tolist()
        ids = [f"{machine_id}_chunk_{i}" for i in range(len(chunks))]
        metadatas = [{"machine_id": c["machine_id"], "source_page": c["source_page"]} for c in chunks]
        
        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas
        )
        logger.info(f"Ingested {len(chunks)} chunks for {machine_id} from {pdf_path}")
        return len(chunks)

    def search(self, query: str, machine_id: Optional[str] = None, top_k: int = 5) -> List[Dict[str, Any]]:
        """Semantic search. Optional filter by machine_id."""
        if self.collection is None or self.embedder is None:
            return []

        try:
            query_emb = self.embedder.encode([query]).tolist()[0]
            where = {"machine_id": machine_id} if machine_id else None
            results = self.collection.query(
                query_embeddings=[query_emb],
                n_results=top_k,
                where=where,
                include=["documents", "metadatas", "distances"]
            )
            
            hits = []
            if results and results.get("ids") and len(results["ids"]) > 0 and len(results["ids"][0]) > 0:
                for i in range(len(results["ids"][0])):
                    hits.append({
                        "text": results["documents"][0][i],
                        "machine_id": results["metadatas"][0][i]["machine_id"],
                        "source_page": results["metadatas"][0][i]["source_page"],
                        "score": max(0.0, float(1 - results["distances"][0][i]))  # cosine similarity
                    })
            return hits
        except Exception as e:
            logger.warning(f"Error during Chroma search: {e}")
            return []

    def get_stats(self) -> dict:
        if self.collection is None:
            return {"total_chunks": 0, "machines": []}
        try:
            count = self.collection.count()
            machines = []
            if count > 0:
                got = self.collection.get()
                if got and got.get("metadatas"):
                    machines = list(set(m["machine_id"] for m in got["metadatas"] if "machine_id" in m))
            return {
                "total_chunks": count,
                "machines": machines
            }
        except Exception as e:
            logger.warning(f"Error getting Chroma stats: {e}")
            return {"total_chunks": 0, "machines": []}

rag_engine = RAGEngine()
