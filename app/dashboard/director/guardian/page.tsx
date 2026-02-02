"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Loader2,
  Plus,
  User as UserIcon,
  Mail,
  Phone,
  Edit2,
  School,
  ChevronDown,
  Users,
  Search,
  MessageCircle,
  ShieldCheck,
  UserPlus,
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
  mutation UpdateUser($userId: String!, $input: UpdateUserInput!) {
    updateUser(userId: $userId, input: $input) {
      id
      fullName
      email
      phone
    }
  }
`;

// === TYPES ===
interface ManagedPlayer {
  id: string;
  firstName: string;
  lastName: string;
  category: { name: string };
}

interface Guardian {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  managedPlayers: ManagedPlayer[];
}

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
    const schools = user.schools || (user.school ? [user.school] : []);
    return schools.map((s: any) => s.school || s);
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

  // --- LOGIC ---
  const filteredGuardians = useMemo(() => {
    if (!data?.guardians) return [];
    if (!searchTerm) return data.guardians;

    const lowerTerm = searchTerm.toLowerCase();
    return data.guardians.filter(
      (g: Guardian) =>
        g.fullName.toLowerCase().includes(lowerTerm) ||
        g.email.toLowerCase().includes(lowerTerm) ||
        g.managedPlayers.some(
          (p) =>
            p.firstName.toLowerCase().includes(lowerTerm) ||
            p.lastName.toLowerCase().includes(lowerTerm),
        ),
    );
  }, [data, searchTerm]);

  // --- HANDLERS ---
  const handleOpenModal = () => {
    setEditingUserId(null);
    setFormData({ fullName: "", email: "", phone: "", password: "" });
    setIsModalOpen(true);
  };

  const handleEdit = (guardian: Guardian) => {
    setEditingUserId(guardian.id);
    setFormData({
      fullName: guardian.fullName,
      email: guardian.email,
      phone: guardian.phone || "",
      password: "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolId) return showAlert("Selecciona una escuela", "error");
    if (!formData.fullName || !formData.email)
      return showAlert("Campos obligatorios faltantes", "warning");

    if (!editingUserId && !formData.password)
      return showAlert(
        "Contraseña obligatoria para nuevos usuarios",
        "warning",
      );

    try {
      if (editingUserId) {
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
        showAlert("Datos actualizados correctamente", "success");
      } else {
        await createGuardian({
          variables: {
            input: {
              fullName: formData.fullName,
              email: formData.email,
              password: formData.password,
              phone: formData.phone,
              role: "GUARDIAN",
              schoolId: selectedSchoolId,
            },
          },
        });
        showAlert("Apoderado registrado exitosamente", "success");
      }
      setIsModalOpen(false);
      refetch();
    } catch (error: any) {
      console.error(error);
      const msg = error.message.includes("Unique constraint")
        ? "El correo ya está registrado en el sistema"
        : error.message;
      showAlert(msg, "error");
    }
  };

  // Helper para WhatsApp
  const openWhatsApp = (phone?: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${cleanPhone}`, "_blank");
  };

  // --- RENDER ---
  if (userLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#312E81]" />
        <p className="text-gray-500 font-medium animate-pulse">
          Cargando familias...
        </p>
      </div>
    );
  }

  const currentSchool = availableSchools.find(
    (s: any) => s.id === selectedSchoolId,
  );

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 animate-fade-in">
      {/* 1. HEADER & CONTROLS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-black text-[#111827] tracking-tight mb-2">
            Familias y Apoderados
          </h1>
          <p className="text-gray-500 text-lg">
            Gestiona el acceso de los padres y su vinculación con los jugadores.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {availableSchools.length > 0 && (
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl px-3 py-2 flex items-center gap-2 min-w-[200px]">
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
            onClick={handleOpenModal}
            className="flex items-center justify-center gap-2 bg-[#10B981] hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-emerald-900/10 transition-all active:scale-95"
          >
            <Plus strokeWidth={3} className="w-5 h-5" />
            <span className="hidden sm:inline">Nuevo Apoderado</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>
      </div>

      {/* 2. SEARCH BAR */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por apoderado, hijo o correo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#312E81] focus:border-transparent transition duration-150 ease-in-out shadow-sm"
        />
      </div>

      {/* 3. GRID DE APODERADOS */}
      {loadingGuardians ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-56 bg-gray-100 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : filteredGuardians.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGuardians.map((guardian: Guardian) => (
            <div
              key={guardian.id}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 flex flex-col relative overflow-hidden"
            >
              {/* Header con acciones */}
              <div className="p-5 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-[#312E81] font-bold text-lg border border-indigo-100">
                      {guardian.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 fill-emerald-100" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1">
                      {guardian.fullName}
                    </h3>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500 uppercase tracking-wide">
                      Apoderado
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleEdit(guardian)}
                  className="text-gray-300 hover:text-[#312E81] p-1 rounded-md hover:bg-indigo-50 transition-colors"
                >
                  <Edit2 size={16} />
                </button>
              </div>

              {/* Información de Contacto */}
              <div className="px-5 pb-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Mail size={14} className="text-gray-400" />
                  <span className="truncate">{guardian.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Phone size={14} className="text-gray-400" />
                  <div className="flex items-center gap-2 w-full justify-between">
                    <span>{guardian.phone || "Sin teléfono"}</span>
                    {guardian.phone && (
                      <button
                        onClick={() => openWhatsApp(guardian.phone)}
                        className="text-emerald-500 hover:text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px] font-bold transition-colors"
                      >
                        <MessageCircle size={10} /> WA
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer: Hijos Asociados */}
              <div className="mt-auto bg-gray-50/50 border-t border-gray-100 p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Users size={12} /> Jugadores Vinculados
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {guardian.managedPlayers &&
                  guardian.managedPlayers.length > 0 ? (
                    guardian.managedPlayers.map((player) => (
                      <span
                        key={player.id}
                        className="px-2 py-1 bg-white text-[#312E81] text-[11px] rounded-md border border-gray-200 font-bold shadow-sm"
                      >
                        {player.firstName}{" "}
                        <span className="text-gray-400 font-normal">
                          ({player.category?.name})
                        </span>
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-gray-400 italic">
                      Sin asignaciones
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
          <div className="bg-white p-4 rounded-full shadow-sm mb-4">
            <UserPlus size={32} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {searchTerm
              ? "No se encontraron resultados"
              : "Sin Apoderados Registrados"}
          </h3>
          <p className="text-sm text-gray-500 max-w-sm text-center mb-6">
            {searchTerm
              ? `No hay nadie que coincida con "${searchTerm}".`
              : "Registra a las familias para que puedan acceder a la App, ver citaciones y realizar pagos."}
          </p>
          {!searchTerm && (
            <button
              onClick={handleOpenModal}
              className="text-[#312E81] font-bold text-sm hover:underline"
            >
              Crear primer apoderado
            </button>
          )}
        </div>
      )}

      {/* 4. MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#312E81]/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-xl text-[#111827]">
                  {editingUserId ? "Editar Apoderado" : "Nuevo Apoderado"}
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  {editingUserId
                    ? "Modificar datos de contacto"
                    : "Crear cuenta de acceso familiar"}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <span className="sr-only">Cerrar</span>
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form
                id="guardianForm"
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="Ej: Juan Pérez"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#312E81] focus:border-transparent outline-none transition-all"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        required
                        placeholder="familia@email.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#312E81] focus:border-transparent outline-none transition-all"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Teléfono
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        placeholder="+569..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#312E81] focus:border-transparent outline-none transition-all"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {editingUserId
                      ? "Cambiar Contraseña (Opcional)"
                      : "Contraseña de Acceso"}
                  </label>
                  <input
                    type="password"
                    required={!editingUserId}
                    placeholder={
                      editingUserId ? "Dejar en blanco para mantener" : "******"
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#312E81] focus:border-transparent outline-none bg-white"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                  {!editingUserId && (
                    <p className="text-[11px] text-gray-400 mt-2 leading-tight">
                      * El apoderado usará este email y contraseña para ingresar
                      a la App Móvil o Web.
                    </p>
                  )}
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="guardianForm"
                disabled={isSaving}
                className="flex-1 px-4 py-3 text-sm font-bold text-white bg-[#312E81] rounded-xl hover:bg-indigo-800 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg shadow-indigo-900/10"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                  </>
                ) : editingUserId ? (
                  "Guardar Cambios"
                ) : (
                  "Crear Cuenta"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
