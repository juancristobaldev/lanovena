"use client";

import React, {
  useState,
  useRef,
  useEffect,
  MouseEvent as ReactMouseEvent,
  TouchEvent as ReactTouchEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  RefreshCw,
  Hand,
  PenTool,
  Eraser,
  Circle,
  Square,
  Play,
  Triangle,
  ArrowLeft,
  Loader2,
  Layout,
  Type,
  FolderOpen,
  X,
  Trash2,
  Edit3,
  Search,
} from "lucide-react";
import { gql } from "@apollo/client";
import { useMutation, useQuery, useLazyQuery } from "@apollo/client/react";
import { useAlert } from "@/src/providers/alert";

// --- GRAPHQL ---

// 1. Obtener Categorías (Para el select y filtros)
const GET_COACH_CATEGORIES = gql`
  query GetCoachCategoriesForBoard {
    meCoach {
      id
      coachProfile {
        categories {
          id
          name
        }
      }
    }
  }
`;

const GET_PLAYERS_BY_CATEGORY = gql`
  query PlayersByCategory($categoryId: String!) {
    playersByCategory(categoryId: $categoryId) {
      id
      firstName
      lastName
      position
    }
  }
`;

// 2. Obtener Pizarras por Categoría (Para la biblioteca)
const GET_BOARDS_BY_CATEGORY = gql`
  query GetBoardsByCategory($categoryId: ID!) {
    tacticalBoardsByCategory(categoryId: $categoryId) {
      id
      title
      description
      initialState
      animation
      updatedAt
    }
  }
`;

// 3. Crear
const CREATE_TACTICAL_BOARD = gql`
  mutation CreateTacticalBoard($input: CreateTacticalBoardInput!) {
    createTacticalBoard(input: $input) {
      id
      title
    }
  }
`;

// 4. Actualizar
const UPDATE_TACTICAL_BOARD = gql`
  mutation UpdateTacticalBoard($input: UpdateTacticalBoardInput!) {
    updateTacticalBoard(input: $input) {
      id
      title
    }
  }
`;

// 5. Eliminar
const DELETE_TACTICAL_BOARD = gql`
  mutation RemoveTacticalBoard($id: ID!) {
    removeTacticalBoard(id: $id) {
      id
    }
  }
`;

// --- TIPOS DEL COMPONENTE ---
type TokenType = "team-a" | "team-b" | "ball" | "cone" | "goal";

interface Token {
  id: string;
  type: TokenType;
  label?: string;
  x: number;
  y: number;
  rotation?: number;
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  color: string;
  points: Point[];
}

interface Frame {
  tokens: Token[];
  strokes: Stroke[];
  currentStroke: Stroke | null;
}

