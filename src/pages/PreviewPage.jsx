import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  EyeOutlined,
  UploadOutlined,
  ReloadOutlined,
  ZoomInOutlined,
  AimOutlined,
  BgColorsOutlined,
} from '@ant-design/icons';
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
  Button,
  Segmented,
  Divider,
} from 'antd';

const { Content } = Layout;
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

  iphone14: {
    label: 'iPhone 14',
    views: {
      front: {
        width: 255,
        height: 530,
        borderRadius: 42,
        color: '#1c1c1e',
        frameColor: '#2c2c2e',
        buttons: [
          { side: 'left', y: 100, height: 40, width: 3 },
          { side: 'left', y: 160, height: 50, width: 3 },
          { side: 'left', y: 220, height: 50, width: 3 },
          { side: 'right', y: 180, height: 70, width: 3 },
        ],
      },
      back: {
        width: 255,
        height: 530,
        borderRadius: 42,
        color: '#e8e8ed',
        frameColor: '#c7c7cc',
        island: {
          type: 'rect',
          x: 10,
          y: 10,
          w: 90,
          h: 90,
          r: 25,
          color: '#d8d8dd',
        },
        cameras: [
          { cx: 35, cy: 35, r: 18 },
          { cx: 70, cy: 70, r: 18 },
          { cx: 65, cy: 25, r: 8, type: 'flash' },
        ],
      },
      side: {
        width: 75,
        height: 530,
        borderRadius: 8,
        color: '#e8e8ed',
        frameColor: '#c7c7cc',
        buttons: [
          { side: 'left', y: 100, height: 40, width: 4 },
          { side: 'left', y: 160, height: 50, width: 4 },
          { side: 'left', y: 220, height: 50, width: 4 },
        ],
      },
      top: {
        width: 255,
        height: 75,
        borderRadius: 42,
        color: '#e8e8ed',
        frameColor: '#c7c7cc',
        speakers: [{ x: 95, y: 35, width: 65, height: 8 }],
      },
      bottom: {
        width: 255,
        height: 75,
        borderRadius: 42,
        color: '#e8e8ed',
        frameColor: '#c7c7cc',
        ports: [{ x: 95, y: 35, width: 65, height: 10 }],
        speakers: [
          { x: 30, y: 40, width: 4, height: 10 },
          { x: 40, y: 40, width: 4, height: 10 },
          { x: 50, y: 40, width: 4, height: 10 },
          { x: 195, y: 40, width: 4, height: 10 },
          { x: 205, y: 40, width: 4, height: 10 },
          { x: 215, y: 40, width: 4, height: 10 },
        ],
      },
    },
  },

  samsungs24: {
    label: 'Samsung S24 Ultra',
    views: {
      front: {
        width: 270,
        height: 560,
        borderRadius: 10,
        color: '#1a1a1a',
        frameColor: '#2a2a2a',
        buttons: [
          { side: 'right', y: 120, height: 50, width: 3 },
          { side: 'right', y: 200, height: 70, width: 3 },
        ],
      },
      back: {
        width: 270,
        height: 560,
        borderRadius: 10,
        color: '#e0e0e0',
        frameColor: '#c0c0c0',
        cameras: [
          { cx: 45, cy: 45, r: 16 },
          { cx: 45, cy: 95, r: 16 },
          { cx: 45, cy: 145, r: 16 },
          { cx: 90, cy: 120, r: 14 },
          { cx: 90, cy: 70, r: 10, type: 'sensor' },
        ],
      },
      side: {
        width: 85,
        height: 560,
        borderRadius: 5,
        color: '#e0e0e0',
        frameColor: '#c0c0c0',
        buttons: [
          { side: 'right', y: 120, height: 50, width: 4 },
          { side: 'right', y: 200, height: 70, width: 4 },
        ],
      },
      top: {
        width: 270,
        height: 85,
        borderRadius: 10,
        color: '#e0e0e0',
        frameColor: '#c0c0c0',
        speakers: [],
      },
      bottom: {
        width: 270,
        height: 85,
        borderRadius: 10,
        color: '#e0e0e0',
        frameColor: '#c0c0c0',
        ports: [{ x: 105, y: 40, width: 60, height: 12 }],
        speakers: [
          { x: 30, y: 45, width: 5, height: 12 },
          { x: 42, y: 45, width: 5, height: 12 },
          { x: 54, y: 45, width: 5, height: 12 },
          { x: 210, y: 45, width: 5, height: 12 },
          { x: 222, y: 45, width: 5, height: 12 },
          { x: 234, y: 45, width: 5, height: 12 },
        ],
      },
    },
  },

  pixel8: {
    label: 'Pixel 8 Pro',
    views: {
      front: {
        width: 255,
        height: 535,
        borderRadius: 35,
        color: '#1a1a1a',
        frameColor: '#2a2a2a',
        buttons: [
          { side: 'right', y: 150, height: 50, width: 3 },
          { side: 'right', y: 220, height: 60, width: 3 },
        ],
      },
      back: {
        width: 255,
        height: 535,
        borderRadius: 35,
        color: '#f0f4f8',
        frameColor: '#d1d5db',
        island: { type: 'bar', y: 35, h: 60, color: '#dbeafe' },
        cameras: [
          { cx: 70, cy: 65, r: 15 },
          { cx: 120, cy: 65, r: 15 },
          { cx: 170, cy: 65, r: 15 },
        ],
      },
      side: {
        width: 82,
        height: 535,
        borderRadius: 8,
        color: '#f0f4f8',
        frameColor: '#d1d5db',
        buttons: [
          { side: 'right', y: 150, height: 50, width: 4 },
          { side: 'right', y: 220, height: 60, width: 4 },
        ],
      },
      top: {
        width: 255,
        height: 82,
        borderRadius: 35,
        color: '#f0f4f8',
        frameColor: '#d1d5db',
        speakers: [{ x: 95, y: 38, width: 65, height: 8 }],
      },
      bottom: {
        width: 255,
        height: 82,
        borderRadius: 35,
        color: '#f0f4f8',
        frameColor: '#d1d5db',
        ports: [{ x: 95, y: 38, width: 65, height: 12 }],
        speakers: [
          { x: 30, y: 45, width: 4, height: 10 },
          { x: 40, y: 45, width: 4, height: 10 },
          { x: 50, y: 45, width: 4, height: 10 },
          { x: 195, y: 45, width: 4, height: 10 },
          { x: 205, y: 45, width: 4, height: 10 },
          { x: 215, y: 45, width: 4, height: 10 },
        ],
      },
    },
  },
};

