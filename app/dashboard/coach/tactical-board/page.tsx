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
  Users,
  ShieldCheck,
  UserPlus,
  CheckCircle2,
} from "lucide-react";
import { gql } from "@apollo/client";
import { useMutation, useQuery, useLazyQuery } from "@apollo/client/react";
import { useAlert } from "@/src/providers/alert";

// --- COLORS CONSTANTS ---
const COLORS = {
  indigo: "#312e81",
  green: "#10b981",
  light: "#f9fafb",
  white: "#ffffff",
  textMain: "#1f2937",
  textLight: "#6b7280",
};

// --- GRAPHQL ---

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

const CREATE_TACTICAL_BOARD = gql`
  mutation CreateTacticalBoard($input: CreateTacticalBoardInput!) {
    createTacticalBoard(input: $input) {
      id
      title
    }
  }
`;

const UPDATE_TACTICAL_BOARD = gql`
  mutation UpdateTacticalBoard($input: UpdateTacticalBoardInput!) {
    updateTacticalBoard(input: $input) {
      id
      title
    }
  }
`;

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
  playerName?: string;
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

// --- CONFIGURACIÓN DE FORMACIONES (X, Y) ---
const FORMATIONS: Record<string, { x: number; y: number }[]> = {
  "F11: 4-3-3": [
    { x: 50, y: 90 }, // POR
    { x: 20, y: 75 },
    { x: 40, y: 80 },
    { x: 60, y: 80 },
    { x: 80, y: 75 }, // DEF
    { x: 30, y: 55 },
    { x: 50, y: 60 },
    { x: 70, y: 55 }, // MED
    { x: 20, y: 35 },
    { x: 50, y: 30 },
    { x: 80, y: 35 }, // DEL
  ],
  "F11: 4-4-2": [
    { x: 50, y: 90 },
    { x: 20, y: 75 },
    { x: 40, y: 80 },
    { x: 60, y: 80 },
    { x: 80, y: 75 },
    { x: 15, y: 55 },
    { x: 40, y: 55 },
    { x: 60, y: 55 },
    { x: 85, y: 55 },
    { x: 35, y: 35 },
    { x: 65, y: 35 },
  ],
  "F11: 3-5-2": [
    { x: 50, y: 90 },
    { x: 30, y: 75 },
    { x: 50, y: 80 },
    { x: 70, y: 75 },
    { x: 15, y: 50 },
    { x: 35, y: 55 },
    { x: 50, y: 60 },
    { x: 65, y: 55 },
    { x: 85, y: 50 },
    { x: 35, y: 30 },
    { x: 65, y: 30 },
  ],
  "F7: 2-3-1": [
    { x: 50, y: 90 },
    { x: 35, y: 75 },
    { x: 65, y: 75 },
    { x: 20, y: 55 },
    { x: 50, y: 55 },
    { x: 80, y: 55 },
    { x: 50, y: 35 },
  ],
};

// --- UTILIDAD PARA LIMPIAR OBJETOS DE APOLLO ANTES DE GUARDAR ---
const cleanObject = (obj: any) => {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      key === "__typename" ? undefined : value,
    ),
  );
};

