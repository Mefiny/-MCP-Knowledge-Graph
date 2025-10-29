import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Select,
  Button,
  Space,
  message,
  Empty,
  Spin,
  Typography,
  Tag,
  Drawer,
  Descriptions,
  Tooltip as AntTooltip,
  Switch,
} from 'antd';
import {
  ShareAltOutlined,
  ReloadOutlined,
  FullscreenOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import ForceGraph3D from 'react-force-graph-3d';
import { documentAPI, knowledgeGraphAPI } from '../services/api';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const PageContainer = styled.div`
  max-width: 1600px;
  margin: 0 auto;
`;

const ControlPanel = styled(Card)`
  margin-bottom: 16px;
`;

const GraphContainer = styled.div`
  height: 800px;
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 8px;
  background: #000a1e;
  position: relative;
  box-shadow: inset 0 0 30px rgba(0, 212, 255, 0.05);
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 14, 39, 0.9);
  backdrop-filter: blur(10px);
  z-index: 10;
`;

const InfoPanel = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(0, 10, 30, 0.9);
  border: 2px solid #00d4ff;
  border-radius: 8px;
  padding: 12px;
  color: #fff;
  font-size: 12px;
  z-index: 100;
  max-width: 280px;

  .info-title {
    font-size: 14px;
    font-weight: bold;
    color: #00d4ff;
    margin-bottom: 8px;
  }

  .info-item {
    margin: 4px 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const NodeTooltip = styled.div`
  background: rgba(0, 10, 30, 0.95);
  border: 2px solid #00d4ff;
  border-radius: 8px;
  padding: 12px;
  color: #fff;
  font-size: 13px;
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.6);
  pointer-events: none;

  .tooltip-title {
    font-size: 15px;
    font-weight: bold;
    color: #00d4ff;
    margin-bottom: 8px;
  }

  .tooltip-item {
    margin: 4px 0;
  }
`;

// 实体类型颜色映射
const getNodeColor = (type) => {
  const colors = {
    TECH: '#52c41a',      // 绿色 - 技术
    ORG: '#722ed1',       // 紫色 - 组织
    DATE: '#fa8c16',      // 橙色 - 日期
    PERSON: '#eb2f96',    // 粉色 - 人名
    LOCATION: '#13c2c2',  // 青色 - 地点
    NUMBER: '#fadb14',    // 黄色 - 数字
    PRODUCT: '#1890ff',   // 蓝色 - 产品
    MODULE: '#2f54eb',    // 深蓝 - 模块
  };
  return colors[type] || '#00d4ff'; // 默认科技蓝
};

function KnowledgeGraphPage() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [enableParticles, setEnableParticles] = useState(true);
  const fgRef = useRef();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const data = await documentAPI.list();
      setDocuments(data.documents || []);
      if (data.documents && data.documents.length > 0) {
        setSelectedDocId(data.documents[0].document_id);
      }
    } catch (error) {
      message.error('获取文档列表失败');
    }
  };

  const fetchGraph = async () => {
    if (!selectedDocId) {
      message.warning('请选择一个文档');
      return;
    }

    setLoading(true);
    try {
      const data = await knowledgeGraphAPI.getDocumentGraph(selectedDocId);

      // 转换为3D力导向图格式
      const nodes = (data.nodes || []).map((node, index) => ({
        id: node.text || `node_${index}`,
        name: node.text || '未知节点',
        type: node.label || 'UNKNOWN',
        val: 1, // 节点大小
      }));

      const links = (data.edges || []).map((edge, index) => ({
        source: edge.source,
        target: edge.target,
        label: edge.type || 'RELATED',
      }));

      setGraphData({ nodes, links });

      if (nodes.length === 0) {
        message.info('该文档暂无知识图谱数据');
      } else {
        message.success(`加载成功：${nodes.length}个节点，${links.length}条关系`);
      }
    } catch (error) {
      if (error.response?.status === 503) {
        message.error('知识图谱服务未启用');
      } else {
        message.error('获取知识图谱失败');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDocId) {
      fetchGraph();
    }
  }, [selectedDocId]);

  // Cytoscape样式配置 - 科技感增强版
  const cytoscapeStylesheet = [
    {
      selector: 'node',
      style: {
        'background-color': '#00d4ff',
        'background-opacity': 0.9,
        'label': 'data(label)',
        'color': '#fff',
        'text-valign': 'center',
        'text-halign': 'center',
        'font-size': '14px',
        'font-weight': 'bold',
        'font-family': 'Arial, sans-serif',
        'width': 'label',
        'height': 'label',
        'padding': '18px',
        'shape': 'round-rectangle',
        'border-width': 3,
        'border-color': '#00d4ff',
        'border-opacity': 0.8,
        'text-outline-color': '#000',
        'text-outline-width': 2,
        'shadow-blur': 15,
        'shadow-color': '#00d4ff',
        'shadow-opacity': 0.6,
        'shadow-offset-x': 0,
        'shadow-offset-y': 0,
      },
    },
    {
      selector: 'node[type="TECH"]',
      style: {
        'background-color': '#52c41a',
        'border-color': '#52c41a',
        'shadow-color': '#52c41a',
      },
    },
    {
      selector: 'node[type="ORG"]',
      style: {
        'background-color': '#722ed1',
        'border-color': '#722ed1',
        'shadow-color': '#722ed1',
      },
    },
    {
      selector: 'node[type="DATE"]',
      style: {
        'background-color': '#fa8c16',
        'border-color': '#fa8c16',
        'shadow-color': '#fa8c16',
      },
    },
    {
      selector: 'node[type="PERSON"]',
      style: {
        'background-color': '#eb2f96',
        'border-color': '#eb2f96',
        'shadow-color': '#eb2f96',
      },
    },
    {
      selector: 'node[type="LOCATION"]',
      style: {
        'background-color': '#13c2c2',
        'border-color': '#13c2c2',
        'shadow-color': '#13c2c2',
      },
    },
    {
      selector: 'edge',
      style: {
        'width': 2.5,
        'line-color': '#00d4ff',
        'line-opacity': 0.6,
        'target-arrow-color': '#00d4ff',
        'target-arrow-shape': 'triangle',
        'target-arrow-size': 8,
        'curve-style': 'bezier',
        'control-point-step-size': 60,
        'label': 'data(label)',
        'font-size': '11px',
        'font-weight': '600',
        'color': '#00ffff',
        'text-rotation': 'autorotate',
        'text-margin-y': -10,
        'text-background-color': '#0a0e27',
        'text-background-opacity': 0.8,
        'text-background-padding': '4px',
        'text-background-shape': 'roundrectangle',
        'text-border-width': 1,
        'text-border-color': '#00d4ff',
        'text-border-opacity': 0.5,
      },
    },
    {
      selector: 'edge:selected',
      style: {
        'width': 4,
        'line-color': '#ff4d4f',
        'target-arrow-color': '#ff4d4f',
        'line-opacity': 1,
      },
    },
    {
      selector: 'node:selected',
      style: {
        'background-color': '#ff4d4f',
        'border-color': '#ff4d4f',
        'border-width': 4,
        'shadow-color': '#ff4d4f',
        'shadow-blur': 25,
        'shadow-opacity': 0.9,
      },
    },
    {
      selector: 'node:hover',
      style: {
        'border-width': 4,
        'shadow-blur': 20,
        'shadow-opacity': 0.8,
      },
    },
    {
      selector: '.highlighted',
      style: {
        'background-color': '#fa8c16',
        'border-color': '#fa8c16',
        'border-width': 5,
        'shadow-color': '#fa8c16',
        'shadow-blur': 30,
        'shadow-opacity': 1,
        'z-index': 999,
      },
    },
    {
      selector: '.neighbor',
      style: {
        'opacity': 1,
        'border-width': 3,
        'border-color': '#52c41a',
      },
    },
    {
      selector: 'edge.neighbor',
      style: {
        'width': 3,
        'line-color': '#52c41a',
        'target-arrow-color': '#52c41a',
        'opacity': 1,
      },
    },
  ];

  // 布局配置 - 增强的网状分散效果
  const layout = {
    name: 'cose',
    animate: true,
    animationDuration: 1000,
    animationEasing: 'ease-out',
    nodeRepulsion: 12000, // 增加节点斥力，更分散
    nodeOverlap: 100,
    idealEdgeLength: 180, // 增加理想边长
    edgeElasticity: 120,
    nestingFactor: 1.2,
    gravity: 0.4, // 降低重力，避免中心聚集
    numIter: 2500, // 增加迭代次数，布局更稳定
    initialTemp: 250,
    coolingFactor: 0.95,
    minTemp: 1.0,
    randomize: true,
    fit: true,
    padding: 60,
  };

  // 工具栏功能
  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.2);
      cyRef.current.center();
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 0.8);
      cyRef.current.center();
    }
  };

  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.fit(null, 50);
    }
  };

  const handleClearHighlight = () => {
    if (cyRef.current) {
      cyRef.current.elements().removeClass('highlighted neighbor');
      setHoverTooltip(null);
    }
  };

  // 单击节点 - 显示详情抽屉
  const handleNodeClick = (event) => {
    const node = event.target;
    setSelectedNode({
      id: node.data('id'),
      label: node.data('label'),
      type: node.data('type'),
    });
    setDrawerVisible(true);
  };

  // 双击节点 - 展开邻居并高亮
  const handleNodeDblClick = (event) => {
    const node = event.target;
    const cy = cyRef.current;

    if (!cy) return;

    // 清除之前的高亮
    cy.elements().removeClass('highlighted neighbor');

    // 高亮当前节点
    node.addClass('highlighted');

    // 高亮邻居节点和边
    const neighborhood = node.neighborhood();
    neighborhood.addClass('neighbor');

    // 聚焦到这个子图
    cy.animate({
      fit: {
        eles: node.union(neighborhood),
        padding: 100,
      },
      duration: 500,
      easing: 'ease-out',
    });

    message.success(`已展开 ${node.data('label')} 的邻居节点`);
  };

  // 悬停节点 - 显示提示框
  const handleNodeMouseOver = (event) => {
    const node = event.target;
    const renderedPos = node.renderedPosition();

    // 获取邻居数量
    const neighbors = node.neighborhood().nodes();

    setHoverTooltip({
      x: renderedPos.x,
      y: renderedPos.y,
      data: {
        label: node.data('label'),
        type: node.data('type'),
        id: node.data('id'),
        neighbors: neighbors.length,
      },
    });
  };

  const handleNodeMouseOut = () => {
    setHoverTooltip(null);
  };

  return (
    <PageContainer>
      <Title level={2}>
        <ShareAltOutlined /> 知识图谱可视化
      </Title>
      <Paragraph>
        单击查看详情 | 双击展开邻居 | 悬停显示信息 | 拖拽调整位置
      </Paragraph>

      <ControlPanel>
        <Space>
          <Text>选择文档：</Text>
          <Select
            style={{ width: 300 }}
            value={selectedDocId}
            onChange={setSelectedDocId}
            placeholder="请选择文档"
          >
            {documents.map((doc) => (
              <Option key={doc.document_id} value={doc.document_id}>
                {doc.file_name} ({doc.entities_count} 个实体)
              </Option>
            ))}
          </Select>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={fetchGraph}
            loading={loading}
          >
            刷新图谱
          </Button>
        </Space>
      </ControlPanel>

      <Card>
        <GraphContainer>
          {/* 工具栏 */}
          <ToolBar>
            <AntTooltip title="放大">
              <ToolButton icon={<ZoomInOutlined />} onClick={handleZoomIn} />
            </AntTooltip>
            <AntTooltip title="缩小">
              <ToolButton icon={<ZoomOutOutlined />} onClick={handleZoomOut} />
            </AntTooltip>
            <AntTooltip title="适应画布">
              <ToolButton icon={<FullscreenOutlined />} onClick={handleFit} />
            </AntTooltip>
            <AntTooltip title="清除高亮">
              <ToolButton icon={<ClearOutlined />} onClick={handleClearHighlight} />
            </AntTooltip>
          </ToolBar>

          {/* 悬停提示框 */}
          {hoverTooltip && (
            <HoverTooltip
              style={{
                left: `${hoverTooltip.x + 10}px`,
                top: `${hoverTooltip.y + 10}px`,
              }}
            >
              <div className="tooltip-title">{hoverTooltip.data.label}</div>
              <div className="tooltip-item">类型: {hoverTooltip.data.type}</div>
              <div className="tooltip-item">连接: {hoverTooltip.data.neighbors} 个节点</div>
              <div className="tooltip-item" style={{ fontSize: '10px', color: '#aaa', marginTop: '8px' }}>
                💡 双击展开邻居
              </div>
            </HoverTooltip>
          )}

          {loading && (
            <LoadingOverlay>
              <Spin size="large" tip="加载中..." />
            </LoadingOverlay>
          )}

          {graphData.nodes.length === 0 && !loading ? (
            <Empty
              description="暂无图谱数据"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ) : (
            <CytoscapeComponent
              elements={[...graphData.nodes, ...graphData.edges]}
              style={{ width: '100%', height: '100%' }}
              stylesheet={cytoscapeStylesheet}
              layout={layout}
              cy={(cy) => {
                cyRef.current = cy;
                // 单击节点 - 查看详情
                cy.on('tap', 'node', handleNodeClick);
                // 双击节点 - 展开邻居
                cy.on('dbltap', 'node', handleNodeDblClick);
                // 悬停节点 - 显示提示
                cy.on('mouseover', 'node', handleNodeMouseOver);
                cy.on('mouseout', 'node', handleNodeMouseOut);
              }}
              minZoom={0.3}
              maxZoom={3}
              wheelSensitivity={0.2}
            />
          )}
        </GraphContainer>

        <div style={{ marginTop: 16 }}>
          <Space>
            <Tag color="blue">节点: {graphData.nodes.length}</Tag>
            <Tag color="green">关系: {graphData.edges.length}</Tag>
          </Space>
        </div>
      </Card>

      {/* 节点详情抽屉 */}
      <Drawer
        title="节点详情"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={400}
      >
        {selectedNode && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="节点ID">
              {selectedNode.id}
            </Descriptions.Item>
            <Descriptions.Item label="节点名称">
              {selectedNode.label}
            </Descriptions.Item>
            <Descriptions.Item label="节点类型">
              <Tag color={
                selectedNode.type === 'TECH' ? 'green' :
                selectedNode.type === 'ORG' ? 'purple' :
                selectedNode.type === 'DATE' ? 'orange' : 'blue'
              }>
                {selectedNode.type}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </PageContainer>
  );
}

export default KnowledgeGraphPage;
