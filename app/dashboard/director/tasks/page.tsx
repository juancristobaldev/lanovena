"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import {
  AlertCircle,
  Calendar,
  UserPlus,
  Loader2,
  LayoutGrid,
} from "lucide-react";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useUser } from "@/src/providers/me";

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

export default function KanbanBoardPage() {
  const { user, loading: userLoading } = useUser();
  const [isMounted, setIsMounted] = useState(false);
  const [columns, setColumns] = useState<Record<TaskStatus, Task[]>>({
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
  });

  // Evitar errores de hidratación con Drag & Drop en Next.js
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // NOTA DEV: Idealmente este schoolId viene de un store global sincronizado con el Layout.
  // Aquí usamos un fallback seguro al primer colegio del usuario.
  const activeSchoolId = useMemo(() => {
    if (!user) return null;
    const schools: any = user.schools || (user.school ? [user.school] : []);
    return schools.length > 0 ? schools[0].school?.id || schools[0].id : null;
  }, [user]);

  const { data, loading, error }: any = useQuery(GET_BOARD_TASKS, {
    variables: { schoolId: activeSchoolId },
    skip: !activeSchoolId,
    fetchPolicy: "cache-and-network",
  });

  const [moveTask] = useMutation(MOVE_TASK);

  // Hidratar columnas
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
    }
  }, [data]);

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

    // SOLUCIÓN AL ERROR DE SOLO LECTURA:
    // 1. Extraemos la tarea original (congelada por Apollo)
    const [removedTask] = sourceTasks.splice(source.index, 1);

    // 2. Creamos una copia superficial (shallow copy) y le asignamos el nuevo estado
    const movedTask = { ...removedTask, status: destStatus };

    // 3. Insertamos la copia modificada en la nueva posición
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
      console.error("Error moviendo tarea:", err);
      // Opcional: Aquí podrías añadir lógica para revertir el estado de la UI (setColumns)
      // si la mutación en el servidor falla, para que el usuario no vea "datos fantasma".
    }
  };

  if (!isMounted || userLoading || (loading && !data)) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#312E81]" />
        <p className="text-slate-500 font-medium">Cargando tablero...</p>
      </div>
    );
  }

  if (error)
    return (
      <div className="p-8 text-red-500 font-bold bg-red-50 rounded-xl">
        Error cargando tareas: {error.message}
      </div>
    );

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col animate-in fade-in duration-500">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto overflow-y-hidden hide-scrollbar pb-4">
          <div className="flex gap-6 h-full items-start min-w-[1000px]">
            {(["TODO", "IN_PROGRESS", "DONE"] as TaskStatus[]).map((status) => {
              const colConfig = {
                TODO: {
                  title: "Por Hacer",
                  bg: "bg-slate-100/50",
                  border: "border-slate-200",
                  dot: "bg-slate-400",
                },
                IN_PROGRESS: {
                  title: "En Progreso",
                  bg: "bg-indigo-50/50",
                  border: "border-indigo-100",
                  dot: "bg-[#312E81] animate-pulse",
                },
                DONE: {
                  title: "Completado",
                  bg: "bg-emerald-50/50",
                  border: "border-emerald-100",
                  dot: "bg-[#10B981]",
                },
              };

              return (
                <div
                  key={status}
                  className={`flex flex-col w-1/3 h-full rounded-2xl border ${colConfig[status].border} ${colConfig[status].bg} overflow-hidden shrink-0 shadow-sm`}
                >
                  <div className="p-4 border-b border-slate-200/50 flex justify-between items-center bg-white/60 backdrop-blur-md">
                    <h3 className="font-black text-slate-700 text-sm flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${colConfig[status].dot}`}
                      ></span>
                      {colConfig[status].title}
                    </h3>
                    <span className="bg-white text-slate-600 border border-slate-200 text-xs font-black px-2.5 py-1 rounded-full shadow-sm">
                      {columns[status].length}
                    </span>
                  </div>

                  <Droppable droppableId={status}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`p-4 flex-1 overflow-y-auto space-y-4 transition-colors ${snapshot.isDraggingOver ? "bg-[#312E81]/5" : ""}`}
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
                                className={`bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-all
                                  ${snapshot.isDragging ? "shadow-xl ring-2 ring-[#312E81]/20 rotate-2 cursor-grabbing scale-[1.02]" : "hover:border-[#312E81]/30 hover:shadow-md cursor-grab"}
                                  ${status === "DONE" ? "opacity-60 bg-slate-50 grayscale-[20%]" : ""}
                                `}
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <span
                                    className={`text-[10px] font-black uppercase tracking-widest ${status === "DONE" ? "text-slate-400" : "text-[#312E81]"}`}
                                  >
                                    {task.id.split("-")[0]}
                                  </span>
                                  {task.priority === "HIGH" && (
                                    <span className="px-2 py-1 rounded-md text-[10px] font-black bg-red-50 text-red-700 flex items-center gap-1 border border-red-100 uppercase tracking-widest">
                                      <AlertCircle size={10} strokeWidth={3} />{" "}
                                      Urgente
                                    </span>
                                  )}
                                  {task.priority === "MEDIUM" && (
                                    <span className="px-2 py-1 rounded-md text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-widest">
                                      Media
                                    </span>
                                  )}
                                  {task.priority === "LOW" && (
                                    <span className="px-2 py-1 rounded-md text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-widest">
                                      Baja
                                    </span>
                                  )}
                                </div>

                                <h4
                                  className={`text-sm font-black leading-snug mb-2 ${status === "DONE" ? "text-slate-500 line-through" : "text-slate-900"}`}
                                >
                                  {task.title}
                                </h4>

                                {task.description && (
                                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 font-medium leading-relaxed">
                                    {task.description}
                                  </p>
                                )}

                                <div className="flex justify-between items-end mt-4 pt-4 border-t border-slate-100">
                                  <div
                                    className={`flex items-center gap-1.5 text-[11px] font-bold ${task.dueDate && new Date(task.dueDate) < new Date() && status !== "DONE" ? "text-red-500" : "text-slate-400"}`}
                                  >
                                    <Calendar size={14} strokeWidth={2.5} />
                                    <span>
                                      {task.dueDate
                                        ? new Date(
                                            task.dueDate,
                                          ).toLocaleDateString("es-CL", {
                                            day: "2-digit",
                                            month: "short",
                                          })
                                        : "Sin fecha"}
                                    </span>
                                  </div>

                                  {task.assignedToUserId ? (
                                    <img
                                      src={`https://ui-avatars.com/api/?name=User&background=312E81&color=fff`}
                                      className="w-7 h-7 rounded-full shadow-sm"
                                      alt="Asignado"
                                    />
                                  ) : (
                                    <div
                                      className="w-7 h-7 rounded-full bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-[#312E81] hover:border-[#312E81] transition-colors cursor-pointer"
                                      title="Asignar usuario"
                                    >
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
        </div>
      </DragDropContext>
    </div>
  );
}
