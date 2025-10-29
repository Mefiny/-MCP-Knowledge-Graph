import React, { useState, useEffect } from 'react';
import {
  Upload,
  Button,
  Table,
  Card,
  message,
  Space,
  Tag,
  Modal,
  Descriptions,
  Progress,
  Typography,
  Popconfirm,
} from 'antd';
import {
  UploadOutlined,
  FileTextOutlined,
  EyeOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import { documentAPI } from '../services/api';

const { Title, Paragraph } = Typography;
const { Dragger } = Upload;

const PageContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const UploadCard = styled(Card)`
  margin-bottom: 24px;
`;

function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await documentAPI.list();
      setDocuments(data.documents || []);
    } catch (error) {
      message.error('获取文档列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    // 检查文件类型
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      message.error('只支持 PDF 和 DOCX 文件');
      return false;
    }

    // 检查文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      message.error('文件大小不能超过 10MB');
      return false;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await documentAPI.upload(file, (progress) => {
        setUploadProgress(progress);
      });

      message.success(`文档 "${file.name}" 上传成功！`);
      message.info(`提取了 ${result.entities_count} 个实体，${result.chunks_count} 个文本块`);

      // 刷新列表
      fetchDocuments();
    } catch (error) {
      message.error('上传失败: ' + (error.response?.data?.detail || error.message));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }

    return false; // 阻止默认上传
  };

  const handleView = async (record) => {
    try {
      const data = await documentAPI.get(record.document_id);
      setSelectedDoc(data);
      setDetailVisible(true);
    } catch (error) {
      message.error('获取文档详情失败');
    }
  };

  const handleDelete = async (documentId) => {
    try {
      await documentAPI.delete(documentId);
      message.success('文档删除成功');
      fetchDocuments();
    } catch (error) {
      message.error('删除失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  const columns = [
    {
      title: '文档名称',
      dataIndex: 'file_name',
      key: 'file_name',
      render: (text) => (
        <Space>
          <FileTextOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'file_type',
      key: 'file_type',
      render: (type) => (
        <Tag color={type === 'pdf' ? 'red' : 'blue'}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: '文本长度',
      dataIndex: 'text_length',
      key: 'text_length',
      render: (len) => `${len.toLocaleString()} 字符`,
    },
    {
      title: '实体数量',
      dataIndex: 'entities_count',
      key: 'entities_count',
      render: (count) => (
        <Tag color="green">{count} 个实体</Tag>
      ),
    },
    {
      title: '文本块',
      dataIndex: 'chunks_count',
      key: 'chunks_count',
      render: (count) => (
        <Tag color="purple">{count} 块</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Popconfirm
            title="确定要删除这个文档吗？"
            onConfirm={() => handleDelete(record.document_id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <Title level={2}>文档管理</Title>
      <Paragraph>上传文档进行智能解析，提取实体和关系，构建知识图谱。</Paragraph>

      <UploadCard>
        <Dragger
          beforeUpload={handleUpload}
          showUploadList={false}
          disabled={uploading}
          multiple={false}
        >
          <p className="ant-upload-drag-icon">
            {uploading ? <CheckCircleOutlined /> : <UploadOutlined />}
          </p>
          <p className="ant-upload-text">
            {uploading ? '上传中...' : '点击或拖拽文件到此处上传'}
          </p>
          <p className="ant-upload-hint">
            支持 PDF 和 DOCX 格式，单个文件不超过 10MB
          </p>
        </Dragger>

        {uploading && (
          <Progress
            percent={uploadProgress}
            status="active"
            style={{ marginTop: 16 }}
          />
        )}
      </UploadCard>

      <Card>
        <Table
          columns={columns}
          dataSource={documents}
          rowKey="document_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `共 ${total} 个文档`,
          }}
        />
      </Card>

      {/* 文档详情Modal */}
      <Modal
        title="文档详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {selectedDoc && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="文档ID" span={2}>
              {selectedDoc.document_id}
            </Descriptions.Item>
            <Descriptions.Item label="文件名">
              {selectedDoc.file_name}
            </Descriptions.Item>
            <Descriptions.Item label="文件类型">
              <Tag color={selectedDoc.file_type === 'pdf' ? 'red' : 'blue'}>
                {selectedDoc.file_type.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="文本长度">
              {selectedDoc.text_length?.toLocaleString()} 字符
            </Descriptions.Item>
            <Descriptions.Item label="文本块数">
              {selectedDoc.chunks_count}
            </Descriptions.Item>
            <Descriptions.Item label="实体数量">
              {selectedDoc.entities_count}
            </Descriptions.Item>
            <Descriptions.Item label="关系数量">
              {selectedDoc.relations_count}
            </Descriptions.Item>
            {selectedDoc.metadata?.title && (
              <Descriptions.Item label="标题" span={2}>
                {selectedDoc.metadata.title}
              </Descriptions.Item>
            )}
            {selectedDoc.metadata?.author && (
              <Descriptions.Item label="作者" span={2}>
                {selectedDoc.metadata.author}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </PageContainer>
  );
}

export default DocumentsPage;
