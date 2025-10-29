"""
Data Models for MCP Platform
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class DocumentMetadata(BaseModel):
    """文档元数据"""
    title: str = ""
    author: str = ""
    subject: str = ""
    file_name: str
    file_type: str  # pdf, docx, pptx
    page_count: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.now)
    file_size: Optional[int] = None


class DocumentChunk(BaseModel):
    """文档分块"""
    chunk_id: str
    document_id: str
    text: str
    start_char: int
    end_char: int
    page_num: Optional[int] = None
    metadata: Dict[str, Any] = {}


class Entity(BaseModel):
    """实体"""
    entity_id: str
    text: str
    label: str  # PERSON, ORG, GPE, etc.
    start_char: int
    end_char: int
    confidence: float = 1.0
    canonical_form: Optional[str] = None  # 规范化形式


class Relation(BaseModel):
    """关系"""
    relation_id: str
    subject: str  # 主体实体ID
    predicate: str  # 关系类型
    object: str  # 客体实体ID
    confidence: float = 1.0
    evidence: Optional[str] = None  # 证据文本


class ParsedDocument(BaseModel):
    """解析后的文档"""
    document_id: str
    text: str
    metadata: DocumentMetadata
    chunks: List[DocumentChunk] = []
    entities: List[Entity] = []
    relations: List[Relation] = []
    status: str = "parsed"


class SearchResult(BaseModel):
    """搜索结果"""
    chunk_id: str
    text: str
    score: float
    metadata: Dict[str, Any]


class QAResponse(BaseModel):
    """问答响应"""
    question: str
    answer: str
    sources: List[SearchResult]
    confidence: float = 0.0