// --- PÁGINA PRINCIPAL ---
export default function TacticalBoardPage() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- ESTADO DE GESTIÓN (CRUD) ---
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null); // Null = Modo Creación
  const [title, setTitle] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  // --- ESTADO DE LA BIBLIOTECA (UI) ---
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryCategoryFilter, setLibraryCategoryFilter] = useState("");

  // --- QUERIES & MUTATIONS ---
  const { data: catData }: any = useQuery(GET_COACH_CATEGORIES);

  // Lazy Query para buscar pizarras solo cuando se abre la librería o cambia el filtro
  const [
    fetchBoards,
    { data: boardsData, loading: loadingBoards, refetch: refetchBoards },
  ]: any = useLazyQuery(GET_BOARDS_BY_CATEGORY, {
    fetchPolicy: "network-only",
  });

  const [createBoard, { loading: creating }] = useMutation(
    CREATE_TACTICAL_BOARD,
  );
  const [updateBoard, { loading: updating }] = useMutation(
    UPDATE_TACTICAL_BOARD,
  );
  const [deleteBoard] = useMutation(DELETE_TACTICAL_BOARD);

  const categories = catData?.meCoach?.coachProfile?.categories || [];

  // --- ESTADO DEL TABLERO (VISUAL) ---
  const [mode, setMode] = useState<"move" | "draw">("move");
  const [color, setColor] = useState("#ffff00");
  const [tokens, setTokens] = useState<Token[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);

  // --- Estado de Grabación/Reproducción ---
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedFrames, setRecordedFrames] = useState<Frame[]>([]);
  const [playbackIndex, setPlaybackIndex] = useState(0);

  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const FRAME_RATE_MS = 50;
  const TRANSITION_DURATION_MS = 100;

  // --- EFECTOS DE BIBLIOTECA ---
  useEffect(() => {
    if (isLibraryOpen && libraryCategoryFilter) {
      fetchBoards({ variables: { categoryId: libraryCategoryFilter } });
    }
  }, [isLibraryOpen, libraryCategoryFilter, fetchBoards]);

  // Si cargan categorías y no hay filtro, poner la primera por defecto
  useEffect(() => {
    if (categories.length > 0 && !libraryCategoryFilter) {
      setLibraryCategoryFilter(categories[0].id);
    }
  }, [categories]);

  // --- INICIALIZACIÓN ---
  const initBoard = () => {
    // Resetear todo a modo "Nueva Pizarra"
    setActiveBoardId(null);
    setTitle("");
    // No reseteamos la categoría seleccionada para comodidad del usuario

    const newTokens: Token[] = [];
    // Equipo A
    for (let i = 1; i <= 5; i++) {
      newTokens.push({
        id: `a-${i}-${Date.now()}`,
        type: "team-a",
        label: `${i}`,
        x: 15 + i * 8,
        y: 20,
      });
    }
    // Equipo B
    for (let i = 1; i <= 5; i++) {
      newTokens.push({
        id: `b-${i}-${Date.now()}`,
        type: "team-b",
        label: `${i}`,
        x: 15 + i * 8,
        y: 80,
      });
    }
    // Pelota y Arcos
    newTokens.push({ id: `ball-${Date.now()}`, type: "ball", x: 50, y: 50 });
    newTokens.push({ id: "goal-top", type: "goal", x: 50, y: 5 });
    newTokens.push({ id: "goal-bottom", type: "goal", x: 50, y: 95 });

    setTokens(newTokens);
    setStrokes([]);
    setCurrentStroke(null);
    setRecordedFrames([]);
    setPlaybackIndex(0);
    setIsPlaying(false);
    setIsRecording(false);
  };

  const loadBoard = (board: any) => {
    // Cargar datos del backend al estado local
    setActiveBoardId(board.id);
    setTitle(board.title);
    setSelectedCategoryId(libraryCategoryFilter); // Asumimos que viene del filtro actual

    // Parsear JSONs (Prisma devuelve objetos JSON, Apollo a veces los trata diferente)
    const initialState = board.initialState;
    const animation = board.animation;

    if (initialState) {
      setTokens(initialState.tokens || []);
      setStrokes(initialState.strokes || []);
    }

    if (animation && Array.isArray(animation)) {
      setRecordedFrames(animation);
    } else {
      setRecordedFrames([]);
    }

    // Resetear estados de reproducción
    setIsPlaying(false);
    setIsRecording(false);
    setPlaybackIndex(0);
    setIsLibraryOpen(false); // Cerrar modal
    showAlert("Estrategia cargada correctamente", "success");
  };

  useEffect(() => {
    initBoard();
    const handleResizeWindow = () => handleResize();
    window.addEventListener("resize", handleResizeWindow);
    setTimeout(handleResize, 100);
    return () => window.removeEventListener("resize", handleResizeWindow);
  }, []);

  // --- LOGICA CANVAS (Renderizado) ---
  useEffect(() => {
    drawCanvas();
  }, [strokes, currentStroke, tokens]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;

    strokes.forEach((stroke) => {
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      if (stroke.points.length > 0) {
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
      }
      ctx.stroke();
    });

    if (currentStroke && currentStroke.points.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = currentStroke.color;
      ctx.moveTo(currentStroke.points[0].x, currentStroke.points[0].y);
      for (let i = 1; i < currentStroke.points.length; i++) {
        ctx.lineTo(currentStroke.points[i].x, currentStroke.points[i].y);
      }
      ctx.stroke();
    }
  };

  const handleResize = () => {
    if (containerRef.current && canvasRef.current) {
      canvasRef.current.width = containerRef.current.clientWidth;
      canvasRef.current.height = containerRef.current.clientHeight;
      drawCanvas();
    }
  };

  const getRelativePos = (
    e: ReactMouseEvent | ReactTouchEvent | MouseEvent | TouchEvent,
  ) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ("changedTouches" in e && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = (e as any).clientX;
      clientY = (e as any).clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  // --- INTERACCIÓN ---
  const handleAddToken = (type: TokenType) => {
    if (isPlaying) return;
    let label = "";
    if (type === "team-a" || type === "team-b") {
      const existing = tokens.filter((t) => t.type === type).length;
      label = `${existing + 1}`;
    }
    const offsetX = (Math.random() - 0.5) * 5;
    const offsetY = (Math.random() - 0.5) * 5;

    const newToken: Token = {
      id: `${type}-${Date.now()}`,
      type,
      label,
      x: 50 + offsetX,
      y: 50 + offsetY,
    };
    setTokens((prev) => [...prev, newToken]);
    setMode("move");
  };

  const handleStart = (
    e: ReactMouseEvent | ReactTouchEvent,
    tokenId?: string,
  ) => {
    if (isPlaying) return;
    if (mode === "move" && tokenId) {
      e.stopPropagation();
      setDraggingId(tokenId);
      return;
    }
    if (mode === "draw") {
      const { x, y } = getRelativePos(e);
      setCurrentStroke({ color, points: [{ x, y }] });
    }
  };

  const handleMove = (e: ReactMouseEvent | ReactTouchEvent) => {
    if (isPlaying) return;
    const container = containerRef.current;
    if (!container) return;

    if (mode === "move" && draggingId) {
      e.preventDefault();
      const { x, y } = getRelativePos(e);
      const rect = container.getBoundingClientRect();
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
    if (mode === "draw" && currentStroke) {
      e.preventDefault();
      const { x, y } = getRelativePos(e);
      setCurrentStroke((prev) => {
        if (!prev) return null;
        return { ...prev, points: [...prev.points, { x, y }] };
      });
    }
  };

  const handleEnd = () => {
    if (isPlaying) return;
    setDraggingId(null);
    if (mode === "draw" && currentStroke) {
      setStrokes((prev) => [...prev, currentStroke]);
      setCurrentStroke(null);
    }
  };

  // --- GRABACIÓN Y REPRODUCCIÓN ---
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      if (recordingIntervalRef.current)
        clearInterval(recordingIntervalRef.current);
    } else {
      setRecordedFrames([]);
      setIsRecording(true);
      recordingIntervalRef.current = setInterval(() => {
        setRecordedFrames((prev) => prev);
      }, FRAME_RATE_MS);
    }
  };

  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setRecordedFrames((prev) => [
          ...prev,
          {
            tokens: JSON.parse(JSON.stringify(tokens)),
            strokes: [...strokes],
            currentStroke: currentStroke ? { ...currentStroke } : null,
          },
        ]);
      }, FRAME_RATE_MS);
      return () => clearInterval(interval);
    }
  }, [isRecording, tokens, strokes, currentStroke]);

  const togglePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (playbackIntervalRef.current)
        clearInterval(playbackIntervalRef.current);
    } else {
      if (recordedFrames.length === 0) return;
      setIsPlaying(true);
      setPlaybackIndex(0);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      playbackIntervalRef.current = setInterval(() => {
        setPlaybackIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          if (nextIndex >= recordedFrames.length) {
            setIsPlaying(false);
            return prevIndex;
          }
          const frame = recordedFrames[nextIndex];
          setTokens(frame.tokens);
          setStrokes(frame.strokes);
          setCurrentStroke(frame.currentStroke);
          return nextIndex;
        });
      }, FRAME_RATE_MS);
      return () => {
        if (playbackIntervalRef.current)
          clearInterval(playbackIntervalRef.current);
      };
    }
  }, [isPlaying, recordedFrames]);

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value);
    setPlaybackIndex(index);
    const frame = recordedFrames[index];
    if (frame) {
      setTokens(frame.tokens);
      setStrokes(frame.strokes);
      setCurrentStroke(frame.currentStroke);
    }
  };

  // --- GUARDADO EN BACKEND ---
  const handleSaveToBackend = async () => {
    if (!title.trim()) return showAlert("Ingresa un título", "error");
    if (!selectedCategoryId)
      return showAlert("Selecciona una categoría", "error");

    const initialState = { tokens, strokes };
    const animation = recordedFrames.length > 0 ? recordedFrames : null;
    const inputData = {
      title,
      categoryId: selectedCategoryId,
      initialState,
      animation,
      coachId: catData?.meCoach?.id,
    };

    try {
      if (activeBoardId) {
        // ACTUALIZAR
        await updateBoard({
          variables: {
            input: {
              id: activeBoardId,
              ...inputData,
            },
          },
        });
        showAlert("Estrategia actualizada", "success");
      } else {
        // CREAR
        const { data }: any = await createBoard({
          variables: {
            input: inputData,
          },
        });
        setActiveBoardId(data.createTacticalBoard.id);
        showAlert("Nueva estrategia guardada", "success");
      }
    } catch (error: any) {
      console.error(error);
      showAlert(error.message || "Error al guardar", "error");
    }
  };

  // --- ELIMINAR ---
  const handleDeleteBoard = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta táctica?")) return;
    try {
      await deleteBoard({ variables: { id } });
      // Si borramos la que estamos viendo, resetear
      if (id === activeBoardId) initBoard();
      // Refrescar lista
      if (libraryCategoryFilter) {
        refetchBoards({ categoryId: libraryCategoryFilter });
      }
      showAlert("Eliminada correctamente", "success");
    } catch (e: any) {
      showAlert(e.message, "error");
    }
  };

  const loadingAction = creating || updating;

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-slate-900 text-white font-sans p-2 md:p-6 relative overflow-hidden">
      {/* --- HEADER SUPERIOR (Datos + Biblioteca) --- */}
      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center gap-4 mb-6 bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-xl relative z-20">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => router.back()}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <button
            onClick={() => setIsLibraryOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-bold transition-colors"
          >
            <FolderOpen size={18} /> Biblioteca
          </button>
          {activeBoardId && (
            <span className="text-xs font-mono bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded border border-indigo-700">
              EDITANDO
            </span>
          )}
        </div>

        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Type className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Título de la Estrategia"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 text-white pl-10 pr-4 py-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm placeholder-slate-500"
            />
          </div>
          <div className="relative">
            <Layout
              className="absolute left-3 top-3 text-slate-400"
              size={18}
            />
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 text-white pl-10 pr-4 py-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm appearance-none"
            >
              <option value="">Categoría...</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSaveToBackend}
          disabled={loadingAction}
          className="w-full md:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          {loadingAction ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Save size={20} />
          )}
          <span>{activeBoardId ? "Actualizar" : "Guardar"}</span>
        </button>
      </div>

      {/* --- MODAL DE BIBLIOTECA --- */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-800 w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl border border-slate-600 flex flex-col overflow-hidden">
            {/* Header Modal */}
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-3">
                <FolderOpen className="text-indigo-400" />
                <h2 className="text-xl font-bold">Biblioteca de Estrategias</h2>
              </div>
              <button
                onClick={() => setIsLibraryOpen(false)}
                className="p-2 hover:bg-slate-700 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* Filtro y Contenido */}
            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar Categorías */}
              <div className="w-1/3 border-r border-slate-700 p-4 bg-slate-900/30 overflow-y-auto">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">
                  Categorías
                </h3>
                <div className="space-y-1">
                  {categories.map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() => setLibraryCategoryFilter(c.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${libraryCategoryFilter === c.id ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-700 hover:text-white"}`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista de Pizarras */}
              <div className="flex-1 p-6 overflow-y-auto bg-slate-800">
                {!libraryCategoryFilter ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                    <Search size={48} className="mb-2" />
                    <p>Selecciona una categoría</p>
                  </div>
                ) : loadingBoards ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2
                      className="animate-spin text-indigo-500"
                      size={32}
                    />
                  </div>
                ) : boardsData?.tacticalBoardsByCategory?.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500">
                    <p>No hay estrategias guardadas en esta categoría.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {boardsData?.tacticalBoardsByCategory.map((board: any) => (
                      <div
                        key={board.id}
                        className="bg-slate-700 p-4 rounded-xl border border-slate-600 hover:border-indigo-500 transition-all group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-lg text-white group-hover:text-indigo-300 truncate">
                            {board.title}
                          </h4>
                          {board.animation && (
                            <span className="bg-red-900/50 text-red-300 text-[10px] px-1.5 py-0.5 rounded border border-red-800 flex items-center gap-1">
                              <Play size={8} fill="currentColor" /> Animada
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mb-4">
                          Actualizado:{" "}
                          {new Date(board.updatedAt).toLocaleDateString()}
                        </p>

                        <div className="flex gap-2">
                          <button
                            onClick={() => loadBoard(board)}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2"
                          >
                            <Edit3 size={14} /> Cargar / Editar
                          </button>
                          <button
                            onClick={() => handleDeleteBoard(board.id)}
                            className="p-2 bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-400 rounded-lg border border-slate-600 hover:border-red-800 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TOOLBAR DE HERRAMIENTAS --- */}
      <div className="flex flex-col gap-3 mb-4 bg-slate-800 p-3 rounded-xl shadow-2xl border border-slate-700 z-40 max-w-5xl w-full">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
            <button
              onClick={() => setMode("move")}
              disabled={isPlaying}
              className={`flex items-center gap-2 px-3 py-2 rounded-md font-bold transition-all ${
                mode === "move"
                  ? "bg-emerald-500 text-white shadow-lg"
                  : "text-slate-400 hover:text-white"
              } ${isPlaying ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Hand size={18} /> <span className="hidden sm:inline">Mover</span>
            </button>
            <button
              onClick={() => setMode("draw")}
              disabled={isPlaying}
              className={`flex items-center gap-2 px-3 py-2 rounded-md font-bold transition-all ${
                mode === "draw"
                  ? "bg-emerald-500 text-white shadow-lg"
                  : "text-slate-400 hover:text-white"
              } ${isPlaying ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <PenTool size={18} />{" "}
              <span className="hidden sm:inline">Dibujar</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded-full cursor-pointer border-2 border-slate-600 bg-transparent p-0 overflow-hidden"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-700">
            <button
              onClick={toggleRecording}
              disabled={isPlaying}
              className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all ${
                isRecording
                  ? "bg-red-600 text-white animate-pulse"
                  : "bg-slate-800 text-red-500 hover:bg-slate-700"
              } ${isPlaying ? "opacity-30 cursor-not-allowed" : ""}`}
            >
              {isRecording ? (
                <Square size={16} fill="currentColor" />
              ) : (
                <Circle size={16} fill="currentColor" />
              )}
              <span className="hidden sm:inline text-xs font-bold font-mono">
                {isRecording ? "PARAR" : "REC"}
              </span>
            </button>

            <button
              onClick={togglePlayback}
              disabled={isRecording || recordedFrames.length === 0}
              className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all ${
                isPlaying
                  ? "bg-blue-600 text-white"
                  : recordedFrames.length > 0
                    ? "bg-slate-800 text-blue-400 hover:bg-slate-700 hover:text-blue-300"
                    : "bg-slate-800 text-slate-600 cursor-not-allowed"
              }`}
            >
              {isPlaying ? (
                <Square size={16} fill="currentColor" />
              ) : (
                <Play size={16} fill="currentColor" />
              )}
              <span className="hidden sm:inline text-xs font-bold font-mono">
                {isPlaying ? "STOP" : "PLAY"}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setStrokes([]);
                setCurrentStroke(null);
                setRecordedFrames([]);
                setPlaybackIndex(0);
                drawCanvas();
              }}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg"
              title="Borrar Todo"
            >
              <Eraser size={18} />
            </button>
            <button
              onClick={initBoard}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              title="Nueva Pizarra (Reset)"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-slate-700">
          <span className="text-xs text-slate-500 font-bold uppercase mr-2">
            Agregar:
          </span>
          <button
            onClick={() => handleAddToken("team-a")}
            className="flex items-center gap-1 bg-slate-900 hover:bg-slate-700 border border-slate-700 px-3 py-1 rounded text-xs transition-colors group"
          >
            <div className="w-3 h-3 rounded-full bg-red-600 border border-white group-hover:scale-110"></div>{" "}
            <span>Rojo</span>
          </button>
          <button
            onClick={() => handleAddToken("team-b")}
            className="flex items-center gap-1 bg-slate-900 hover:bg-slate-700 border border-slate-700 px-3 py-1 rounded text-xs transition-colors group"
          >
            <div className="w-3 h-3 rounded-full bg-blue-600 border border-white group-hover:scale-110"></div>{" "}
            <span>Azul</span>
          </button>
          <button
            onClick={() => handleAddToken("ball")}
            className="flex items-center gap-1 bg-slate-900 hover:bg-slate-700 border border-slate-700 px-3 py-1 rounded text-xs transition-colors group"
          >
            <div className="w-3 h-3 rounded-full bg-white border border-black group-hover:scale-110"></div>{" "}
            <span>Pelota</span>
          </button>
          <button
            onClick={() => handleAddToken("cone")}
            className="flex items-center gap-1 bg-slate-900 hover:bg-slate-700 border border-slate-700 px-3 py-1 rounded text-xs transition-colors group"
          >
            <Triangle
              size={12}
              className="text-orange-500 fill-orange-500 group-hover:-translate-y-0.5"
            />{" "}
            <span>Cono</span>
          </button>
          <button
            onClick={() => handleAddToken("goal")}
            className="flex items-center gap-1 bg-slate-900 hover:bg-slate-700 border border-slate-700 px-3 py-1 rounded text-xs transition-colors group"
          >
            <Square size={12} className="text-white group-hover:scale-110" />{" "}
            <span>Arco</span>
          </button>
        </div>
      </div>

      {/* --- Slider de Progreso --- */}
      {recordedFrames.length > 0 && (
        <div className="w-full max-w-[900px] mb-2 px-1 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="text-xs text-slate-500 font-mono">0s</span>
          <input
            type="range"
            min="0"
            max={recordedFrames.length - 1}
            value={playbackIndex}
            onChange={handleScrub}
            disabled={isRecording}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
          />
          <span className="text-xs text-slate-500 font-mono">
            {(recordedFrames.length * (FRAME_RATE_MS / 1000)).toFixed(1)}s
          </span>
        </div>
      )}

      {/* --- Cancha Container --- */}

      <div
        ref={containerRef}
        className={`
            relative w-full max-w-[900px] aspect-[16/10] sm:aspect-[4/3] 
            bg-[#2c8f43] border-[6px] border-white rounded shadow-2xl overflow-hidden select-none 
            ${mode === "draw" && !isPlaying ? "cursor-crosshair" : "cursor-default"}
            touch-none z-10
        `}
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(0,0,0,0.06) 50px, rgba(0,0,0,0.06) 100px)",
        }}
        onMouseDown={(e) => handleStart(e)}
        onTouchStart={(e) => handleStart(e)}
        onMouseMove={handleMove}
        onTouchMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchEnd={handleEnd}
      >
        {isRecording && (
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-red-600/90 text-white px-3 py-1 rounded-full animate-pulse shadow-lg pointer-events-none">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span className="text-xs font-bold tracking-wider">REC</span>
          </div>
        )}
        {isPlaying && (
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-blue-600/90 text-white px-3 py-1 rounded-full shadow-lg pointer-events-none">
            <Play size={10} fill="currentColor" />
            <span className="text-xs font-bold tracking-wider">REPLAY</span>
          </div>
        )}

        <div className="absolute inset-0 pointer-events-none opacity-80">
          <div className="absolute top-1/2 left-1/2 w-[15%] h-[20%] min-w-[80px] min-h-[80px] border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute top-1/2 w-full h-0.5 bg-white/70"></div>
          <div className="absolute top-0 left-1/2 w-[30%] h-[15%] border-2 border-t-0 border-white -translate-x-1/2"></div>
          <div className="absolute bottom-0 left-1/2 w-[30%] h-[15%] border-2 border-b-0 border-white -translate-x-1/2"></div>
        </div>

        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none"
        />

        {tokens.map((token) => (
          <div
            key={token.id}
            onMouseDown={(e) => handleStart(e, token.id)}
            onTouchStart={(e) => handleStart(e, token.id)}
            className={`
                absolute flex items-center justify-center 
                shadow-md z-20 
                ${!isPlaying && mode === "move" ? "hover:scale-110 active:scale-110 cursor-grab active:cursor-grabbing" : ""}
                ${isPlaying ? `transition-all ease-linear will-change-[left,top]` : ""}
                ${token.type === "team-a" ? "bg-red-600 text-white border-2 border-white shadow-red-900/50 w-7 h-7 sm:w-9 sm:h-9 rounded-full font-bold text-xs sm:text-sm" : ""}
                ${token.type === "team-b" ? "bg-blue-600 text-white border-2 border-white shadow-blue-900/50 w-7 h-7 sm:w-9 sm:h-9 rounded-full font-bold text-xs sm:text-sm" : ""}
                ${token.type === "ball" ? "bg-white text-black border-2 border-black w-4 h-4 sm:w-5 sm:h-5 rounded-full z-30" : ""}
                ${token.type === "cone" ? "bg-orange-500 w-5 h-5 sm:w-6 sm:h-6 border border-white/50" : ""}
                ${token.type === "goal" ? "bg-transparent border-4 border-white/80 w-24 h-12 rounded-sm" : ""}
            `}
            style={{
              left: `${token.x}%`,
              top: `${token.y}%`,
              transform: "translate(-50%, -50%)",
              transitionDuration: isPlaying
                ? `${TRANSITION_DURATION_MS}ms`
                : "0s",
              clipPath:
                token.type === "cone"
                  ? "polygon(50% 0%, 0% 100%, 100% 100%)"
                  : "none",
            }}
          >
            {(token.type === "team-a" || token.type === "team-b") &&
              token.label}
          </div>
        ))}
      </div>

      <p className="mt-4 text-slate-400 text-sm flex gap-2 items-center">
        {isRecording
          ? "🔴 Grabando..."
          : isPlaying
            ? "▶️ Reproduciendo..."
            : "Abre la Biblioteca para cargar una táctica guardada."}
      </p>
    </div>
  );
}