// --- PÁGINA PRINCIPAL ---
export default function TacticalBoardPage() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- ESTADO DE GESTIÓN (CRUD) ---
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  // --- ESTADO DE LA BIBLIOTECA (UI) ---
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryCategoryFilter, setLibraryCategoryFilter] = useState("");

  // --- ESTADO DE SELECCIÓN DE FORMACIÓN (MODALES) ---
  const [pendingFormation, setPendingFormation] = useState<string | null>(null);
  const [showDeploymentChoice, setShowDeploymentChoice] = useState(false);
  const [showManualSelector, setShowManualSelector] = useState(false);
  const [manualAssignments, setManualAssignments] = useState<
    Record<number, any>
  >({});
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);

  // --- QUERIES & MUTATIONS ---
  const { data: catData }: any = useQuery(GET_COACH_CATEGORIES);

  const { data: playersData, loading: loadingPlayers }: any = useQuery(
    GET_PLAYERS_BY_CATEGORY,
    {
      variables: { categoryId: selectedCategoryId },
      skip: !selectedCategoryId,
      fetchPolicy: "cache-first",
    },
  );

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

  // --- EFECTOS ---
  useEffect(() => {
    if (isLibraryOpen && libraryCategoryFilter) {
      fetchBoards({ variables: { categoryId: libraryCategoryFilter } });
    }
  }, [isLibraryOpen, libraryCategoryFilter, fetchBoards]);

  useEffect(() => {
    if (categories.length > 0 && !libraryCategoryFilter) {
      setLibraryCategoryFilter(categories[0].id);
    }
  }, [categories]);

  // --- INICIALIZACIÓN ---
  const initBoard = () => {
    setActiveBoardId(null);
    setTitle("");
    const newTokens: Token[] = [];

    // Plantilla base 5v5 como tenías originalmente
    for (let i = 1; i <= 5; i++) {
      newTokens.push({
        id: `a-${i}-${Date.now()}`,
        type: "team-a",
        label: `${i}`,
        x: 15 + i * 8,
        y: 20,
      });
    }
    for (let i = 1; i <= 5; i++) {
      newTokens.push({
        id: `b-${i}-${Date.now()}`,
        type: "team-b",
        label: `${i}`,
        x: 15 + i * 8,
        y: 80,
      });
    }
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
    setActiveBoardId(board.id);
    setTitle(board.title);
    setSelectedCategoryId(libraryCategoryFilter);

    // Parseo defensivo por si el backend lo devuelve como String
    let initialState = board.initialState;
    let animation = board.animation;

    if (typeof initialState === "string") {
      try {
        initialState = JSON.parse(initialState);
      } catch (e) {}
    }
    if (typeof animation === "string") {
      try {
        animation = JSON.parse(animation);
      } catch (e) {}
    }

    if (initialState) {
      setTokens(initialState.tokens || []);
      setStrokes(initialState.strokes || []);
    }
    if (animation && Array.isArray(animation)) {
      setRecordedFrames(animation);
    } else {
      setRecordedFrames([]);
    }

    setIsPlaying(false);
    setIsRecording(false);
    setPlaybackIndex(0);
    setIsLibraryOpen(false);
    showAlert("Estrategia cargada correctamente", "success");
  };

  useEffect(() => {
    initBoard();
    const handleResizeWindow = () => handleResize();
    window.addEventListener("resize", handleResizeWindow);
    setTimeout(handleResize, 100);
    return () => window.removeEventListener("resize", handleResizeWindow);
  }, []);

  // --- 1. MANEJO DE SELECCIÓN DE FORMACIÓN ---
  const handleFormationSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const form = e.target.value;
    if (!form) return;

    if (
      !playersData?.playersByCategory ||
      playersData.playersByCategory.length === 0
    ) {
      e.target.value = "";
      return showAlert("No hay jugadores en esta categoría", "warning");
    }

    setPendingFormation(form);
    setShowDeploymentChoice(true);
    e.target.value = "";
  };

  // --- 2. DESPLIEGUE AUTOMÁTICO ---
  const deployAutomatic = () => {
    if (!pendingFormation) return;
    setShowDeploymentChoice(false);

    const players = [...playersData.playersByCategory];
    const posOrder: Record<string, number> = { GK: 1, DEF: 2, MID: 3, FW: 4 };

    players.sort((a, b) => {
      const posA = a.position || "";
      const posB = b.position || "";
      return (posOrder[posA] || 99) - (posOrder[posB] || 99);
    });

    const positions = FORMATIONS[pendingFormation];
    const preservedTokens = tokens.filter((t) => t.type !== "team-a");

    const teamATokens: Token[] = players
      .slice(0, positions.length)
      .map((p, i) => ({
        id: `a-${p.id}-${Date.now()}`,
        type: "team-a",
        label: `${i + 1}`,
        playerName: p.lastName || p.firstName,
        x: positions[i].x,
        y: positions[i].y,
      }));

    setTokens([...preservedTokens, ...teamATokens]);
    showAlert(
      `Plantel alineado automáticamente en ${pendingFormation}`,
      "success",
    );
    setMode("move");
    setPendingFormation(null);
  };

  // --- 3. DESPLIEGUE MANUAL ---
  const openManualSelector = () => {
    setShowDeploymentChoice(false);
    setManualAssignments({});
    setActiveSlotIndex(null);
    setShowManualSelector(true);
  };

  const assignPlayerToSlot = (player: any) => {
    if (activeSlotIndex === null) return;
    setManualAssignments((prev) => ({
      ...prev,
      [activeSlotIndex]: player,
    }));
    setActiveSlotIndex(null);
  };

  const deployManual = () => {
    if (!pendingFormation) return;

    const positions = FORMATIONS[pendingFormation];
    const preservedTokens = tokens.filter((t) => t.type !== "team-a");
    const teamATokens: Token[] = [];

    positions.forEach((pos, index) => {
      const assignedPlayer = manualAssignments[index];
      if (assignedPlayer) {
        teamATokens.push({
          id: `a-${assignedPlayer.id}-${Date.now()}`,
          type: "team-a",
          label: `${index + 1}`,
          playerName: assignedPlayer.lastName || assignedPlayer.firstName,
          x: pos.x,
          y: pos.y,
        });
      }
    });

    if (teamATokens.length === 0) {
      return showAlert("Asigna al menos un jugador", "warning");
    }

    setTokens([...preservedTokens, ...teamATokens]);
    setShowManualSelector(false);
    setPendingFormation(null);
    showAlert("Alineación manual completada", "success");
  };

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

    // Limpiamos estrictamente los objetos para evitar errores '__typename' de GraphQL
    const cleanTokens = cleanObject(tokens);
    const cleanStrokes = cleanObject(strokes);
    const cleanAnimation =
      recordedFrames.length > 0 ? cleanObject(recordedFrames) : null;

    const initialState = { tokens: cleanTokens, strokes: cleanStrokes };
    const inputData = {
      title,
      categoryId: selectedCategoryId,
      initialState,
      animation: cleanAnimation,
      coachId: catData?.meCoach?.id,
    };

    try {
      if (activeBoardId) {
        await updateBoard({
          variables: { input: { id: activeBoardId, ...inputData } },
        });
        showAlert("Estrategia actualizada correctamente", "success");
      } else {
        const { data }: any = await createBoard({
          variables: { input: inputData },
        });
        setActiveBoardId(data.createTacticalBoard.id);
        showAlert("Nueva estrategia guardada correctamente", "success");
      }
    } catch (error: any) {
      console.error(error);
      showAlert(error.message || "Error al guardar la estrategia", "error");
    }
  };

  const handleDeleteBoard = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta táctica?")) return;
    try {
      await deleteBoard({ variables: { id } });
      if (id === activeBoardId) initBoard();
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
    <div
      className={`flex flex-col items-center w-full min-h-screen font-sans p-2 md:p-6 relative overflow-hidden`}
      style={{ backgroundColor: COLORS.light, color: COLORS.textMain }}
    >
      {/* --- HEADER SUPERIOR --- */}
      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-200 relative z-20">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => router.back()}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
          >
            <ArrowLeft size={20} />
          </button>
          <button
            onClick={() => setIsLibraryOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors text-white shadow-md hover:shadow-lg hover:opacity-90"
            style={{ backgroundColor: COLORS.indigo }}
          >
            <FolderOpen size={18} /> Biblioteca
          </button>
          {activeBoardId && (
            <span className="text-xs font-mono bg-indigo-100 text-indigo-700 px-2 py-1 rounded border border-indigo-200">
              EDITANDO
            </span>
          )}
        </div>

        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Type className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Título de la Estrategia"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 text-gray-800 pl-10 pr-4 py-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm placeholder-gray-400 transition-all"
            />
          </div>
          <div className="relative">
            <Layout className="absolute left-3 top-3 text-gray-400" size={18} />
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 text-gray-800 pl-10 pr-4 py-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm appearance-none cursor-pointer transition-all"
            >
              <option value="">Selecciona Categoría...</option>
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
          className="w-full md:w-auto px-6 py-2.5 text-white font-bold rounded-lg shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          style={{ backgroundColor: COLORS.green }}
        >
          {loadingAction ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Save size={20} />
          )}
          <span>{activeBoardId ? "Actualizar" : "Guardar"}</span>
        </button>
      </div>

      {/* --- MODAL: ELECCIÓN DE MÉTODO DE DESPLIEGUE --- */}
      {showDeploymentChoice && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full text-center">
            <h3 className="text-xl font-bold mb-2 text-gray-800">
              Definir Alineación
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              ¿Cómo deseas posicionar a los jugadores en el {pendingFormation}?
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={deployAutomatic}
                className="flex flex-col items-center justify-center gap-2 p-4 border border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
              >
                <RefreshCw
                  size={32}
                  className="text-indigo-400 group-hover:text-indigo-600"
                />
                <span className="font-bold text-gray-700">Automático</span>
                <span className="text-[10px] text-gray-400">
                  Ordenado por posición (ARQ, DEF...)
                </span>
              </button>

              <button
                onClick={openManualSelector}
                className="flex flex-col items-center justify-center gap-2 p-4 border border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
              >
                <UserPlus
                  size={32}
                  className="text-emerald-400 group-hover:text-emerald-600"
                />
                <span className="font-bold text-gray-700">
                  Selección Manual
                </span>
                <span className="text-[10px] text-gray-400">
                  Elige jugador por jugador
                </span>
              </button>
            </div>
            <button
              onClick={() => {
                setShowDeploymentChoice(false);
                setPendingFormation(null);
              }}
              className="mt-6 text-gray-400 text-sm underline hover:text-gray-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL: SELECCIÓN MANUAL DE JUGADORES --- */}
      {showManualSelector && pendingFormation && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 md:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Alineación Manual:{" "}
                  <span className="text-indigo-600">{pendingFormation}</span>
                </h2>
                <p className="text-xs text-gray-500">
                  Toca un círculo en la cancha y selecciona un jugador de la
                  lista.
                </p>
              </div>
              <button
                onClick={() => setShowManualSelector(false)}
                className="p-2 hover:bg-gray-200 rounded-full text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              <div className="flex-1 bg-[#2c8f43] relative p-4 flex items-center justify-center overflow-hidden">
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(255,255,255,0.2) 50px, rgba(255,255,255,0.2) 52px)",
                  }}
                ></div>
                <div className="relative w-full max-w-[400px] aspect-[2/3] border-4 border-white/80 rounded bg-green-700/50 shadow-2xl">
                  {FORMATIONS[pendingFormation].map((pos, index) => {
                    const assigned = manualAssignments[index];
                    const isActive = activeSlotIndex === index;
                    return (
                      <button
                        key={index}
                        onClick={() => setActiveSlotIndex(index)}
                        className={`absolute w-12 h-12 -ml-6 -mt-6 rounded-full border-2 flex items-center justify-center shadow-lg transition-transform hover:scale-110
                                            ${isActive ? "ring-4 ring-yellow-400 z-10" : ""}
                                            ${assigned ? "bg-white border-indigo-600" : "bg-black/40 border-white text-white"}
                                        `}
                        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                      >
                        {assigned ? (
                          <div className="flex flex-col items-center leading-none">
                            <span className="font-bold text-indigo-900 text-[10px]">
                              {index + 1}
                            </span>
                            <span className="text-[8px] font-bold text-indigo-700 truncate max-w-[40px]">
                              {assigned.lastName || assigned.firstName}
                            </span>
                          </div>
                        ) : (
                          <span className="font-bold">{index + 1}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="w-full md:w-1/3 bg-white border-l border-gray-200 flex flex-col">
                <div className="p-3 bg-gray-100 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {activeSlotIndex !== null
                    ? `Seleccionar para Posición ${activeSlotIndex + 1}`
                    : "Selecciona una posición primero"}
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {activeSlotIndex !== null ? (
                    playersData?.playersByCategory
                      .filter(
                        (p: any) =>
                          !Object.values(manualAssignments).some(
                            (assigned: any) => assigned.id === p.id,
                          ),
                      )
                      .map((p: any) => (
                        <button
                          key={p.id}
                          onClick={() => assignPlayerToSlot(p)}
                          className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"
                        >
                          <div>
                            <p className="font-bold text-gray-800 text-sm group-hover:text-indigo-700">
                              {p.firstName} {p.lastName}
                            </p>
                            <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                              {p.position || "N/A"}
                            </span>
                          </div>
                          <CheckCircle2
                            size={16}
                            className="text-gray-300 group-hover:text-indigo-500"
                          />
                        </button>
                      ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 p-6 text-center">
                      <Hand size={32} className="mb-2 opacity-50" />
                      <p className="text-sm">
                        Toca un círculo en la pizarra para asignar un jugador.
                      </p>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={deployManual}
                    className="w-full py-3 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    style={{ backgroundColor: COLORS.indigo }}
                  >
                    <ShieldCheck size={20} /> Confirmar Alineación
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE BIBLIOTECA --- */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-3">
                <FolderOpen className="text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-800">
                  Biblioteca de Estrategias
                </h2>
              </div>
              <button
                onClick={() => setIsLibraryOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-full text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-1 overflow-hidden">
              <div className="w-1/3 border-r border-gray-200 p-4 bg-gray-50 overflow-y-auto">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">
                  Categorías
                </h3>
                <div className="space-y-1">
                  {categories.map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() => setLibraryCategoryFilter(c.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        libraryCategoryFilter === c.id
                          ? "text-white shadow-md"
                          : "text-gray-600 hover:bg-gray-200"
                      }`}
                      style={{
                        backgroundColor:
                          libraryCategoryFilter === c.id
                            ? COLORS.indigo
                            : "transparent",
                      }}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 p-6 overflow-y-auto bg-gray-100">
                {!libraryCategoryFilter ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
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
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <p>No hay estrategias guardadas en esta categoría.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {boardsData?.tacticalBoardsByCategory.map((board: any) => (
                      <div
                        key={board.id}
                        className="bg-white p-4 rounded-xl border border-gray-200 hover:border-indigo-400 transition-all group shadow-sm hover:shadow-md"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-lg text-gray-800 group-hover:text-indigo-600 truncate">
                            {board.title}
                          </h4>
                          {board.animation && (
                            <span className="bg-red-50 text-red-500 text-[10px] px-1.5 py-0.5 rounded border border-red-200 flex items-center gap-1 font-bold">
                              <Play size={8} fill="currentColor" /> Animada
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mb-4">
                          Actualizado:{" "}
                          {new Date(board.updatedAt).toLocaleDateString()}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadBoard(board)}
                            className="flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 text-white hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: COLORS.indigo }}
                          >
                            <Edit3 size={14} /> Cargar
                          </button>
                          <button
                            onClick={() => handleDeleteBoard(board.id)}
                            className="p-2 bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg border border-gray-200 transition-colors"
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

      {/* --- TOOLBAR DE HERRAMIENTAS CENTRAL --- */}
      <div className="flex flex-col gap-3 mb-4 bg-white p-4 rounded-xl shadow-md border border-gray-200 z-40 max-w-5xl w-full">
        {/* GRUPO 1: CONTROLES PRINCIPALES */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Herramientas de Interacción */}
          <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setMode("move")}
              disabled={isPlaying}
              className={`flex items-center gap-2 px-3 py-2 rounded-md font-bold transition-all ${
                mode === "move"
                  ? "text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              } ${isPlaying ? "opacity-50 cursor-not-allowed" : ""}`}
              style={{
                backgroundColor: mode === "move" ? COLORS.green : "transparent",
              }}
            >
              <Hand size={18} /> <span className="hidden sm:inline">Mover</span>
            </button>
            <button
              onClick={() => setMode("draw")}
              disabled={isPlaying}
              className={`flex items-center gap-2 px-3 py-2 rounded-md font-bold transition-all ${
                mode === "draw"
                  ? "text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              } ${isPlaying ? "opacity-50 cursor-not-allowed" : ""}`}
              style={{
                backgroundColor: mode === "draw" ? COLORS.green : "transparent",
              }}
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
              className="w-8 h-8 rounded-full cursor-pointer border-2 border-gray-200 bg-transparent p-0 overflow-hidden shadow-sm"
            />
          </div>

          {/* Grabación y Reproducción */}
          <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-lg border border-gray-200">
            <button
              onClick={toggleRecording}
              disabled={isPlaying}
              className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all ${
                isRecording
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-white text-red-500 hover:bg-red-50"
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
                  ? "bg-indigo-600 text-white"
                  : recordedFrames.length > 0
                    ? "bg-white text-indigo-600 hover:bg-indigo-50"
                    : "bg-white text-gray-400 cursor-not-allowed"
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

          {/* Limpiar y Despliegue de Plantel */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setStrokes([]);
                  setCurrentStroke(null);
                  setRecordedFrames([]);
                  setPlaybackIndex(0);
                  drawCanvas();
                }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Borrar Todo"
              >
                <Eraser size={18} />
              </button>
              <button
                onClick={initBoard}
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Reset Completo"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            <div className="hidden md:block w-px h-8 bg-gray-200"></div>

            <div className="flex items-center gap-2 bg-indigo-50 p-1.5 rounded-lg border border-indigo-100">
              <ShieldCheck size={16} className="text-indigo-600 ml-1" />
              <span className="text-xs text-indigo-800 font-bold whitespace-nowrap">
                PLANTEL:
              </span>
              <select
                className="bg-white text-gray-800 border border-gray-300 text-xs rounded px-2 py-1 outline-none shadow-sm cursor-pointer hover:border-indigo-400"
                disabled={!selectedCategoryId || loadingPlayers}
                onChange={handleFormationSelect}
              >
                <option value="">Alinear en Cancha...</option>
                {Object.keys(FORMATIONS).map((form) => (
                  <option key={form} value={form}>
                    {form}
                  </option>
                ))}
              </select>
              {loadingPlayers && (
                <Loader2 size={14} className="animate-spin text-indigo-400" />
              )}
            </div>
          </div>
        </div>

        {/* GRUPO 2: AGREGAR ELEMENTOS (Estilo Explicito Base) */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-3 border-t border-gray-100 mt-1">
          <span className="text-xs text-gray-400 font-bold uppercase mr-2">
            Agregar:
          </span>
          <button
            onClick={() => handleAddToken("team-a")}
            className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 transition-all shadow-sm group"
          >
            <div className="w-3.5 h-3.5 rounded-full bg-red-600 border border-white shadow-sm group-hover:scale-110 transition-transform"></div>{" "}
            <span>Rojo</span>
          </button>
          <button
            onClick={() => handleAddToken("team-b")}
            className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 transition-all shadow-sm group"
          >
            <div className="w-3.5 h-3.5 rounded-full bg-blue-600 border border-white shadow-sm group-hover:scale-110 transition-transform"></div>{" "}
            <span>Azul</span>
          </button>
          <button
            onClick={() => handleAddToken("ball")}
            className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 transition-all shadow-sm group"
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white border border-gray-300 shadow-sm group-hover:scale-110 transition-transform"></div>{" "}
            <span>Pelota</span>
          </button>
          <button
            onClick={() => handleAddToken("cone")}
            className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 transition-all shadow-sm group"
          >
            <Triangle
              size={14}
              className="text-orange-500 fill-orange-500 group-hover:-translate-y-0.5 transition-transform"
            />{" "}
            <span>Cono</span>
          </button>
          <button
            onClick={() => handleAddToken("goal")}
            className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 transition-all shadow-sm group"
          >
            <Square
              size={14}
              className="text-gray-800 group-hover:scale-110 transition-transform"
            />{" "}
            <span>Arco</span>
          </button>
        </div>
      </div>

      {/* --- Slider de Progreso --- */}
      {recordedFrames.length > 0 && (
        <div className="w-full max-w-[900px] mb-2 px-1 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="text-xs text-gray-500 font-mono">0s</span>
          <input
            type="range"
            min="0"
            max={recordedFrames.length - 1}
            value={playbackIndex}
            onChange={handleScrub}
            disabled={isRecording}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500"
          />
          <span className="text-xs text-gray-500 font-mono">
            {(recordedFrames.length * (FRAME_RATE_MS / 1000)).toFixed(1)}s
          </span>
        </div>
      )}

      {/* --- Cancha Container --- */}
      <div
        ref={containerRef}
        className={`
            relative w-full max-w-[900px] aspect-[16/10] sm:aspect-[4/3] 
            bg-[#2c8f43] border-[6px] border-white rounded-lg shadow-2xl overflow-hidden select-none 
            ${mode === "draw" && !isPlaying ? "cursor-crosshair" : "cursor-default"}
            touch-none z-10
        `}
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(255,255,255,0.15) 50px, rgba(255,255,255,0.15) 52px)",
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

        {/* Líneas de la cancha */}
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

        {/* Tokens (Jugadores) con renderizado de Nombre */}
        {tokens.map((token) => (
          <div
            key={token.id}
            onMouseDown={(e) => handleStart(e, token.id)}
            onTouchStart={(e) => handleStart(e, token.id)}
            className={`
                absolute flex flex-col items-center justify-center z-20 pointer-events-auto
                ${!isPlaying && mode === "move" ? "cursor-grab active:cursor-grabbing" : ""}
                ${isPlaying ? `transition-all ease-linear will-change-[left,top]` : ""}
            `}
            style={{
              left: `${token.x}%`,
              top: `${token.y}%`,
              transform: "translate(-50%, -50%)",
              transitionDuration: isPlaying
                ? `${TRANSITION_DURATION_MS}ms`
                : "0s",
            }}
          >
            <div
              className={`
              flex items-center justify-center shadow-md
              ${!isPlaying && mode === "move" ? "hover:scale-110 active:scale-110 transition-transform" : ""}
              ${token.type === "team-a" ? "bg-red-600 text-white border-2 border-white w-7 h-7 sm:w-9 sm:h-9 rounded-full font-bold text-xs sm:text-sm" : ""}
              ${token.type === "team-b" ? "bg-blue-600 text-white border-2 border-white w-7 h-7 sm:w-9 sm:h-9 rounded-full font-bold text-xs sm:text-sm" : ""}
              ${token.type === "ball" ? "bg-white text-black border-2 border-black w-4 h-4 sm:w-5 sm:h-5 rounded-full z-30" : ""}
              ${token.type === "cone" ? "bg-orange-500 w-5 h-5 sm:w-6 sm:h-6 border border-white/50" : ""}
              ${token.type === "goal" ? "bg-transparent border-4 border-white/80 w-24 h-12 rounded-sm" : ""}
            `}
              style={{
                clipPath:
                  token.type === "cone"
                    ? "polygon(50% 0%, 0% 100%, 100% 100%)"
                    : "none",
              }}
            >
              {(token.type === "team-a" || token.type === "team-b") &&
                token.label}
            </div>

            {/* Etiqueta con el nombre real del jugador si se usó alineación */}
            {token.playerName && (
              <span className="mt-1 bg-white/90 text-gray-900 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap shadow-sm border border-gray-200">
                {token.playerName}
              </span>
            )}
          </div>
        ))}
      </div>

      <p className="mt-4 text-gray-400 text-sm flex gap-2 items-center font-medium">
        {isRecording
          ? "🔴 Grabando..."
          : isPlaying
            ? "▶️ Reproduciendo..."
            : "Selecciona una categoría y usa 'Alinear' para gestionar tu equipo o añade elementos libremente."}
      </p>
    </div>
  );
}
