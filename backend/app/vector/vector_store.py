"""
Vector Store Manager using ChromaDB
向量数据库管理器 - 基于ChromaDB
"""
import os
from typing import List, Dict, Optional, Any
from pathlib import Path
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from loguru import logger


class VectorStoreManager:
    """向量数据库管理器"""

    def __init__(
            self,
            persist_directory: str = None,
            collection_name: str = "mcp_documents",
            embedding_model: str = "all-MiniLM-L6-v2"  # 改用更小、更快的模型
    ):
        """
        初始化向量数据库

        Args:
            persist_directory: 持久化目录
            collection_name: 集合名称
            embedding_model: Embedding模型名称
        """
        self.persist_directory = persist_directory or os.getenv(
            "CHROMA_PERSIST_DIR",
            "./data/chroma"
        )
        self.collection_name = collection_name
        self.available = False  # 初始化为False

        # 确保目录存在
        Path(self.persist_directory).mkdir(parents=True, exist_ok=True)

        # 初始化ChromaDB客户端
        try:
            self.client = chromadb.PersistentClient(
                path=self.persist_directory,
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            logger.info(f"✓ ChromaDB initialized at {self.persist_directory}")
        except Exception as e:
            logger.error(f"✗ Failed to initialize ChromaDB: {str(e)}")
            raise

        # 获取或创建集合
        try:
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={"description": "MCP文档向量存储"}
            )
            logger.info(f"✓ Collection ready: {self.collection_name}")
        except Exception as e:
            logger.error(f"✗ Failed to create collection: {str(e)}")
            raise

        # 初始化Embedding模型（带多个备选方案）
        self.embedding_model = None
        self._init_embedding_model(embedding_model)

    def _init_embedding_model(self, preferred_model: str):
        """
        初始化Embedding模型，带多个备选方案

        Args:
            preferred_model: 首选模型名称
        """
        # 按优先级尝试多个模型
        models_to_try = [
            preferred_model,
            "all-MiniLM-L6-v2",  # 通用英文模型（推荐，最稳定）
            "paraphrase-MiniLM-L6-v2",  # 备选小模型
            "distiluse-base-multilingual-cased-v2",  # 多语言模型
        ]

        logger.info("正在尝试加载Embedding模型...")

        for model_name in models_to_try:
            try:
                logger.info(f"  尝试: {model_name}")
                self.embedding_model = SentenceTransformer(model_name)
                self.available = True
                logger.info(f"✓ 成功加载模型: {model_name}")
                return
            except Exception as e:
                logger.warning(f"  ✗ 加载失败: {str(e)}")
                continue

        # 所有模型都失败
        error_msg = "无法加载任何Embedding模型，请检查网络连接或手动下载模型"
        logger.error(f"✗ {error_msg}")
        raise Exception(error_msg)

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        生成文本的向量表示

        Args:
            texts: 文本列表

        Returns:
            向量列表
        """
        if not self.available or self.embedding_model is None:
            logger.error("Embedding model not available")
            return []

        try:
            embeddings = self.embedding_model.encode(
                texts,
                show_progress_bar=False,
                convert_to_numpy=True
            )
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Embedding generation failed: {str(e)}")
            return []

    def add_documents(
            self,
            texts: List[str],
            metadatas: List[Dict],
            ids: List[str]
    ) -> bool:
        """
        添加文档到向量数据库

        Args:
            texts: 文本列表
            metadatas: 元数据列表
            ids: 文档ID列表

        Returns:
            是否成功
        """
        if not self.available:
            logger.error("Vector store not available")
            return False

        try:
            # 生成embeddings
            embeddings = self.generate_embeddings(texts)

            if not embeddings:
                logger.error("Failed to generate embeddings")
                return False

            # 添加到ChromaDB
            self.collection.add(
                documents=texts,
                embeddings=embeddings,
                metadatas=metadatas,
                ids=ids
            )

            logger.info(f"✓ Added {len(texts)} documents to vector store")
            return True

        except Exception as e:
            logger.error(f"Failed to add documents: {str(e)}")
            return False

    def add_chunks(
            self,
            chunks: List[Dict],
            document_id: str
    ) -> bool:
        """
        添加文档分块到向量数据库

        Args:
            chunks: 分块列表 [{chunk_id, text, start_char, end_char}]
            document_id: 文档ID

        Returns:
            是否成功
        """
        if not chunks:
            return True

        texts = [chunk["text"] for chunk in chunks]
        ids = [chunk["chunk_id"] for chunk in chunks]
        metadatas = [
            {
                "document_id": document_id,
                "chunk_id": chunk["chunk_id"],
                "start_char": chunk.get("start_char", 0),
                "end_char": chunk.get("end_char", 0)
            }
            for chunk in chunks
        ]

        return self.add_documents(texts, metadatas, ids)

    def search(
            self,
            query: str,
            top_k: int = 5,
            filter_metadata: Dict = None
    ) -> List[Dict]:
        """
        语义搜索

        Args:
            query: 查询文本
            top_k: 返回前K个结果
            filter_metadata: 元数据过滤条件

        Returns:
            搜索结果列表 [{id, text, metadata, score}]
        """
        if not self.available:
            logger.error("Vector store not available")
            return []

        try:
            # 生成查询向量
            query_embedding = self.generate_embeddings([query])
            if not query_embedding:
                return []

            query_embedding = query_embedding[0]

            # 执行搜索
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=filter_metadata,
                include=["documents", "metadatas", "distances"]
            )

            # 格式化结果
            search_results = []
            if results["ids"]:
                for i in range(len(results["ids"][0])):
                    search_results.append({
                        "id": results["ids"][0][i],
                        "text": results["documents"][0][i],
                        "metadata": results["metadatas"][0][i],
                        "score": 1 - results["distances"][0][i]  # 转换为相似度分数
                    })

            logger.info(f"Search returned {len(search_results)} results")
            return search_results

        except Exception as e:
            logger.error(f"Search failed: {str(e)}")
            return []

    def search_by_document(
            self,
            query: str,
            document_id: str,
            top_k: int = 5
    ) -> List[Dict]:
        """
        在特定文档中搜索

        Args:
            query: 查询文本
            document_id: 文档ID
            top_k: 返回数量

        Returns:
            搜索结果
        """
        return self.search(
            query,
            top_k,
            filter_metadata={"document_id": document_id}
        )

    def get_document_chunks(self, document_id: str) -> List[Dict]:
        """
        获取文档的所有分块

        Args:
            document_id: 文档ID

        Returns:
            分块列表
        """
        try:
            results = self.collection.get(
                where={"document_id": document_id},
                include=["documents", "metadatas"]
            )

            chunks = []
            if results["ids"]:
                for i in range(len(results["ids"])):
                    chunks.append({
                        "id": results["ids"][i],
                        "text": results["documents"][i],
                        "metadata": results["metadatas"][i]
                    })

            return chunks

        except Exception as e:
            logger.error(f"Failed to get document chunks: {str(e)}")
            return []

    def delete_document(self, document_id: str) -> bool:
        """
        删除文档的所有向量

        Args:
            document_id: 文档ID

        Returns:
            是否成功
        """
        try:
            # 先获取所有相关的chunk IDs
            results = self.collection.get(
                where={"document_id": document_id}
            )

            if results["ids"]:
                self.collection.delete(ids=results["ids"])
                logger.info(f"Deleted {len(results['ids'])} chunks for document {document_id}")
                return True
            else:
                logger.warning(f"No chunks found for document {document_id}")
                return False

        except Exception as e:
            logger.error(f"Failed to delete document: {str(e)}")
            return False

    def get_stats(self) -> Dict[str, Any]:
        """
        获取向量数据库统计信息

        Returns:
            统计信息
        """
        try:
            count = self.collection.count()
            return {
                "total_chunks": count,
                "collection_name": self.collection_name,
                "persist_directory": self.persist_directory,
                "available": self.available
            }
        except Exception as e:
            logger.error(f"Failed to get stats: {str(e)}")
            return {"available": False}

    def clear_collection(self):
        """清空集合（谨慎使用！）"""
        try:
            self.client.delete_collection(self.collection_name)
            self.collection = self.client.create_collection(
                name=self.collection_name,
                metadata={"description": "MCP文档向量存储"}
            )
            logger.warning(f"⚠ Collection '{self.collection_name}' cleared")
        except Exception as e:
            logger.error(f"Failed to clear collection: {str(e)}")

    def hybrid_search(
            self,
            query: str,
            top_k: int = 10,
            semantic_weight: float = 0.7
    ) -> List[Dict]:
        """
        混合搜索（语义+关键词）

        Args:
            query: 查询文本
            top_k: 返回数量
            semantic_weight: 语义搜索权重 (0-1)

        Returns:
            搜索结果
        """
        # 语义搜索
        semantic_results = self.search(query, top_k * 2)

        if not semantic_results:
            return []

        # 关键词过滤（简单实现）
        keyword_filtered = []
        query_keywords = set(query.lower().split())

        for result in semantic_results:
            text_lower = result["text"].lower()
            keyword_score = sum(1 for kw in query_keywords if kw in text_lower) / len(query_keywords)

            # 混合分数
            combined_score = (
                    semantic_weight * result["score"] +
                    (1 - semantic_weight) * keyword_score
            )

            result["combined_score"] = combined_score
            result["keyword_score"] = keyword_score
            keyword_filtered.append(result)

        # 按混合分数排序
        keyword_filtered.sort(key=lambda x: x["combined_score"], reverse=True)

        return keyword_filtered[:top_k]