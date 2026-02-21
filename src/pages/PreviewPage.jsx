import React, { useState, useRef, useEffect } from 'react';
import { EyeOutlined, CameraOutlined, UploadOutlined } from '@ant-design/icons';
import {
  Layout,
  Card,
  Select,
  Upload,
  Slider,
  Row,
  Col,
  Typography,
  Space,
} from 'antd';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const devices = {
  iphone15pro: {
    label: 'iPhone 15 Pro',
    views: {
      front: {
        width: 260,
        height: 540,
        borderRadius: 45,
        color: '#1c1c1e',
        frameColor: '#3a3a3a',
        buttons: [
          { side: 'left', y: 100, height: 40, width: 3 },
          { side: 'left', y: 160, height: 50, width: 3 },
          { side: 'left', y: 220, height: 50, width: 3 },
          { side: 'right', y: 180, height: 70, width: 3 },
        ],
      },
      back: {
        width: 260,
        height: 540,
        borderRadius: 45,
        color: '#5e5e5e',
        frameColor: '#3a3a3a',
        island: {
          type: 'rect',
          x: 10,
          y: 10,
          w: 110,
          h: 115,
          r: 25,
          color: '#4a4a4a',
        },
        cameras: [
          { cx: 40, cy: 40, r: 18 },
          { cx: 40, cy: 90, r: 18 },
          { cx: 85, cy: 65, r: 18 },
          { cx: 80, cy: 100, r: 6, type: 'lidar' },
          { cx: 80, cy: 30, r: 8, type: 'flash' },
        ],
      },
      side: {
        width: 80,
        height: 540,
        borderRadius: 8,
        color: '#5e5e5e',
        frameColor: '#3a3a3a',
        buttons: [
          { side: 'left', y: 100, height: 40, width: 4 },
          { side: 'left', y: 160, height: 50, width: 4 },
          { side: 'left', y: 220, height: 50, width: 4 },
        ],
      },
      top: {
        width: 260,
        height: 80,
        borderRadius: 45,
        color: '#5e5e5e',
        frameColor: '#3a3a3a',
        speakers: [{ x: 100, y: 35, width: 60, height: 10 }],
      },
      bottom: {
        width: 260,
        height: 80,
        borderRadius: 45,
        color: '#5e5e5e',
        frameColor: '#3a3a3a',
        ports: [{ x: 100, y: 35, width: 60, height: 10 }],
        speakers: [
          { x: 30, y: 40, width: 4, height: 10 },
          { x: 40, y: 40, width: 4, height: 10 },
          { x: 50, y: 40, width: 4, height: 10 },
          { x: 200, y: 40, width: 4, height: 10 },
          { x: 210, y: 40, width: 4, height: 10 },
          { x: 220, y: 40, width: 4, height: 10 },
        ],
      },
    },
  },
  iphone14: { label: 'iPhone 14', views: { front: { width: 255, height: 530, borderRadius: 42, color: '#1c1c1e', frameColor: '#2c2c2e', buttons: [{ side: 'left', y: 100, height: 40, width: 3 }, { side: 'left', y: 160, height: 50, width: 3 }, { side: 'left', y: 220, height: 50, width: 3 }, { side: 'right', y: 180, height: 70, width: 3 }] }, back: { width: 255, height: 530, borderRadius: 42, color: '#e8e8ed', frameColor: '#c7c7cc', island: { type: 'rect', x: 10, y: 10, w: 90, h: 90, r: 25, color: '#d8d8dd' }, cameras: [{ cx: 35, cy: 35, r: 18 }, { cx: 70, cy: 70, r: 18 }, { cx: 65, cy: 25, r: 8, type: 'flash' }] }, side: { width: 75, height: 530, borderRadius: 8, color: '#e8e8ed', frameColor: '#c7c7cc', buttons: [{ side: 'left', y: 100, height: 40, width: 4 }, { side: 'left', y: 160, height: 50, width: 4 }, { side: 'left', y: 220, height: 50, width: 4 }] }, top: { width: 255, height: 75, borderRadius: 42, color: '#e8e8ed', frameColor: '#c7c7cc', speakers: [{ x: 95, y: 35, width: 65, height: 8 }] }, bottom: { width: 255, height: 75, borderRadius: 42, color: '#e8e8ed', frameColor: '#c7c7cc', ports: [{ x: 95, y: 35, width: 65, height: 10 }], speakers: [{ x: 30, y: 40, width: 4, height: 10 }, { x: 40, y: 40, width: 4, height: 10 }, { x: 50, y: 40, width: 4, height: 10 }, { x: 195, y: 40, width: 4, height: 10 }, { x: 205, y: 40, width: 4, height: 10 }, { x: 215, y: 40, width: 4, height: 10 }] } } }, samsungs24: { label: 'Samsung S24 Ultra', views: { front: { width: 270, height: 560, borderRadius: 10, color: '#1a1a1a', frameColor: '#2a2a2a', buttons: [{ side: 'right', y: 120, height: 50, width: 3 }, { side: 'right', y: 200, height: 70, width: 3 }] }, back: { width: 270, height: 560, borderRadius: 10, color: '#e0e0e0', frameColor: '#c0c0c0', cameras: [{ cx: 45, cy: 45, r: 16 }, { cx: 45, cy: 95, r: 16 }, { cx: 45, cy: 145, r: 16 }, { cx: 90, cy: 120, r: 14 }, { cx: 90, cy: 70, r: 10, type: 'sensor' }] }, side: { width: 85, height: 560, borderRadius: 5, color: '#e0e0e0', frameColor: '#c0c0c0', buttons: [{ side: 'right', y: 120, height: 50, width: 4 }, { side: 'right', y: 200, height: 70, width: 4 }] }, top: { width: 270, height: 85, borderRadius: 10, color: '#e0e0e0', frameColor: '#c0c0c0', speakers: [] }, bottom: { width: 270, height: 85, borderRadius: 10, color: '#e0e0e0', frameColor: '#c0c0c0', ports: [{ x: 105, y: 40, width: 60, height: 12 }], speakers: [{ x: 30, y: 45, width: 5, height: 12 }, { x: 42, y: 45, width: 5, height: 12 }, { x: 54, y: 45, width: 5, height: 12 }, { x: 210, y: 45, width: 5, height: 12 }, { x: 222, y: 45, width: 5, height: 12 }, { x: 234, y: 45, width: 5, height: 12 }] } } }, pixel8: { label: 'Pixel 8 Pro', views: { front: { width: 255, height: 535, borderRadius: 35, color: '#1a1a1a', frameColor: '#2a2a2a', buttons: [{ side: 'right', y: 150, height: 50, width: 3 }, { side: 'right', y: 220, height: 60, width: 3 }] }, back: { width: 255, height: 535, borderRadius: 35, color: '#f0f4f8', frameColor: '#d1d5db', island: { type: 'bar', y: 35, h: 60, color: '#dbeafe' }, cameras: [{ cx: 70, cy: 65, r: 15 }, { cx: 120, cy: 65, r: 15 }, { cx: 170, cy: 65, r: 15 }] }, side: { width: 82, height: 535, borderRadius: 8, color: '#f0f4f8', frameColor: '#d1d5db', buttons: [{ side: 'right', y: 150, height: 50, width: 4 }, { side: 'right', y: 220, height: 60, width: 4 }] }, top: { width: 255, height: 82, borderRadius: 35, color: '#f0f4f8', frameColor: '#d1d5db', speakers: [{ x: 95, y: 38, width: 65, height: 8 }] }, bottom: { width: 255, height: 82, borderRadius: 35, color: '#f0f4f8', frameColor: '#d1d5db', ports: [{ x: 95, y: 38, width: 65, height: 12 }], speakers: [{ x: 30, y: 45, width: 4, height: 10 }, { x: 40, y: 45, width: 4, height: 10 }, { x: 50, y: 45, width: 4, height: 10 }, { x: 195, y: 45, width: 4, height: 10 }, { x: 205, y: 45, width: 4, height: 10 }, { x: 215, y: 45, width: 4, height: 10 }] } } }, xiaomi14: { label: 'Xiaomi 14', views: { front: { width: 255, height: 530, borderRadius: 30, color: '#1a1a1a', frameColor: '#2a2a2a', buttons: [{ side: 'right', y: 140, height: 50, width: 3 }, { side: 'right', y: 210, height: 65, width: 3 }] }, back: { width: 255, height: 530, borderRadius: 30, color: '#000000', frameColor: '#222', island: { type: 'rect', x: 15, y: 15, w: 120, h: 120, r: 20, color: '#111' }, cameras: [{ cx: 45, cy: 45, r: 18 }, { cx: 100, cy: 45, r: 18 }, { cx: 45, cy: 100, r: 18 }, { cx: 100, cy: 100, r: 12, type: 'flash' }] }, side: { width: 78, height: 530, borderRadius: 8, color: '#000000', frameColor: '#222', buttons: [{ side: 'right', y: 140, height: 50, width: 4 }, { side: 'right', y: 210, height: 65, width: 4 }] }, top: { width: 255, height: 78, borderRadius: 30, color: '#000000', frameColor: '#222', speakers: [] }, bottom: { width: 255, height: 78, borderRadius: 30, color: '#000000', frameColor: '#222', ports: [{ x: 92, y: 36, width: 70, height: 12 }], speakers: [{ x: 25, y: 42, width: 5, height: 12 }, { x: 38, y: 42, width: 5, height: 12 }, { x: 51, y: 42, width: 5, height: 12 }, { x: 195, y: 42, width: 5, height: 12 }, { x: 208, y: 42, width: 5, height: 12 }, { x: 221, y: 42, width: 5, height: 12 }] } } }, oneplus12: { label: 'OnePlus 12', views: { front: { width: 260, height: 545, borderRadius: 32, color: '#1a1a1a', frameColor: '#2a2a2a', buttons: [{ side: 'left', y: 100, height: 45, width: 3 }, { side: 'right', y: 140, height: 50, width: 3 }, { side: 'right', y: 210, height: 65, width: 3 }] }, back: { width: 260, height: 545, borderRadius: 32, color: '#2d5a3d', frameColor: '#1a3a2a', island: { type: 'circle', x: 20, y: 20, r: 65, color: '#1a3a2a' }, cameras: [{ cx: 55, cy: 55, r: 20 }, { cx: 55, cy: 105, r: 20 }, { cx: 105, cy: 80, r: 16 }, { cx: 85, cy: 40, r: 8, type: 'flash' }] }, side: { width: 82, height: 545, borderRadius: 8, color: '#2d5a3d', frameColor: '#1a3a2a', buttons: [{ side: 'left', y: 100, height: 45, width: 4 }, { side: 'right', y: 140, height: 50, width: 4 }, { side: 'right', y: 210, height: 65, width: 4 }] }, top: { width: 260, height: 82, borderRadius: 32, color: '#2d5a3d', frameColor: '#1a3a2a', speakers: [] }, bottom: { width: 260, height: 82, borderRadius: 32, color: '#2d5a3d', frameColor: '#1a3a2a', ports: [{ x: 95, y: 38, width: 70, height: 12 }], speakers: [{ x: 28, y: 44, width: 5, height: 12 }, { x: 40, y: 44, width: 5, height: 12 }, { x: 52, y: 44, width: 5, height: 12 }, { x: 200, y: 44, width: 5, height: 12 }, { x: 212, y: 44, width: 5, height: 12 }, { x: 224, y: 44, width: 5, height: 12 }] } } }, nothingphone2: { label: 'Nothing Phone (2)', views: { front: { width: 258, height: 538, borderRadius: 28, color: '#1a1a1a', frameColor: '#2a2a2a', buttons: [{ side: 'right', y: 135, height: 48, width: 3 }, { side: 'right', y: 205, height: 62, width: 3 }] }, back: { width: 258, height: 538, borderRadius: 28, color: 'rgba(255,255,255,0.15)', frameColor: '#e8e8e8', cameras: [{ cx: 35, cy: 35, r: 20 }, { cx: 35, cy: 95, r: 20 }, { cx: 80, cy: 35, r: 10, type: 'flash' }] }, side: { width: 80, height: 538, borderRadius: 8, color: 'rgba(255,255,255,0.15)', frameColor: '#e8e8e8', buttons: [{ side: 'right', y: 135, height: 48, width: 4 }, { side: 'right', y: 205, height: 62, width: 4 }] }, top: { width: 258, height: 80, borderRadius: 28, color: 'rgba(255,255,255,0.15)', frameColor: '#e8e8e8', speakers: [] }, bottom: { width: 258, height: 80, borderRadius: 28, color: 'rgba(255,255,255,0.15)', frameColor: '#e8e8e8', ports: [{ x: 94, y: 37, width: 70, height: 12 }], speakers: [{ x: 26, y: 43, width: 5, height: 12 }, { x: 38, y: 43, width: 5, height: 12 }, { x: 50, y: 43, width: 5, height: 12 }, { x: 200, y: 43, width: 5, height: 12 }, { x: 212, y: 43, width: 5, height: 12 }, { x: 224, y: 43, width: 5, height: 12 }] } } }, huaweip60: { label: 'Huawei P60 Pro', views: { front: { width: 262, height: 542, borderRadius: 34, color: '#1a1a1a', frameColor: '#2a2a2a', buttons: [{ side: 'right', y: 138, height: 52, width: 3 }, { side: 'right', y: 212, height: 68, width: 3 }] }, back: { width: 262, height: 542, borderRadius: 34, color: '#f5f5f0', frameColor: '#e0e0db', island: { type: 'circle', x: 18, y: 18, r: 72, color: '#e8e8e3' }, cameras: [{ cx: 50, cy: 50, r: 22 }, { cx: 50, cy: 110, r: 22 }, { cx: 110, cy: 80, r: 18 }, { cx: 90, cy: 35, r: 10, type: 'flash' }] }, side: { width: 83, height: 542, borderRadius: 8, color: '#f5f5f0', frameColor: '#e0e0db', buttons: [{ side: 'right', y: 138, height: 52, width: 4 }, { side: 'right', y: 212, height: 68, width: 4 }] }, top: { width: 262, height: 83, borderRadius: 34, color: '#f5f5f0', frameColor: '#e0e0db', speakers: [] }, bottom: { width: 262, height: 83, borderRadius: 34, color: '#f5f5f0', frameColor: '#e0e0db', ports: [{ x: 96, y: 39, width: 70, height: 12 }], speakers: [{ x: 27, y: 45, width: 5, height: 12 }, { x: 40, y: 45, width: 5, height: 12 }, { x: 53, y: 45, width: 5, height: 12 }, { x: 202, y: 45, width: 5, height: 12 }, { x: 215, y: 45, width: 5, height: 12 }, { x: 228, y: 45, width: 5, height: 12 }] } } }
};

