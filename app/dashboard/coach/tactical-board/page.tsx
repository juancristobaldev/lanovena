"use client";

import React, {
  useState,
  useRef,
  useEffect,
  MouseEvent as ReactMouseEvent,
  TouchEvent as ReactTouchEvent,
} from "react";
import { Save, RefreshCw, Hand, PenTool, Eraser } from "lucide-react";

// --- Tipos ---
interface Token {
  id: string;
  type: "team-a" | "team-b" | "ball" | "cone";
  label?: string;
  x: number; // Porcentaje 0-100
  y: number; // Porcentaje 0-100
}

interface TacticalBoardProps {
  onSave?: (data: { tokens: Token[]; drawing: string }) => void;
}

const TacticalBoard: React.FC<TacticalBoardProps> = ({ onSave }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Estado ---
  const [mode, setMode] = useState<"move" | "draw">("move");
  const [color, setColor] = useState("#ffff00"); // Amarillo por defecto
  const [tokens, setTokens] = useState<Token[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // --- Inicialización ---
  const initBoard = () => {
    const newTokens: Token[] = [];
    // Equipo A (Rojos)
    for (let i = 1; i <= 11; i++) {
      newTokens.push({
        id: `a-${i}`,
        type: "team-a",
        label: `${i}`,
        x: 10 + i * 6,
        y: 10,
      });
    }
    // Equipo B (Azules)
    for (let i = 1; i <= 11; i++) {
      newTokens.push({
        id: `b-${i}`,
        type: "team-b",
        label: `${i}`,
        x: 10 + i * 6,
        y: 85,
      });
    }
    // Objetos
    newTokens.push({ id: "ball", type: "ball", x: 50, y: 50 });
    newTokens.push({ id: "cone-1", type: "cone", x: 5, y: 50 });
    newTokens.push({ id: "cone-2", type: "cone", x: 95, y: 50 });

    setTokens(newTokens);
    clearCanvas();
  };

  // Cargar al montar y manejar resize
  useEffect(() => {
    initBoard();
    const handleResizeWindow = () => handleResize();
    window.addEventListener("resize", handleResizeWindow);
    // Timeout pequeño para asegurar que el contenedor ya tiene tamaño
    setTimeout(handleResize, 100);
    return () => window.removeEventListener("resize", handleResizeWindow);
  }, []);

  // --- Helpers ---

  // Ajusta el tamaño del canvas al del contenedor div
  const handleResize = () => {
    if (containerRef.current && canvasRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      canvasRef.current.width = clientWidth;
      canvasRef.current.height = clientHeight;

      // Al redimensionar se pierde el contexto, hay que reconfigurarlo
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.lineWidth = 3;
        ctx.strokeStyle = color;
      }
    }
  };

  // Obtiene X e Y relativos al contenedor (en Pixeles)
  const getRelativePos = (
    e: ReactMouseEvent | ReactTouchEvent | MouseEvent | TouchEvent,
  ) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();

    let clientX, clientY;

    // Detectar si es Touch o Mouse
    if ("touches" in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ("changedTouches" in e && e.changedTouches.length > 0) {
      // Para eventos 'touchend'
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      // Evento Mouse
      clientX = (e as any).clientX;
      clientY = (e as any).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  // --- Handlers de Interacción ---

  const handleStart = (
    e: ReactMouseEvent | ReactTouchEvent,
    tokenId?: string,
  ) => {
    // Si tocamos un token y estamos en modo MOVE
    if (mode === "move" && tokenId) {
      e.stopPropagation(); // Evita burbujeo
      setDraggingId(tokenId);
      return;
    }

    // Si estamos en modo DRAW (tocando el fondo o un token, da igual)
    if (mode === "draw") {
      // e.preventDefault(); // Comentado para permitir scroll si se toca fuera
      setIsDrawing(true);
      const { x, y } = getRelativePos(e);
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    }
  };

  const handleMove = (e: ReactMouseEvent | ReactTouchEvent) => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Logica de Arrastre (MOVE)
    if (mode === "move" && draggingId) {
      e.preventDefault(); // Evitar scroll al arrastrar
      const { x, y } = getRelativePos(e);
      const rect = container.getBoundingClientRect();

      // Convertir pixeles a porcentaje
      const xPercent = (x / rect.width) * 100;
      const yPercent = (y / rect.height) * 100;

      setTokens((prev) =>
        prev.map((t) =>
          t.id === draggingId
            ? {
                ...t,
                x: Math.max(0, Math.min(xPercent, 100)),
                y: Math.max(0, Math.min(yPercent, 100)),
              }
            : t,
        ),
      );
    }

    // 2. Logica de Dibujo (DRAW)
    if (mode === "draw" && isDrawing) {
      e.preventDefault(); // Evitar scroll al dibujar
      const { x, y } = getRelativePos(e);
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  const handleEnd = () => {
    setDraggingId(null);
    setIsDrawing(false);

    // Cerrar path si estábamos dibujando
    if (mode === "draw") {
      const ctx = canvasRef.current?.getContext("2d");
      ctx?.beginPath();
    }
  };

  // --- Utilidades ---
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSaveClick = () => {
    if (onSave && canvasRef.current) {
      const drawingData = canvasRef.current.toDataURL("image/png");
      onSave({ tokens, drawing: drawingData });
    }
  };

  // Actualizar el color del contexto si cambia el state
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.strokeStyle = color;
  }, [color]);

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-slate-900 text-white font-sans p-2 md:p-6">
      {/* --- Toolbar --- */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-6 bg-slate-800 p-4 rounded-xl shadow-2xl border border-slate-700 z-50 max-w-4xl w-full">
        {/* Selector de Modo */}
        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
          <button
            onClick={() => setMode("move")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold transition-all ${
              mode === "move"
                ? "bg-[#10B981] text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Hand size={18} /> <span className="hidden sm:inline">Mover</span>
          </button>
          <button
            onClick={() => setMode("draw")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold transition-all ${
              mode === "draw"
                ? "bg-[#10B981] text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <PenTool size={18} />{" "}
            <span className="hidden sm:inline">Dibujar</span>
          </button>
        </div>

        <div className="h-8 w-px bg-slate-600 mx-1 hidden sm:block"></div>

        {/* Color Picker */}
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-10 h-10 rounded-full cursor-pointer border-2 border-slate-600 p-0 overflow-hidden bg-transparent"
            title="Color del Lápiz"
          />
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          <button
            onClick={clearCanvas}
            className="bg-slate-700 hover:bg-red-500/80 text-white p-2.5 rounded-lg transition-colors border border-slate-600"
            title="Borrar Dibujos"
          >
            <Eraser size={20} />
          </button>
          <button
            onClick={initBoard}
            className="bg-slate-700 hover:bg-blue-500 text-white p-2.5 rounded-lg transition-colors border border-slate-600"
            title="Resetear Todo"
          >
            <RefreshCw size={20} />
          </button>
        </div>

        <div className="flex-grow hidden sm:block"></div>

        <button
          onClick={handleSaveClick}
          className="w-full sm:w-auto bg-[#312E81] hover:bg-indigo-600 text-white px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold transition-all shadow-lg border border-indigo-900"
        >
          <Save size={18} />
          <span>Guardar</span>
        </button>
      </div>

      {/* --- Cancha Container --- */}
      <div
        ref={containerRef}
        className={`
            relative w-full max-w-[900px] aspect-[16/10] sm:aspect-[4/3] 
            bg-[#2c8f43] border-[6px] border-white rounded shadow-2xl overflow-hidden select-none 
            ${mode === "draw" ? "cursor-crosshair" : "cursor-default"}
            touch-none
        `}
        style={{
          // Patrón de césped sutil
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(0,0,0,0.06) 50px, rgba(0,0,0,0.06) 100px)",
        }}
        // Eventos en el contenedor principal para manejar el Dibujo y el 'mousemove' global
        onMouseDown={(e) => handleStart(e)}
        onTouchStart={(e) => handleStart(e)}
        onMouseMove={handleMove}
        onTouchMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchEnd={handleEnd}
      >
        {/* 1. Líneas de Cancha (CSS Overlay - Fondo) */}
        <div className="absolute inset-0 pointer-events-none opacity-80">
          <div className="absolute top-1/2 left-1/2 w-[15%] h-[20%] min-w-[80px] min-h-[80px] border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute top-1/2 w-full h-0.5 bg-white/70"></div>
          <div className="absolute top-0 left-1/2 w-[30%] h-[15%] border-2 border-t-0 border-white -translate-x-1/2"></div>
          <div className="absolute bottom-0 left-1/2 w-[30%] h-[15%] border-2 border-b-0 border-white -translate-x-1/2"></div>
        </div>

        {/* 2. Canvas Layer (Dibujos) - Z-Index 10 */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none"
          // pointer-events-none permite que los clicks pasen a través del canvas hacia las fichas si no estamos dibujando.
          // Pero como manejamos el mousedown en el PARENT, no necesitamos eventos aquí.
        />

        {/* 3. Fichas / Tokens - Z-Index 20 */}
        {tokens.map((token) => (
          <div
            key={token.id}
            onMouseDown={(e) => handleStart(e, token.id)}
            onTouchStart={(e) => handleStart(e, token.id)}
            className={`
                absolute w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center 
                font-bold text-xs sm:text-sm border-2 border-white shadow-md z-20 
                transition-transform hover:scale-110 active:scale-125
                ${mode === "move" ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair"}
                ${token.type === "team-a" ? "bg-red-600 text-white shadow-red-900/50" : ""}
                ${token.type === "team-b" ? "bg-blue-600 text-white shadow-blue-900/50" : ""}
                ${token.type === "ball" ? "bg-white text-black !border-black" : ""}
                ${token.type === "cone" ? "bg-orange-500 rounded-none clip-cone w-5 h-5 sm:w-6 sm:h-6" : ""}
            `}
            style={{
              left: `${token.x}%`,
              top: `${token.y}%`,
              transform: "translate(-50%, -50%)",
              clipPath:
                token.type === "cone"
                  ? "polygon(50% 0%, 0% 100%, 100% 100%)"
                  : "none",
            }}
          >
            {token.type !== "cone" && token.type !== "ball" ? token.label : ""}
          </div>
        ))}
      </div>

      {/* Footer / Instrucciones */}
      <p className="mt-4 text-slate-400 text-sm">
        {mode === "move"
          ? "🖐 Arrastra las fichas para posicionarlas."
          : "✏️ Dibuja sobre la cancha para marcar movimientos."}
      </p>
    </div>
  );
};

export default TacticalBoard;
