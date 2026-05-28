import React, { useEffect, useState } from "react";
import { dbService, OperationType } from "../../lib/db";
import { Invoice, Trip, Truck } from "../../types";
import { useAuth } from "../auth/AuthContext";
import {
  TrendingUp,
  Clock,
  Navigation,
  Fuel,
  Users,
  ShieldAlert,
  CalendarDays,
  CheckCircle2,
  ArrowRight,
  ClipboardList,
  Package,
  Truck as TruckIcon,
  FileText
} from "lucide-react";
import { motion } from "motion/react";

const DAYS_OF_WEEK = [
  { label: "M", index: 0, full: "Monday" },
  { label: "T", index: 1, full: "Tuesday" },
  { label: "W", index: 2, full: "Wednesday" },
  { label: "T", index: 3, full: "Thursday" },
  { label: "F", index: 4, full: "Friday" },
  { label: "S", index: 5, full: "Saturday" },
  { label: "S", index: 6, full: "Sunday" }
];

function getWeekdayIndex(dateStr: string): number {
  if (!dateStr) return -1;
  const parts = dateStr.split("-");
  if (parts.length < 3) return -1;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  const dayOfWeek = d.getDay(); // 0 is Sunday, 1 is Monday...
  return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
}

export default function DashboardView() {
  const { user } = useAuth();
  const userId = user?.userId || "simulated-user";
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{
    truck: Truck;
    weekdayIndex: number;
    trips: Trip[];
  } | null>(null);

  useEffect(() => {
    async function fetchDashboardContent() {
      try {
        const invs = await dbService.getInvoices(userId);
        const tps = await dbService.getTrips();
        const trks = await dbService.getTrucks();
        setInvoices(invs);
        setTrips(tps);
        setTrucks(trks);
      } catch (err) {
        console.error("Failed to load dashboard statistics:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardContent();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono text-gray-450 mt-4 uppercase">Loading Logistics Aggregates...</p>
      </div>
    );
  }

  // Derived Analytics
  const approvedInvoices = invoices.filter(x => x.status === "approved");
  const grossRevenue = approvedInvoices.reduce((acc, curr) => acc + (curr.summary.total_due || 0), 0);
  const pendingRevenue = invoices.filter(x => x.status === "pending").reduce((acc, curr) => acc + (curr.summary.total_due || 0), 0);

  // Derived Counts for new KPI Cards
  const scheduledTrips = trips.filter(t => t.status === "scheduled");
  const inTransitTrips = trips.filter(t => t.status === "in_transit");
  const deliveredTrips = trips.filter(t => t.status === "delivered");

  const assemblyCount = scheduledTrips.length;
  const loadedCount = inTransitTrips.length;
  const deliveredCount = deliveredTrips.length;
  const invoicedCount = invoices.length;

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards with soft grid container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: ASSEMBLY */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-850 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
          id="kpi-card-assembly"
        >
          <div className="flex justify-between items-center">
            <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div className="w-5 h-0.5 bg-gray-200 dark:bg-zinc-800 rounded"></div>
          </div>
          <div className="mt-5">
            <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-gray-400 dark:text-zinc-500 uppercase">
              Assembly
            </span>
            <h3 className="text-3xl font-sans font-black tracking-tight text-gray-900 dark:text-zinc-100 mt-1">
              {assemblyCount}
            </h3>
            <span className="text-[10px] font-mono font-bold tracking-wider text-gray-400 dark:text-zinc-500 uppercase mt-2 block">
              Picking & Packing
            </span>
          </div>
        </motion.div>

        {/* Card 2: LOADED */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-850 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
          id="kpi-card-loaded"
        >
          <div className="flex justify-between items-center">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-500 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <div className="w-5 h-0.5 bg-gray-200 dark:bg-zinc-800 rounded"></div>
          </div>
          <div className="mt-5">
            <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-gray-400 dark:text-zinc-500 uppercase">
              Loaded
            </span>
            <h3 className="text-3xl font-sans font-black tracking-tight text-gray-900 dark:text-zinc-100 mt-1">
              {loadedCount}
            </h3>
            <span className="text-[10px] font-mono font-bold tracking-wider text-gray-400 dark:text-zinc-500 uppercase mt-2 block">
              Ready for Transit
            </span>
          </div>
        </motion.div>

        {/* Card 3: DELIVERED */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-850 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
          id="kpi-card-delivered"
        >
          <div className="flex justify-between items-center">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <TruckIcon className="w-5 h-5" />
            </div>
            <div className="w-5 h-0.5 bg-gray-200 dark:bg-zinc-800 rounded"></div>
          </div>
          <div className="mt-5">
            <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-gray-400 dark:text-zinc-500 uppercase">
              Delivered
            </span>
            <h3 className="text-3xl font-sans font-black tracking-tight text-gray-900 dark:text-zinc-100 mt-1">
              {deliveredCount}
            </h3>
            <span className="text-[10px] font-mono font-bold tracking-wider text-gray-400 dark:text-zinc-500 uppercase mt-2 block">
              Successful Drops
            </span>
          </div>
        </motion.div>

        {/* Card 4: INVOICED */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-850 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
          id="kpi-card-invoiced"
        >
          <div className="flex justify-between items-center">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div className="w-5 h-0.5 bg-gray-200 dark:bg-zinc-800 rounded"></div>
          </div>
          <div className="mt-5">
            <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-gray-400 dark:text-zinc-500 uppercase">
              Invoiced
            </span>
            <h3 className="text-3xl font-sans font-black tracking-tight text-gray-900 dark:text-zinc-100 mt-1">
              {invoicedCount}
            </h3>
            <span className="text-[10px] font-mono font-bold tracking-wider text-gray-400 dark:text-zinc-500 uppercase mt-2 block">
              Finalized Records
            </span>
          </div>
        </motion.div>
      </div>



      {/* Weekly Schedule Grid Area */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden" id="weekly-dispatch-schedule-card">
        {/* Centered Blue-Grey Header */}
        <div className="bg-[#f8fafc] dark:bg-zinc-850/50 py-4 px-6 border-b border-gray-150 dark:border-zinc-800 text-center">
          <h3 className="text-base font-sans font-black text-[#1e293b] dark:text-zinc-100 tracking-wide select-none">
            Weekly Dispatch Schedule
          </h3>
        </div>

        {/* Outer Scroll Container for fully fluid table on mobile */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px] divide-y divide-gray-100 dark:divide-zinc-800">
            {/* Header Row */}
            <div 
              style={{ display: "grid", gridTemplateColumns: "180px repeat(7, minmax(0, 1fr))" }}
              className="bg-white dark:bg-zinc-900 select-none border-b border-gray-100 dark:border-zinc-800/60"
            >
              <div className="p-4 text-[10px] uppercase font-mono font-bold tracking-widest text-[#94a3b8] dark:text-zinc-500 text-left">
                Truck Name
              </div>
              {DAYS_OF_WEEK.map(day => (
                <div key={day.index} className="p-4 text-[10px] uppercase font-mono font-bold tracking-widest text-[#94a3b8] dark:text-zinc-500 text-center">
                  {day.label}
                </div>
              ))}
            </div>

            {/* Inner rows */}
            {trucks.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-gray-400 dark:text-zinc-500">
                No fleet vehicles registered. Please add trucks in fleet settings.
              </div>
            ) : (
              trucks.map(truck => (
                <div 
                  key={truck.id}
                  style={{ display: "grid", gridTemplateColumns: "180px repeat(7, minmax(0, 1fr))" }}
                  className="bg-white dark:bg-zinc-900 hover:bg-gray-50/20 dark:hover:bg-zinc-850/10 transition-colors"
                >
                  {/* Left Column (Brand & Plate ID) */}
                  <div className="p-4 py-5 flex flex-col justify-center border-r border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-900">
                    <span className="text-sm font-sans font-extrabold text-[#334155] dark:text-zinc-200 truncate">
                      {truck.model.split(" ")[0] || truck.model}
                    </span>
                    <span className="text-[10px] text-[#94a3b8] dark:text-zinc-500 font-mono tracking-wide mt-0.5">
                      {truck.license_plate.toLowerCase().replace(/\s+/g, "")}
                    </span>
                  </div>

                  {/* Day Columns */}
                  {DAYS_OF_WEEK.map(day => {
                    const cellTrips = trips.filter(trip => {
                      return trip.truck_id === truck.id && getWeekdayIndex(trip.scheduled_date) === day.index;
                    });

                    const hasSchedule = cellTrips.length > 0;

                    return (
                      <div 
                        key={day.index} 
                        className="p-3 border-r last:border-r-0 border-gray-100 dark:border-zinc-800/60 flex items-center justify-center bg-white dark:bg-zinc-900"
                      >
                        {hasSchedule ? (
                          <button
                            onClick={() => setSelectedCell({ truck, weekdayIndex: day.index, trips: cellTrips })}
                            className="w-full h-full aspect-[4/3] min-h-[64px] bg-[#f1f3ff] dark:bg-indigo-950/20 hover:bg-[#e4e8ff] dark:hover:bg-indigo-900/35 border border-[#dee3ff] dark:border-indigo-900/40 rounded-xl flex flex-col items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95 group"
                            title={`${cellTrips.length} active dispatches. Click to view.`}
                          >
                            <span className="text-base font-sans font-black text-[#4f46e5] dark:text-indigo-400 group-hover:scale-105 transition-transform">
                              {cellTrips.length}
                            </span>
                            <span className="text-[8px] sm:text-[9px] font-mono font-bold tracking-widest text-[#4f46e5] dark:text-indigo-400 uppercase mt-0.5">
                              {cellTrips.length === 1 ? "Drop" : "Drops"}
                            </span>
                          </button>
                        ) : (
                          <div className="w-full h-full aspect-[4/3] min-h-[64px] bg-gray-50/40 dark:bg-zinc-850/15 border border-dashed border-gray-155 dark:border-zinc-800/60 rounded-xl flex items-center justify-center text-[#cbd5e1] dark:text-zinc-700 select-none">
                            <span className="text-xl">·</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Grid Footer (Caption + Legend) */}
        <div className="bg-[#f8fafc] dark:bg-zinc-850/30 px-6 py-4 border-t border-gray-150 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-3 select-none">
          {/* Left Action Prompt */}
          <span className="text-[10px] font-mono font-bold tracking-wider text-[#94a3b8] dark:text-zinc-500 uppercase">
            Click on active schedule blocks to view linked invoices
          </span>

          {/* Right Legend Indicators */}
          <div className="flex items-center gap-4 text-[10px] font-mono font-bold tracking-wider uppercase">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4f46e5] dark:bg-indigo-500 inline-block"></span>
              <span className="text-[#64748b] dark:text-zinc-500">Active Schedule</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-zinc-850 border border-dashed border-gray-300 dark:border-zinc-700 inline-block"></span>
              <span className="text-[#64748b] dark:text-zinc-500">No Schedule</span>
            </div>
          </div>
        </div>
      </div>

      {/* Linked Invoices Details Drawer / Modal Dialog */}
      {selectedCell && (() => {
        const getLinkedInvoices = (trip: Trip) => {
          return invoices.filter(inv => {
            const dest = trip.destination.toLowerCase();
            const city = inv.ship_to_details?.address?.city?.toLowerCase() || "";
            const name = inv.ship_to_details?.name?.toLowerCase() || "";
            return dest.includes(city) || city.includes(dest) || dest.includes(name) || name.includes(dest);
          });
        };

        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs"
            onClick={() => setSelectedCell(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modern Card Header */}
              <div className="p-5 border-b border-gray-150 dark:border-zinc-800 flex justify-between items-start bg-gray-50/80 dark:bg-zinc-850/50">
                <div>
                  <h3 className="text-base font-sans font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2">
                    <TruckIcon className="w-4.5 h-4.5 text-indigo-505" />
                    Dispatch Card: {selectedCell.truck.model.split(" ")[0]}
                  </h3>
                  <p className="text-[10px] font-mono text-gray-400 dark:text-zinc-500 mt-1 uppercase tracking-wide">
                    {DAYS_OF_WEEK[selectedCell.weekdayIndex].full} • Plate Reference: {selectedCell.truck.license_plate}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCell(null)}
                  className="p-1 px-2.5 bg-gray-150 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-755 text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Container Body */}
              <div className="p-5 overflow-y-auto space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-zinc-800">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#4f46e5] dark:text-indigo-400 tracking-wider">
                    Assigned Dispatches ({selectedCell.trips.length})
                  </span>
                </div>

                <div className="space-y-4">
                  {selectedCell.trips.map(trip => {
                    const matchedInvoices = getLinkedInvoices(trip);
                    return (
                      <div key={trip.id} className="p-4 bg-[#f8fafc]/50 dark:bg-zinc-850/20 border border-gray-150/80 dark:border-zinc-800/60 rounded-xl space-y-3.5 shadow-xs">
                        {/* Trip level stats */}
                        <div className="flex justify-between items-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wide text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/20 uppercase">
                            {trip.trip_number}
                          </span>
                          <span className="font-mono text-xs font-bold text-gray-800 dark:text-zinc-100">
                            R{trip.freight_revenue?.toFixed(2)}
                          </span>
                        </div>

                        {/* Trip attributes */}
                        <div className="grid grid-cols-2 gap-3 text-xs bg-white dark:bg-zinc-900 border border-gray-105 dark:border-zinc-850 p-2.5 rounded-lg">
                          <div>
                            <p className="text-[9px] font-mono text-gray-400 dark:text-zinc-500 uppercase tracking-wide">Driver / Operator</p>
                            <p className="font-sans font-bold text-[#334155] dark:text-zinc-300 mt-0.5">{trip.driver_name}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-mono text-gray-400 dark:text-zinc-500 uppercase tracking-wide">Transit Status</p>
                            <p className="font-sans font-bold text-indigo-600 dark:text-indigo-400 capitalize mt-0.5">{trip.status.replace("_", " ")}</p>
                          </div>
                        </div>

                        {/* Origin destination labels */}
                        <div className="flex items-center gap-1.5 text-xs text-gray-550 dark:text-zinc-400 pt-0.5 select-none font-medium">
                          <span className="truncate max-w-[180px]">{trip.origin}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                          <span className="truncate max-w-[180px]">{trip.destination}</span>
                        </div>

                        {/* Sub-section: Linked Invoices */}
                        <div className="pt-3.5 border-t border-gray-100 dark:border-zinc-800/80">
                          <p className="text-[9px] font-mono font-bold tracking-widest text-[#94a3b8] dark:text-zinc-505 uppercase mb-2">
                            Linked Invoices ({matchedInvoices.length})
                          </p>
                          {matchedInvoices.length === 0 ? (
                            <div className="p-2 border border-dashed border-gray-150 dark:border-zinc-800 rounded-lg text-[#94a3b8] dark:text-zinc-500 text-[10px] uppercase font-mono tracking-wider italic text-center select-none bg-white dark:bg-zinc-900">
                              No matching billing invoices found
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {matchedInvoices.map(inv => (
                                <div key={inv.id} className="flex justify-between items-center text-xs p-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-2xs hover:border-[#dee3ff] dark:hover:border-zinc-700 transition-colors">
                                  <div className="min-w-0 pr-3">
                                    <p className="font-bold text-gray-800 dark:text-zinc-200 truncate">{inv.invoice_number}</p>
                                    <p className="text-[9px] text-[#94a3b8] dark:text-zinc-500 truncate mt-0.5">{inv.bill_to_details.name}</p>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className="font-mono font-bold text-[#4f46e5] dark:text-indigo-400">R{inv.summary.total_due?.toFixed(2)}</p>
                                    <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[8px] font-mono font-bold tracking-wide text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20 uppercase">
                                      {inv.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        );
      })()}
    </div>
  );
}
