import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "./ThemeContext";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Milestone,
  Truck,
  Settings,
  LogOut,
  Sun,
  Moon,
  Search,
  Bell,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { MenuSection } from "../../types";

interface LayoutProps {
  activeSection: MenuSection;
  setActiveSection: (section: MenuSection) => void;
  children: React.ReactNode;
}

export default function Layout({ activeSection, setActiveSection, children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebar_collapsed") === "true";
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const newVal = !prev;
      localStorage.setItem("sidebar_collapsed", String(newVal));
      return newVal;
    });
  };

  const menuItems = [
    { name: "Dashboard" as MenuSection, icon: LayoutDashboard },
    { name: "Invoices" as MenuSection, icon: FileSpreadsheet },
    { name: "Trips" as MenuSection, icon: Milestone },
    { name: "Trucks" as MenuSection, icon: Truck },
    { name: "Settings" as MenuSection, icon: Settings }
  ];

  const userDisplayName = user?.email ? user.email.split("@")[0] : "hajnel20";

  return (
    <div className="min-h-screen flex bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
      {/* Sidebar for Desktop */}
      <aside className={`hidden lg:flex flex-col ${isCollapsed ? "w-16" : "w-64"} border-r border-[#1e1e24]/10 bg-[#0d0d0f] text-zinc-300 transition-all duration-300 relative`}>
        {/* Toggle Collapse Button on Desktop Sidebar */}
        <button
          onClick={toggleCollapse}
          className="absolute top-[96px] -right-3.5 w-[26px] h-[26px] bg-[#6366f1] rounded-full flex items-center justify-center text-white border-[3.5px] border-[#f8fafc] dark:border-slate-950 hover:bg-indigo-550 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer shadow-md z-50"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          id="sidebar-collapse-toggle-btn"
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
          ) : (
            <X className="w-2.5 h-2.5 stroke-[3]" />
          )}
        </button>

        {/* Inner Scrollable Container to prevent clipping absolute elements */}
        <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
          {/* Sidebar Header Brand (InvoiceForge as in the screenshot) */}
          <div className={`p-6 border-b border-zinc-900 flex items-center transition-all ${isCollapsed ? "justify-center" : "gap-3"}`}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm shadow-indigo-500/20">
              <FileSpreadsheet className="w-4.5 h-4.5" id="brand-logo-doc" />
            </div>
            {!isCollapsed && (
              <h1 className="font-sans font-bold tracking-tight text-white text-lg transition-all duration-200">
                InvoiceForge
              </h1>
            )}
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 p-3 space-y-1 mt-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveSection(item.name)}
                  className={`w-full flex items-center rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                    isCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2"
                  } ${
                    isActive
                      ? "bg-[#16161a] text-white font-semibold"
                      : "text-zinc-400 hover:bg-[#16161a]/60 hover:text-white"
                  }`}
                  id={`menu-item-${item.name.toLowerCase()}`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-indigo-500" : "text-zinc-500 hover:text-zinc-350"}`} />
                  {!isCollapsed && (
                    <span className="transition-all duration-200">{item.name}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer User Detail - Simple & Elegant */}
          <div className="p-4 border-t border-zinc-900">
            <button
              onClick={() => logout()}
              className={`w-full flex items-center rounded-lg text-sm font-medium text-zinc-400 hover:bg-[#16161a]/80 hover:text-white transition-all cursor-pointer ${
                isCollapsed ? "justify-center p-2" : "gap-2.5 px-3 py-2"
              }`}
              id="sidebar-logout-button"
              title={isCollapsed ? "Logout" : undefined}
            >
              <LogOut className="w-4.5 h-4.5" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 lg:hidden bg-zinc-950/60 z-40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
          <aside
            className="fixed top-0 bottom-0 left-0 w-64 bg-[#0d0d0f] text-zinc-300 p-5 flex flex-col z-50 border-r border-zinc-900"
            onClick={(e) => e.stopPropagation()}
            id="mobile-sidebar"
          >
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shrink-0">
                  <FileSpreadsheet className="w-4.5 h-4.5" />
                </div>
                <span className="font-bold text-lg text-white">InvoiceForge</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      setActiveSection(item.name);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-[#16161a] text-white font-semibold"
                        : "text-zinc-400 hover:bg-[#16161a]/60 hover:text-white"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "text-indigo-500" : "text-zinc-500"}`} />
                    {item.name}
                  </button>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-zinc-900">
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:bg-[#16161a]/80 hover:text-white"
              >
                <LogOut className="w-4.5 h-4.5" />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header Bar with Screenshot Search & User avatar/username styling */}
        <header className="h-16 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between px-6 shrink-0 transition-colors duration-200">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 lg:hidden text-gray-500 hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Search inputs as in the screenshot */}
            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400 dark:text-zinc-500" />
              <input
                type="text"
                placeholder="Search invoices, clients..."
                className="w-full pl-10 pr-4 py-2 bg-transparent text-sm text-gray-850 dark:text-zinc-200 border border-gray-200/80 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                id="header-global-search-bar"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 border border-gray-200 dark:border-zinc-800 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-indigo-600 transition-all cursor-pointer"
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
              id="theme-toggle-button"
            >
              {theme === "light" ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
            </button>

            {/* Notification Bell matching screenshot red dot style */}
            <div className="relative">
              <button className="p-2 border border-gray-200 dark:border-zinc-800 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-805 text-gray-500 dark:text-zinc-400 transition-all cursor-pointer">
                <Bell className="w-4.5 h-4.5 text-gray-700 dark:text-zinc-300" />
              </button>
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500"></span>
            </div>

            {/* Avatar & Username matching screenshot (Initial "H" + "hajnel20") */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-semibold uppercase text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 font-mono">
                {userDisplayName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline-block text-xs font-semibold text-gray-700 dark:text-zinc-300 font-mono">
                {userDisplayName}
              </span>
            </div>
          </div>
        </header>

        {/* Primary Page Canvas */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
