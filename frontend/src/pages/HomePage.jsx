import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Space, Divider } from 'antd';
import {
  FileTextOutlined,
  ShareAltOutlined,
  DatabaseOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import { systemAPI, knowledgeGraphAPI } from '../services/api';

const { Title, Paragraph } = Typography;

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const WelcomeCard = styled(Card)`
  margin-bottom: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;

  .ant-card-body {
    padding: 48px;
  }

  h1, p {
    color: white !important;
  }
`;

const FeatureCard = styled(Card)`
  height: 100%;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

function HomePage() {
  const [stats, setStats] = useState({
    features: {},
    kgStats: { nodes: 0, relationships: 0 },
  });

  useEffect(() => {
    // 获取系统信息
    Promise.all([
      systemAPI.info(),
      knowledgeGraphAPI.getStats().catch(() => ({ nodes: 0, relationships: 0 })),
    ]).then(([info, kgStats]) => {
      setStats({
        features: info.features || {},
        kgStats,
      });
    });
  }, []);

  const features = [
    {
      icon: <FileTextOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
      title: '智能文档解析',
      description: '支持PDF、Word等多种格式，自动提取文本、表格和元数据。',
      available: true,
    },
    {
      icon: <ShareAltOutlined style={{ fontSize: 48, color: '#52c41a' }} />,
      title: '知识图谱构建',
      description: '自动识别实体和关系，构建可视化知识网络。',
      available: stats.features.knowledge_graph,
    },
    {
      icon: <DatabaseOutlined style={{ fontSize: 48, color: '#722ed1' }} />,
      title: '向量语义检索',
      description: '基于深度学习的语义搜索，理解查询意图。',
      available: stats.features.vector_search,
    },
    {
      icon: <RobotOutlined style={{ fontSize: 48, color: '#fa8c16' }} />,
      title: 'AI智能问答',
      description: '结合知识图谱和大语言模型，提供精准答案。',
      available: stats.features.rag_qa,
    },
  ];

  return (
    <PageContainer>
      <WelcomeCard>
        <Title level={1}>欢迎使用 MCP Platform</Title>
        <Paragraph style={{ fontSize: 16, marginTop: 16 }}>
          数字图书管理员式知识图谱平台 - 让知识更有价值
        </Paragraph>
        <Paragraph style={{ fontSize: 14, opacity: 0.9 }}>
          上传文档 → 智能解析 → 知识抽取 → 图谱构建 → 语义检索 → AI问答
        </Paragraph>
      </WelcomeCard>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="知识图谱节点"
              value={stats.kgStats.nodes || 0}
              prefix={<ShareAltOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="知识图谱关系"
              value={stats.kgStats.relationships || 0}
              prefix={<ShareAltOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="文档解析"
              value={stats.features.file_parsing ? '可用' : '不可用'}
              valueStyle={{
                color: stats.features.file_parsing ? '#52c41a' : '#f5222d',
                fontSize: 20,
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="AI问答"
              value={stats.features.rag_qa ? '可用' : '不可用'}
              valueStyle={{
                color: stats.features.rag_qa ? '#52c41a' : '#f5222d',
                fontSize: 20,
              }}
            />
          </Card>
        </Col>
      </Row>

      <Divider orientation="left">核心功能</Divider>

      <Row gutter={[24, 24]}>
        {features.map((feature, index) => (
          <Col xs={24} sm={12} md={6} key={index}>
            <FeatureCard>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div style={{ textAlign: 'center' }}>{feature.icon}</div>
                <Title level={4} style={{ textAlign: 'center', marginBottom: 8 }}>
                  {feature.title}
                </Title>
                <Paragraph style={{ textAlign: 'center', marginBottom: 0 }}>
                  {feature.description}
                </Paragraph>
                <div style={{ textAlign: 'center', color: feature.available ? '#52c41a' : '#999' }}>
                  {feature.available ? '✓ 已启用' : '✗ 未启用'}
                </div>
              </Space>
            </FeatureCard>
          </Col>
        ))}
      </Row>

      <Card style={{ marginTop: 24 }}>
        <Title level={3}>快速开始</Title>
        <ol>
          <li>点击"文档管理"上传PDF或Word文档</li>
          <li>系统自动解析、提取实体和关系</li>
          <li>在"知识图谱"中查看可视化网络</li>
          <li>使用"语义搜索"查找相关内容</li>
          <li>在"AI问答"中提出问题，获得智能答案</li>
        </ol>
      </Card>
    </PageContainer>
  );
}

export default HomePage;
