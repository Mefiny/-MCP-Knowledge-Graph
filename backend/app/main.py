"""
MCP Platform - FastAPI Main Application
集成知识图谱、向量检索、RAG问答的完整平台
"""
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
from dotenv import load_dotenv

from app.parsers.pdf_parser import PDFParser
from app.parsers.word_parser import WordParser
from app.nlp.segmenter import TextSegmenter
from app.nlp.ner import SimpleNER, SpacyNER, RelationExtractor
from app.models.schemas import DocumentMetadata, ParsedDocument
from app.kg.neo4j_manager import Neo4jManager
from app.vector.vector_store import VectorStoreManager
from app.rag.rag_engine import RAGEngine

# 加载环境变量
load_dotenv()

# 初始化FastAPI应用
app = FastAPI(
    title="MCP Platform",
    description="数字图书管理员式知识图谱平台 API - 支持文档解析、知识图谱、向量检索、RAG问答",
    version="0.2.0"
)

# CORS配置（允许前端跨域访问）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 上传目录
UPLOAD_DIR = Path("./uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# ==================== 初始化各个模块 ====================

# 文件解析器
pdf_parser = PDFParser()
word_parser = WordParser()
text_segmenter = TextSegmenter(max_chunk_size=500, overlap=50)

# NER引擎（尝试使用SpaCy，失败则使用SimpleNER）
ner_engine = SpacyNER()
if not ner_engine.available:
    logger.warning("SpaCy not available, falling back to SimpleNER")
    ner_engine = SimpleNER()

relation_extractor = RelationExtractor()

# 知识图谱管理器（Neo4j）
try:
    kg_manager = Neo4jManager()
    if kg_manager.connected:
        kg_manager.create_constraints()
except Exception as e:
    logger.warning(f"Knowledge Graph initialization failed: {e}")
    kg_manager = None

# 向量存储管理器（ChromaDB）
try:
    vector_store = VectorStoreManager()
except Exception as e:
    logger.error(f"Vector Store initialization failed: {e}")
    vector_store = None

# RAG问答引擎
try:
    rag_engine = RAGEngine(
        vector_store=vector_store,
        kg_manager=kg_manager
    )
except Exception as e:
    logger.warning(f"RAG Engine initialization failed: {e}")
    rag_engine = None

# 内存文档存储（临时方案）
documents_store = {}

logger.info("="*60)
logger.info("MCP Platform Initialized")
logger.info(f"  - Knowledge Graph (Neo4j): {'✓' if kg_manager and kg_manager.connected else '✗'}")
logger.info(f"  - Vector Store (ChromaDB): {'✓' if vector_store and vector_store.available else '✗'}")
logger.info(f"  - RAG Engine (OpenAI): {'✓' if rag_engine and rag_engine.available else '✗'}")
logger.info("="*60)


# ==================== 基础API ====================

@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "Welcome to MCP Platform API",
        "version": "0.2.0",
        "docs": "/docs",
        "features": {
            "file_parsing": True,
            "nlp_processing": True,
            "knowledge_graph": kg_manager is not None and kg_manager.connected,
            "vector_search": vector_store is not None and vector_store.available,
            "rag_qa": rag_engine is not None and rag_engine.available
        }
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    kg_stats = kg_manager.get_stats() if kg_manager else {"connected": False}
    vector_stats = vector_store.get_stats() if vector_store else {"available": False}

    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "pdf_parser": "available",
            "word_parser": "available",
            "ner_engine": "spacy" if isinstance(ner_engine, SpacyNER) and ner_engine.available else "simple",
            "knowledge_graph": {
                "status": "connected" if kg_stats.get("connected") else "disconnected",
                "nodes": kg_stats.get("nodes", 0),
                "relationships": kg_stats.get("relationships", 0)
            },
            "vector_store": {
                "status": "available" if vector_stats.get("available") else "unavailable",
                "total_chunks": vector_stats.get("total_chunks", 0)
            },
            "rag_engine": "available" if rag_engine and rag_engine.available else "unavailable"
        }
    }


