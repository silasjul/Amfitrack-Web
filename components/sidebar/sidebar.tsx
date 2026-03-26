import { AppSidebar } from "@/components/sidebar/app-sidebar";
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
          <SidebarTrigger className="bg-[#292d39] p-4 shadow-[0_0_9px_0_#00000088] text-[#8c92a4] hover:text-white" />
        </div>
        {/* Page content */}
        {children}  
      </SidebarInset>
    </SidebarProvider>
  );
}
