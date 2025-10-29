import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Layout, Menu, message, Button, Dropdown } from 'antd';
import {
  FileTextOutlined,
  ShareAltOutlined,
  SearchOutlined,
  CommentOutlined,
  HomeOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';

// Components
import GeometricBackground from './components/GeometricBackground';

// Pages
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import DocumentsPage from './pages/DocumentsPage';
import KnowledgeGraphPage3D from './pages/KnowledgeGraphPage3D';
import SearchPage from './pages/SearchPage';
import QAPage from './pages/QAPage';
import SettingsPage from './pages/SettingsPage';

// API
import { systemAPI } from './services/api';

const { Header, Content, Sider } = Layout;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
  background: transparent;
  position: relative;
`;

const StyledHeader = styled(Header)`
  background: rgba(0, 21, 41, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 212, 255, 0.2);
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 10;
`;

const Logo = styled.div`
  color: white;
  font-size: 20px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
`;

const StatusBadge = styled.div`
  display: flex;
  gap: 16px;
  color: rgba(255, 255, 255, 0.65);
  font-size: 12px;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .username {
    font-size: 14px;
  }
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => props.active ? '#52c41a' : '#f5222d'};
  }
`;

const StyledContent = styled(Content)`
  margin: 24px;
  padding: 24px;
  background: rgba(15, 20, 35, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 212, 255, 0.15);
  border-radius: 12px;
  min-height: 280px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  position: relative;
  z-index: 1;

  /* 调整全局文字颜色 */
  color: rgba(255, 255, 255, 0.85);

  /* 标题颜色 */
  h1, h2, h3, h4, h5, h6 {
    color: rgba(255, 255, 255, 0.95);
  }

  /* 调整antd组件文字颜色 */
  .ant-typography {
    color: rgba(255, 255, 255, 0.85);
  }

  .ant-typography-secondary {
    color: rgba(255, 255, 255, 0.55);
  }
`;

// 路由守卫组件
function ProtectedRoute({ children }) {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// 主应用布局
function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [systemStatus, setSystemStatus] = useState({
    kg: false,
    vector: false,
    rag: false,
  });
  const [username, setUsername] = useState('');

  useEffect(() => {
    // 获取系统状态
    systemAPI.info()
      .then(data => {
        setSystemStatus({
          kg: data.features?.knowledge_graph || false,
          vector: data.features?.vector_search || false,
          rag: data.features?.rag_qa || false,
        });
      })
      .catch(() => {
        message.error('无法连接到后端服务');
      });

    // 获取用户名
    setUsername(localStorage.getItem('username') || 'User');
  }, []);

  // 登出
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    message.success('已成功登出');
    navigate('/login');
  };

  // 用户菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/documents',
      icon: <FileTextOutlined />,
      label: '文档管理',
    },
    {
      key: '/graph',
      icon: <ShareAltOutlined />,
      label: '知识图谱 (3D)',
    },
    {
      key: '/search',
      icon: <SearchOutlined />,
      label: '语义搜索',
    },
    {
      key: '/qa',
      icon: <CommentOutlined />,
      label: 'AI问答',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
  ];

  return (
    <StyledLayout>
      {/* 几何背景 */}
      <GeometricBackground />

      <StyledHeader>
        <Logo>
          <ShareAltOutlined style={{ fontSize: 24 }} />
          MCP Platform
        </Logo>
        <HeaderRight>
          <StatusBadge>
            <StatusItem active={systemStatus.kg}>
              <div className="status-dot" />
              知识图谱
            </StatusItem>
            <StatusItem active={systemStatus.vector}>
              <div className="status-dot" />
              向量检索
            </StatusItem>
            <StatusItem active={systemStatus.rag}>
              <div className="status-dot" />
              AI问答
            </StatusItem>
          </StatusBadge>

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <UserInfo>
              <UserOutlined />
              <span className="username">{username}</span>
            </UserInfo>
          </Dropdown>
        </HeaderRight>
      </StyledHeader>

      <Layout style={{ background: 'transparent' }}>
        <Sider
          width={200}
          style={{
            background: 'rgba(0, 21, 41, 0.6)',
            backdropFilter: 'blur(10px)',
            borderRight: '1px solid rgba(0, 212, 255, 0.15)',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => {
              navigate(key);
            }}
            style={{
              height: '100%',
              borderRight: 0,
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.75)',
            }}
            theme="dark"
          />
        </Sider>

        <Layout style={{ padding: '0 24px 24px', background: 'transparent' }}>
          <StyledContent>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/graph" element={<KnowledgeGraphPage3D />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/qa" element={<QAPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </StyledContent>
        </Layout>
      </Layout>
    </StyledLayout>
  );
}

// App 根组件
function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
