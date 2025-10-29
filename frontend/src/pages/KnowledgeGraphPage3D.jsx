import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Switch,
  Slider,
  Tooltip,
} from 'antd';
import {
  ShareAltOutlined,
  ReloadOutlined,
  FullscreenOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  EyeOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
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
  height: 700px;
  width: 100%;
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 8px;
  background: #000a1e;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 0 50px rgba(0, 212, 255, 0.1);
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
  background: rgba(10, 14, 39, 0.95);
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
  max-width: 250px;
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.4);
  transition: all 0.3s ease;

  .info-title {
    font-size: 14px;
    font-weight: bold;
    color: #00d4ff;
    margin-bottom: 8px;
    text-shadow: 0 0 10px rgba(0, 212, 255, 0.8);
  }

  .info-item {
    margin: 4px 0;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .info-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, #00d4ff, transparent);
    margin: 8px 0;
  }
`;

const ControlButtons = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 100;
`;

const ControlButton = styled.div`
  width: 40px;
  height: 40px;
  background: rgba(0, 10, 30, 0.9);
  border: 1px solid #00d4ff;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #00d4ff;
  transition: all 0.3s ease;
  font-size: 16px;

  &:hover {
    background: rgba(0, 212, 255, 0.2);
    box-shadow: 0 0 15px rgba(0, 212, 255, 0.5);
  }
`;

const SettingsPanel = styled.div`
  position: absolute;
  top: 70px;
  right: 16px;
  background: rgba(0, 10, 30, 0.95);
  border: 1px solid #00d4ff;
  border-radius: 8px;
  padding: 16px;
  color: #fff;
  min-width: 200px;
  z-index: 100;
  display: ${props => props.visible ? 'block' : 'none'};
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.4);

  .setting-item {
    margin-bottom: 12px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }

  .setting-label {
    font-size: 12px;
    color: #00d4ff;
    margin-bottom: 6px;
    display: block;
  }
`;

// 实体类型颜色映射 - 优化颜色对比度
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

