import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  List,
  Space,
  Typography,
  Empty,
  Spin,
  Tag,
  Collapse,
  Avatar,
  message,
} from 'antd';
import {
  RobotOutlined,
  UserOutlined,
  SendOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import { qaAPI } from '../services/api';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const ChatContainer = styled(Card)`
  height: 600px;
  display: flex;
  flex-direction: column;
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  background: rgba(10, 14, 39, 0.4);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 8px;
  margin-bottom: 16px;
  max-height: 500px;
  min-height: 400px;

  /* 美化滚动条 */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 21, 41, 0.3);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 212, 255, 0.4);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 212, 255, 0.6);
  }
`;

const MessageItem = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: flex-start;
  width: 100%;

  &.user {
    flex-direction: row-reverse;
  }
`;

const MessageContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 75%;

  ${props => props.isUser && `
    align-items: flex-end;
  `}
`;

const MessageBubble = styled.div`
  padding: 16px 20px;
  border-radius: 16px;
  position: relative;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
  display: inline-block;

  /* 用户消息 - 青蓝色渐变科技风 */
  ${props => props.isUser && `
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.25), rgba(0, 150, 200, 0.35));
    border: 1px solid rgba(0, 212, 255, 0.4);
    color: rgba(255, 255, 255, 0.95);
    box-shadow:
      0 4px 12px rgba(0, 212, 255, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);

    &::before {
      content: '';
      position: absolute;
      right: -8px;
      top: 12px;
      width: 0;
      height: 0;
      border-left: 8px solid rgba(0, 212, 255, 0.3);
      border-top: 8px solid transparent;
      border-bottom: 8px solid transparent;
    }
  `}

  /* AI消息 - 紫色渐变科技风 */
  ${props => !props.isUser && `
    background: linear-gradient(135deg, rgba(138, 43, 226, 0.2), rgba(100, 20, 180, 0.3));
    border: 1px solid rgba(138, 43, 226, 0.4);
    color: rgba(255, 255, 255, 0.95);
    box-shadow:
      0 4px 12px rgba(138, 43, 226, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);

    &::before {
      content: '';
      position: absolute;
      left: -8px;
      top: 12px;
      width: 0;
      height: 0;
      border-right: 8px solid rgba(138, 43, 226, 0.3);
      border-top: 8px solid transparent;
      border-bottom: 8px solid transparent;
    }
  `}

  /* Markdown内容样式 */
  p {
    margin: 0;
    line-height: 1.6;
    color: inherit;
  }

  code {
    background: rgba(0, 0, 0, 0.3);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.9em;
    color: #00d4ff;
  }

  pre {
    background: rgba(0, 0, 0, 0.3);
    padding: 12px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 8px 0;
  }
`;

const InputArea = styled.div`
  display: flex;
  gap: 8px;
`;

const SourcesCollapse = styled(Collapse)`
  margin-top: 12px;
  background: rgba(0, 21, 41, 0.5);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 8px;
  width: 100%;

  .ant-collapse-header {
    color: rgba(255, 255, 255, 0.85) !important;
    background: rgba(0, 21, 41, 0.3);
    border-radius: 8px !important;
  }

  .ant-collapse-content {
    background: transparent;
    border-top: 1px solid rgba(0, 212, 255, 0.2);
  }

  .ant-collapse-content-box {
    background: transparent;
    padding: 12px;
  }

  .ant-list-item {
    border-bottom: 1px solid rgba(0, 212, 255, 0.1) !important;
  }

  .ant-list-item-meta-description {
    color: rgba(255, 255, 255, 0.75) !important;
  }
`;

const TimestampText = styled(Text)`
  font-size: 12px;
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.45);
  display: block;
  
  ${props => props.isUser && `
    text-align: right;
  `}
`;

function QAPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messageListRef = useRef(null);

  // 滚动到底部的函数
  const scrollToBottom = () => {
    if (messageListRef.current) {
      setTimeout(() => {
        messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
      }, 100);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) {
      return;
    }

    const userMessage = {
      type: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const data = await qaAPI.ask(input);

      const aiMessage = {
        type: 'ai',
        content: data.answer,
        sources: data.sources || [],
        confidence: data.confidence,
        model: data.model,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      if (error.response?.status === 503) {
        message.error('RAG问答服务未启用，请配置OpenAI API密钥');
      } else {
        message.error('提问失败: ' + (error.response?.data?.detail || error.message));
      }

      const errorMessage = {
        type: 'ai',
        content: '抱歉，我暂时无法回答这个问题。',
        error: true,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'green';
    if (confidence >= 0.6) return 'blue';
    if (confidence >= 0.4) return 'orange';
    return 'red';
  };

  return (
    <PageContainer>
      <Title level={2}>
        <RobotOutlined /> AI 智能问答
      </Title>
      <Paragraph>
        基于知识图谱和向量检索的RAG问答系统，提供准确、可溯源的答案。
      </Paragraph>

      <ChatContainer>
        <MessageList ref={messageListRef}>
          {messages.length === 0 ? (
            <Empty
              description={
                <span style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                  开始对话吧！问我关于文档的任何问题。
                </span>
              }
              image={<RobotOutlined style={{ fontSize: 64, color: '#8a2be2' }} />}
            />
          ) : (
            messages.map((msg, index) => (
              <MessageItem key={index} className={msg.type}>
                <Avatar
                  icon={msg.type === 'user' ? <UserOutlined /> : <RobotOutlined />}
                  style={{
                    background: msg.type === 'user'
                      ? 'linear-gradient(135deg, #00d4ff, #0099cc)'
                      : 'linear-gradient(135deg, #8a2be2, #6a1bb2)',
                    boxShadow: msg.type === 'user'
                      ? '0 0 12px rgba(0, 212, 255, 0.3)'
                      : '0 0 12px rgba(138, 43, 226, 0.3)',
                    flexShrink: 0,
                  }}
                />
                <MessageContent isUser={msg.type === 'user'}>
                  <MessageBubble isUser={msg.type === 'user'}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>

                    {msg.type === 'ai' && !msg.error && (
                      <div style={{ marginTop: 8 }}>
                        {msg.confidence !== undefined && (
                          <Tag color={getConfidenceColor(msg.confidence)}>
                            置信度: {(msg.confidence * 100).toFixed(1)}%
                          </Tag>
                        )}
                        {msg.model && (
                          <Tag>{msg.model}</Tag>
                        )}
                      </div>
                    )}

                    {msg.sources && msg.sources.length > 0 && (
                      <SourcesCollapse
                        ghost
                        size="small"
                        onChange={scrollToBottom}
                        items={[
                          {
                            key: '1',
                            label: `来源 (${msg.sources.length})`,
                            children: (
                              <List
                                size="small"
                                dataSource={msg.sources}
                                renderItem={(source, idx) => (
                                  <List.Item>
                                    <List.Item.Meta
                                      avatar={<FileTextOutlined />}
                                      title={
                                        <Space>
                                          <Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                                            来源 #{idx + 1}
                                          </Text>
                                          <Tag color="blue">
                                            相关度: {(source.score * 100).toFixed(1)}%
                                          </Tag>
                                        </Space>
                                      }
                                      description={
                                        <Paragraph
                                          ellipsis={{ rows: 2, expandable: true }}
                                          style={{ color: 'rgba(255, 255, 255, 0.75)', marginBottom: 0 }}
                                        >
                                          {source.text}
                                        </Paragraph>
                                      }
                                    />
                                  </List.Item>
                                )}
                              />
                            ),
                          },
                        ]}
                      />
                    )}
                  </MessageBubble>
                  <TimestampText isUser={msg.type === 'user'}>
                    {msg.timestamp}
                  </TimestampText>
                </MessageContent>
              </MessageItem>
            ))
          )}

          {loading && (
            <MessageItem>
              <Avatar
                icon={<RobotOutlined />}
                style={{
                  background: 'linear-gradient(135deg, #8a2be2, #6a1bb2)',
                  boxShadow: '0 0 12px rgba(138, 43, 226, 0.3)',
                  flexShrink: 0,
                }}
              />
              <MessageContent isUser={false}>
                <MessageBubble isUser={false}>
                  <Space>
                    <Spin />
                    <span style={{ color: 'rgba(255, 255, 255, 0.85)' }}>正在思考...</span>
                  </Space>
                </MessageBubble>
              </MessageContent>
            </MessageItem>
          )}
        </MessageList>

        <InputArea>
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="输入你的问题... (Shift+Enter 换行)"
            autoSize={{ minRows: 1, maxRows: 4 }}
            disabled={loading}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={loading}
            disabled={!input.trim()}
          >
            发送
          </Button>
        </InputArea>
      </ChatContainer>

      <Card style={{ marginTop: 16 }}>
        <Title level={4}>使用提示</Title>
        <ul>
          <li>系统会从上传的文档中检索相关内容来回答问题</li>
          <li>点击"来源"可以查看答案的依据</li>
          <li>置信度表示答案的可靠程度</li>
          <li>支持多轮对话，可以追问细节</li>
        </ul>
      </Card>
    </PageContainer>
  );
}

export default QAPage;