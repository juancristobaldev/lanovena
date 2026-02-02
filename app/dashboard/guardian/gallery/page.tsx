"use client";

import React, { useState } from "react";
import {
  Loader2,
  Image as ImageIcon,
  Download,
  Calendar,
  MapPin,
  X,
  Filter,
  Maximize2,
  Share2,
} from "lucide-react";
import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";

// === GRAPHQL (Simulado para Tags) ===
const GET_GALLERY_TAGS = gql`
  query GetGalleryTags {
    meGuardian {
      managedPlayers {
        category {
          id
          name
        }
      }
    }
  }
`;

// === MOCK DATA ===
const MOCK_PHOTOS = [
  {
    id: "1",
    url: "https://images.unsplash.com/photo-1517466787929-bc90951d64b8?q=80&w=1200&auto=format&fit=crop",
    title: "Victoria contra Los Leones",
    date: "15 Oct 2023",
    location: "Estadio Municipal",
    category: "Sub-12",
    description:
      "Gran actuación del equipo bajo la lluvia. Remontada épica en el segundo tiempo.",
  },
  {
    id: "2",
    url: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?q=80&w=1200&auto=format&fit=crop",
    title: "Entrenamiento Físico",
    date: "12 Oct 2023",
    location: "Complejo La Novena",
    category: "Sub-10",
    description: "Trabajo de coordinación y potencia previo al campeonato.",
  },
  {
    id: "3",
    url: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?q=80&w=1200&auto=format&fit=crop",
    title: "Charla Técnica",
    date: "10 Oct 2023",
    location: "Cancha 2",
    category: "Sub-12",
    description:
      "El profe Marcelo explicando la táctica para el fin de semana.",
  },
  {
    id: "4",
    url: "https://images.unsplash.com/photo-1575361204480-aadea252468e?q=80&w=1200&auto=format&fit=crop",
    title: "Celebración de Gol",
    date: "28 Sep 2023",
    location: "Estadio Germán Becker",
    category: "General",
    description:
      "La alegría del equipo tras el gol del empate en el último minuto.",
  },
  {
    id: "5",
    url: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop",
    title: "Torneo Interregional",
    date: "20 Sep 2023",
    location: "Valdivia",
    category: "Sub-10",
    description:
      "Viaje al campeonato sur. Una experiencia inolvidable para los niños.",
  },
];

export default function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [lightboxPhoto, setLightboxPhoto] = useState<any>(null);

  const { data }: any = useQuery(GET_GALLERY_TAGS);

  // Categorías dinámicas
  const myCategories = Array.from(
    new Set(
      data?.meGuardian?.managedPlayers?.map((p: any) => p.category.name) || [],
    ),
  );
  const categories = ["Todas", "General", ...(myCategories as string[])];

  const filteredPhotos = MOCK_PHOTOS.filter(
    (photo) =>
      selectedCategory === "Todas" || photo.category === selectedCategory,
  );

  // --- Handlers ---
  const handleDownload = async (photoUrl: string, filename: string) => {
    try {
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `LaNovena_${filename.replace(/\s+/g, "_")}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert("Error al descargar. Intenta mantener presionada la imagen.");
    }
  };

  const handleShare = async (photo: any) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: photo.title,
          text: photo.description,
          url: photo.url,
        });
      } catch (error) {
        console.log("Error sharing", error);
      }
    } else {
      alert("Tu navegador no soporta compartir nativamente.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-screen bg-gray-50 animate-fade-in pb-24">
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#312E81] tracking-tight">
            Galería del Club
          </h1>
          <p className="text-gray-500 font-medium">
            Revive los mejores momentos de la temporada.
          </p>
        </div>

        {/* Filtros (Scroll Horizontal en Móvil) */}
        <div className="w-full md:w-auto flex gap-2 overflow-x-auto pb-2 no-scrollbar mask-gradient-r">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`
                px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border shadow-sm
                ${
                  selectedCategory === cat
                    ? "bg-[#312E81] text-white border-[#312E81] shadow-indigo-200"
                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-indigo-600"
                }
                `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 2. PHOTO GRID (Responsive) */}
      {filteredPhotos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              onClick={() => setLightboxPhoto(photo)}
            >
              {/* Imagen con Overlay */}
              <div className="aspect-[4/3] overflow-hidden bg-gray-200 relative">
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="bg-white/20 backdrop-blur-md text-white p-3 rounded-full">
                    <Maximize2 size={24} />
                  </span>
                </div>
                {/* Badge Categoría */}
                <div className="absolute top-3 left-3">
                  <span className="bg-white/90 backdrop-blur-sm text-[#312E81] text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
                    {photo.category}
                  </span>
                </div>
              </div>

              {/* Info Card */}
              <div className="p-4">
                <h3 className="font-bold text-gray-900 text-sm truncate mb-1">
                  {photo.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Calendar size={12} /> <span>{photo.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
          <ImageIcon size={48} className="text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">
            No hay fotos en esta categoría.
          </p>
        </div>
      )}

      {/* 3. LIGHTBOX MODAL (Full Screen) */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 p-4 md:p-8"
          onClick={() => setLightboxPhoto(null)} // Cerrar al hacer click afuera
        >
          {/* Botón Cerrar Flotante */}
          <button
            onClick={() => setLightboxPhoto(null)}
            className="absolute top-4 right-4 md:top-8 md:right-8 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors z-50 backdrop-blur-md"
          >
            <X size={24} />
          </button>

          <div
            className="max-w-6xl w-full max-h-full flex flex-col md:flex-row bg-[#1a1a1a] rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()} // Evitar cierre al clickear contenido
          >
            {/* Área de Imagen */}
            <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden group">
              <img
                src={lightboxPhoto.url}
                alt={lightboxPhoto.title}
                className="max-h-[50vh] md:max-h-[85vh] w-full object-contain"
              />
            </div>

            {/* Sidebar de Detalles */}
            <div className="w-full md:w-96 bg-[#1a1a1a] text-white p-6 md:p-8 flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/10 shrink-0">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-block px-3 py-1 bg-[#312E81] rounded-lg text-xs font-bold tracking-wide text-indigo-100 border border-indigo-500/30">
                    {lightboxPhoto.category}
                  </span>
                  <button
                    onClick={() => handleShare(lightboxPhoto)}
                    className="text-gray-400 hover:text-white transition-colors md:hidden"
                  >
                    <Share2 size={20} />
                  </button>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold mb-3 leading-tight">
                  {lightboxPhoto.title}
                </h2>

                <div className="space-y-3 text-sm text-gray-400 mb-6 border-b border-white/10 pb-6">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <span>{lightboxPhoto.date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>{lightboxPhoto.location}</span>
                  </div>
                </div>

                <p className="text-gray-300 text-sm leading-relaxed">
                  {lightboxPhoto.description}
                </p>
              </div>

              {/* Acciones */}
              <div className="mt-8 space-y-3">
                <button
                  onClick={() =>
                    handleDownload(lightboxPhoto.url, lightboxPhoto.title)
                  }
                  className="w-full bg-white text-gray-900 hover:bg-gray-200 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
                >
                  <Download size={18} />
                  Descargar Original
                </button>

                <p className="text-[10px] text-center text-gray-500">
                  © La Novena • Uso personal exclusivo.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