function KnowledgeGraphPage3D() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [hoverNode, setHoverNode] = useState(null);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // 性能优化设置
  const [performanceSettings, setPerformanceSettings] = useState({
    enableParticles: true,
    showLabels: true,
    nodeSize: 2.5, // 减小默认节点大小
    linkWidth: 1.5, // 减小默认连线宽度
    particleSpeed: 0.005,
    enablePhysics: true,
    renderQuality: 'high', // high, medium, low
  });

  const fgRef = useRef();
  const animationRef = useRef();
  const nodeObjectsCache = useRef(new Map());

  useEffect(() => {
    fetchDocuments();
    return () => {
      // 清理动画
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
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

  const fetchGraph = useCallback(async () => {
    if (!selectedDocId) {
      message.warning('请选择一个文档');
      return;
    }

    setLoading(true);
    try {
      const data = await knowledgeGraphAPI.getDocumentGraph(selectedDocId);

      // 转换为3D力导向图格式，添加性能优化
      const nodes = (data.nodes || []).map((node, index) => ({
        id: node.text || `node_${index}`,
        name: node.text || '未知节点',
        type: node.label || 'UNKNOWN',
        val: Math.random() * 4 + 1, // 随机大小增加视觉层次
        x: (Math.random() - 0.5) * 200, // 初始分散位置
        y: (Math.random() - 0.5) * 200,
        z: (Math.random() - 0.5) * 200,
      }));

      const links = (data.edges || []).map((edge) => ({
        source: edge.source,
        target: edge.target,
        label: edge.type || 'RELATED',
        value: Math.random() * 5 + 1, // 链接权重
      }));

      // 清除缓存
      nodeObjectsCache.current.clear();

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
  }, [selectedDocId]);

  useEffect(() => {
    if (selectedDocId) {
      fetchGraph();
    }
  }, [selectedDocId, fetchGraph]);

  // 优化的节点点击事件
  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
    setDrawerVisible(true);

    // 聚焦到节点
    if (fgRef.current && node) {
      fgRef.current.cameraPosition(
        { x: node.x + 50, y: node.y + 50, z: node.z + 50 },
        node,
        1000
      );
    }
  }, []);

  // 优化的悬浮事件
  const handleNodeHover = useCallback((node) => {
    setHoverNode(node);
    if (fgRef.current) {
      document.body.style.cursor = node ? 'pointer' : 'default';
    }
  }, []);

  // 适应视图
  const handleFitToCanvas = useCallback(() => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400);
    }
  }, []);

  // 缩放控制
  const handleZoomIn = useCallback(() => {
    if (fgRef.current) {
      const { x, y, z } = fgRef.current.cameraPosition();
      fgRef.current.cameraPosition({ x: x * 0.8, y: y * 0.8, z: z * 0.8 }, null, 300);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (fgRef.current) {
      const { x, y, z } = fgRef.current.cameraPosition();
      fgRef.current.cameraPosition({ x: x * 1.2, y: y * 1.2, z: z * 1.2 }, null, 300);
    }
  }, []);

  // 优化的节点3D对象创建 - 使用缓存和LOD
  const createNodeObject = useCallback((node) => {
    const cacheKey = `${node.type}-${performanceSettings.renderQuality}-${performanceSettings.nodeSize}`;

    if (nodeObjectsCache.current.has(cacheKey)) {
      const cachedGroup = nodeObjectsCache.current.get(cacheKey);
      return cachedGroup.clone();
    }

    const group = new THREE.Group();
    const color = getNodeColor(node.type);
    const baseSize = performanceSettings.nodeSize * 0.8; // 基础球体更小
    const size = baseSize * Math.sqrt(node.val || 1); // 使用平方根让大小变化更平缓

    // 根据渲染质量调整细节
    const segments = performanceSettings.renderQuality === 'high' ? 32 :
                    performanceSettings.renderQuality === 'medium' ? 16 : 8;

    // 1. 核心球体 - 更小更精致
    const sphereGeometry = new THREE.SphereGeometry(size, segments, segments);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.3,
      shininess: 80,
      transparent: true,
      opacity: 0.9,
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    group.add(sphere);

    // 2. 外环光圈（仅高质量模式）- 更细的光圈
    if (performanceSettings.renderQuality === 'high') {
      const ringGeometry = new THREE.RingGeometry(size + 0.5, size + 1, segments);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
    }

    // 3. 文字标签（可选）- 更大更清晰
    if (performanceSettings.showLabels && node.name) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      // 增大字体和画布，提高清晰度
      const fontSize = performanceSettings.renderQuality === 'high' ? 48 : 36;
      const scale = 2; // 高分辨率

      context.font = `bold ${fontSize * scale}px Arial, Microsoft YaHei, sans-serif`;
      const text = node.name.length > 15 ? node.name.substring(0, 15) + '...' : node.name;
      const metrics = context.measureText(text);
      const textWidth = metrics.width;

      canvas.width = (textWidth + 32 * scale);
      canvas.height = (fontSize + 16) * scale;

      // 背景 - 更深的背景提高对比度
      context.fillStyle = 'rgba(0, 5, 15, 0.95)';
      context.beginPath();
      context.roundRect(0, 0, canvas.width, canvas.height, 12 * scale);
      context.fill();

      // 边框 - 更明显的边框
      context.strokeStyle = color;
      context.lineWidth = 3 * scale;
      context.beginPath();
      context.roundRect(0, 0, canvas.width, canvas.height, 12 * scale);
      context.stroke();

      // 发光效果
      context.shadowColor = color;
      context.shadowBlur = 10 * scale;

      // 文字 - 加粗且更大
      context.font = `bold ${fontSize * scale}px Arial, Microsoft YaHei, sans-serif`;
      context.fillStyle = '#ffffff';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        depthTest: true,
      });

      const sprite = new THREE.Sprite(spriteMaterial);
      // 调整标签大小和位置 - 更大更清晰
      const spriteScale = (textWidth / scale) / 8;
      sprite.scale.set(spriteScale, spriteScale / 3, 1);
      sprite.position.y = size + 6; // 贴近球体
      group.add(sprite);
    }

    // 缓存对象
    nodeObjectsCache.current.set(cacheKey, group);
    return group.clone();
  }, [performanceSettings]);

  // 性能设置更新处理
  const handleSettingChange = useCallback((key, value) => {
    setPerformanceSettings(prev => ({
      ...prev,
      [key]: value
    }));

    // 清除缓存以应用新设置
    nodeObjectsCache.current.clear();
  }, []);

  // 内存化图数据处理
  const processedGraphData = useMemo(() => {
    if (graphData.nodes.length === 0) return graphData;

    // 根据性能设置过滤或简化数据
    let { nodes, links } = graphData;

    if (performanceSettings.renderQuality === 'low' && nodes.length > 100) {
      // 低质量模式：限制节点数量
      nodes = nodes.slice(0, 100);
      links = links.filter(link =>
        nodes.some(n => n.id === link.source) &&
        nodes.some(n => n.id === link.target)
      );
    }

    return { nodes, links };
  }, [graphData, performanceSettings.renderQuality]);

  return (
    <PageContainer>
      <Title level={2}>
        <ShareAltOutlined /> 3D 知识图谱可视化
      </Title>
      <Paragraph>
        🚀 高性能三维网状展示 | 🎮 智能交互控制 | 🔧 可调节渲染质量
      </Paragraph>

      <ControlPanel>
        <Space size="large" wrap>
          <Space>
            <Text strong>选择文档：</Text>
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
          </Space>

          <Space>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchGraph}
              loading={loading}
            >
              刷新图谱
            </Button>
            <Button
              icon={<FullscreenOutlined />}
              onClick={handleFitToCanvas}
            >
              适应视图
            </Button>
          </Space>

          <Space>
            <Text>渲染质量：</Text>
            <Select
              value={performanceSettings.renderQuality}
              onChange={(value) => handleSettingChange('renderQuality', value)}
              style={{ width: 100 }}
            >
              <Option value="high">高</Option>
              <Option value="medium">中</Option>
              <Option value="low">低</Option>
            </Select>
          </Space>
        </Space>
      </ControlPanel>

      <Card>
        <GraphContainer>
          {/* 信息面板 */}
          <InfoPanel>
            <div className="info-title">📊 图谱信息</div>
            <div className="info-divider"></div>
            <div className="info-item">
              <span>🔵 节点数量:</span>
              <Tag color="blue">{processedGraphData.nodes.length}</Tag>
            </div>
            <div className="info-item">
              <span>🔗 关系数量:</span>
              <Tag color="green">{processedGraphData.links.length}</Tag>
            </div>
            <div className="info-item">
              <span>🎨 渲染质量:</span>
              <Tag color="orange">{performanceSettings.renderQuality}</Tag>
            </div>
            {hoverNode && (
              <>
                <div className="info-divider"></div>
                <div className="info-item">
                  <span>🎯 当前节点:</span>
                </div>
                <div className="info-item" style={{
                  paddingLeft: '4px',
                  color: getNodeColor(hoverNode.type),
                  fontWeight: 'bold',
                  wordBreak: 'break-all',
                  whiteSpace: 'normal',
                  lineHeight: '1.4'
                }}>
                  {hoverNode.name.length > 30 ? hoverNode.name.substring(0, 30) + '...' : hoverNode.name}
                </div>
                <div className="info-item">
                  <span style={{ fontSize: '10px', color: '#aaa' }}>
                    类型: {hoverNode.type}
                  </span>
                </div>
              </>
            )}
          </InfoPanel>

          {/* 控制按钮 */}
          <ControlButtons>
            <Tooltip title="设置" placement="left">
              <ControlButton onClick={() => setSettingsVisible(!settingsVisible)}>
                <SettingOutlined />
              </ControlButton>
            </Tooltip>
            <Tooltip title="放大" placement="left">
              <ControlButton onClick={handleZoomIn}>
                <ZoomInOutlined />
              </ControlButton>
            </Tooltip>
            <Tooltip title="缩小" placement="left">
              <ControlButton onClick={handleZoomOut}>
                <ZoomOutOutlined />
              </ControlButton>
            </Tooltip>
            <Tooltip title="适应视图" placement="left">
              <ControlButton onClick={handleFitToCanvas}>
                <EyeOutlined />
              </ControlButton>
            </Tooltip>
          </ControlButtons>

          {/* 设置面板 */}
          <SettingsPanel visible={settingsVisible}>
            <div className="setting-item">
              <span className="setting-label">粒子效果</span>
              <Switch
                checked={performanceSettings.enableParticles}
                onChange={(checked) => handleSettingChange('enableParticles', checked)}
                size="small"
              />
            </div>
            <div className="setting-item">
              <span className="setting-label">显示标签</span>
              <Switch
                checked={performanceSettings.showLabels}
                onChange={(checked) => handleSettingChange('showLabels', checked)}
                size="small"
              />
            </div>
            <div className="setting-item">
              <span className="setting-label">节点大小: {performanceSettings.nodeSize}</span>
              <Slider
                min={1}
                max={8}
                step={0.5}
                value={performanceSettings.nodeSize}
                onChange={(value) => handleSettingChange('nodeSize', value)}
                style={{ marginTop: 4 }}
              />
            </div>
            <div className="setting-item">
              <span className="setting-label">连线宽度: {performanceSettings.linkWidth}</span>
              <Slider
                min={0.5}
                max={4}
                step={0.5}
                value={performanceSettings.linkWidth}
                onChange={(value) => handleSettingChange('linkWidth', value)}
                style={{ marginTop: 4 }}
              />
            </div>
          </SettingsPanel>

          {loading && (
            <LoadingOverlay>
              <Spin size="large" tip="正在加载3D图谱..." />
            </LoadingOverlay>
          )}

          {processedGraphData.nodes.length === 0 && !loading ? (
            <Empty
              description="暂无图谱数据"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#fff',
              }}
            />
          ) : (
            <ForceGraph3D
              ref={fgRef}
              graphData={processedGraphData}
              nodeLabel="name"
              nodeAutoColorBy="type"
              nodeColor={(node) => getNodeColor(node.type)}
              nodeRelSize={performanceSettings.nodeSize}
              nodeThreeObject={performanceSettings.showLabels ? createNodeObject : undefined}
              linkWidth={performanceSettings.linkWidth}
              linkColor={() => 'rgba(0, 212, 255, 0.4)'}
              linkDirectionalParticles={performanceSettings.enableParticles ? 2 : 0}
              linkDirectionalParticleWidth={2}
              linkDirectionalParticleSpeed={performanceSettings.particleSpeed}
              linkDirectionalParticleColor={() => '#00d4ff'}
              onNodeClick={handleNodeClick}
              onNodeHover={handleNodeHover}
              backgroundColor="#000a1e"
              showNavInfo={false}
              enableNodeDrag={true}
              enableNavigationControls={true}
              controlType="orbit"
              warmupTicks={60}
              cooldownTicks={100}
              d3AlphaDecay={0.02}
              d3VelocityDecay={0.3}
            />
          )}
        </GraphContainer>

        <div style={{ marginTop: 16, textAlign: 'center', color: '#aaa', fontSize: '12px' }}>
          🎮 交互提示：拖拽旋转 | 滚轮缩放 | 单击查看详情 | 右侧控制面板调节设置
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
            <Descriptions.Item label="节点名称">
              {selectedNode.name}
            </Descriptions.Item>
            <Descriptions.Item label="节点ID">
              {selectedNode.id}
            </Descriptions.Item>
            <Descriptions.Item label="节点类型">
              <Tag color={getNodeColorTag(selectedNode.type)}>
                {selectedNode.type}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="节点权重">
              {selectedNode.val?.toFixed(2) || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="坐标位置">
              X: {selectedNode.x?.toFixed(1)}, Y: {selectedNode.y?.toFixed(1)}, Z: {selectedNode.z?.toFixed(1)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </PageContainer>
  );
}

// Tag颜色映射
function getNodeColorTag(type) {
  const colors = {
    TECH: 'green',
    ORG: 'purple',
    DATE: 'orange',
    PERSON: 'magenta',
    LOCATION: 'cyan',
    NUMBER: 'gold',
    PRODUCT: 'blue',
    MODULE: 'geekblue',
  };
  return colors[type] || 'blue';
}

export default KnowledgeGraphPage3D;