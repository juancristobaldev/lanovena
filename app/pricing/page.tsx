"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Check,
  X,
  ShieldCheck,
  Users,
  Trophy,
  Building2,
  ArrowRight,
  HelpCircle,
  Star,
} from "lucide-react";
import { PLANS, SPECIAL_PLANS, Plan } from "@/src/utils/plans";

export default function PublicPricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* HEADER HERO */}
      <div className="bg-[#312E81] text-white pt-32 pb-24 px-6 text-center relative overflow-hidden">
        {/* Background Pattern (Araucaria abstracta o líneas de cancha) */}
        <div
          className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 50%, #ffffff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        ></div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <span className="inline-block py-1 px-3 rounded-full bg-indigo-800 text-indigo-200 text-xs font-bold uppercase tracking-wider mb-6 border border-indigo-700">
            Planes Flexibles
          </span>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
            Talento con identidad, <br />
            <span className="text-[#10B981]">gestión con tecnología</span>
          </h1>
          <p className="text-lg text-indigo-100 max-w-2xl mx-auto leading-relaxed mb-10">
            La plataforma que usan las mejores escuelas del sur. Elige el plan
            que se adapta al tamaño de tu cantera.
          </p>

          {/* Toggle Anual/Mensual */}
          <div className="inline-flex items-center bg-indigo-900/50 p-1 rounded-full border border-indigo-700 backdrop-blur-sm">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${!isAnnual ? "bg-white text-[#312E81] shadow-md" : "text-indigo-300 hover:text-white"}`}
            >
              Mensual
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${isAnnual ? "bg-white text-[#312E81] shadow-md" : "text-indigo-300 hover:text-white"}`}
            >
              Anual{" "}
              <span className="bg-[#10B981] text-white text-[10px] px-1.5 py-0.5 rounded ml-1">
                Ahorra 2 meses
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* PRICING CARDS (Overlap Header) */}
      <div className="max-w-7xl mx-auto px-6 -mt-16 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
          {PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} isAnnual={isAnnual} />
          ))}
        </div>

        {/* SECTION: NETWORK & INSTITUTIONAL */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* GOLD / NETWORK */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Trophy size={100} className="text-amber-600" />
            </div>
            <div className="relative z-10">
              <h3 className="text-amber-900 font-black text-2xl mb-2 flex items-center gap-2">
                🥇 Plan {SPECIAL_PLANS.GOLD.name}
              </h3>
              <p className="text-amber-800 mb-4 text-sm font-medium">
                {SPECIAL_PLANS.GOLD.description}
              </p>
              <ul className="space-y-2 mb-6">
                {SPECIAL_PLANS.GOLD.features.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-amber-900/80"
                  >
                    <Check size={16} className="text-amber-600" /> {f}
                  </li>
                ))}
              </ul>
              <div className="bg-white/60 p-3 rounded-lg inline-block">
                <p className="text-xs font-bold text-amber-900 uppercase">
                  Precio Preferencial
                </p>
                <p className="text-lg font-black text-amber-600">
                  {SPECIAL_PLANS.GOLD.priceNote}
                </p>
              </div>
            </div>
          </div>

          {/* INSTITUTIONAL */}
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Building2 size={100} className="text-gray-600" />
            </div>
            <div className="relative z-10">
              <h3 className="text-gray-900 font-black text-2xl mb-2 flex items-center gap-2">
                🏛️ {SPECIAL_PLANS.INSTITUTIONAL.name}
              </h3>
              <p className="text-gray-600 mb-4 text-sm font-medium">
                {SPECIAL_PLANS.INSTITUTIONAL.description}
              </p>
              <ul className="space-y-2 mb-6">
                {SPECIAL_PLANS.INSTITUTIONAL.features.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <Check size={16} className="text-gray-900" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/contact"
                className="text-[#312E81] font-bold text-sm hover:underline flex items-center gap-1"
              >
                Solicitar reunión de convenio <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ SECTION */}
      <div className="max-w-3xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-black text-center text-[#312E81] mb-10">
          Preguntas Frecuentes
        </h2>
        <div className="space-y-4">
          <FaqItem
            q="¿Qué pasa si me paso del límite de alumnos?"
            a="No te preocupes, el sistema te enviará una alerta cuando estés cerca del límite. Tendrás 7 días para regularizar o actualizar tu plan antes de que se bloqueen nuevos ingresos."
          />
          <FaqItem
            q="¿El Modo Institucional incluye cobros?"
            a="No. El Modo Institucional oculta automáticamente todos los módulos financieros (Caja, Deudas, Carro de Compras) para adaptarse a la gratuidad municipal."
          />
          <FaqItem
            q="¿Puedo cambiar de plan después?"
            a="Sí, puedes hacer un Upgrade en cualquier momento. El cambio es inmediato y se cobra el proporcional del mes."
          />
        </div>
      </div>
    </div>
  );
}

