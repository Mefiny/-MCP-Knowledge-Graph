/**
 * API Service - 与后端通信的服务层
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ==================== 文档管理 API ====================

export const documentAPI = {
  // 上传文档
  upload: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
  },

  // 获取所有文档
  list: async () => {
    return apiClient.get('/api/documents');
  },

  // 获取文档详情
  get: async (documentId) => {
    return apiClient.get(`/api/documents/${documentId}`);
  },

  // 获取文档全文
  getText: async (documentId) => {
    return apiClient.get(`/api/documents/${documentId}/text`);
  },

  // 获取文档实体
  getEntities: async (documentId) => {
    return apiClient.get(`/api/documents/${documentId}/entities`);
  },

  // 获取文档关系
  getRelations: async (documentId) => {
    return apiClient.get(`/api/documents/${documentId}/relations`);
  },

  // 删除文档
  delete: async (documentId) => {
    return apiClient.delete(`/api/documents/${documentId}`);
  },
};

// ==================== 知识图谱 API ====================

export const knowledgeGraphAPI = {
  // 获取统计信息
  getStats: async () => {
    return apiClient.get('/api/kg/stats');
  },

  // 获取文档知识图谱
  getDocumentGraph: async (documentId) => {
    return apiClient.get(`/api/kg/graph/${documentId}`);
  },

  // 获取实体子图
  getEntitySubgraph: async (entityText, maxDepth = 2, limit = 50) => {
    return apiClient.get(`/api/kg/entity/${encodeURIComponent(entityText)}`, {
      params: { max_depth: maxDepth, limit },
    });
  },

  // 搜索实体
  searchEntities: async (label, limit = 20) => {
    return apiClient.get('/api/kg/search', {
      params: { label, limit },
    });
  },
};

// ==================== 向量检索 API ====================

export const searchAPI = {
  // 语义搜索
  semantic: async (query, topK = 5, documentId = null) => {
    return apiClient.get('/api/search', {
      params: {
        query,
        top_k: topK,
        document_id: documentId,
      },
    });
  },

  // 混合搜索
  hybrid: async (query, topK = 10, semanticWeight = 0.7) => {
    return apiClient.get('/api/search/hybrid', {
      params: {
        query,
        top_k: topK,
        semantic_weight: semanticWeight,
      },
    });
  },
};

// ==================== RAG 问答 API ====================

export const qaAPI = {
  // 提问
  ask: async (question, documentId = null, topK = 5, useHybrid = true, includeGraph = false) => {
    return apiClient.post('/api/qa/ask', null, {
      params: {
        question,
        document_id: documentId,
        top_k: topK,
        use_hybrid: useHybrid,
        include_graph: includeGraph,
      },
    });
  },

  // 生成摘要
  summarize: async (documentId, maxLength = 500) => {
    return apiClient.post(`/api/qa/summarize/${documentId}`, null, {
      params: { max_length: maxLength },
    });
  },
};

// ==================== 系统 API ====================

export const systemAPI = {
  // 健康检查
  health: async () => {
    return apiClient.get('/health');
  },

  // 获取平台信息
  info: async () => {
    return apiClient.get('/');
  },
};

// ==================== LLM 模型管理 API ====================

export const llmAPI = {
  // 获取所有可用的 LLM 提供商
  getProviders: async () => {
    return apiClient.get('/api/llm/providers');
  },

  // 获取所有支持的提供商（包括未配置的）
  getAllProviders: async () => {
    return apiClient.get('/api/llm/providers/all');
  },

  // 获取当前使用的模型
  getCurrent: async () => {
    return apiClient.get('/api/llm/current');
  },

  // 测试 API Key
  testProvider: async (provider, apiKey, model = null) => {
    return apiClient.post('/api/llm/test', null, {
      params: {
        provider,
        api_key: apiKey,
        model,
      },
    });
  },

  // 配置提供商（添加/更新 API Key）
  configProvider: async (provider, apiKey, model = null, setAsCurrent = true) => {
    return apiClient.post('/api/llm/config', null, {
      params: {
        provider,
        api_key: apiKey,
        model,
        set_as_current: setAsCurrent,
      },
    });
  },

  // 切换 LLM 提供商和模型
  switchProvider: async (provider, model = null) => {
    return apiClient.post('/api/llm/switch', null, {
      params: {
        provider,
        model,
      },
    });
  },
};

export default {
  document: documentAPI,
  kg: knowledgeGraphAPI,
  search: searchAPI,
  qa: qaAPI,
  system: systemAPI,
  llm: llmAPI,
};
