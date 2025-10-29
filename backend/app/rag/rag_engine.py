"""
RAG (Retrieval-Augmented Generation) Engine
检索增强生成问答系统 - 支持多个 LLM 提供商
"""
import os
from typing import List, Dict, Optional, Any
from loguru import logger
from app.rag.llm_providers import get_llm_manager


class RAGEngine:
    """RAG问答引擎"""

    def __init__(
        self,
        vector_store=None,
        kg_manager=None
    ):
        """
        初始化RAG引擎

        Args:
            vector_store: 向量存储管理器
            kg_manager: 知识图谱管理器
        """
        self.vector_store = vector_store
        self.kg_manager = kg_manager

        # 使用LLM提供商管理器
        self.llm_manager = get_llm_manager()

        if self.llm_manager.is_available():
            info = self.llm_manager.get_current_info()
            logger.info(f"✓ RAG Engine initialized with {info['name']} ({info['model']})")
        else:
            logger.warning("No LLM provider available, RAG features will be limited")

    @property
    def available(self) -> bool:
        """动态检查LLM是否可用（支持运行时配置）"""
        return self.llm_manager.is_available()

    def retrieve_context(
        self,
        question: str,
        top_k: int = 5,
        document_id: Optional[str] = None,
        use_hybrid: bool = True
    ) -> List[Dict]:
        """
        检索相关上下文

        Args:
            question: 用户问题
            top_k: 返回数量
            document_id: 限定文档ID
            use_hybrid: 是否使用混合搜索

        Returns:
            检索结果列表
        """
        if not self.vector_store:
            logger.warning("Vector store not available")
            return []

        try:
            # 使用向量检索
            if document_id:
                results = self.vector_store.search_by_document(
                    question,
                    document_id,
                    top_k
                )
            elif use_hybrid:
                results = self.vector_store.hybrid_search(
                    question,
                    top_k
                )
            else:
                results = self.vector_store.search(
                    question,
                    top_k
                )

            logger.info(f"Retrieved {len(results)} context chunks")
            return results

        except Exception as e:
            logger.error(f"Context retrieval failed: {str(e)}")
            return []

    def format_context(self, contexts: List[Dict]) -> str:
        """
        格式化上下文为提示词

        Args:
            contexts: 上下文列表

        Returns:
            格式化的上下文字符串
        """
        if not contexts:
            return "没有找到相关上下文。"

        formatted = []
        for i, ctx in enumerate(contexts, 1):
            text = ctx.get("text", "")
            score = ctx.get("score", 0) or ctx.get("combined_score", 0)
            formatted.append(f"[片段 {i}] (相关度: {score:.2f})\n{text}")

        return "\n\n".join(formatted)

    def generate_answer(
        self,
        question: str,
        contexts: List[Dict],
        system_prompt: str = None,
        temperature: float = 0.3
    ) -> Dict[str, Any]:
        """
        生成答案

        Args:
            question: 用户问题
            contexts: 检索到的上下文
            system_prompt: 系统提示词
            temperature: 生成温度

        Returns:
            答案信息 {answer, confidence, model}
        """
        if not self.available:
            return {
                "answer": "抱歉，AI问答功能当前不可用。您可以查看检索到的相关文档片段。",
                "confidence": 0.0,
                "model": "none",
                "error": "OpenAI client not available"
            }

        # 默认系统提示词
        if not system_prompt:
            system_prompt = """你是一个专业的知识问答助手。请根据提供的文档片段回答用户问题。

要求：
1. 只基于提供的文档片段回答，不要编造信息
2. 如果文档中没有相关信息，请明确说明
3. 引用具体片段时，标注片段编号
4. 回答要简洁、准确、有条理
5. 使用中文回答"""

        # 格式化上下文
        context_text = self.format_context(contexts)

        # 构建用户提示
        user_prompt = f"""参考文档：
{context_text}

问题：{question}

请基于上述文档回答问题。"""

        try:
            # 调用LLM提供商
            result = self.llm_manager.chat_completion(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=temperature,
                max_tokens=1000
            )

            answer = result["content"]

            # 估算置信度（基于检索分数）
            avg_score = sum(
                ctx.get("score", 0) or ctx.get("combined_score", 0)
                for ctx in contexts
            ) / len(contexts) if contexts else 0

            return {
                "answer": answer,
                "confidence": avg_score,
                "model": result["model"],
                "provider": result["provider"],
                "usage": result.get("usage", {})
            }

        except Exception as e:
            logger.error(f"Answer generation failed: {str(e)}")
            return {
                "answer": f"生成答案时出错: {str(e)}",
                "confidence": 0.0,
                "model": self.model,
                "error": str(e)
            }

    def ask(
        self,
        question: str,
        document_id: Optional[str] = None,
        top_k: int = 5,
        use_hybrid: bool = True,
        include_graph: bool = False
    ) -> Dict[str, Any]:
        """
        完整的RAG问答流程

        Args:
            question: 用户问题
            document_id: 限定文档ID
            top_k: 检索数量
            use_hybrid: 使用混合检索
            include_graph: 是否包含知识图谱信息

        Returns:
            完整的问答结果
        """
        # 1. 检索上下文
        contexts = self.retrieve_context(
            question,
            top_k,
            document_id,
            use_hybrid
        )

        # 2. 可选：从知识图谱获取额外信息
        graph_info = None
        if include_graph and self.kg_manager and self.kg_manager.connected:
            # 提取问题中的实体
            # 这里简化处理，实际应该用NER提取
            graph_info = self._get_graph_context(question)

        # 3. 生成答案
        result = self.generate_answer(question, contexts)

        # 4. 组装完整响应
        return {
            "question": question,
            "answer": result["answer"],
            "sources": [
                {
                    "chunk_id": ctx.get("id", ""),
                    "text": ctx.get("text", ""),
                    "score": ctx.get("score", 0) or ctx.get("combined_score", 0),
                    "metadata": ctx.get("metadata", {})
                }
                for ctx in contexts
            ],
            "confidence": result.get("confidence", 0.0),
            "model": result.get("model", "none"),
            "graph_info": graph_info,
            "usage": result.get("usage", {}),
            "error": result.get("error")
        }

    def _get_graph_context(self, question: str) -> Optional[Dict]:
        """
        从知识图谱获取额外上下文（简化版）

        Args:
            question: 用户问题

        Returns:
            图谱信息
        """
        # 这里是简化实现
        # 实际应该：
        # 1. 用NER提取问题中的实体
        # 2. 在图谱中查找这些实体
        # 3. 获取实体的邻居和关系
        # 4. 格式化为额外上下文

        return None

    def summarize_document(
        self,
        document_id: str,
        max_length: int = 500
    ) -> Dict[str, Any]:
        """
        生成文档摘要

        Args:
            document_id: 文档ID
            max_length: 最大摘要长度

        Returns:
            摘要结果
        """
        if not self.available or not self.vector_store:
            return {
                "summary": "摘要功能不可用",
                "error": "Service unavailable"
            }

        try:
            # 获取文档的所有分块
            chunks = self.vector_store.get_document_chunks(document_id)

            if not chunks:
                return {
                    "summary": "未找到文档内容",
                    "error": "Document not found"
                }

            # 合并文本（限制长度）
            full_text = "\n\n".join([c["text"] for c in chunks[:10]])  # 最多10个chunk

            # 生成摘要
            result = self.llm_manager.chat_completion(
                messages=[
                    {
                        "role": "system",
                        "content": "你是一个专业的文档摘要助手。请用中文生成简洁、准确的摘要。"
                    },
                    {
                        "role": "user",
                        "content": f"请为以下文档生成摘要（{max_length}字以内）：\n\n{full_text}"
                    }
                ],
                temperature=0.3,
                max_tokens=max_length
            )

            summary = result["content"]

            return {
                "summary": summary,
                "document_id": document_id,
                "chunks_used": len(chunks),
                "model": result["model"],
                "provider": result["provider"]
            }

        except Exception as e:
            logger.error(f"Summarization failed: {str(e)}")
            return {
                "summary": f"摘要生成失败: {str(e)}",
                "error": str(e)
            }


# 测试代码
if __name__ == "__main__":
    from vector.vector_store import VectorStoreManager

    # 初始化向量存储
    vector_store = VectorStoreManager(
        persist_directory="./data/chroma_test"
    )

    # 初始化RAG引擎
    rag_engine = RAGEngine(
        vector_store=vector_store,
        model="gpt-3.5-turbo"
    )

    if rag_engine.available:
        # 测试问答
        result = rag_engine.ask(
            "什么是深度学习？",
            top_k=3
        )

        print("\n=== RAG问答测试 ===")
        print(f"问题: {result['question']}")
        print(f"答案: {result['answer']}")
        print(f"置信度: {result['confidence']:.2f}")
        print(f"\n引用来源 ({len(result['sources'])}个):")
        for i, src in enumerate(result['sources'][:2], 1):
            print(f"{i}. {src['text'][:80]}... (分数: {src['score']:.3f})")
    else:
        print("RAG引擎不可用（需要配置OpenAI API密钥）")
