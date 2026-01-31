import Sidebar from "@/src/components/Drawer";

// app/dashboard/layout.tsx
export default function DashboardLayout({ children }: any) {
  return (
    <div className="flex">
      <Sidebar />

      <main>{children}</main>
    </div>
  );
}
