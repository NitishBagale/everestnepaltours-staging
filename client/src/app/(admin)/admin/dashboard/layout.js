import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import AdminHeader from "@/components/AdminHeader";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";

export default function DashboardLayout({ children }) {
  return (
    <ProtectedRoute>
      <RoleProtectedRoute allowedRoles={["admin", "editor", "superadmin"]}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex flex-col h-screen overflow-hidden p-0 m-0 text-[18px]">
            <AdminHeader />
            <main
              id="admin-scroll-area"
              className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50"
            >
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </RoleProtectedRoute>
    </ProtectedRoute>
  );
}
