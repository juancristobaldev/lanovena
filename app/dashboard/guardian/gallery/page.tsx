"use client";

import React, { useState } from "react";
import {
  Loader2,
  Image as ImageIcon,
  Download,
  Calendar,
  MapPin,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";

// === GRAPHQL (Futuro) ===
// Por ahora simularemos la respuesta, pero esta sería la query ideal.
const GET_GALLERY_TAGS = gql`
  query GetGalleryTags {
    me {
      managedPlayers {
        category {
          id
          name
        }
      }
    }
  }
`;

// === MOCK DATA (Para visualizar sin Backend de Galería aún) ===
const MOCK_PHOTOS = [
  {
    id: "1",
    url: "https://images.unsplash.com/photo-1517466787929-bc90951d64b8?q=80&w=800&auto=format&fit=crop",
    title: "Victoria contra Los Leones",
    date: "2023-10-15",
    location: "Estadio Municipal",
    category: "Sub-12",
    description: "Gran actuación del equipo bajo la lluvia.",
  },
  {
    id: "2",
    url: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?q=80&w=800&auto=format&fit=crop",
    title: "Entrenamiento Físico",
    date: "2023-10-12",
    location: "Complejo La Novena",
    category: "Sub-10",
    description: "Trabajo de coordinación y potencia.",
  },
  {
    id: "3",
    url: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?q=80&w=800&auto=format&fit=crop",
    title: "Charla Técnica",
    date: "2023-10-10",
    location: "Cancha 2",
    category: "Sub-12",
    description: "El profe Marcelo explicando la táctica.",
  },
  {
    id: "4",
    url: "https://images.unsplash.com/photo-1575361204480-aadea252468e?q=80&w=800&auto=format&fit=crop",
    title: "Celebración de Gol",
    date: "2023-09-28",
    location: "Estadio Germán Becker",
    category: "General",
    description: "La alegría del equipo tras el gol del empate.",
  },
  {
    id: "5",
    url: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop",
    title: "Torneo Interregional",
    date: "2023-09-20",
    location: "Valdivia",
    category: "Sub-10",
    description: "Viaje al campeonato sur.",
  },
];

export default function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [lightboxPhoto, setLightboxPhoto] = useState<any>(null);

  // Obtener categorías reales de los hijos para el filtro
  const { data }: any = useQuery(GET_GALLERY_TAGS);

  // Extraer categorías únicas de los hijos del apoderado
  const myCategories = Array.from(
    new Set(data?.me?.managedPlayers?.map((p: any) => p.category.name) || []),
  );

  const categories = ["Todas", "General", ...(myCategories as string[])];

  // Filtrar fotos
  const filteredPhotos = MOCK_PHOTOS.filter(
    (photo) =>
      selectedCategory === "Todas" || photo.category === selectedCategory,
  );

  // Handlers
  const openLightbox = (photo: any) => setLightboxPhoto(photo);
  const closeLightbox = () => setLightboxPhoto(null);

  const handleDownload = async (photoUrl: string, filename: string) => {
    // Simulación de descarga segura
    try {
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Error al descargar", e);
      alert("No se pudo descargar la imagen");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-indigo-900">
            Galería del Club
          </h1>
          <p className="text-sm text-gray-500">
            Revive los mejores momentos de la temporada.
          </p>
        </div>
      </div>

      {/* FILTROS (Chips) */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`
              px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border
              ${
                selectedCategory === cat
                  ? "bg-indigo-900 text-white border-indigo-900 shadow-md"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-indigo-200"
              }
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* PHOTO GRID (Masonry Style Simulado) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredPhotos.map((photo) => (
          <div
            key={photo.id}
            className="group relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300"
            onClick={() => openLightbox(photo)}
          >
            {/* Imagen */}
            <div className="aspect-[4/3] overflow-hidden bg-gray-100 relative">
              <img
                src={photo.url}
                alt={photo.title}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <p className="text-white text-xs font-bold flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> Ver foto
                </p>
              </div>
              {/* Badge Categoría */}
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-indigo-900 shadow-sm">
                {photo.category}
              </div>
            </div>

            {/* Info */}
            <div className="p-3">
              <h3 className="font-bold text-gray-800 text-sm truncate">
                {photo.title}
              </h3>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {photo.date}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* LIGHTBOX MODAL */}
      {lightboxPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-200">
          {/* Botón Cerrar */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-50"
          >
            <X className="w-8 h-8" />
          </button>

          <div className="max-w-5xl w-full h-full flex flex-col md:flex-row">
            {/* Imagen Grande */}
            <div className="flex-1 flex items-center justify-center p-4 relative">
              <img
                src={lightboxPhoto.url}
                alt={lightboxPhoto.title}
                className="max-h-[85vh] max-w-full object-contain shadow-2xl rounded-lg"
              />
            </div>

            {/* Sidebar de Detalles (Solo en Desktop o debajo en móvil) */}
            <div className="w-full md:w-80 bg-gray-900/50 md:bg-gray-900 text-white p-6 flex flex-col justify-between backdrop-blur-lg md:backdrop-blur-none border-l border-white/10">
              <div>
                <span className="inline-block px-2 py-1 bg-indigo-600 rounded text-xs font-bold mb-3">
                  {lightboxPhoto.category}
                </span>
                <h2 className="text-2xl font-bold mb-2">
                  {lightboxPhoto.title}
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                  {lightboxPhoto.description}
                </p>

                <div className="space-y-3 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <span>{lightboxPhoto.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>{lightboxPhoto.location}</span>
                  </div>
                </div>
              </div>

              {/* Botón Descargar */}
              <div className="mt-8 md:mt-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(lightboxPhoto.url, lightboxPhoto.title);
                  }}
                  className="w-full bg-white text-gray-900 hover:bg-gray-200 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Descargar Original
                </button>
                <p className="text-[10px] text-center text-gray-500 mt-2">
                  Solo uso personal y familiar.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
