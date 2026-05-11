import { AppSidebar } from "@/components/general/sidebar-left/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-hidden">
        <div className="absolute top-0 left-0 z-10 flex shrink-0 items-center gap-2 p-2">
          <SidebarTrigger className="bg-sidebar p-4 shadow-sidebar text-sidebar-foreground/50 hover:text-sidebar-foreground" />
        </div>
        {/* Page content */}
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
