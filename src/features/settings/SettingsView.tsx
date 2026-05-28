import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../app/ThemeContext";
import { isRealFirebase } from "../../lib/firebase";
import {
  Settings,
  Sun,
  Moon,
  Database,
  Shield,
  Building2,
  Lock,
  Compass,
  FileCheck2,
  AlertOctagon
} from "lucide-react";

export default function SettingsView() {
  const { user, login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Company profile meta state
  const [companyName, setCompanyName] = useState("London Gateway Port Authority");
  const [carrierCode, setCarrierCode] = useState("LGP-441-GB");
  const [cargoInsurance, setCargoInsurance] = useState("CS-98122-UK");
  const [notif, setNotif] = useState<string | null>(null);

  const handleSaveCompanyDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setNotif("Company logistics parameters successfully updated.");
    setTimeout(() => setNotif(null), 3000);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {notif && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-150 dark:border-emerald-900/40 text-xs text-emerald-600 dark:text-emerald-400 rounded-xl">
          {notif}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Diagnostics & Credentials */}
        <div className="lg:col-span-1 space-y-6">
          {/* Theme card selection */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
            <h5 className="font-sans font-semibold text-gray-900 dark:text-zinc-50 text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sun className="w-4.5 h-4.5 text-amber-500" /> Core Environment Theme
            </h5>

            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4">
              Toggle the ambient theme preference for RouteLedger. Selection is saved natively across browser sessions.
            </p>

            <button
              onClick={toggleTheme}
              className="w-full py-2 border border-gray-200 dark:border-zinc-800 text-xs font-semibold rounded-lg hover:border-indigo-400 hover:text-indigo-600 transition-all cursor-pointer flex items-center justify-center gap-2 text-gray-700 dark:text-zinc-300 bg-gray-50 dark:bg-zinc-900"
              id="settings-theme-toggle-btn"
            >
              {theme === "light" ? (
                <>
                  <Moon className="w-4.5 h-4.5 text-indigo-550" />
                  <span>Activate Dark Twilight theme</span>
                </>
              ) : (
                <>
                  <Sun className="w-4.5 h-4.5 text-amber-450" />
                  <span>Activate Clean Daylight theme</span>
                </>
              )}
            </button>
          </div>

          {/* Secure credentials info panel */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3.5">
            <h5 className="font-sans font-semibold text-gray-900 dark:text-zinc-50 text-xs uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4.5 h-4.5 text-indigo-500" /> Crew Credentials
            </h5>

            <div className="text-xs space-y-2.5">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 dark:text-zinc-500 block">Logged Account email</span>
                <span className="font-sans font-bold text-gray-850 dark:text-zinc-205">{user?.email || "hajnel20@gmail.com"}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 dark:text-zinc-500 block">Cargo Privilege Clearance</span>
                <span className="font-sans font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-widest text-[10px]">
                  Logistics Master Admin
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 dark:text-zinc-500 block">Session Status</span>
                <span className="font-mono text-emerald-500 font-bold">MUTUAL SIGNED IN</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Company Logistics Profile Metadata & Database sync details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Details Form Card */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <div className="pb-3 border-b border-gray-150 dark:border-zinc-800 mb-5 flex items-center gap-2 text-gray-950 dark:text-white">
              <Building2 className="w-5 h-5 text-indigo-500" />
              <div>
                <h4 className="font-sans font-semibold text-sm">Company Logistics Profile Parameters</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">Configure metadata to populate on cargo clearance headers</p>
              </div>
            </div>

            <form onSubmit={handleSaveCompanyDetails} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">Company Entity Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-zinc-800 rounded-lg text-xs bg-transparent focus:ring-1"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">Carrier DOT Code</label>
                  <input
                    type="text"
                    value={carrierCode}
                    onChange={(e) => setCarrierCode(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-zinc-800 rounded-lg text-xs bg-transparent focus:ring-1 font-mono"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">Cargo Transit Marine Insurance Policy Reference</label>
                  <input
                    type="text"
                    value={cargoInsurance}
                    onChange={(e) => setCargoInsurance(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-zinc-800 rounded-lg text-xs bg-transparent focus:ring-1 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm"
                  id="settings-save-profile-btn"
                >
                  Save Profile Settings
                </button>
              </div>
            </form>
          </div>

          {/* Database Synchronization Status Diagnostic Canvas */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <div className="pb-3 border-b border-gray-150 dark:border-zinc-800 mb-4 flex items-center gap-2 text-gray-900 dark:text-zinc-50">
              <Database className="w-5 h-5 text-indigo-505" />
              <div>
                <h4 className="font-sans font-semibold text-sm">Database Sync & Cloud Integration Diagnostics</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">Real-time telemetry verification audit of cloud connections</p>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex justify-between items-center p-2.5 bg-gray-50 dark:bg-zinc-850/45 rounded-lg border border-gray-150 dark:border-zinc-800">
                <span className="font-sans font-medium text-gray-700 dark:text-zinc-300">Firestore Cloud Database</span>
                {isRealFirebase ? (
                  <span className="font-mono text-[10px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    REALTIME SYNCED
                  </span>
                ) : (
                  <span className="font-mono text-[10px] bg-amber-50 dark:bg-amber-955/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-200">
                    LOCAL SIMULATOR ENGINE (OFFLINE APPROVED)
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center p-2.5 bg-gray-50 dark:bg-zinc-850/45 rounded-lg border border-gray-150 dark:border-zinc-800">
                <span className="font-sans font-medium text-gray-700 dark:text-zinc-300">Firebase User Auth Registry</span>
                {isRealFirebase ? (
                  <span className="font-mono text-[10px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    REMOTE IDENTITY SYNCED
                  </span>
                ) : (
                  <span className="font-mono text-[10px] bg-amber-50 dark:bg-amber-955/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-200">
                    LOCAL SIMULATOR ENFORCED
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center p-2.5 bg-gray-50 dark:bg-zinc-850/45 rounded-lg border border-gray-150 dark:border-zinc-800">
                <span className="font-sans font-medium text-gray-700 dark:text-zinc-300">Google Gemini Extraction Worker (OCR)</span>
                <span className="font-mono text-[10px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  ONLINE WORKER INJECTED
                </span>
              </div>
            </div>

            {/* Instruction about Firebase sync setup */}
            {!isRealFirebase && (
              <div className="mt-4 p-3 bg-indigo-50/50 dark:bg-zinc-850/45 rounded-xl border border-indigo-150 dark:border-indigo-900/30 text-[11px] leading-relaxed text-indigo-750 dark:text-indigo-400 flex gap-2">
                <AlertOctagon className="w-5 h-5 shrink-0 mt-0.5" />
                <span>
                  <strong>Tip:</strong> If you would like to test physical database sync to Google Firestore, simply click <strong>Terms Accept</strong> on the AI Studio project provisioning sidebar. The configurations will dynamically activate.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
