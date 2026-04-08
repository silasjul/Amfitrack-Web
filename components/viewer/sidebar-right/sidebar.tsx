import { AppSidebar } from "@/components/viewer/sidebar-right/app-sidebar";
import {
  RightSidebarInset,
  RightSidebarProvider,
  RightSidebarTrigger,
} from "@/components/ui/sidebar-right";

export default function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <RightSidebarProvider>
      <RightSidebarInset className="min-w-0 overflow-hidden">
        <div className="absolute top-0 right-0 z-10 flex shrink-0 items-center gap-2 p-2">
          <RightSidebarTrigger className="bg-sidebar p-4 shadow-sidebar text-sidebar-foreground/50 hover:text-sidebar-foreground" />
        </div>
        {children}
      </RightSidebarInset>
      <AppSidebar />
    </RightSidebarProvider>
  );
}
