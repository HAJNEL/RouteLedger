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
  X
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

  const menuItems = [
    { name: "Dashboard" as MenuSection, icon: LayoutDashboard },
    { name: "Invoices" as MenuSection, icon: FileSpreadsheet },
    { name: "Trips" as MenuSection, icon: Milestone },
    { name: "Trucks" as MenuSection, icon: Truck },
    { name: "Settings" as MenuSection, icon: Settings }
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800 bg-slate-900 text-slate-300 overflow-y-auto duration-200">
        {/* Sidebar Header Brand */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0 shadow-sm shadow-blue-500/20">
            <Truck className="w-4.5 h-4.5" id="brand-logo-truck" />
          </div>
          <div>
            <h1 className="font-sans font-bold tracking-tight text-white text-base">
              RouteLedger
            </h1>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
              Fleet Admin Hub
            </p>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 space-y-1 mt-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveSection(item.name)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                }`}
                id={`menu-item-${item.name.toLowerCase()}`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-blue-550" : "text-slate-500 hover:text-slate-300"}`} />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer User Detail */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-2.5 p-2 bg-slate-800/40 rounded-xl mb-3 overflow-hidden text-ellipsis border border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold uppercase text-slate-200 shrink-0 border border-slate-700">
              {user?.email ? user.email.charAt(0) : "A"}
            </div>
            <div className="ml-1 min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {user?.email || "hajnel20@gmail.com"}
              </p>
              <p className="text-[10px] text-slate-500 font-mono truncate">
                Admin Privilege
              </p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-slate-800/80 hover:text-red-300 transition-all cursor-pointer"
            id="sidebar-logout-button"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 lg:hidden bg-zinc-950/60 z-40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
          <aside
            className="fixed top-0 bottom-0 left-0 w-64 bg-slate-900 text-slate-300 p-5 flex flex-col z-50 border-r border-slate-800"
            onClick={(e) => e.stopPropagation()}
            id="mobile-sidebar"
          >
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
              <span className="font-bold text-lg text-white">RouteLedger</span>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
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
                        ? "bg-slate-800 text-white shadow-sm"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "text-blue-550" : "text-slate-500"}`} />
                    {item.name}
                  </button>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-slate-800/80"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between px-6 shrink-0 transition-colors duration-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 lg:hidden text-gray-500 hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-sans font-semibold tracking-tight text-gray-900 dark:text-white">
              {activeSection}
            </h2>
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

            {/* Simulated Notification Indicator */}
            <div className="relative">
              <button className="p-2 border border-gray-200 dark:border-zinc-800 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 transition-all">
                <Bell className="w-4.5 h-4.5" />
              </button>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            </div>

            <div className="hidden sm:block text-xs font-mono text-gray-400 dark:text-zinc-500 uppercase bg-gray-50 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
              Secure Cloud Session
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
