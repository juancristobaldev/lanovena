"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Loader2,
  Plus,
  User as UserIcon,
  Mail,
  Phone,
  Edit,
  School,
  ChevronDown,
  Users,
  Search,
} from "lucide-react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useAlert } from "@/src/providers/alert";
import { useUser } from "@/src/providers/me";

// === GRAPHQL OPERATIONS ===

const GET_GUARDIANS = gql`
  query GetGuardians($schoolId: ID!) {
    guardians(schoolId: $schoolId) {
      id
      fullName
      email
      phone
      role
      # Traemos los jugadores que gestiona para mostrar contexto
      managedPlayers {
        id
        firstName
        lastName
        category {
          name
        }
      }
    }
  }
`;

const CREATE_GUARDIAN = gql`
  mutation CreateGuardian($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      fullName
    }
  }
`;

const UPDATE_USER = gql`
  mutation UpdateUser($userId: ID!, $input: UpdateUserInput!) {
    updateUser(userId: $userId, input: $input) {
      id
      fullName
      email
      phone
    }
  }
`;

export default function GuardiansPage() {
  const { showAlert } = useAlert();
  const { user, loading: userLoading } = useUser();

  // Estados
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });

  // --- SELECCIÓN DE ESCUELA ---
  const availableSchools = useMemo(() => {
    if (!user) return [];
    // @ts-ignore
    return user.schools || (user.school ? [user.school] : []);
  }, [user]);

  useEffect(() => {
    if (availableSchools.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(availableSchools[0].id);
    }
  }, [availableSchools, selectedSchoolId]);

  // --- QUERIES ---
  const {
    data,
    loading: loadingGuardians,
    refetch,
  }: any = useQuery(GET_GUARDIANS, {
    variables: { schoolId: selectedSchoolId },
    skip: !selectedSchoolId,
    fetchPolicy: "network-only",
  });

  // --- MUTATIONS ---
  const [createGuardian, { loading: creating }] = useMutation(CREATE_GUARDIAN);
  const [updateUser, { loading: updating }] = useMutation(UPDATE_USER);

  const isSaving = creating || updating;

  // --- HANDLERS ---

  const handleOpenModal = () => {
    setEditingUserId(null); // Modo Crear
    setFormData({ fullName: "", email: "", phone: "", password: "" });
    setIsModalOpen(true);
  };

  const handleEdit = (guardian: any) => {
    setEditingUserId(guardian.id); // Modo Editar
    setFormData({
      fullName: guardian.fullName,
      email: guardian.email,
      phone: guardian.phone || "",
      password: "", // Password vacío por seguridad
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolId) return showAlert("Selecciona una escuela", "error");
    if (!formData.fullName || !formData.email)
      return showAlert("Nombre y Email son obligatorios", "warning");

    // Validación de password solo al crear
    if (!editingUserId && !formData.password)
      return showAlert(
        "La contraseña es obligatoria para nuevos usuarios",
        "warning",
      );

    try {
      if (editingUserId) {
        // ACTUALIZAR
        await updateUser({
          variables: {
            userId: editingUserId,
            input: {
              fullName: formData.fullName,
              email: formData.email,
              phone: formData.phone,
              ...(formData.password ? { password: formData.password } : {}),
            },
          },
        });
        showAlert("Datos de apoderado actualizados", "success");
      } else {
        // CREAR
        await createGuardian({
          variables: {
            input: {
              fullName: formData.fullName,
              email: formData.email,
              password: formData.password,
              phone: formData.phone,
              role: "GUARDIAN", // Rol Específico
              schoolId: selectedSchoolId,
            },
          },
        });
        showAlert("Cuenta de apoderado creada exitosamente", "success");
      }

      setIsModalOpen(false);
      refetch();
    } catch (error: any) {
      console.error(error);
      // Manejo amigable de duplicados
      if (error.message.includes("Unique constraint")) {
        showAlert("Este correo ya está registrado en el sistema", "error");
      } else {
        showAlert(error.message || "Error al procesar solicitud", "error");
      }
    }
  };

  // Filtrado local por búsqueda
  const filteredGuardians = useMemo(() => {
    if (!data?.guardians) return [];
    return data.guardians.filter(
      (g: any) =>
        g.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.email.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [data, searchTerm]);

  // --- RENDER ---

  if (userLoading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="animate-spin text-indigo-900" />
      </div>
    );

  const currentSchool = availableSchools.find(
    (s: any) => s.id === selectedSchoolId,
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-indigo-900">Apoderados</h1>
          <p className="text-gray-600">
            Gestión de familias y acceso a la plataforma.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* Selector Escuela */}
          {availableSchools.length > 1 && (
            <div className="relative group bg-white border border-indigo-100 rounded-lg px-3 py-2 flex items-center gap-2 shadow-sm">
              <School className="w-4 h-4 text-indigo-600" />
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="bg-transparent outline-none text-sm font-bold text-indigo-900 cursor-pointer appearance-none pr-6 w-full sm:w-auto"
              >
                {availableSchools.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 pointer-events-none" />
            </div>
          )}

          {/* Buscador */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            onClick={handleOpenModal}
            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Nuevo Apoderado
          </button>
        </div>
      </div>

      {/* GRID DE FAMILIAS */}
      {loadingGuardians ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredGuardians.map((guardian: any) => (
            <div
              key={guardian.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-4 flex flex-col relative group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                    {guardian.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm leading-tight">
                      {guardian.fullName}
                    </h3>
                    <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">
                      Apoderado
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleEdit(guardian)}
                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{guardian.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{guardian.phone || "Sin teléfono"}</span>
                </div>
              </div>

              <div className="mt-auto pt-3 border-t border-gray-50">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Users className="w-3 h-3" /> Jugadores a cargo
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {guardian.managedPlayers &&
                  guardian.managedPlayers.length > 0 ? (
                    guardian.managedPlayers.map((player: any) => (
                      <span
                        key={player.id}
                        className="px-2 py-0.5 bg-gray-50 text-gray-700 text-[11px] rounded border border-gray-100 font-medium"
                      >
                        {player.firstName} ({player.category?.name})
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-gray-400 italic">
                      Sin jugadores asignados
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {filteredGuardians.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
              <UserIcon className="w-12 h-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-bold text-gray-600">
                No se encontraron apoderados
              </h3>
              <p className="text-gray-500 text-sm max-w-xs mx-auto mb-4">
                {searchTerm
                  ? "Intenta con otro nombre en la búsqueda."
                  : "Registra a las familias para que puedan acceder a la App."}
              </p>
              {!searchTerm && (
                <button
                  onClick={handleOpenModal}
                  className="text-indigo-600 font-bold text-sm hover:underline"
                >
                  Crear el primero
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL (CREAR / EDITAR) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-indigo-900">
                  {editingUserId ? "Editar Apoderado" : "Nuevo Apoderado"}
                </h3>
                <p className="text-xs text-gray-500">
                  {editingUserId
                    ? "Actualiza los datos de contacto"
                    : "Crea una cuenta de acceso para la familia"}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ej: Juan Pérez"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="familia@gmail.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="+569..."
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  {editingUserId
                    ? "Nueva Contraseña (Opcional)"
                    : "Contraseña Provisoria"}
                </label>
                <input
                  type="password"
                  required={!editingUserId}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-gray-300"
                  placeholder={
                    editingUserId ? "Dejar en blanco para mantener" : "******"
                  }
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>

              {!editingUserId && (
                <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                  <p className="text-[11px] text-indigo-800 leading-tight">
                    <strong>Nota:</strong> Al crear el usuario, podrá vincular a
                    sus hijos desde la gestión de Jugadores o tú podrás
                    asignarlos manualmente después.
                  </p>
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-indigo-900 rounded-lg hover:bg-indigo-800 disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingUserId ? "Guardar Cambios" : "Crear Cuenta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
