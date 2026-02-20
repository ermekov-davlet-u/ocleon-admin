import React, { useState, useRef } from 'react';

const devices = {
  iphone: { width: 200, height: 400, borderRadius: 30, cameras: [{ cx: 100, cy: 50, r: 15 }, { cx: 130, cy: 50, r: 10 }] },
  samsung: { width: 210, height: 420, borderRadius: 35, cameras: [{ cx: 105, cy: 55, r: 12 }, { cx: 135, cy: 55, r: 12 }] },
  pixel: { width: 190, height: 390, borderRadius: 25, cameras: [{ cx: 95, cy: 45, r: 10 }] },
  xiaomi: { width: 205, height: 410, borderRadius: 28, cameras: [{ cx: 102, cy: 48, r: 14 }, { cx: 130, cy: 48, r: 9 }] },
};

const PhoneCaseDesigner = () => {
  const [device, setDevice] = useState('iphone');
  const [image, setImage] = useState(null);
  const [showSides, setShowSides] = useState(true);

  // координаты картинки чехла
  const [imgPos, setImgPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e) => {
    dragging.current = true;
    offset.current = { x: e.nativeEvent.offsetX - imgPos.x, y: e.nativeEvent.offsetY - imgPos.y };
  };

  const handleMouseMove = (e) => {
    if (!dragging.current) return;
    setImgPos({ x: e.nativeEvent.offsetX - offset.current.x, y: e.nativeEvent.offsetY - offset.current.y });
  };

  const handleMouseUp = () => {
    dragging.current = false;
  };

  const { width, height, borderRadius, cameras } = devices[device];

  return (
    <div style={{ textAlign: 'center', fontFamily: 'Arial, sans-serif', padding: 20 }}>
      <h2>Phone Case Designer</h2>

      <div style={{ marginBottom: 10 }}>
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </div>

      <div style={{ marginBottom: 10 }}>
        <select value={device} onChange={(e) => setDevice(e.target.value)} style={{ marginRight: 10, padding: '5px' }}>
          {Object.keys(devices).map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <label>
          <input type="checkbox" checked={showSides} onChange={() => setShowSides(!showSides)} /> Показать боковые грани
        </label>
      </div>

      <svg
        width={width + (showSides ? 20 : 0)}
        height={height}
        viewBox={`0 0 ${width + (showSides ? 20 : 0)} ${height}`}
        style={{ display: 'block', margin: '20px auto', borderRadius: borderRadius, boxShadow: '0 0 20px rgba(0,0,0,0.3)', cursor: dragging.current ? 'grabbing' : 'grab' }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Боковые грани */}
        {showSides && <rect x="0" y="0" width="10" height={height} fill="#111" rx="5" />}
        {showSides && <rect x={width + 10} y="0" width="10" height={height} fill="#111" rx="5" />}

        {/* Задняя панель телефона */}
        <rect
          x={showSides ? 10 : 0}
          y="0"
          width={width}
          height={height}
          rx={borderRadius}
          ry={borderRadius}
          fill="#222"
        />

        {/* Чехол */}
        {image && (
          <image
            href={image}
            x={(showSides ? 10 : 0) + imgPos.x}
            y={imgPos.y}
            width={width}
            height={height}
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#clipPhone)"
            onMouseDown={handleMouseDown}
          />
        )}

        {/* Камеры */}
        {cameras.map((cam, idx) => (
          <circle
            key={idx}
            cx={cam.cx + (showSides ? 10 : 0)}
            cy={cam.cy}
            r={cam.r}
            fill="#000"
          />
        ))}

        <defs>
          <clipPath id="clipPhone">
            <rect
              x={showSides ? 10 : 0}
              y="0"
              width={width}
              height={height}
              rx={borderRadius}
              ry={borderRadius}
            />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
};

export default PhoneCaseDesigner;