const PhoneCaseDesigner = () => {
  const [deviceKey, setDeviceKey] = useState('iphone15pro');
  const [view, setView] = useState('back');
  const [image, setImage] = useState(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);

  const dragStart = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });
  const svgRef = useRef(null);

  const currentDevice = devices[deviceKey].views[view];

  const handleFileChange = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
      setTransform({ x: 0, y: 0, scale: 1 });
    };
    reader.readAsDataURL(file);
    return false; // запрет стандартного upload
  };

  const handlePointerDown = (e) => {
    if (!image) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: transform.x,
      initialY: transform.y,
    };
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();

    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    setTransform((prev) => ({
      ...prev,
      x: dragStart.current.initialX + dx,
      y: dragStart.current.initialY + dy,
    }));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointermove', handlePointerMove);
    } else {
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointermove', handlePointerMove);
    }
    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [isDragging]);

  const handleZoom = (value) => {
    setTransform((prev) => ({ ...prev, scale: value }));
  };

  const renderDevice = () => {
    const w = currentDevice.width;
    const h = currentDevice.height;

    return (
      <svg
        ref={svgRef}
        width={w + 80}
        height={h + 80}
        viewBox={`-40 -40 ${w + 80} ${h + 80}`}
        style={{
          cursor: isDragging ? 'grabbing' : image ? 'grab' : 'default',
          filter: 'drop-shadow(0 20px 45px rgba(0,0,0,0.55))',
          touchAction: 'none',
          background:
            'radial-gradient(circle at 20% 0%, #ffffff 0, #f3f4f6 35%, #d1d5db 100%)',
          borderRadius: 32,
        }}
        onPointerDown={handlePointerDown}
      >
        <defs>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={currentDevice.frameColor} />
            <stop offset="45%" stopColor={currentDevice.color} />
            <stop offset="100%" stopColor={currentDevice.frameColor} />
          </linearGradient>

          <radialGradient id="lensGrad" cx="30%" cy="30%">
            <stop offset="0%" stopColor="#666" />
            <stop offset="75%" stopColor="#000" />
            <stop offset="100%" stopColor="#050505" />
          </radialGradient>

          <radialGradient id="glare" cx="30%" cy="20%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0.0)" />
          </radialGradient>

          <linearGradient id="edgeHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
          </linearGradient>

          <clipPath id="phoneMask">
            <rect
              x={0}
              y={0}
              width={w}
              height={h}
              rx={currentDevice.borderRadius}
              ry={currentDevice.borderRadius}
            />
          </clipPath>
        </defs>

        {/* "стол" под телефоном */}
        <ellipse
          cx={w / 2}
          cy={h + 20}
          rx={w * 0.7}
          ry={30}
          fill="rgba(15,23,42,0.12)"
        />

        {/* Тело телефона */}
        <rect
          x={0}
          y={0}
          width={w}
          height={h}
          rx={currentDevice.borderRadius}
          ry={currentDevice.borderRadius}
          fill="url(#bodyGrad)"
          stroke={currentDevice.frameColor}
          strokeWidth={3}
        />

        {/* Лёгкий боковой блик */}
        <rect
          x={1.5}
          y={4}
          width={w - 3}
          height={h - 8}
          rx={currentDevice.borderRadius - 4}
          ry={currentDevice.borderRadius - 4}
          fill="url(#edgeHighlight)"
          opacity={0.22}
          pointerEvents="none"
        />

        <g clipPath="url(#phoneMask)">
          {/* Картинка на чехле */}
          {image && (
            <image
              href={image}
              x={transform.x}
              y={transform.y}
              width={w}
              height={h}
              style={{
                transformBox: 'fill-box',
                transformOrigin: 'center',
                transform: `scale(${transform.scale})`,
              }}
              preserveAspectRatio="xMidYMid slice"
            />
          )}

          {/* Лёгкий общий градиент, чтобы картинка "вписалась" в материал */}
          <rect
            x={0}
            y={0}
            width={w}
            height={h}
            fill="url(#bodyGrad)"
            style={{ mixBlendMode: 'multiply', opacity: 0.18 }}
            pointerEvents="none"
          />

          {/* Блик стекла */}
          <rect
            x={-w * 0.2}
            y={0}
            width={w * 0.7}
            height={h * 0.7}
            fill="url(#glare)"
            transform={`rotate(-18 ${w / 2} ${h / 2})`}
            opacity={view === 'back' || view === 'front' ? 0.6 : 0.25}
            pointerEvents="none"
          />
        </g>

        {/* Островок / камера-блок */}
        {currentDevice.island && (
          currentDevice.island.type === 'rect' ? (
            <rect
              x={currentDevice.island.x}
              y={currentDevice.island.y}
              width={currentDevice.island.w}
              height={currentDevice.island.h}
              rx={currentDevice.island.r}
              fill={currentDevice.island.color}
              style={{
                filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.55))',
              }}
              opacity={0.98}
            />
          ) : currentDevice.island.type === 'bar' ? (
            <rect
              x={0}
              y={currentDevice.island.y}
              width={w}
              height={currentDevice.island.h}
              rx={10}
              fill={currentDevice.island.color}
              style={{
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.45))',
              }}
            />
          ) : (
            <circle
              cx={currentDevice.island.x + currentDevice.island.r}
              cy={currentDevice.island.y + currentDevice.island.r}
              r={currentDevice.island.r}
              fill={currentDevice.island.color}
              style={{
                filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))',
              }}
              opacity={0.98}
            />
          )
        )}

        {/* Камеры */}
        {currentDevice.cameras?.map((cam, idx) => (
          <g key={idx}>
            <circle
              cx={cam.cx}
              cy={cam.cy}
              r={cam.r + 4}
              fill="#050505"
              stroke="#1f2933"
              strokeWidth={1.7}
            />
            <circle
              cx={cam.cx}
              cy={cam.cy}
              r={cam.r}
              fill={
                cam.type === 'flash'
                  ? '#fffbe6'
                  : cam.type === 'lidar'
                    ? '#050505'
                    : 'url(#lensGrad)'
              }
              opacity={cam.type === 'flash' ? 0.92 : 1}
            />
            {!cam.type && (
              <>
                <circle
                  cx={cam.cx - cam.r * 0.35}
                  cy={cam.cy - cam.r * 0.35}
                  r={cam.r * 0.45}
                  fill="url(#glare)"
                  opacity={0.85}
                />
                <circle
                  cx={cam.cx}
                  cy={cam.cy}
                  r={cam.r * 0.65}
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth={1}
                />
              </>
            )}
          </g>
        ))}

        {/* Кнопки */}
        {currentDevice.buttons?.map((btn, idx) => {
          const x =
            btn.side === 'left'
              ? -3
              : btn.side === 'right'
                ? currentDevice.width
                : btn.x || 0;
          const y = btn.y || 0;
          const wBtn = btn.width || 3;
          const hBtn = btn.height || 40;

          return (
            <rect
              key={idx}
              x={x}
              y={y}
              width={wBtn}
              height={hBtn}
              rx={2}
              fill={currentDevice.frameColor}
              stroke={currentDevice.color}
              strokeWidth={0.6}
              opacity={0.85}
            />
          );
        })}

        {/* Порт / динамики */}
        {currentDevice.ports?.map((port, idx) => (
          <rect
            key={idx}
            x={port.x}
            y={port.y}
            width={port.width}
            height={port.height}
            rx={4}
            fill="#050505"
            stroke="#020617"
            strokeWidth={1}
          />
        ))}

        {currentDevice.speakers?.map((speaker, idx) => (
          <rect
            key={idx}
            x={speaker.x}
            y={speaker.y}
            width={speaker.width}
            height={speaker.height}
            rx={1}
            fill="#111827"
            stroke="#020617"
            strokeWidth={0.5}
          />
        ))}
      </svg>
    );
  };

  return (
    <Layout
      style={{
        minHeight: '90vh',
        background:
          'radial-gradient(circle at top, #e0f2fe 0, #f9fafb 40%, #e5e7eb 100%)',
      }}
    >


      <Content style={{ padding: '0 16px 32px' }}>
        <Row gutter={[24, 24]} justify="center">
          <Col xs={24} lg={12}>
            <Card
              style={{ borderRadius: 24 }}
              bodyStyle={{ padding: 24 }}
            >
              <Row gutter={[16, 16]}>
                <Col span={24} md={12}>
                  <Text strong>Модель устройства</Text>
                  <Select
                    value={deviceKey}
                    onChange={(v) => setDeviceKey(v)}
                    style={{ width: '100%', marginTop: 8 }}
                    size="large"
                    options={Object.entries(devices).map(
                      ([key, device]) => ({
                        label: device.label,
                        value: key,
                      })
                    )}
                  />
                </Col>

                <Col span={24} md={12}>
                  <Text strong>
                    <Space size={6}>
                      <EyeOutlined />
                      Вид устройства
                    </Space>
                  </Text>
                  <Space
                    wrap
                    style={{ marginTop: 8, width: '100%' }}
                  >
                    {(['front', 'back', 'side']).map(
                      (v) => (
                        <button
                          key={v}
                          onClick={() => setView(v)}
                          className={`px-3 py-2 rounded-lg font-medium transition-all ${view === v
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                          {v === 'front'
                            ? 'Спереди'
                            : v === 'back'
                              ? 'Сзади'
                              : 'Сбоку'}
                        </button>
                      )
                    )}
                    {(['top', 'bottom']).map((v) => (
                      <button
                        key={v}
                        onClick={() => setView(v)}
                        className={`px-3 py-2 rounded-lg font-medium transition-all ${view === v
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {v === 'top' ? 'Сверху' : 'Снизу'}
                      </button>
                    ))}
                  </Space>
                </Col>
              </Row>

              <div style={{ marginTop: 24 }}>
                <Text strong>Загрузить изображение</Text>
                <Upload.Dragger
                  name="file"
                  multiple={false}
                  beforeUpload={handleFileChange}
                  showUploadList={false}
                  style={{ marginTop: 8, borderRadius: 16 }}
                >
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">
                    Перетащите файл сюда или нажмите для выбора
                  </p>
                  <p className="ant-upload-hint">
                    Поддерживаются любые изображения
                  </p>
                </Upload.Dragger>
              </div>

              {image && (
                <div style={{ marginTop: 24 }}>
                  <Space
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text strong>
                      Масштаб: {transform.scale.toFixed(1)}x
                    </Text>
                  </Space>
                  <Slider
                    min={0.5}
                    max={4}
                    step={0.1}
                    value={transform.scale}
                    onChange={handleZoom}
                  />
                  <Text type="secondary">
                    Перетащите изображение по телефону, чтобы
                    точно позиционировать дизайн.
                  </Text>
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              style={{ borderRadius: 24 }}
            >
              {renderDevice()}
            </Card>

            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Text type="secondary">
                Совет: выберите модель и вид устройства, загрузите
                картинку, а затем используйте масштаб и
                перетаскивание для идеальной посадки.
              </Text>
            </div>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default PhoneCaseDesigner;