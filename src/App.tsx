import React, { useState } from "react";
import { ThemeProvider } from "./features/app/ThemeContext";
import { AuthProvider, useAuth } from "./features/auth/AuthContext";
import LoginView from "./features/auth/LoginView";
import Layout from "./features/app/Layout";
import DashboardView from "./features/dashboard/DashboardView";
import InvoicesView from "./features/invoices/InvoicesView";
import TripsView from "./features/trips/TripsView";
import TrucksView from "./features/trucks/TrucksView";
import SettingsView from "./features/settings/SettingsView";
import { MenuSection } from "./types";

function MainAppDispatcher() {
  const { user, loading } = useAuth();
  const [activeSection, setActiveSection] = useState<MenuSection>("Dashboard");

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-50 font-sans transition-colors duration-255">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mt-5">
          Initializing RouteLedger Secure Session Gate...
        </p>
      </div>
    );
  }

  // Gatekeeper: Unauthenticated users are shown the industrial LoginView
  if (!user) {
    return <LoginView />;
  }

  // Switch Dispatcher for sidebar targets
  const renderActiveSection = () => {
    switch (activeSection) {
      case "Dashboard":
        return <DashboardView />;
      case "Invoices":
        return <InvoicesView />;
      case "Trips":
        return <TripsView />;
      case "Trucks":
        return <TrucksView />;
      case "Settings":
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <Layout activeSection={activeSection} setActiveSection={setActiveSection}>
      {renderActiveSection()}
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainAppDispatcher />
      </AuthProvider>
    </ThemeProvider>
  );
}
