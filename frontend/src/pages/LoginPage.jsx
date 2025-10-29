import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

// 动画定义
const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
`;

const glow = keyframes`
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
`;

const lineMove = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// 主容器
const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1419 100%);
  position: relative;
  overflow: hidden;
`;

// 几何背景
const GeometricBackground = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  opacity: 0.15;

  .shape {
    position: absolute;
    border: 1px solid #00d4ff;
    animation: ${float} 8s ease-in-out infinite;
  }

  .triangle1 {
    width: 0;
    height: 0;
    border-left: 150px solid transparent;
    border-right: 150px solid transparent;
    border-bottom: 260px solid rgba(0, 212, 255, 0.1);
    top: 10%;
    left: 5%;
    animation-delay: 0s;
    filter: blur(2px);
  }

  .triangle2 {
    width: 0;
    height: 0;
    border-left: 100px solid transparent;
    border-right: 100px solid transparent;
    border-bottom: 173px solid rgba(138, 43, 226, 0.1);
    top: 60%;
    right: 10%;
    animation-delay: 2s;
    filter: blur(2px);
  }

  .circle {
    width: 300px;
    height: 300px;
    border-radius: 50%;
    border: 2px solid #00d4ff;
    top: 50%;
    right: 5%;
    animation-delay: 1s;
  }

  .square {
    width: 200px;
    height: 200px;
    border: 2px solid #8a2be2;
    bottom: 10%;
    left: 15%;
    animation-delay: 3s;
    transform: rotate(45deg);
  }

  .line {
    position: absolute;
    height: 1px;
    background: linear-gradient(90deg, transparent, #00d4ff, transparent);
    width: 200%;
    animation: ${lineMove} 4s linear infinite;
  }

  .line1 { top: 20%; animation-delay: 0s; }
  .line2 { top: 40%; animation-delay: 2s; }
  .line3 { top: 60%; animation-delay: 1s; }
  .line4 { top: 80%; animation-delay: 3s; }
`;

// 网格背景
const GridBackground = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(0, 212, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 212, 255, 0.05) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: ${glow} 3s ease-in-out infinite;
`;

// 登录卡片
const LoginCard = styled.div`
  position: relative;
  z-index: 10;
  background: rgba(15, 20, 35, 0.9);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 20px;
  padding: 60px 50px;
  width: 450px;
  backdrop-filter: blur(10px);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.5),
    0 0 80px rgba(0, 212, 255, 0.1),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  animation: ${fadeInUp} 0.8s ease-out;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #00d4ff, transparent);
    animation: ${lineMove} 3s linear infinite;
  }
`;

// 标题
const Title = styled.h1`
  color: #fff;
  font-size: 32px;
  font-weight: 300;
  text-align: center;
  margin-bottom: 10px;
  letter-spacing: 3px;
  text-transform: uppercase;

  span {
    background: linear-gradient(135deg, #00d4ff, #8a2be2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 600;
  }
`;

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  margin-bottom: 40px;
  font-size: 14px;
  letter-spacing: 1px;
`;

// 表单样式
const StyledForm = styled(Form)`
  .ant-form-item {
    margin-bottom: 24px;
  }

  .ant-input-affix-wrapper,
  .ant-input-password {
    background: rgba(10, 14, 39, 0.6) !important;
    border: 1px solid rgba(0, 212, 255, 0.3);
    border-radius: 8px;
    padding: 12px 15px;
    transition: all 0.3s;
    backdrop-filter: blur(10px);

    &:hover {
      background: rgba(10, 14, 39, 0.8) !important;
      border-color: rgba(0, 212, 255, 0.6);
      box-shadow: 0 0 15px rgba(0, 212, 255, 0.15);
    }

    &:focus,
    &.ant-input-affix-wrapper-focused,
    &.ant-input-password-focused {
      background: rgba(10, 14, 39, 0.9) !important;
      border-color: #00d4ff;
      box-shadow:
        0 0 20px rgba(0, 212, 255, 0.3),
        inset 0 0 10px rgba(0, 212, 255, 0.1);
    }

    input {
      background: transparent !important;
      border: none !important;
      color: #fff !important;
      font-size: 15px;
      outline: none !important;
      box-shadow: none !important;

      &::placeholder {
        color: rgba(0, 212, 255, 0.4);
      }

      &:-webkit-autofill,
      &:-webkit-autofill:hover,
      &:-webkit-autofill:focus {
        -webkit-text-fill-color: #fff !important;
        -webkit-box-shadow: 0 0 0 1000px rgba(10, 14, 39, 0.9) inset !important;
        transition: background-color 5000s ease-in-out 0s;
      }
    }

    .anticon {
      color: rgba(0, 212, 255, 0.7);
      font-size: 16px;
    }

    .ant-input-suffix {
      .anticon {
        color: rgba(0, 212, 255, 0.5);

        &:hover {
          color: rgba(0, 212, 255, 0.9);
        }
      }
    }
  }

  /* 确保普通输入框也应用样式 */
  .ant-input {
    background: rgba(10, 14, 39, 0.6) !important;
    border: 1px solid rgba(0, 212, 255, 0.3);
    border-radius: 8px;
    padding: 12px 15px;
    color: #fff !important;
    font-size: 15px;
    transition: all 0.3s;
    backdrop-filter: blur(10px);

    &::placeholder {
      color: rgba(0, 212, 255, 0.4);
    }

    &:hover {
      background: rgba(10, 14, 39, 0.8) !important;
      border-color: rgba(0, 212, 255, 0.6);
      box-shadow: 0 0 15px rgba(0, 212, 255, 0.15);
    }

    &:focus {
      background: rgba(10, 14, 39, 0.9) !important;
      border-color: #00d4ff;
      box-shadow:
        0 0 20px rgba(0, 212, 255, 0.3),
        inset 0 0 10px rgba(0, 212, 255, 0.1);
    }

    &:-webkit-autofill,
    &:-webkit-autofill:hover,
    &:-webkit-autofill:focus {
      -webkit-text-fill-color: #fff !important;
      -webkit-box-shadow: 0 0 0 1000px rgba(10, 14, 39, 0.9) inset !important;
      transition: background-color 5000s ease-in-out 0s;
    }
  }
`;

const LoginButton = styled(Button)`
  width: 100%;
  height: 50px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  background: linear-gradient(135deg, #00d4ff, #8a2be2);
  position: relative;
  overflow: hidden;
  transition: all 0.3s;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(0, 212, 255, 0.4);

    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(0);
  }
`;

const FooterText = styled.div`
  text-align: center;
  margin-top: 30px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;

  a {
    color: #00d4ff;
    text-decoration: none;
    margin-left: 5px;
    transition: all 0.3s;

    &:hover {
      color: #8a2be2;
      text-shadow: 0 0 10px rgba(138, 43, 226, 0.5);
    }
  }
`;

const LogoContainer = styled.div`
  text-align: center;
  margin-bottom: 30px;

  .logo-circle {
    width: 80px;
    height: 80px;
    margin: 0 auto;
    border: 2px solid #00d4ff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(138, 43, 226, 0.1));
    box-shadow:
      0 0 30px rgba(0, 212, 255, 0.3),
      inset 0 0 20px rgba(0, 212, 255, 0.1);
    position: relative;

    &::before {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 1px solid #00d4ff;
      animation: ${glow} 2s ease-in-out infinite;
    }

    /* 六边形外框 */
    &::after {
      content: '';
      position: absolute;
      width: 70px;
      height: 70px;
      background: transparent;
      border: 1px solid rgba(138, 43, 226, 0.4);
      clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
      animation: ${float} 4s ease-in-out infinite;
    }
  }
`;

// 电子图书Logo组件
const BookLogo = styled.div`
  position: relative;
  width: 40px;
  height: 40px;
  z-index: 1;

  /* 书本主体 - 左页 */
  .book-left {
    position: absolute;
    left: 8px;
    top: 10px;
    width: 12px;
    height: 20px;
    background: linear-gradient(135deg, #00d4ff, #0099cc);
    border-radius: 2px 0 0 2px;
    box-shadow:
      -2px 0 4px rgba(0, 212, 255, 0.3),
      inset -1px 0 2px rgba(255, 255, 255, 0.2);

    /* 页面线条 */
    &::before,
    &::after {
      content: '';
      position: absolute;
      right: 3px;
      width: 6px;
      height: 1px;
      background: rgba(255, 255, 255, 0.3);
    }

    &::before { top: 6px; }
    &::after { top: 10px; }
  }

  /* 书本主体 - 右页 */
  .book-right {
    position: absolute;
    right: 8px;
    top: 10px;
    width: 12px;
    height: 20px;
    background: linear-gradient(135deg, #8a2be2, #6a1bb2);
    border-radius: 0 2px 2px 0;
    box-shadow:
      2px 0 4px rgba(138, 43, 226, 0.3),
      inset 1px 0 2px rgba(255, 255, 255, 0.2);

    /* 页面线条 */
    &::before,
    &::after {
      content: '';
      position: absolute;
      left: 3px;
      width: 6px;
      height: 1px;
      background: rgba(255, 255, 255, 0.3);
    }

    &::before { top: 6px; }
    &::after { top: 10px; }
  }

  /* 书脊 */
  .book-spine {
    position: absolute;
    left: 50%;
    top: 10px;
    transform: translateX(-50%);
    width: 3px;
    height: 20px;
    background: linear-gradient(180deg, #00d4ff, #8a2be2);
    box-shadow:
      0 0 8px rgba(0, 212, 255, 0.5),
      0 0 12px rgba(138, 43, 226, 0.3);
  }

  /* 顶部装饰 - 电子信号线 */
  .signal-line {
    position: absolute;
    top: 2px;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 2px;
    background: linear-gradient(90deg, transparent, #00d4ff, transparent);
    animation: ${lineMove} 2s linear infinite;
  }

  /* 底部装饰 - 数据点 */
  .data-dots {
    position: absolute;
    bottom: 2px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 3px;

    span {
      width: 2px;
      height: 2px;
      background: #00d4ff;
      border-radius: 50%;
      opacity: 0.6;
      animation: ${glow} 1.5s ease-in-out infinite;

      &:nth-child(2) { animation-delay: 0.3s; }
      &:nth-child(3) { animation-delay: 0.6s; }
    }
  }
`;

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);

    // 模拟登录请求
    setTimeout(() => {
      // 演示账号验证
      if (values.username === 'admin' && values.password === 'admin123') {
        message.success('登录成功！欢迎回来');

        // 保存登录状态
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', values.username);

        // 跳转到首页
        setTimeout(() => {
          navigate('/');
        }, 500);
      } else {
        message.error('用户名或密码错误！');
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <LoginContainer>
      {/* 网格背景 */}
      <GridBackground />

      {/* 几何图形背景 */}
      <GeometricBackground>
        <div className="shape triangle1"></div>
        <div className="shape triangle2"></div>
        <div className="shape circle"></div>
        <div className="shape square"></div>
        <div className="line line1"></div>
        <div className="line line2"></div>
        <div className="line line3"></div>
        <div className="line line4"></div>
      </GeometricBackground>

      {/* 登录卡片 */}
      <LoginCard>
        <LogoContainer>
          <div className="logo-circle">
            <BookLogo>
              <div className="book-left"></div>
              <div className="book-spine"></div>
              <div className="book-right"></div>
              <div className="signal-line"></div>
              <div className="data-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </BookLogo>
          </div>
        </LogoContainer>

        <Title>
          MCP <span>Platform</span>
        </Title>
        <Subtitle>Knowledge Graph Management System</Subtitle>

        <StyledForm
          name="login"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <LoginButton
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<LoginOutlined />}
            >
              登录
            </LoginButton>
          </Form.Item>
        </StyledForm>

        <FooterText>
          还没有账号？
          <a href="#register">立即注册</a>
        </FooterText>
      </LoginCard>
    </LoginContainer>
  );
}

export default LoginPage;