# ==================== 文档上传与解析 ====================

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    上传文件并完整处理（解析、NER、知识图谱、向量化）

    支持的文件类型: PDF, DOCX
    """
    try:
        # 生成文档ID
        document_id = str(uuid.uuid4())

        # 检查文件类型
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in ['.pdf', '.docx', '.doc']:
            raise HTTPException(
                status_code=400,
                detail=f"不支持的文件类型: {file_ext}. 仅支持 PDF 和 DOCX"
            )

        # 保存文件
        file_path = UPLOAD_DIR / f"{document_id}{file_ext}"
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        logger.info(f"File uploaded: {file.filename} -> {file_path}")

        # 1. 解析文件
        if file_ext == '.pdf':
            parse_result = pdf_parser.parse(str(file_path))
        else:
            parse_result = word_parser.parse(str(file_path))

        if parse_result['status'] == 'error':
            raise HTTPException(status_code=500, detail=parse_result.get('error', 'Parse error'))

        text = parse_result['text']

        # 2. 文本分段
        chunks = text_segmenter.segment(text, document_id)

        # 3. 实体识别
        entities = ner_engine.extract_entities(text)

        # 4. 关系抽取
        relations = relation_extractor.extract_relations(text, entities)

        # 5. 存储到知识图谱
        kg_success = False
        if kg_manager and kg_manager.connected:
            # 创建文档节点
            metadata = {
                **parse_result['metadata'],
                "file_type": file_ext[1:]
            }
            kg_manager.create_document_node(document_id, metadata)

            # 批量创建实体节点
            kg_manager.batch_create_entities(entities, document_id)

            # 批量创建关系
            kg_manager.batch_create_relations(relations)

            kg_success = True
            logger.info(f"✓ Saved to Knowledge Graph: {len(entities)} entities, {len(relations)} relations")

        # 6. 向量化并存储
        vector_success = False
        if vector_store and vector_store.available:
            vector_store.add_chunks(chunks, document_id)
            vector_success = True
            logger.info(f"✓ Saved to Vector Store: {len(chunks)} chunks")

        # 构建响应
        parsed_doc = {
            "document_id": document_id,
            "file_name": file.filename,
            "file_type": file_ext[1:],
            "text_length": len(text),
            "chunks_count": len(chunks),
            "entities_count": len(entities),
            "relations_count": len(relations),
            "metadata": parse_result['metadata'],
            "processing": {
                "knowledge_graph": kg_success,
                "vector_store": vector_success
            },
            "status": "success"
        }

        # 保存到内存存储
        documents_store[document_id] = {
            **parsed_doc,
            "text": text,
            "chunks": chunks,
            "entities": entities,
            "relations": relations,
            "file_path": str(file_path)
        }

        logger.info(f"Document processed successfully: {document_id}")

        return JSONResponse(content=parsed_doc)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== 文档管理API ====================

@app.get("/api/documents")
async def list_documents():
    """列出所有文档"""
    docs = []
    for doc_id, doc in documents_store.items():
        docs.append({
            "document_id": doc_id,
            "file_name": doc["file_name"],
            "file_type": doc["file_type"],
            "text_length": doc["text_length"],
            "entities_count": doc["entities_count"],
            "chunks_count": doc["chunks_count"]
        })

    return JSONResponse(content={
        "total": len(docs),
        "documents": docs
    })


@app.get("/api/documents/{document_id}")
async def get_document(document_id: str):
    """获取文档详情"""
    if document_id not in documents_store:
        raise HTTPException(status_code=404, detail="Document not found")

    doc = documents_store[document_id]

    return JSONResponse(content={
        "document_id": document_id,
        "file_name": doc["file_name"],
        "file_type": doc["file_type"],
        "text_length": doc["text_length"],
        "chunks_count": doc["chunks_count"],
        "entities_count": doc["entities_count"],
        "relations_count": doc["relations_count"],
        "metadata": doc["metadata"]
    })


@app.get("/api/documents/{document_id}/text")
async def get_document_text(document_id: str):
    """获取文档全文"""
    if document_id not in documents_store:
        raise HTTPException(status_code=404, detail="Document not found")

    return JSONResponse(content={
        "document_id": document_id,
        "text": documents_store[document_id]["text"]
    })


@app.get("/api/documents/{document_id}/entities")
async def get_entities(document_id: str):
    """获取文档的所有实体"""
    if document_id not in documents_store:
        raise HTTPException(status_code=404, detail="Document not found")

    entities = documents_store[document_id]["entities"]

    return JSONResponse(content={
        "document_id": document_id,
        "entities_count": len(entities),
        "entities": entities
    })


@app.get("/api/documents/{document_id}/relations")
async def get_relations(document_id: str):
    """获取文档的所有关系"""
    if document_id not in documents_store:
        raise HTTPException(status_code=404, detail="Document not found")

    relations = documents_store[document_id]["relations"]

    return JSONResponse(content={
        "document_id": document_id,
        "relations_count": len(relations),
        "relations": relations[:100]  # 限制返回数量
    })


@app.delete("/api/documents/{document_id}")
async def delete_document(document_id: str):
    """删除文档（包括文件、向量、知识图谱）"""
    if document_id not in documents_store:
        raise HTTPException(status_code=404, detail="Document not found")

    # 删除文件
    file_path = documents_store[document_id]["file_path"]
    if os.path.exists(file_path):
        os.remove(file_path)

    # 删除向量
    if vector_store:
        vector_store.delete_document(document_id)

    # TODO: 删除知识图谱中的文档节点

    # 从内存中删除
    del documents_store[document_id]

    logger.info(f"Document deleted: {document_id}")

    return JSONResponse(content={"message": "Document deleted successfully"})


# ==================== 知识图谱API ====================

@app.get("/api/kg/stats")
async def get_kg_stats():
    """获取知识图谱统计信息"""
    if not kg_manager or not kg_manager.connected:
        raise HTTPException(status_code=503, detail="Knowledge Graph not available")

    stats = kg_manager.get_stats()
    return JSONResponse(content=stats)


@app.get("/api/kg/graph/{document_id}")
async def get_document_graph(document_id: str):
    """获取文档的知识图谱"""
    if not kg_manager or not kg_manager.connected:
        raise HTTPException(status_code=503, detail="Knowledge Graph not available")

    graph_data = kg_manager.get_document_graph(document_id)
    return JSONResponse(content=graph_data)


@app.get("/api/kg/entity/{entity_text}")
async def get_entity_subgraph(
    entity_text: str,
    max_depth: int = Query(2, ge=1, le=5),
    limit: int = Query(50, ge=1, le=200)
):
    """获取实体的邻居子图"""
    if not kg_manager or not kg_manager.connected:
        raise HTTPException(status_code=503, detail="Knowledge Graph not available")

    subgraph = kg_manager.get_entity_neighbors(entity_text, max_depth, limit)
    return JSONResponse(content=subgraph)


@app.get("/api/kg/search")
async def search_entities(
    label: str = Query(..., description="实体标签"),
    limit: int = Query(20, ge=1, le=100)
):
    """按标签搜索实体"""
    if not kg_manager or not kg_manager.connected:
        raise HTTPException(status_code=503, detail="Knowledge Graph not available")

    entities = kg_manager.search_entities_by_label(label, limit)
    return JSONResponse(content={"entities": entities})


# ==================== 向量检索API ====================

@app.get("/api/search")
async def semantic_search(
    query: str = Query(..., min_length=1),
    top_k: int = Query(5, ge=1, le=20),
    document_id: Optional[str] = None
):
    """语义搜索"""
    if not vector_store or not vector_store.available:
        raise HTTPException(status_code=503, detail="Vector Store not available")

    if document_id:
        results = vector_store.search_by_document(query, document_id, top_k)
    else:
        results = vector_store.search(query, top_k)

    return JSONResponse(content={
        "query": query,
        "results_count": len(results),
        "results": results
    })


@app.get("/api/search/hybrid")
async def hybrid_search(
    query: str = Query(..., min_length=1),
    top_k: int = Query(10, ge=1, le=20),
    semantic_weight: float = Query(0.7, ge=0.0, le=1.0)
):
    """混合搜索（语义+关键词）"""
    if not vector_store or not vector_store.available:
        raise HTTPException(status_code=503, detail="Vector Store not available")

    results = vector_store.hybrid_search(query, top_k, semantic_weight)

    return JSONResponse(content={
        "query": query,
        "results_count": len(results),
        "results": results
    })


# ==================== RAG问答API ====================

@app.post("/api/qa/ask")
async def ask_question(
    question: str = Query(..., min_length=1),
    document_id: Optional[str] = None,
    top_k: int = Query(5, ge=1, le=10),
    use_hybrid: bool = Query(True),
    include_graph: bool = Query(False)
):
    """RAG问答"""
    if not rag_engine:
        raise HTTPException(status_code=503, detail="RAG Engine not available")

    result = rag_engine.ask(
        question=question,
        document_id=document_id,
        top_k=top_k,
        use_hybrid=use_hybrid,
        include_graph=include_graph
    )

    return JSONResponse(content=result)


@app.post("/api/qa/summarize/{document_id}")
async def summarize_document(
    document_id: str,
    max_length: int = Query(500, ge=100, le=2000)
):
    """生成文档摘要"""
    if not rag_engine:
        raise HTTPException(status_code=503, detail="RAG Engine not available")

    result = rag_engine.summarize_document(document_id, max_length)

    return JSONResponse(content=result)


# ==================== LLM模型管理API ====================

@app.get("/api/llm/providers")
async def get_llm_providers():
    """获取所有可用的LLM提供商"""
    if not rag_engine or not rag_engine.available:
        return JSONResponse(content={
            "providers": [],
            "current": None,
            "message": "No LLM providers configured"
        })

    providers = rag_engine.llm_manager.get_available_providers()
    current = rag_engine.llm_manager.get_current_info()

    return JSONResponse(content={
        "providers": providers,
        "current": current
    })


@app.get("/api/llm/providers/all")
async def get_all_llm_providers():
    """获取所有支持的LLM提供商（包括未配置的）"""
    if not rag_engine:
        from app.rag.llm_providers import LLMProviderManager
        temp_manager = LLMProviderManager()
        providers = temp_manager.get_all_providers()
    else:
        providers = rag_engine.llm_manager.get_all_providers()

    return JSONResponse(content={
        "providers": providers
    })


@app.post("/api/llm/test")
async def test_llm_provider(
    provider: str = Query(..., description="提供商ID (openai/qwen/deepseek)"),
    api_key: str = Query(..., description="API密钥"),
    model: Optional[str] = Query(None, description="模型名称")
):
    """测试LLM提供商的API Key"""
    if not rag_engine:
        raise HTTPException(status_code=503, detail="RAG Engine not available")

    result = rag_engine.llm_manager.test_provider(provider, api_key, model)

    if result["success"]:
        return JSONResponse(content=result)
    else:
        raise HTTPException(status_code=400, detail=result["message"])


@app.post("/api/llm/config")
async def config_llm_provider(
    provider: str = Query(..., description="提供商ID (openai/qwen/deepseek)"),
    api_key: str = Query(..., description="API密钥"),
    model: Optional[str] = Query(None, description="模型名称"),
    set_as_current: bool = Query(True, description="是否设为当前使用")
):
    """配置LLM提供商（动态添加/更新）"""
    if not rag_engine:
        raise HTTPException(status_code=503, detail="RAG Engine not available")

    # 添加或更新提供商
    success = rag_engine.llm_manager.add_or_update_provider(provider, api_key, model)

    if not success:
        raise HTTPException(status_code=400, detail=f"Failed to configure provider {provider}")

    # 如果需要，设置为当前使用
    if set_as_current:
        rag_engine.llm_manager.set_provider(provider, model)

    current = rag_engine.llm_manager.get_current_info()
    logger.info(f"LLM provider configured: {current['name']} ({current['model']})")

    return JSONResponse(content={
        "success": True,
        "current": current,
        "message": f"Successfully configured {current['name']}"
    })


@app.post("/api/llm/switch")
async def switch_llm_provider(
    provider: str = Query(..., description="提供商ID (openai/qwen/deepseek)"),
    model: Optional[str] = Query(None, description="模型名称")
):
    """切换LLM提供商和模型"""
    if not rag_engine or not rag_engine.available:
        raise HTTPException(status_code=503, detail="RAG Engine not available")

    success = rag_engine.llm_manager.set_provider(provider, model)

    if success:
        current = rag_engine.llm_manager.get_current_info()
        logger.info(f"LLM provider switched to {current['name']} ({current['model']})")
        return JSONResponse(content={
            "success": True,
            "current": current,
            "message": f"Successfully switched to {current['name']}"
        })
    else:
        raise HTTPException(status_code=400, detail=f"Provider {provider} not available")


@app.get("/api/llm/current")
async def get_current_llm():
    """获取当前使用的LLM提供商"""
    if not rag_engine or not rag_engine.available:
        return JSONResponse(content={
            "provider": "none",
            "model": "none",
            "name": "未配置"
        })

    current = rag_engine.llm_manager.get_current_info()
    return JSONResponse(content=current)


# ==================== 启动与关闭 ====================

@app.on_event("startup")
async def startup_event():
    """应用启动事件"""
    logger.info("🚀 MCP Platform API Server started")


@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭事件"""
    if kg_manager:
        kg_manager.close()
    logger.info("👋 MCP Platform API Server stopped")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
