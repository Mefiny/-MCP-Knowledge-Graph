import React, { useState, useEffect } from 'react';
import {
  Card,
  Select,
  Button,
  Space,
  Typography,
  Divider,
  Alert,
  Spin,
  Tag,
  message,
  Input,
  Collapse,
} from 'antd';
import {
  ThunderboltOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  ApiOutlined,
  ExperimentOutlined,
  SaveOutlined,
  LoadingOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import { llmAPI } from '../services/api';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const StyledCard = styled(Card)`
  margin-bottom: 24px;

  .ant-card-head {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

    .ant-card-head-title {
      color: white;
      font-weight: 600;
    }
  }
`;

const ProviderCard = styled.div`
  padding: 24px;
  border: 2px solid ${props => props.configured ? 'rgba(82, 196, 26, 0.5)' : 'rgba(0, 212, 255, 0.3)'};
  border-radius: 12px;
  margin-bottom: 20px;
  background: ${props => props.configured ? 'rgba(82, 196, 26, 0.08)' : 'rgba(10, 14, 39, 0.6)'};
  backdrop-filter: blur(10px);
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 212, 255, 0.2);
    border-color: ${props => props.configured ? 'rgba(82, 196, 26, 0.7)' : 'rgba(0, 212, 255, 0.5)'};
  }
`;

const ProviderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ProviderName = styled.div`
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #00d4ff;
`;

const ConfigSection = styled.div`
  background: rgba(0, 21, 41, 0.4);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid rgba(0, 212, 255, 0.2);
`;

const FormRow = styled.div`
  margin-bottom: 16px;

  .label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.85);
  }
`;

const InfoSection = styled.div`
  background: rgba(0, 21, 41, 0.4);
  padding: 16px;
  border-radius: 6px;
  margin-top: 16px;
  border: 1px solid rgba(0, 212, 255, 0.2);

  .info-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid rgba(0, 212, 255, 0.15);

    &:last-child {
      border-bottom: none;
    }

    .label {
      color: rgba(255, 255, 255, 0.65);
      font-weight: 500;
    }

    .value {
      color: rgba(255, 255, 255, 0.95);
      font-weight: 600;
    }
  }
`;

const GuideCard = styled(Card)`
  margin-top: 24px;

  .guide-section {
    margin-bottom: 20px;

    h4 {
      color: #00d4ff;
      margin-bottom: 12px;
    }

    .guide-steps {
      padding-left: 20px;

      li {
        margin-bottom: 8px;
        line-height: 1.6;
        color: rgba(255, 255, 255, 0.85);
      }
    }

    .code-block {
      background: rgba(0, 21, 41, 0.5);
      border: 1px solid rgba(0, 212, 255, 0.2);
      padding: 12px;
      border-radius: 4px;
      font-family: monospace;
      margin-top: 8px;
      overflow-x: auto;
    }
  }
`;

// 提供商配置信息
const PROVIDER_INFO = {
  qwen: {
    name: '千问 (通义千问)',
    icon: '',
    description: '阿里云通义千问 - 国内访问快速，性价比高',
    guideUrl: 'https://dashscope.aliyun.com/',
    steps: [
      '访问阿里云 DashScope 控制台',
      '注册/登录阿里云账号',
      '进入 API Key 管理页面',
      '创建新的 API Key',
      '复制 API Key 并粘贴到下方输入框'
    ]
  },
  openai: {
    name: 'OpenAI (ChatGPT)',
    icon: '',
    description: 'OpenAI GPT 系列 - 功能最强大，需要国际网络',
    guideUrl: 'https://platform.openai.com/',
    steps: [
      '访问 OpenAI Platform',
      '注册账号并添加支付方式',
      '进入 API Keys 页面',
      '创建新的 API Key',
      '复制 API Key 并粘贴到下方输入框'
    ]
  },
  deepseek: {
    name: 'DeepSeek',
    icon: '',
    description: 'DeepSeek - 国产高性能模型',
    guideUrl: 'https://www.deepseek.com/',
    steps: [
      '访问 DeepSeek 官网',
      '注册账号',
      '进入 API 管理页面',
      '获取 API Key',
      '复制 API Key 并粘贴到下方输入框'
    ]
  }
};

function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState([]);
  const [currentProvider, setCurrentProvider] = useState(null);

  // 每个提供商的状态
  const [providerStates, setProviderStates] = useState({});

  // 加载提供商列表
  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await llmAPI.getAllProviders();
      setProviders(data.providers || []);

      // 获取当前配置
      const current = await llmAPI.getCurrent();
      setCurrentProvider(current);

      // 初始化每个提供商的状态
      const states = {};
      data.providers.forEach(provider => {
        states[provider.id] = {
          apiKey: '',
          model: provider.models[0],
          testing: false,
          saving: false,
          testResult: null
        };
      });
      setProviderStates(states);

    } catch (error) {
      message.error('加载配置失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  // 更新提供商状态
  const updateProviderState = (providerId, updates) => {
    setProviderStates(prev => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        ...updates
      }
    }));
  };

  // 测试连接
  const handleTest = async (providerId) => {
    const state = providerStates[providerId];

    if (!state.apiKey) {
      message.warning('请输入 API Key');
      return;
    }

    updateProviderState(providerId, { testing: true, testResult: null });

    try {
      const result = await llmAPI.testProvider(providerId, state.apiKey, state.model);

      updateProviderState(providerId, {
        testing: false,
        testResult: { success: true, message: result.message }
      });

      message.success('✅' + result.message);
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message || '连接失败';

      updateProviderState(providerId, {
        testing: false,
        testResult: { success: false, message: errorMsg }
      });

      message.error('❌' + errorMsg);
    }
  };

  // 保存配置
  const handleSave = async (providerId) => {
    const state = providerStates[providerId];

    if (!state.apiKey) {
      message.warning('请输入 API Key');
      return;
    }

    updateProviderState(providerId, { saving: true });

    try {
      await llmAPI.configProvider(providerId, state.apiKey, state.model, true);

      message.success('✅ 配置保存成功！');

      // 重新加载配置
      await loadProviders();

    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message || '保存失败';
      message.error('❌ ' + errorMsg);
    } finally {
      updateProviderState(providerId, { saving: false });
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" tip="加载设置中..." />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Title level={2}>
        <ApiOutlined /> AI 模型配置
      </Title>
      <Paragraph type="secondary">
        选择并配置您的 AI 模型提供商，无需重启服务即可生效
      </Paragraph>

      <Divider />

      {/* 当前模型信息 */}
      <StyledCard
        title={
          <Space>
            <ThunderboltOutlined />
            当前使用的 AI 模型
          </Space>
        }
      >
        {currentProvider && currentProvider.provider !== 'none' ? (
          <InfoSection>
            <div className="info-item">
              <span className="label">提供商</span>
              <span className="value">{currentProvider.name}</span>
            </div>
            <div className="info-item">
              <span className="label">模型</span>
              <span className="value">
                <Tag color="blue">{currentProvider.model}</Tag>
              </span>
            </div>
            <div className="info-item">
              <span className="label">状态</span>
              <span className="value">
                <Tag color="success" icon={<CheckCircleOutlined />}>
                  正常运行
                </Tag>
              </span>
            </div>
          </InfoSection>
        ) : (
          <Alert
            message="未配置 AI 模型"
            description="请在下方选择并配置一个 AI 提供商，以启用 AI 问答功能。"
            type="warning"
            showIcon
          />
        )}
      </StyledCard>

      {/* 提供商配置 */}
      <StyledCard
        title={
          <Space>
            <ApiOutlined />
            配置 AI 提供商
          </Space>
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={loadProviders}
            type="text"
            style={{ color: 'white' }}
          >
            刷新
          </Button>
        }
      >
        <Paragraph type="secondary">
          输入您的 API Key，点击"测试连接"验证，然后"保存配置"即可使用
        </Paragraph>

        {providers.map(provider => {
          const info = PROVIDER_INFO[provider.id];
          const state = providerStates[provider.id] || {};

          return (
            <ProviderCard key={provider.id} configured={provider.configured}>
              <ProviderHeader>
                <ProviderName>
                  <span style={{ fontSize: '28px' }}>{info?.icon || '🤖'}</span>
                  {info?.name || provider.name}
                  {provider.configured && (
                    <Tag color="success">已配置</Tag>
                  )}
                  {provider.current && (
                    <Tag color="blue">当前使用</Tag>
                  )}
                </ProviderName>
              </ProviderHeader>

              {info?.description && (
                <Paragraph type="secondary" style={{ marginBottom: 20 }}>
                  {info.description}
                </Paragraph>
              )}

              <ConfigSection>
                <FormRow>
                  <span className="label">选择模型</span>
                  <Select
                    value={state.model}
                    onChange={(value) => updateProviderState(provider.id, { model: value })}
                    style={{ width: '100%' }}
                  >
                    {provider.models.map(model => (
                      <Option key={model} value={model}>
                        {model}
                      </Option>
                    ))}
                  </Select>
                </FormRow>

                <FormRow>
                  <span className="label">API Key</span>
                  <Input.Password
                    placeholder={`请输入 ${info?.name || provider.name} 的 API Key`}
                    value={state.apiKey}
                    onChange={(e) => updateProviderState(provider.id, {
                      apiKey: e.target.value,
                      testResult: null
                    })}
                    size="large"
                  />
                </FormRow>

                {state.testResult && (
                  <Alert
                    type={state.testResult.success ? 'success' : 'error'}
                    message={state.testResult.message}
                    icon={state.testResult.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}

                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button
                    type="default"
                    icon={state.testing ? <LoadingOutlined /> : <ExperimentOutlined />}
                    onClick={() => handleTest(provider.id)}
                    loading={state.testing}
                    disabled={!state.apiKey}
                  >
                    测试连接
                  </Button>
                  <Button
                    type="primary"
                    icon={state.saving ? <LoadingOutlined /> : <SaveOutlined />}
                    onClick={() => handleSave(provider.id)}
                    loading={state.saving}
                    disabled={!state.apiKey || (state.testResult && !state.testResult.success)}
                  >
                    保存配置
                  </Button>
                </Space>
              </ConfigSection>

              {/* 获取指南 */}
              <Collapse ghost style={{ marginTop: 16 }}>
                <Panel header={`如何获取 ${info?.name || provider.name} API Key？`} key="1">
                  {info?.steps && (
                    <div>
                      <ol className="guide-steps">
                        {info.steps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                      {info.guideUrl && (
                        <div style={{ marginTop: 12 }}>
                          <a href={info.guideUrl} target="_blank" rel="noopener noreferrer">
                            前往 {info.name} 官网 →
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </Panel>
              </Collapse>
            </ProviderCard>
          );
        })}
      </StyledCard>

      {/* 使用说明 */}
      <GuideCard title="使用说明">
        <div className="guide-section">
          <h4>快速开始</h4>
          <ol className="guide-steps">
            <li>选择一个 AI 提供商（推荐千问 - 国内访问快）</li>
            <li>选择模型版本（默认即可）</li>
            <li>输入您的 API Key</li>
            <li>点击"测试连接"确保 Key 有效</li>
            <li>点击"保存配置"完成设置</li>
            <li>前往"AI问答"页面开始使用</li>
          </ol>
        </div>

        <Divider />

        <div className="guide-section">
          <h4>注意事项</h4>
          <ul className="guide-steps">
            <li>API Key 不会被保存到本地文件，仅在运行时内存中生效</li>
            <li>配置后立即生效，无需重启服务</li>
            <li>可以同时配置多个提供商，随时切换使用</li>
            <li>请妥善保管您的 API Key，不要分享给他人</li>
          </ul>
        </div>

        <Divider />

        <div className="guide-section">
          <h4>常见问题</h4>
          <ul className="guide-steps">
            <li><strong>测试连接失败？</strong> 请检查 API Key 是否正确，网络是否正常</li>
            <li><strong>OpenAI 无法访问？</strong> OpenAI 需要国际网络访问，建议使用千问或 DeepSeek</li>
            <li><strong>如何获取免费额度？</strong> 千问和 DeepSeek 通常提供免费试用额度</li>
          </ul>
        </div>
      </GuideCard>
    </PageContainer>
  );
}

export default SettingsPage;
