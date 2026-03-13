// app/dashboard/admin/layout.tsx
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8FAFC] overflow-hidden w-full">
      {/* Puedes agregar un Header superior aquí si lo separas del Sidebar */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-10">{children}</main>
    </div>
  );
}
