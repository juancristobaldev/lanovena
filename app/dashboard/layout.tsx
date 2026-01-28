// app/dashboard/layout.tsx
export default function DashboardLayout({ children }: any) {
  return (
    <div>
      <aside>Sidebar</aside>
      <main>{children}</main>
    </div>
  );
}
