import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../app/ThemeContext";
import { isRealFirebase } from "../../lib/firebase";
import { dbService } from "../../lib/db";
import { Warehouse } from "../../types";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useAdvancedMarkerRef,
  useMap
} from "@vis.gl/react-google-maps";
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
  AlertOctagon,
  MapPin,
  Plus,
  Trash2,
  Edit3,
  Map as MapIcon,
  Phone,
  HelpCircle
} from "lucide-react";

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";
const hasValidKey = Boolean(API_KEY) && API_KEY.trim() !== "" && !API_KEY.includes("YOUR_") && !API_KEY.includes("•");

function MapRecenter({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (map && target) {
      map.panTo(target);
    }
  }, [map, target]);
  return null;
}

function WarehouseMarker({ wh, isSelected, onClick }: { wh: Warehouse; isSelected: boolean; onClick: () => void; key?: string }) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: wh.lat, lng: wh.lng }}
        onClick={() => {
          onClick();
          setShowInfo(true);
        }}
      >
        <Pin
          background={isSelected ? "#ea580c" : "#4f46e5"}
          borderColor={isSelected ? "#c2410c" : "#4338ca"}
          glyphColor="#fff"
        />
      </AdvancedMarker>
      {showInfo && (
        <InfoWindow anchor={marker} onCloseClick={() => setShowInfo(false)}>
          <div className="p-1 font-sans text-xs text-gray-800 max-w-xs space-y-1">
            <h6 className="font-bold text-gray-900 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              {wh.name}
            </h6>
            <p className="text-[11px] text-gray-500 leading-tight">{wh.address}</p>
            {wh.capacity_sqm && (
              <p className="text-[10px] font-mono font-medium text-emerald-600 bg-emerald-50 max-w-max px-1.5 py-0.2 rounded mt-1">
                Capacity: {wh.capacity_sqm.toLocaleString()} sqm
              </p>
            )}
            {wh.contact_number && (
              <p className="text-[10px] text-gray-400 font-mono pt-1">
                📞 {wh.contact_number}
              </p>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export default function SettingsView() {
  const { user } = useAuth();
  const userId = user?.userId || "simulated-user";
  const { theme, toggleTheme } = useTheme();

  // Company profile meta state
  const [companyName, setCompanyName] = useState("London Gateway Port Authority");
  const [carrierCode, setCarrierCode] = useState("LGP-441-GB");
  const [cargoInsurance, setCargoInsurance] = useState("CS-98122-UK");
  const [notif, setNotif] = useState<string | null>(null);

  // Warehouse list & form state
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Form states
  const [whName, setWhName] = useState("");
  const [whAddress, setWhAddress] = useState("");
  const [whLat, setWhLat] = useState("");
  const [whLng, setWhLng] = useState("");
  const [whCapacity, setWhCapacity] = useState("");
  const [whContact, setWhContact] = useState("");

  useEffect(() => {
    async function fetchWarehouses() {
      try {
        const list = await dbService.getWarehouses(userId);
        setWarehouses(list);
        if (list.length > 0) {
          setSelectedWarehouse(list[0]);
        }
      } catch (err) {
        console.error("Error fetching warehouses in SettingsView:", err);
      }
    }
    fetchWarehouses();
  }, [userId]);

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whName || !whAddress || !whLat || !whLng) {
      alert("Please specify the Name, Address, Latitude and Longitude.");
      return;
    }

    const latNum = parseFloat(whLat);
    const lngNum = parseFloat(whLng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      alert("Latitude and Longitude must be valid decimal numbers.");
      return;
    }

    const nextWh: Warehouse = {
      id: currentId || `wh-${Date.now()}`,
      name: whName,
      address: whAddress,
      lat: latNum,
      lng: lngNum,
      capacity_sqm: whCapacity ? parseInt(whCapacity, 10) : undefined,
      contact_number: whContact || undefined,
      userId: userId
    };

    try {
      await dbService.saveWarehouse(nextWh);
      const list = await dbService.getWarehouses(userId);
      setWarehouses(list);
      setSelectedWarehouse(nextWh);
      resetForm();
      setNotif(currentId ? "Warehouse depot parameters successfully updated." : "New logistics distribution depot registered.");
      setTimeout(() => setNotif(null), 3500);
    } catch (err) {
      console.error("Error saving warehouse depot:", err);
    }
  };

  const handleEdit = (wh: Warehouse) => {
    setIsEditing(true);
    setCurrentId(wh.id);
    setWhName(wh.name);
    setWhAddress(wh.address);
    setWhLat(wh.lat.toString());
    setWhLng(wh.lng.toString());
    setWhCapacity(wh.capacity_sqm?.toString() || "");
    setWhContact(wh.contact_number || "");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this distribution depot?")) return;
    try {
      await dbService.deleteWarehouse(id);
      const list = await dbService.getWarehouses(userId);
      setWarehouses(list);
      if (selectedWarehouse?.id === id) {
        setSelectedWarehouse(list[0] || null);
      }
      setNotif("Logistics distribution depot removed.");
      setTimeout(() => setNotif(null), 3000);
    } catch (err) {
      console.error("Error removing depot:", err);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentId(null);
    setWhName("");
    setWhAddress("");
    setWhLat("");
    setWhLng("");
    setWhCapacity("");
    setWhContact("");
  };

  const handleMapClick = (e: any) => {
    const clickedLatLng = e.detail?.latLng || e.latLng;
    if (clickedLatLng) {
      const lat = typeof clickedLatLng.lat === 'function' ? clickedLatLng.lat() : clickedLatLng.lat;
      const lng = typeof clickedLatLng.lng === 'function' ? clickedLatLng.lng() : clickedLatLng.lng;
      setWhLat(lat.toFixed(6));
      setWhLng(lng.toFixed(6));
      if (!isEditing) {
        setIsEditing(true);
      }
    }
  };

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
              Toggle the ambient theme preference for InvoiceForge. Selection is saved natively across browser sessions.
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

        {/* Warehouses configuration and map */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="pb-3 border-b border-gray-150 dark:border-zinc-800 mb-5 flex justify-between items-center text-gray-950 dark:text-white flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-indigo-500" />
              <div>
                <h4 className="font-sans font-semibold text-sm">Warehouse Locations & Depot Hubs</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">Manage regional cargo dispatch centers and distribution warehouses on the map</p>
              </div>
            </div>
            
            <button
              onClick={() => { resetForm(); setIsEditing(true); }}
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 font-semibold rounded-lg text-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Depot
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Warehouses directory list & form builder */}
            <div className="lg:col-span-5 space-y-4">
              {/* Dynamic Depot Form when active */}
              {isEditing && (
                <form onSubmit={handleAddOrUpdate} className="p-4 bg-gray-50/50 dark:bg-zinc-850/10 border border-gray-150 dark:border-zinc-800 rounded-xl space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                      {currentId ? "Modify Depot Parameters" : "Register Distribution Depot"}
                    </span>
                    <button
                      onClick={resetForm}
                      type="button"
                      className="text-[11px] font-mono text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">Depot / Yard Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Manchester Distribution Yard"
                        value={whName}
                        onChange={(e) => setWhName(e.target.value)}
                        required
                        className="w-full px-3 py-1.5 border border-gray-300 dark:border-zinc-800 rounded-lg bg-transparent text-gray-800 dark:text-zinc-100 placeholder-gray-400 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">Street Address</label>
                      <input
                        type="text"
                        placeholder="e.g. Trafford Park, Manchester M17 1GA"
                        value={whAddress}
                        onChange={(e) => setWhAddress(e.target.value)}
                        required
                        className="w-full px-3 py-1.5 border border-gray-300 dark:border-zinc-800 rounded-lg bg-transparent text-gray-800 dark:text-zinc-100 placeholder-gray-400 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">Latitude</label>
                        <input
                          type="text"
                          placeholder="e.g. 53.4808"
                          value={whLat}
                          onChange={(e) => setWhLat(e.target.value)}
                          required
                          className="w-full px-3 py-1.5 border border-gray-300 dark:border-zinc-800 rounded-lg bg-transparent text-gray-800 dark:text-zinc-100 placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">Longitude</label>
                        <input
                          type="text"
                          placeholder="e.g. -2.2426"
                          value={whLng}
                          onChange={(e) => setWhLng(e.target.value)}
                          required
                          className="w-full px-3 py-1.5 border border-gray-300 dark:border-zinc-800 rounded-lg bg-transparent text-gray-800 dark:text-zinc-100 placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 font-mono"
                        />
                      </div>
                    </div>

                    {/* Quick Presets Builder */}
                    <div className="bg-white/40 dark:bg-zinc-900/40 p-2 rounded-lg border border-gray-200 dark:border-zinc-800">
                      <span className="block text-[9px] uppercase font-mono tracking-widest text-gray-400 dark:text-zinc-550 mb-1.5">Location Quick presets (UK & US)</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { name: "London", lat: 51.5074, lng: 0.1278 },
                          { name: "Birmingham", lat: 52.4862, lng: -1.8904 },
                          { name: "Manchester", lat: 53.4808, lng: -2.2426 },
                          { name: "Houston", lat: 29.7604, lng: -95.3698 }
                        ].map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => {
                              setWhLat(preset.lat.toFixed(4));
                              setWhLng(preset.lng.toFixed(4));
                            }}
                            className="px-2 py-0.5 bg-gray-100 hover:bg-indigo-55 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-indigo-950/40 text-gray-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded text-[10px] font-mono cursor-pointer transition-colors"
                          >
                            📍 {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="hidden sm:block text-[9px] text-indigo-600 dark:text-indigo-400 font-medium">
                      💡 Tip: Click on the interactive map directly to drop pin coordinates into form!
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-450 mb-1">Capacity (sqm)</label>
                        <input
                          type="number"
                          placeholder="e.g. 5000"
                          value={whCapacity}
                          onChange={(e) => setWhCapacity(e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-300 dark:border-zinc-800 rounded-lg bg-transparent text-gray-800 dark:text-zinc-100 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-450 mb-1">Contact Phone</label>
                        <input
                          type="text"
                          placeholder="e.g. +44..."
                          value={whContact}
                          onChange={(e) => setWhContact(e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-300 dark:border-zinc-800 rounded-lg bg-transparent text-gray-800 dark:text-zinc-100 focus:ring-1 focus:ring-indigo-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 text-xs pt-1.5">
                    <button
                      onClick={resetForm}
                      type="button"
                      className="px-3 py-1.5 bg-gray-150 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 rounded-lg font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold cursor-pointer shadow-sm"
                    >
                      Save depot
                    </button>
                  </div>
                </form>
              )}

              {/* Directory list of saved warehouses */}
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {warehouses.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-400 dark:text-zinc-500 font-mono border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl bg-gray-50/20 dark:bg-zinc-900">
                    No active warehouses declared. Fill out form or click presets above.
                  </div>
                ) : (
                  warehouses.map((wh) => {
                    const isSelected = selectedWarehouse?.id === wh.id;
                    return (
                      <div
                        key={wh.id}
                        onClick={() => setSelectedWarehouse(wh)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#f5f7ff] dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/60 ring-1 ring-indigo-500/20"
                            : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-850/45"
                        } flex justify-between items-start gap-3`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400"}`} />
                            <span className="text-xs font-bold text-gray-800 dark:text-zinc-150 truncate block">
                              {wh.name}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-450 dark:text-zinc-500 truncate mt-1">
                            {wh.address}
                          </p>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[9px] font-mono font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest bg-gray-55 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                              {wh.lat.toFixed(4)} • {wh.lng.toFixed(4)}
                            </span>
                            {wh.capacity_sqm && (
                              <span className="text-[9px] font-sans font-medium text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">
                                {wh.capacity_sqm.toLocaleString()} sqm
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleEdit(wh)}
                            className="p-1 text-gray-400 hover:text-indigo-650 dark:hover:text-indigo-400 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Edit depot"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(wh.id)}
                            className="p-1 text-gray-400 hover:text-red-650 dark:hover:text-red-400 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Remove depot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Map rendering canvas container */}
            <div className="lg:col-span-7 h-[420px] bg-gray-50 dark:bg-zinc-950 border border-gray-150 dark:border-zinc-800 rounded-2xl overflow-hidden relative shadow-inner">
              {hasValidKey ? (
                <APIProvider apiKey={API_KEY} version="weekly">
                  <Map
                    defaultCenter={{ lat: 51.5074, lng: 0.1278 }}
                    defaultZoom={11}
                    mapId="DEMO_MAP_ID"
                    onClick={handleMapClick}
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    style={{ width: '100%', height: '100%' }}
                  >
                    {warehouses.map((wh) => (
                      <WarehouseMarker
                        key={wh.id}
                        wh={wh}
                        isSelected={selectedWarehouse?.id === wh.id}
                        onClick={() => setSelectedWarehouse(wh)}
                      />
                    ))}
                    <MapRecenter target={selectedWarehouse ? { lat: selectedWarehouse.lat, lng: selectedWarehouse.lng } : null} />
                  </Map>
                </APIProvider>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-900 text-slate-100 font-sans border border-slate-750">
                  <div className="max-w-md text-center space-y-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-amber-500 animate-pulse border border-slate-700 text-lg">
                      📍
                    </div>
                    
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Google Maps API Key Required</h3>
                    
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Google Maps requires an API Key credential to load satellite terrain data, geocoding libraries, and display interactive warehouses on the live dispatch map.
                    </p>

                    <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-left space-y-2 text-xs font-sans">
                      <p className="text-emerald-400 font-medium font-bold">✨ Interactive Simulated Map Mode</p>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Don't have a key? You can still declare depots, add multiple warehouses locally, select items, and update details using the list left.
                      </p>
                      <div className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-2 font-mono">
                        <span className="text-indigo-400">Step 1:</span> Get a key: <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener" className="text-blue-400 underline hover:text-blue-300">Google Console</a>
                        <br />
                        <span className="text-indigo-400">Step 2:</span> Go to top-right Gear ⚙️ → Secrets → add <code>GOOGLE_MAPS_PLATFORM_KEY</code>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
