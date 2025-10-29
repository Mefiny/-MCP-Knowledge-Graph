import React from 'react';
import styled, { keyframes } from 'styled-components';

// 动画定义
const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
`;

const glow = keyframes`
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
`;

const lineMove = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// 主容器
const BackgroundContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1419 100%);
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
`;

// 网格背景
const GridBackground = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: ${glow} 4s ease-in-out infinite;
`;

// 几何图形
const GeometricShapes = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0.1;

  .shape {
    position: absolute;
    border: 1px solid #00d4ff;
    animation: ${float} 8s ease-in-out infinite;
  }

  /* 三角形 */
  .triangle1 {
    width: 0;
    height: 0;
    border-left: 120px solid transparent;
    border-right: 120px solid transparent;
    border-bottom: 200px solid rgba(0, 212, 255, 0.08);
    top: 5%;
    left: 3%;
    animation-delay: 0s;
    filter: blur(1px);
  }

  .triangle2 {
    width: 0;
    height: 0;
    border-left: 80px solid transparent;
    border-right: 80px solid transparent;
    border-bottom: 140px solid rgba(138, 43, 226, 0.08);
    top: 65%;
    right: 8%;
    animation-delay: 2s;
    filter: blur(1px);
  }

  .triangle3 {
    width: 0;
    height: 0;
    border-left: 60px solid transparent;
    border-right: 60px solid transparent;
    border-bottom: 100px solid rgba(0, 212, 255, 0.06);
    bottom: 15%;
    left: 40%;
    animation-delay: 4s;
    filter: blur(1px);
  }

  /* 圆形 */
  .circle1 {
    width: 250px;
    height: 250px;
    border-radius: 50%;
    border: 2px solid rgba(0, 212, 255, 0.15);
    top: 45%;
    right: 5%;
    animation-delay: 1s;
  }

  .circle2 {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    border: 1px solid rgba(138, 43, 226, 0.1);
    top: 15%;
    left: 60%;
    animation-delay: 3s;
  }

  /* 方形 */
  .square1 {
    width: 180px;
    height: 180px;
    border: 2px solid rgba(138, 43, 226, 0.12);
    bottom: 8%;
    left: 12%;
    animation-delay: 3s;
    transform: rotate(45deg);
  }

  .square2 {
    width: 100px;
    height: 100px;
    border: 1px solid rgba(0, 212, 255, 0.1);
    top: 30%;
    left: 25%;
    animation-delay: 5s;
    transform: rotate(30deg);
  }

  /* 六边形 */
  .hexagon {
    position: absolute;
    width: 120px;
    height: 120px;
    top: 20%;
    right: 25%;
    background: transparent;
    border: 1px solid rgba(0, 212, 255, 0.12);
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
    animation: ${float} 10s ease-in-out infinite, ${rotate} 60s linear infinite;
    animation-delay: 2s;
  }
`;

// 动态线条
const AnimatedLines = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;

  .line {
    position: absolute;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.3), transparent);
    width: 200%;
    animation: ${lineMove} 6s linear infinite;
  }

  .line1 { top: 15%; animation-delay: 0s; }
  .line2 { top: 35%; animation-delay: 2s; }
  .line3 { top: 55%; animation-delay: 1s; }
  .line4 { top: 75%; animation-delay: 3s; }
  .line5 { top: 90%; animation-delay: 4s; }

  .line-vertical {
    width: 1px;
    height: 200%;
    background: linear-gradient(180deg, transparent, rgba(138, 43, 226, 0.2), transparent);
    animation: ${lineMove} 8s linear infinite;
  }

  .vline1 {
    left: 20%;
    animation-delay: 1s;
  }

  .vline2 {
    left: 50%;
    animation-delay: 3s;
  }

  .vline3 {
    left: 80%;
    animation-delay: 5s;
  }
`;

// 光点装饰
const GlowDots = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;

  .dot {
    position: absolute;
    width: 4px;
    height: 4px;
    background: #00d4ff;
    border-radius: 50%;
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.6);
    animation: ${glow} 3s ease-in-out infinite;
  }

  .dot1 { top: 10%; left: 15%; animation-delay: 0s; }
  .dot2 { top: 25%; right: 20%; animation-delay: 0.5s; }
  .dot3 { top: 60%; left: 30%; animation-delay: 1s; }
  .dot4 { top: 80%; right: 35%; animation-delay: 1.5s; }
  .dot5 { top: 40%; right: 50%; animation-delay: 2s; background: #8a2be2; box-shadow: 0 0 10px rgba(138, 43, 226, 0.6); }
  .dot6 { bottom: 20%; left: 45%; animation-delay: 2.5s; background: #8a2be2; box-shadow: 0 0 10px rgba(138, 43, 226, 0.6); }
`;

function GeometricBackground() {
  return (
    <BackgroundContainer>
      {/* 网格背景 */}
      <GridBackground />

      {/* 几何图形 */}
      <GeometricShapes>
        <div className="shape triangle1"></div>
        <div className="shape triangle2"></div>
        <div className="shape triangle3"></div>
        <div className="shape circle1"></div>
        <div className="shape circle2"></div>
        <div className="shape square1"></div>
        <div className="shape square2"></div>
        <div className="hexagon"></div>
      </GeometricShapes>

      {/* 动态线条 */}
      <AnimatedLines>
        <div className="line line1"></div>
        <div className="line line2"></div>
        <div className="line line3"></div>
        <div className="line line4"></div>
        <div className="line line5"></div>
        <div className="line-vertical vline1"></div>
        <div className="line-vertical vline2"></div>
        <div className="line-vertical vline3"></div>
      </AnimatedLines>

      {/* 发光点 */}
      <GlowDots>
        <div className="dot dot1"></div>
        <div className="dot dot2"></div>
        <div className="dot dot3"></div>
        <div className="dot dot4"></div>
        <div className="dot dot5"></div>
        <div className="dot dot6"></div>
      </GlowDots>
    </BackgroundContainer>
  );
}

export default GeometricBackground;