// === COMPONENTE TARJETA DE PRECIO ===
function PricingCard({ plan, isAnnual }: { plan: Plan; isAnnual: boolean }) {
  const price = isAnnual ? plan.priceYearly / 12 : plan.priceMonthly; // Mostrar precio mensual equivalente
  const yearlyTotal = plan.priceYearly;

  return (
    <div
      className={`
            relative flex flex-col p-8 rounded-2xl h-full transition-all duration-300
            ${plan.styles.card}
        `}
    >
      {plan.isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#10B981] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1 uppercase tracking-wide">
          <Star size={12} fill="currentColor" /> Recomendado
        </div>
      )}

      <div className="mb-6">
        <h3
          className={`text-lg font-bold uppercase tracking-wider mb-2 ${plan.id === "ALTO_RENDIMIENTO" ? "text-indigo-200" : "text-gray-500"}`}
        >
          {plan.name}
        </h3>
        <div className="flex items-baseline gap-1">
          <span
            className={`text-4xl font-black ${plan.id === "ALTO_RENDIMIENTO" ? "text-white" : "text-[#111827]"}`}
          >
            {plan.currency}
            {Math.round(price).toLocaleString("es-CL")}
          </span>
          <span
            className={`text-sm font-medium ${plan.id === "ALTO_RENDIMIENTO" ? "text-indigo-300" : "text-gray-400"}`}
          >
            /mes
          </span>
        </div>
        {isAnnual && (
          <p className="text-xs text-[#10B981] font-bold mt-1">
            Facturado ${yearlyTotal.toLocaleString("es-CL")} anual
          </p>
        )}
        <p
          className={`mt-4 text-sm leading-relaxed ${plan.id === "ALTO_RENDIMIENTO" ? "text-indigo-100" : "text-gray-600"}`}
        >
          {plan.tagline}
        </p>
      </div>

      {/* Limits Grid */}
      <div
        className={`grid grid-cols-2 gap-y-3 gap-x-2 text-xs font-medium mb-6 p-4 rounded-xl ${plan.id === "ALTO_RENDIMIENTO" ? "bg-slate-800 text-indigo-200" : "bg-gray-50 text-gray-600"}`}
      >
        <div className="flex items-center gap-2">
          <Building2 size={14} /> {plan.limits.schools} Sede
        </div>
        <div className="flex items-center gap-2">
          <Users size={14} /> {plan.limits.players} Alumnos
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} /> {plan.limits.coaches} Profes
        </div>
        <div className="flex items-center gap-2">
          <Trophy size={14} /> {plan.limits.categories} Series
        </div>
      </div>

      <div className="flex-1 space-y-3 mb-8">
        {plan.features.map((feat, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 text-sm ${!feat.included ? "opacity-40" : ""}`}
          >
            {feat.included ? (
              <Check
                size={16}
                className={
                  plan.id === "ALTO_RENDIMIENTO"
                    ? "text-[#10B981]"
                    : "text-[#312E81]"
                }
              />
            ) : (
              <X size={16} className="text-gray-400" />
            )}
            <span
              className={
                plan.id === "ALTO_RENDIMIENTO"
                  ? "text-gray-200"
                  : "text-gray-700"
              }
            >
              {feat.text}
            </span>
          </div>
        ))}
      </div>

      <Link
        href="/register"
        className={`
                w-full py-3.5 rounded-xl font-bold text-center transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2
                ${plan.styles.button}
            `}
      >
        {plan.buttonText} <ArrowRight size={16} />
      </Link>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 text-left flex justify-between items-center font-bold text-gray-800 hover:bg-gray-50"
      >
        {q}
        <HelpCircle size={18} className="text-gray-400" />
      </button>
      {open && (
        <div className="px-6 pb-4 text-sm text-gray-600 leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}
