"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import {
  Plus,
  LayoutGrid,
  ChevronRight,
  AlertCircle,
  Calendar,
  UserPlus,
  X,
  School,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
// Importamos el hook para obtener el usuario y sus escuelas
import { useUser } from "@/src/providers/me";

// ==========================================
// 1. GRAPHQL QUERIES & MUTATIONS
// ==========================================
const GET_BOARD_TASKS = gql`
  query GetBoardTasks($schoolId: String!) {
    boardTasks(schoolId: $schoolId) {
      id
      title
      description
      status
      priority
      position
      dueDate
      assignedToUserId
    }
  }
`;

const MOVE_TASK = gql`
  mutation MoveTask($id: String!, $newStatus: String!, $newPosition: Int!) {
    moveTask(id: $id, newStatus: $newStatus, newPosition: $newPosition) {
      id
      status
      position
    }
  }
`;

const CREATE_TASK = gql`
  mutation CreateTask(
    $schoolId: String!
    $title: String!
    $description: String
  ) {
    createTask(schoolId: $schoolId, title: $title, description: $description) {
      id
      title
      description
      status
      priority
      position
      dueDate
      assignedToUserId
    }
  }
`;

// Tipos base
type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  dueDate?: string;
  assignedToUserId?: string;
}

// ==========================================
// 2. COMPONENTE PRINCIPAL
// ==========================================
export default function KanbanBoard() {
  // Contexto de Usuario
  const { user, loading: userLoading } = useUser();

  // Estados
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [columns, setColumns] = useState<Record<TaskStatus, Task[]>>({
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    title: "",
    description: "",
  });

  // --- LÓGICA DE ESCUELAS ---
  const availableSchools = useMemo(() => {
    if (!user) return [];
    const schools = user.schools || (user.school ? [user.school] : []);
    return schools.map((s: any) => s.school || s);
  }, [user]);

  // Auto-seleccionar la primera escuela al cargar
  useEffect(() => {
    if (availableSchools.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(availableSchools[0].id);
    }
  }, [availableSchools, selectedSchoolId]);

  // --- HOOKS APOLLO ---
  // Ahora la query depende del selectedSchoolId
  const { data, loading, error }: any = useQuery(GET_BOARD_TASKS, {
    variables: { schoolId: selectedSchoolId },
    skip: !selectedSchoolId, // Evita ejecutar la query si no hay escuela seleccionada
    fetchPolicy: "cache-and-network",
  });

  const [moveTask] = useMutation(MOVE_TASK);

  const [createTask, { loading: isCreating }] = useMutation(CREATE_TASK, {
    onCompleted: (mutationData: any) => {
      const newTask = mutationData.createTask;
      setColumns((prev) => {
        const updatedTodo = [...prev.TODO, newTask].sort(
          (a, b) => a.position - b.position,
        );
        return { ...prev, TODO: updatedTodo };
      });
      setIsModalOpen(false);
      setNewTaskForm({ title: "", description: "" });
    },
    onError: (err) => {
      console.error("Error al crear la tarea:", err);
      alert("Hubo un error al crear la tarea.");
    },
  });

  // Hidratar estado cuando cambia la data (ej. al cambiar de escuela)
  useEffect(() => {
    if (data?.boardTasks) {
      const tasks: Task[] = data.boardTasks;
      setColumns({
        TODO: tasks
          .filter((t) => t.status === "TODO")
          .sort((a, b) => a.position - b.position),
        IN_PROGRESS: tasks
          .filter((t) => t.status === "IN_PROGRESS")
          .sort((a, b) => a.position - b.position),
        DONE: tasks
          .filter((t) => t.status === "DONE")
          .sort((a, b) => a.position - b.position),
      });
    } else {
      // Si no hay data (cambio de escuela cargando), limpiamos
      setColumns({ TODO: [], IN_PROGRESS: [], DONE: [] });
    }
  }, [data, selectedSchoolId]);

  // ==========================================
  // 3. HANDLERS
  // ==========================================
  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskForm.title.trim() || !selectedSchoolId) return;

    await createTask({
      variables: {
        schoolId: selectedSchoolId,
        title: newTaskForm.title.trim(),
        description: newTaskForm.description.trim() || null,
      },
    });
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const sourceStatus = source.droppableId as TaskStatus;
    const destStatus = destination.droppableId as TaskStatus;

    const newColumns = { ...columns };
    const sourceTasks = Array.from(newColumns[sourceStatus]);
    const destTasks =
      sourceStatus === destStatus
        ? sourceTasks
        : Array.from(newColumns[destStatus]);

    const [movedTask] = sourceTasks.splice(source.index, 1);
    movedTask.status = destStatus;
    destTasks.splice(destination.index, 0, movedTask);

    newColumns[sourceStatus] = sourceTasks;
    if (sourceStatus !== destStatus) {
      newColumns[destStatus] = destTasks;
    }

    setColumns(newColumns);

    const calculatedPosition = (destination.index + 1) * 1024;

    try {
      await moveTask({
        variables: {
          id: draggableId,
          newStatus: destStatus,
          newPosition: calculatedPosition,
        },
      });
    } catch (err) {
      console.error("Error al mover la tarea:", err);
    }
  };

  // --- RENDERIZADO CONDICIONAL DE CARGA ---
  if (userLoading || (loading && !data)) {
    return (
      <div className="min-h-[60vh] h-full flex flex-col items-center justify-center gap-4 bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-[#312E81]" />
        <p className="text-gray-500 font-medium animate-pulse">
          Cargando tablero...
        </p>
      </div>
    );
  }

  if (error)
    return <div className="p-8 text-red-500">Error cargando tareas.</div>;

  const currentSchool = availableSchools.find(
    (s: any) => s.id === selectedSchoolId,
  );

  return (
    <div className="h-full flex flex-col bg-gray-50 text-gray-800 relative">
      {/* HEADER CON SELECTOR DE ESCUELA */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <LayoutGrid size={16} strokeWidth={2.5} />
            <span>Dirección Técnica</span>
            <ChevronRight size={14} strokeWidth={3} className="mt-0.5" />
            <span className="text-gray-900 font-bold">
              Planificación Semanal
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Tablero de Tareas
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          {/* Selector Escuela (Idéntico a CoachesPage) */}
          {availableSchools.length > 0 && (
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl px-3 py-2 flex items-center gap-2 w-full sm:min-w-[200px]">
              <div className="bg-indigo-50 p-2 rounded-lg">
                <School className="w-4 h-4 text-[#312E81]" />
              </div>
              <div className="relative flex-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Escuela
                </span>
                {availableSchools.length > 1 ? (
                  <select
                    value={selectedSchoolId}
                    onChange={(e) => setSelectedSchoolId(e.target.value)}
                    className="bg-transparent font-bold text-[#312E81] text-sm outline-none w-full appearance-none cursor-pointer"
                  >
                    {availableSchools.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-bold text-[#312E81] text-sm block truncate">
                    {currentSchool?.name}
                  </span>
                )}
              </div>
              {availableSchools.length > 1 && (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </div>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            disabled={!selectedSchoolId}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-200 flex justify-center items-center gap-2 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={18} strokeWidth={2.5} /> Nueva Tarea
          </button>
        </div>
      </header>

      {/* ÁREA KANBAN */}
      <DragDropContext onDragEnd={onDragEnd}>
        <main className="flex-1 overflow-x-auto p-6 hide-scrollbar">
          <div className="flex gap-6 h-full items-start min-w-[900px]">
            {(["TODO", "IN_PROGRESS", "DONE"] as TaskStatus[]).map((status) => {
              const colConfig = {
                TODO: {
                  title: "Por Hacer",
                  bg: "bg-gray-100/50",
                  border: "border-gray-200/60",
                  dot: "bg-gray-400",
                },
                IN_PROGRESS: {
                  title: "En Progreso",
                  bg: "bg-blue-50/30",
                  border: "border-blue-100/60",
                  dot: "bg-blue-500 animate-pulse",
                },
                DONE: {
                  title: "Completado",
                  bg: "bg-green-50/30",
                  border: "border-green-100/60",
                  dot: "bg-green-500",
                },
              };

              return (
                <div
                  key={status}
                  className={`flex flex-col w-1/3 max-w-[400px] h-full rounded-xl border ${colConfig[status].border} ${colConfig[status].bg} overflow-hidden flex-shrink-0`}
                >
                  <div className="p-4 border-b border-gray-200/50 flex justify-between items-center bg-white/50 backdrop-blur-sm">
                    <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${colConfig[status].dot}`}
                      ></span>
                      {colConfig[status].title}
                    </h3>
                    <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">
                      {columns[status].length}
                    </span>
                  </div>

                  <Droppable droppableId={status}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`p-3 flex-1 overflow-y-auto space-y-3 transition-colors ${snapshot.isDraggingOver ? "bg-indigo-50/30" : ""}`}
                      >
                        {columns[status].map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white p-4 rounded-lg border border-gray-200 shadow-sm transition-all
                                  ${snapshot.isDragging ? "shadow-lg ring-2 ring-indigo-500 rotate-2 cursor-grabbing scale-105" : "hover:border-indigo-300 cursor-grab"}
                                  ${status === "DONE" ? "opacity-75 bg-gray-50" : ""}
                                `}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <span
                                    className={`text-[10px] font-bold ${status === "DONE" ? "text-gray-400 line-through" : "text-indigo-400"}`}
                                  >
                                    {task.id.split("-")[0].toUpperCase()}
                                  </span>
                                  {task.priority === "HIGH" && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 flex items-center gap-1">
                                      <AlertCircle size={12} strokeWidth={3} />
                                      Alta
                                    </span>
                                  )}
                                  {task.priority === "MEDIUM" && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-50 text-yellow-700">
                                      Media
                                    </span>
                                  )}
                                  {task.priority === "LOW" && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600">
                                      Baja
                                    </span>
                                  )}
                                </div>

                                <h4
                                  className={`text-sm font-bold leading-tight mb-3 ${status === "DONE" ? "text-gray-500 line-through" : "text-gray-900"}`}
                                >
                                  {task.title}
                                </h4>

                                {task.description && (
                                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                                    {task.description}
                                  </p>
                                )}

                                <div className="flex justify-between items-end mt-4 pt-3 border-t border-gray-50">
                                  <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                                    <Calendar size={14} strokeWidth={2} />
                                    <span>
                                      {task.dueDate
                                        ? new Date(
                                            task.dueDate,
                                          ).toLocaleDateString()
                                        : "Sin fecha"}
                                    </span>
                                  </div>

                                  {task.assignedToUserId ? (
                                    <img
                                      src={`https://ui-avatars.com/api/?name=User&background=DBEAFE&color=1E3A8A`}
                                      className="w-6 h-6 rounded-full"
                                      alt="Asignado"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                                      <UserPlus size={12} strokeWidth={2.5} />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </main>
      </DragDropContext>

      {/* ==========================================
          MODAL DE CREACIÓN DE TAREA
      ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-lg">Nueva Tarea</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 p-1.5 rounded-full transition-colors"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Formulario */}
            <form
              onSubmit={handleCreateTaskSubmit}
              className="p-6 flex flex-col gap-5"
            >
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Título de la tarea <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="Ej. Revisar inventario de petos..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-900"
                  value={newTaskForm.title}
                  onChange={(e) =>
                    setNewTaskForm({ ...newTaskForm, title: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Descripción (Opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Añade más contexto o instrucciones..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-700 resize-none"
                  value={newTaskForm.description}
                  onChange={(e) =>
                    setNewTaskForm({
                      ...newTaskForm,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              {/* Botones de Acción */}
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newTaskForm.title.trim() || isCreating}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? "Guardando..." : "Crear Tarea"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
