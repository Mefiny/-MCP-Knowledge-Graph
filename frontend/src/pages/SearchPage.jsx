import React, { useState } from 'react';
import {
  Card,
  Input,
  Button,
  List,
  Tag,
  Space,
  Typography,
  Empty,
  Spin,
  Radio,
  Slider,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { searchAPI } from '../services/api';

const { Title, Paragraph, Text } = Typography;
const { Search } = Input;

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const SearchCard = styled(Card)`
  margin-bottom: 24px;
`;

const ResultItem = styled(List.Item)`
  padding: 16px !important;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: #f5f5f5;
  }
`;

const ScoreTag = styled(Tag)`
  font-size: 14px;
  padding: 4px 12px;
`;

const WhiteMarksSlider = styled(Slider)`
  .ant-slider-mark-text {
    color: white !important;
  }
`;

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState('hybrid'); // 'semantic' or 'hybrid'
  const [topK, setTopK] = useState(10);
  const [semanticWeight, setSemanticWeight] = useState(0.7);

  const handleSearch = async () => {
    if (!query.trim()) {
      return;
    }

    setLoading(true);
    try {
      let data;
      if (searchType === 'semantic') {
        data = await searchAPI.semantic(query, topK);
      } else {
        data = await searchAPI.hybrid(query, topK, semanticWeight);
      }

      setResults(data.results || []);
    } catch (error) {
      if (error.response?.status === 503) {
        message.error('向量检索服务未启用');
      } else {
        message.error('搜索失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'green';
    if (score >= 0.6) return 'blue';
    if (score >= 0.4) return 'orange';
    return 'red';
  };

  return (
    <PageContainer>
      <Title level={2}>
        <SearchOutlined /> 语义搜索
      </Title>
      <Paragraph>
        基于深度学习的语义搜索，理解查询意图，找到相关文档片段。
      </Paragraph>

      <SearchCard>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Search
            placeholder="输入搜索关键词或问题..."
            enterButton="搜索"
            size="large"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onSearch={handleSearch}
            loading={loading}
          />

          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>搜索模式：</Text>
            <Radio.Group value={searchType} onChange={(e) => setSearchType(e.target.value)}>
              <Radio.Button value="semantic">纯语义搜索</Radio.Button>
              <Radio.Button value="hybrid">混合搜索</Radio.Button>
            </Radio.Group>
          </Space>

          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>返回数量：{topK}</Text>
            <WhiteMarksSlider
              min={1}
              max={20}
              value={topK}
              onChange={setTopK}
              marks={{ 1: '1', 5: '5', 10: '10', 15: '15', 20: '20' }}
            />
          </Space>

          {searchType === 'hybrid' && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>语义权重：{semanticWeight.toFixed(2)}</Text>
              <WhiteMarksSlider
                min={0}
                max={1}
                step={0.1}
                value={semanticWeight}
                onChange={setSemanticWeight}
                marks={{ 0: '关键词', 0.5: '平衡', 1: '语义' }}
              />
            </Space>
          )}
        </Space>
      </SearchCard>

      <Card title={`搜索结果 (${results.length})`}>
        <Spin spinning={loading}>
          {results.length === 0 && !loading ? (
            <Empty description="暂无搜索结果" />
          ) : (
            <List
              dataSource={results}
              renderItem={(item, index) => (
                <ResultItem>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>#{index + 1}</Text>
                        <ScoreTag color={getScoreColor(item.score || item.combined_score)}>
                          相似度: {((item.score || item.combined_score) * 100).toFixed(1)}%
                        </ScoreTag>
                        {item.combined_score && (
                          <Tag>
                            语义: {(item.score * 100).toFixed(0)}% |
                            关键词: {(item.keyword_score * 100).toFixed(0)}%
                          </Tag>
                        )}
                      </Space>
                    }
                    description={
                      <div>
                        <Paragraph
                          ellipsis={{ rows: 3, expandable: true, symbol: '展开' }}
                          style={{ marginTop: 8, marginBottom: 8 }}
                        >
                          {item.text}
                        </Paragraph>
                        {item.metadata && (
                          <Space size="small">
                            <Tag color="blue">
                              文档: {item.metadata.document_id?.substring(0, 8)}
                            </Tag>
                            <Tag>
                              块ID: {item.metadata.chunk_id}
                            </Tag>
                          </Space>
                        )}
                      </div>
                    }
                  />
                </ResultItem>
              )}
            />
          )}
        </Spin>
      </Card>
    </PageContainer>
  );
}

export default SearchPage;