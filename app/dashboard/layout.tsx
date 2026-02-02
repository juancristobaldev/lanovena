import Sidebar from "@/src/components/Drawer";

// app/dashboard/layout.tsx
export default function DashboardLayout({ children }: any) {
  return (
    <div className="flex w-full max-w-[1200px] mx-auto">
      <Sidebar />

      <main className="w-full">{children}</main>
    </div>
  );
}