const viewOptions = [
  { label: 'Спереди', value: 'front' },
  { label: 'Сзади', value: 'back' },
  { label: 'Сбоку', value: 'side' },
  { label: 'Сверху', value: 'top' },
  { label: 'Снизу', value: 'bottom' },
];

const bgPresets = {
  soft: 'radial-gradient(circle at top, #e0f2fe 0, #f9fafb 40%, #e5e7eb 100%)',
  dark: 'radial-gradient(circle at top, #1e293b 0, #0f172a 45%, #020617 100%)',
  studio: 'radial-gradient(circle at top, #ffffff 0, #eef2ff 30%, #dbeafe 100%)',
};

const PhoneCaseDesigner = () => {
  const [deviceKey, setDeviceKey] = useState('iphone15pro');
  const [view, setView] = useState('back');
  const [image, setImage] = useState(null);
  const [imageMeta, setImageMeta] = useState({ width: 0, height: 0 });

  const [transform, setTransform] = useState({
    x: 0,
    y: 0,
    scale: 1,
    baseScale: 1,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [bgMode, setBgMode] = useState('soft');

  const dragStart = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });
  const svgRef = useRef(null);

  const currentDevice = devices[deviceKey].views[view];

  const fitScale = useMemo(() => {
    if (!imageMeta.width || !imageMeta.height) return 1;
    return Math.min(
      currentDevice.width / imageMeta.width,
      currentDevice.height / imageMeta.height
    );
  }, [currentDevice.width, currentDevice.height, imageMeta.width, imageMeta.height]);

  const centerImage = (scaleMultiplier = 1) => {
    if (!imageMeta.width || !imageMeta.height) return;

    const baseScale = fitScale;
    const actualScale = baseScale * scaleMultiplier;
    const renderedW = imageMeta.width * actualScale;
    const renderedH = imageMeta.height * actualScale;

    setTransform({
      x: (currentDevice.width - renderedW) / 2,
      y: (currentDevice.height - renderedH) / 2,
      scale: scaleMultiplier,
      baseScale,
    });
  };

  const handleFileChange = (file) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        setImage(reader.result);
        setImageMeta({ width: img.width, height: img.height });

        const baseScale = Math.min(
          currentDevice.width / img.width,
          currentDevice.height / img.height
        );

        const renderedW = img.width * baseScale;
        const renderedH = img.height * baseScale;

        setTransform({
          x: (currentDevice.width - renderedW) / 2,
          y: (currentDevice.height - renderedH) / 2,
          scale: 1,
          baseScale,
        });
      };
      img.src = reader.result;
    };

    reader.readAsDataURL(file);
    return false;
  };

  useEffect(() => {
    if (image) {
      centerImage(transform.scale || 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceKey, view]);

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
    setTransform((prev) => {
      const prevActual = prev.baseScale * prev.scale;
      const nextActual = prev.baseScale * value;

      const centerX = currentDevice.width / 2;
      const centerY = currentDevice.height / 2;

      const imageCenterX =
        (centerX - prev.x) / prevActual;
      const imageCenterY =
        (centerY - prev.y) / prevActual;

      return {
        ...prev,
        scale: value,
        x: centerX - imageCenterX * nextActual,
        y: centerY - imageCenterY * nextActual,
      };
    });
  };

  const handleWheel = (e) => {
    if (!image) return;
    e.preventDefault();

    const delta = e.deltaY < 0 ? 0.1 : -0.1;

    setTransform((prev) => {
      const nextScale = Math.max(0.2, Math.min(8, +(prev.scale + delta).toFixed(2)));
      const prevActual = prev.baseScale * prev.scale;
      const nextActual = prev.baseScale * nextScale;

      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return prev;

      const mouseX = e.clientX - rect.left - 40;
      const mouseY = e.clientY - rect.top - 40;

      const imagePointX = (mouseX - prev.x) / prevActual;
      const imagePointY = (mouseY - prev.y) / prevActual;

      return {
        ...prev,
        scale: nextScale,
        x: mouseX - imagePointX * nextActual,
        y: mouseY - imagePointY * nextActual,
      };
    });
  };

  const renderDevice = () => {
    const w = currentDevice.width;
    const h = currentDevice.height;

    const actualScale = transform.baseScale * transform.scale;
    const renderedImageWidth = imageMeta.width * actualScale;
    const renderedImageHeight = imageMeta.height * actualScale;

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          userSelect: 'none',
        }}
      >
        <svg
          ref={svgRef}
          width={w + 80}
          height={h + 80}
          viewBox={`-40 -40 ${w + 80} ${h + 80}`}
          style={{
            cursor: isDragging ? 'grabbing' : image ? 'grab' : 'default',
            filter: 'drop-shadow(0 24px 50px rgba(0,0,0,0.35))',
            touchAction: 'none',
            borderRadius: 36,
          }}
          onPointerDown={handlePointerDown}
          onWheel={handleWheel}
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
              <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
              <stop offset="60%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>

            <linearGradient id="edgeHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.75)" />
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

          <ellipse
            cx={w / 2}
            cy={h + 22}
            rx={w * 0.72}
            ry={28}
            fill="rgba(15,23,42,0.14)"
          />

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

          <rect
            x={1.5}
            y={4}
            width={w - 3}
            height={h - 8}
            rx={Math.max(4, currentDevice.borderRadius - 4)}
            ry={Math.max(4, currentDevice.borderRadius - 4)}
            fill="url(#edgeHighlight)"
            opacity={0.22}
            pointerEvents="none"
          />

          <g clipPath="url(#phoneMask)">
            {!image && (
              <>
                <rect
                  x={0}
                  y={0}
                  width={w}
                  height={h}
                  fill="url(#bodyGrad)"
                />
                <text
                  x={w / 2}
                  y={h / 2 - 10}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.85)"
                  fontSize="18"
                  fontWeight="700"
                >
                  Загрузите дизайн
                </text>
                <text
                  x={w / 2}
                  y={h / 2 + 18}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.55)"
                  fontSize="12"
                >
                  Любую картинку можно вставить и двигать
                </text>
              </>
            )}

            {image && (
              <image
                href={image}
                x={transform.x}
                y={transform.y}
                width={renderedImageWidth}
                height={renderedImageHeight}
                preserveAspectRatio="none"
              />
            )}

            <rect
              x={0}
              y={0}
              width={w}
              height={h}
              fill="url(#bodyGrad)"
              style={{ mixBlendMode: 'multiply', opacity: 0.12 }}
              pointerEvents="none"
            />

            <rect
              x={-w * 0.18}
              y={-5}
              width={w * 0.65}
              height={h * 0.72}
              fill="url(#glare)"
              transform={`rotate(-18 ${w / 2} ${h / 2})`}
              opacity={view === 'back' || view === 'front' ? 0.62 : 0.28}
              pointerEvents="none"
            />
          </g>

          {currentDevice.island &&
            (currentDevice.island.type === 'rect' ? (
              <rect
                x={currentDevice.island.x}
                y={currentDevice.island.y}
                width={currentDevice.island.w}
                height={currentDevice.island.h}
                rx={currentDevice.island.r}
                fill={currentDevice.island.color}
                style={{
                  filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.45))',
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
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.35))',
                }}
              />
            ) : (
              <circle
                cx={currentDevice.island.x + currentDevice.island.r}
                cy={currentDevice.island.y + currentDevice.island.r}
                r={currentDevice.island.r}
                fill={currentDevice.island.color}
                style={{
                  filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.45))',
                }}
              />
            ))}

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
                      : cam.type === 'sensor'
                        ? '#1f2937'
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
                    stroke="rgba(255,255,255,0.14)"
                    strokeWidth={1}
                  />
                </>
              )}
            </g>
          ))}

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
                opacity={0.88}
              />
            );
          })}

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
      </div>
    );
  };

  return (
    <Layout
      style={{
        minHeight: '100vh',
        background: bgPresets[bgMode],
        transition: 'all 0.35s ease',
      }}
    >
      <Content style={{ padding: '24px 16px 40px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div
            style={{
              marginBottom: 24,
              padding: 24,
              borderRadius: 28,
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(14px)',
              boxShadow: '0 20px 60px rgba(15,23,42,0.10)',
              border: '1px solid rgba(255,255,255,0.45)',
            }}
          >
            <Space direction="vertical" size={6}>
              <Title level={2} style={{ margin: 0 }}>
                3D Phone Case Designer
              </Title>
              <Text type="secondary">
                Выбери модель, загрузи изображение и вручную подгони любой участок под форму чехла.
              </Text>
            </Space>
          </div>

          <Row gutter={[24, 24]} align="stretch">
            <Col xs={24} xl={10}>
              <Card
                style={{
                  borderRadius: 28,
                  border: '1px solid rgba(255,255,255,0.55)',
                  background: 'rgba(255,255,255,0.78)',
                  backdropFilter: 'blur(14px)',
                  boxShadow: '0 18px 50px rgba(15,23,42,0.08)',
                }}
                bodyStyle={{ padding: 24 }}
              >
                <Space direction="vertical" size={20} style={{ width: '100%' }}>
                  <div>
                    <Text strong>Модель устройства</Text>
                    <Select
                      value={deviceKey}
                      onChange={setDeviceKey}
                      style={{ width: '100%', marginTop: 8 }}
                      size="large"
                      options={Object.entries(devices).map(([key, device]) => ({
                        label: device.label,
                        value: key,
                      }))}
                    />
                  </div>

                  <div>
                    <Text strong>
                      <Space size={6}>
                        <EyeOutlined />
                        Вид устройства
                      </Space>
                    </Text>
                    <div style={{ marginTop: 10 }}>
                      <Segmented
                        block
                        size="large"
                        options={viewOptions}
                        value={view}
                        onChange={setView}
                      />
                    </div>
                  </div>

                  <div>
                    <Text strong>
                      <Space size={6}>
                        <UploadOutlined />
                        Загрузить изображение
                      </Space>
                    </Text>

                    <Upload.Dragger
                      name="file"
                      multiple={false}
                      beforeUpload={handleFileChange}
                      showUploadList={false}
                      style={{
                        marginTop: 10,
                        borderRadius: 20,
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        border: '1.5px dashed #93c5fd',
                      }}
                    >
                      <p className="ant-upload-drag-icon">
                        <UploadOutlined style={{ fontSize: 28, color: '#2563eb' }} />
                      </p>
                      <p className="ant-upload-text">
                        Перетащите файл сюда или нажмите для выбора
                      </p>
                      <p className="ant-upload-hint">
                        JPG, PNG, WEBP и любые другие изображения
                      </p>
                    </Upload.Dragger>
                  </div>

                  <div>
                    <Text strong>
                      <Space size={6}>
                        <BgColorsOutlined />
                        Фон сцены
                      </Space>
                    </Text>
                    <div style={{ marginTop: 10 }}>
                      <Segmented
                        options={[
                          { label: 'Soft', value: 'soft' },
                          { label: 'Dark', value: 'dark' },
                          { label: 'Studio', value: 'studio' },
                        ]}
                        value={bgMode}
                        onChange={setBgMode}
                      />
                    </div>
                  </div>

                  <Divider style={{ margin: '4px 0' }} />

                  {image && (
                    <>
                      <div>
                        <Space
                          style={{
                            width: '100%',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Text strong>
                            <Space size={6}>
                              <ZoomInOutlined />
                              Масштаб: {transform.scale.toFixed(2)}x
                            </Space>
                          </Text>
                          <Text type="secondary">
                            {imageMeta.width} × {imageMeta.height}
                          </Text>
                        </Space>

                        <Slider
                          min={0.2}
                          max={8}
                          step={0.05}
                          value={transform.scale}
                          onChange={handleZoom}
                          style={{ marginTop: 12 }}
                        />
                      </div>

                      <Space wrap>
                        <Button
                          icon={<ReloadOutlined />}
                          onClick={() => centerImage(1)}
                        >
                          Сбросить
                        </Button>

                        <Button
                          icon={<AimOutlined />}
                          onClick={() => centerImage(transform.scale)}
                        >
                          Центрировать
                        </Button>
                      </Space>

                      <Text type="secondary">
                        Перетаскивай изображение мышкой. Колёсиком мыши тоже можно менять масштаб.
                        Картинка не обрезается автоматически — ты сам выбираешь, какой участок будет внутри макета.
                      </Text>
                    </>
                  )}
                </Space>
              </Card>
            </Col>

            <Col xs={24} xl={14}>
              <Card
                style={{
                  borderRadius: 28,
                  border: '1px solid rgba(255,255,255,0.55)',
                  background: 'rgba(255,255,255,0.55)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 18px 50px rgba(15,23,42,0.08)',
                }}
                bodyStyle={{
                  padding: 24,
                  minHeight: 760,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background:
                    bgMode === 'dark'
                      ? 'radial-gradient(circle at 50% 20%, rgba(255,255,255,0.06), rgba(255,255,255,0) 45%)'
                      : 'radial-gradient(circle at 50% 20%, rgba(255,255,255,0.7), rgba(255,255,255,0) 45%)',
                  borderRadius: 28,
                }}
              >
                {renderDevice()}
              </Card>

              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Text type="secondary">
                  Подсказка: сначала загрузи изображение целиком, потом увеличь и смести его так, чтобы на чехол попал нужный участок.
                </Text>
              </div>
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  );
};

export default PhoneCaseDesigner;