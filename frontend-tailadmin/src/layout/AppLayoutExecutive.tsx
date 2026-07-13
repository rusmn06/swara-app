// src/layout/AppLayoutExecutive.tsx
import { Outlet } from "react-router";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import AppSidebarExecutive from "../layout/AppSidebarExecutive";
import AppHeaderExecutive from "../layout/AppHeaderExecutive"; // kalau ada header terpisah juga
import Backdrop from "./Backdrop";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen xl:flex">
      <div>
        <AppSidebarExecutive />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeaderExecutive />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const AppLayoutExecutive: React.FC = () => (
  <SidebarProvider>
    <LayoutContent />
  </SidebarProvider>
);

export default AppLayoutExecutive;