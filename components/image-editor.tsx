"use client";

import {
  Brush,
  Check,
  Crop,
  RotateCcw,
  Undo2,
  X,
  ZoomIn,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

const OUTPUT_WIDTH = 800;
const OUTPUT_HEIGHT = 600;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

type Point = { x: number; y: number };
type Stroke = { points: Point[]; size: number };

function drawStrokeMask(context: CanvasRenderingContext2D, stroke: Stroke) {
  if (!stroke.points.length) return;
  context.save();
  context.fillStyle = "#fff";
  context.strokeStyle = "#fff";
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = stroke.size;

  if (stroke.points.length === 1) {
    context.beginPath();
    context.arc(
      stroke.points[0].x,
      stroke.points[0].y,
      stroke.size / 2,
      0,
      Math.PI * 2,
    );
    context.fill();
  } else {
    context.beginPath();
    context.moveTo(stroke.points[0].x, stroke.points[0].y);
    stroke.points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
    context.stroke();
  }
  context.restore();
}

// CanvasRenderingContext2D.filter is undefined in Safari < 18 — use scale-down fallback
function createBlurredCanvas(
  image: HTMLImageElement,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  if (typeof ctx.filter === "string") {
    ctx.filter = "blur(18px)";
    ctx.drawImage(image, 0, 0, width, height);
    ctx.filter = "none";
    return canvas;
  }

  // Fallback: scale way down then back up — bilinear interpolation creates blur
  const ratio = 0.05;
  const sw = Math.max(1, Math.round(width * ratio));
  const sh = Math.max(1, Math.round(height * ratio));
  const small = document.createElement("canvas");
  small.width = sw;
  small.height = sh;
  const sCtx = small.getContext("2d")!;
  sCtx.imageSmoothingEnabled = true;
  sCtx.drawImage(image, 0, 0, sw, sh);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(small, 0, 0, width, height);
  return canvas;
}

export function ImageEditor({
  source,
  onCancel,
  onComplete,
}: {
  source: string;
  onCancel: () => void;
  onComplete: (image: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const croppedImageRef = useRef<HTMLImageElement | null>(null);
  const blurredCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const effectCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Crop mode — track all active pointers
  const cropPointersRef = useRef<Map<number, { clientX: number; clientY: number }>>(new Map());
  // Single-finger pan
  const panRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startOffset: Point;
  } | null>(null);
  // Two-finger pinch
  const pinchRef = useRef<{
    startDistance: number;
    startZoom: number;
    startOffset: Point;
    midCanvasX: number;
    midCanvasY: number;
  } | null>(null);

  // Blur mode — track single brush pointer
  const blurPointerRef = useRef<number | null>(null);

  const [step, setStep] = useState<"crop" | "blur">("crop");
  const [sourceReady, setSourceReady] = useState(false);
  const [croppedReady, setCroppedReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [brushSize, setBrushSize] = useState(42);
  const [strokes, setStrokes] = useState<Stroke[]>([]);

  // Always-current refs to avoid stale closures in pointer handlers
  const zoomRef = useRef(zoom);
  const offsetRef = useRef(offset);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { offsetRef.current = offset; }, [offset]);

  useEffect(() => {
    const image = new window.Image();
    image.onload = () => {
      sourceImageRef.current = image;
      setSourceReady(true);
    };
    image.src = source;
  }, [source]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  const getImageMetrics = useCallback((nextZoom: number) => {
    const image = sourceImageRef.current;
    if (!image) return null;
    const coverScale = Math.max(
      OUTPUT_WIDTH / image.naturalWidth,
      OUTPUT_HEIGHT / image.naturalHeight,
    );
    const width = image.naturalWidth * coverScale * nextZoom;
    const height = image.naturalHeight * coverScale * nextZoom;
    return {
      width,
      height,
      maxX: Math.max(0, (width - OUTPUT_WIDTH) / 2),
      maxY: Math.max(0, (height - OUTPUT_HEIGHT) / 2),
    };
  }, []);

  const clampOffset = useCallback(
    (nextOffset: Point, nextZoom: number) => {
      const metrics = getImageMetrics(nextZoom);
      if (!metrics) return nextOffset;
      return {
        x: Math.max(-metrics.maxX, Math.min(metrics.maxX, nextOffset.x)),
        y: Math.max(-metrics.maxY, Math.min(metrics.maxY, nextOffset.y)),
      };
    },
    [getImageMetrics],
  );

  const drawCrop = useCallback(() => {
    const canvas = canvasRef.current;
    const image = sourceImageRef.current;
    const metrics = getImageMetrics(zoom);
    if (!canvas || !image || !metrics) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "#fff";
    context.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
    context.drawImage(
      image,
      (OUTPUT_WIDTH - metrics.width) / 2 + offset.x,
      (OUTPUT_HEIGHT - metrics.height) / 2 + offset.y,
      metrics.width,
      metrics.height,
    );
  }, [getImageMetrics, offset, zoom]);

  const drawBlur = useCallback(() => {
    const canvas = canvasRef.current;
    const image = croppedImageRef.current;
    if (!canvas || !image) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "#fff";
    context.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
    context.drawImage(image, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

    if (!strokes.length) return;

    if (!blurredCanvasRef.current) {
      blurredCanvasRef.current = createBlurredCanvas(image, OUTPUT_WIDTH, OUTPUT_HEIGHT);
    }

    const maskCanvas = maskCanvasRef.current ?? document.createElement("canvas");
    maskCanvas.width = OUTPUT_WIDTH;
    maskCanvas.height = OUTPUT_HEIGHT;
    maskCanvasRef.current = maskCanvas;
    const maskContext = maskCanvas.getContext("2d");
    if (!maskContext) return;
    maskContext.clearRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
    strokes.forEach((stroke) => drawStrokeMask(maskContext, stroke));

    const effectCanvas = effectCanvasRef.current ?? document.createElement("canvas");
    effectCanvas.width = OUTPUT_WIDTH;
    effectCanvas.height = OUTPUT_HEIGHT;
    effectCanvasRef.current = effectCanvas;
    const effectContext = effectCanvas.getContext("2d");
    if (!effectContext) return;
    effectContext.clearRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
    effectContext.globalCompositeOperation = "source-over";
    effectContext.drawImage(blurredCanvasRef.current, 0, 0);
    effectContext.globalCompositeOperation = "destination-in";
    effectContext.drawImage(maskCanvas, 0, 0);
    effectContext.globalCompositeOperation = "source-over";

    context.drawImage(effectCanvas, 0, 0);
  }, [strokes]);

  useEffect(() => {
    if (step === "crop" && sourceReady) drawCrop();
  }, [drawCrop, sourceReady, step]);

  useEffect(() => {
    if (step === "blur" && croppedReady) drawBlur();
  }, [croppedReady, drawBlur, step]);

  const getCanvasPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * OUTPUT_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * OUTPUT_HEIGHT,
    };
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);

    if (step === "crop") {
      cropPointersRef.current.set(event.pointerId, {
        clientX: event.clientX,
        clientY: event.clientY,
      });

      if (cropPointersRef.current.size >= 2) {
        // Second finger down — switch to pinch, cancel any pan
        panRef.current = null;
        const rect = event.currentTarget.getBoundingClientRect();
        const pts = Array.from(cropPointersRef.current.values());
        const [p1, p2] = pts;
        const distance = Math.hypot(p2.clientX - p1.clientX, p2.clientY - p1.clientY);
        const midClientX = (p1.clientX + p2.clientX) / 2;
        const midClientY = (p1.clientY + p2.clientY) / 2;
        pinchRef.current = {
          startDistance: distance,
          startZoom: zoomRef.current,
          startOffset: offsetRef.current,
          midCanvasX: ((midClientX - rect.left) / rect.width) * OUTPUT_WIDTH,
          midCanvasY: ((midClientY - rect.top) / rect.height) * OUTPUT_HEIGHT,
        };
      } else {
        // First finger — start pan
        panRef.current = {
          pointerId: event.pointerId,
          startClientX: event.clientX,
          startClientY: event.clientY,
          startOffset: offsetRef.current,
        };
      }
      return;
    }

    // Blur mode — only the first active pointer draws
    if (blurPointerRef.current === null) {
      const stroke = { points: [getCanvasPoint(event)], size: brushSize };
      blurPointerRef.current = event.pointerId;
      setStrokes((current) => [...current, stroke]);
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (step === "crop") {
      cropPointersRef.current.set(event.pointerId, {
        clientX: event.clientX,
        clientY: event.clientY,
      });

      if (cropPointersRef.current.size >= 2 && pinchRef.current) {
        const pinch = pinchRef.current;
        const pts = Array.from(cropPointersRef.current.values());
        const [p1, p2] = pts;
        const distance = Math.hypot(p2.clientX - p1.clientX, p2.clientY - p1.clientY);
        const ratio = distance / pinch.startDistance;
        const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pinch.startZoom * ratio));
        const r = nextZoom / pinch.startZoom;
        const { midCanvasX: cx, midCanvasY: cy, startOffset } = pinch;

        // Keep the pinch midpoint fixed in canvas space while zooming
        // Formula: newOffset = (cx - W/2) + r * (W/2 - cx + oldOffset)
        const nextOffset = clampOffset(
          {
            x: cx - OUTPUT_WIDTH / 2 + r * (OUTPUT_WIDTH / 2 - cx + startOffset.x),
            y: cy - OUTPUT_HEIGHT / 2 + r * (OUTPUT_HEIGHT / 2 - cy + startOffset.y),
          },
          nextZoom,
        );

        setZoom(nextZoom);
        setOffset(nextOffset);
      } else if (cropPointersRef.current.size === 1 && panRef.current?.pointerId === event.pointerId) {
        const pan = panRef.current;
        const rect = event.currentTarget.getBoundingClientRect();
        setOffset(
          clampOffset(
            {
              x: pan.startOffset.x + ((event.clientX - pan.startClientX) / rect.width) * OUTPUT_WIDTH,
              y: pan.startOffset.y + ((event.clientY - pan.startClientY) / rect.height) * OUTPUT_HEIGHT,
            },
            zoomRef.current,
          ),
        );
      }
      return;
    }

    if (blurPointerRef.current !== event.pointerId) return;
    const point = getCanvasPoint(event);
    setStrokes((current) => {
      if (!current.length) return current;
      const next = [...current];
      const last = next[next.length - 1];
      next[next.length - 1] = { ...last, points: [...last.points, point] };
      return next;
    });
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (step === "crop") {
      cropPointersRef.current.delete(event.pointerId);

      if (cropPointersRef.current.size < 2) {
        pinchRef.current = null;
      }

      if (cropPointersRef.current.size === 1 && pinchRef.current === null) {
        // One finger remains after pinch — restart pan from its current position
        const [remainingId, remainingPos] = Array.from(cropPointersRef.current.entries())[0];
        panRef.current = {
          pointerId: remainingId,
          startClientX: remainingPos.clientX,
          startClientY: remainingPos.clientY,
          startOffset: offsetRef.current,
        };
      }

      if (cropPointersRef.current.size === 0) {
        panRef.current = null;
      }
      return;
    }

    if (blurPointerRef.current === event.pointerId) blurPointerRef.current = null;
  };

  const applyCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const croppedSource = canvas.toDataURL("image/jpeg", 0.86);
    const image = new window.Image();
    setCroppedReady(false);
    image.onload = () => {
      croppedImageRef.current = image;
      blurredCanvasRef.current = null;
      maskCanvasRef.current = null;
      effectCanvasRef.current = null;
      setCroppedReady(true);
    };
    image.src = croppedSource;
    setStrokes([]);
    setStep("blur");
    cropPointersRef.current.clear();
    panRef.current = null;
    pinchRef.current = null;
  };

  const finishEditing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onComplete(canvas.toDataURL("image/jpeg", 0.82));
  };

  return (
    <div className="image-editor-backdrop">
      <section
        className="image-editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-editor-title"
      >
        <header className="image-editor-header">
          <div>
            <span className="image-editor-kicker">사진 편집</span>
            <h2 id="image-editor-title">
              {step === "crop" ? "판독할 글씨만 남겨주세요" : "가릴 글씨를 블러 처리해 주세요"}
            </h2>
          </div>
          <button className="icon-button" type="button" onClick={onCancel} aria-label="편집 취소">
            <X size={21} />
          </button>
        </header>

        <div className="image-editor-steps" aria-label="편집 단계">
          <span className={step === "crop" ? "active" : "done"}>
            <Crop size={15} /> 1. 영역 선택
          </span>
          <span className={step === "blur" ? "active" : ""}>
            <Brush size={15} /> 2. 블러 처리
          </span>
        </div>

        <div className="image-editor-canvas-wrap">
          <canvas
            ref={canvasRef}
            className={step === "blur" ? "is-blurring" : undefined}
            width={OUTPUT_WIDTH}
            height={OUTPUT_HEIGHT}
            style={{ touchAction: "none" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            aria-label={step === "crop" ? "사진 크롭 영역" : "불필요한 글씨 블러 처리 영역"}
          />
          {step === "crop" ? <div className="image-editor-grid" aria-hidden="true" /> : null}
        </div>

        {step === "crop" ? (
          <div className="image-editor-controls">
            <p>사진을 드래그하거나 두 손가락으로 확대해 글씨를 프레임에 맞춰주세요.</p>
            <label className="image-editor-slider">
              <ZoomIn size={18} />
              <span>확대</span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(event) => {
                  const nextZoom = Number(event.target.value);
                  setZoom(nextZoom);
                  setOffset((current) => clampOffset(current, nextZoom));
                }}
              />
            </label>
          </div>
        ) : (
          <div className="image-editor-controls">
            <p>사진 위를 문지르면 해당 부분이 흐리게 가려져요.</p>
            <label className="image-editor-slider">
              <Brush size={18} />
              <span>범위</span>
              <input
                type="range"
                min="16"
                max="90"
                step="2"
                value={brushSize}
                onChange={(event) => setBrushSize(Number(event.target.value))}
              />
            </label>
            <div className="image-editor-tools">
              <button
                type="button"
                onClick={() => setStrokes((current) => current.slice(0, -1))}
                disabled={!strokes.length}
              >
                <Undo2 size={17} /> 되돌리기
              </button>
              <button type="button" onClick={() => setStrokes([])} disabled={!strokes.length}>
                <RotateCcw size={17} /> 블러 초기화
              </button>
            </div>
          </div>
        )}

        <footer className="image-editor-actions">
          {step === "blur" ? (
            <button className="button button-ghost button-small" type="button" onClick={() => setStep("crop")}>
              이전
            </button>
          ) : (
            <button className="button button-ghost button-small" type="button" onClick={onCancel}>
              취소
            </button>
          )}
          <button
            className="button button-accent button-small button-grow"
            type="button"
            onClick={step === "crop" ? applyCrop : finishEditing}
            disabled={step === "crop" ? !sourceReady : !croppedReady}
          >
            {step === "crop" ? (
              <><Crop size={17} /> 크롭 적용</>
            ) : (
              <><Check size={17} /> 편집 완료</>
            )}
          </button>
        </footer>
      </section>
    </div>
  );
}
