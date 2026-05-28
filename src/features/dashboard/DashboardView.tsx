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
  ArrowRight
} from "lucide-react";
import { motion } from "motion/react";

export default function DashboardView() {
  const { user } = useAuth();
  const userId = user?.userId || "simulated-user";
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);

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

  const activeShipmentsCount = trips.filter(x => x.status === "in_transit" || x.status === "scheduled").length;
  const dispatchRate = Math.round((trucks.filter(x => x.status === "active").length / (trucks.length || 1)) * 100);

  const avgFuel = Math.round(trucks.reduce((acc, curr) => acc + curr.fuel_level, 0) / (trucks.length || 1));

  // Sort schedule statuses
  const scheduledTrips = trips.filter(t => t.status === "scheduled");
  const inTransitTrips = trips.filter(t => t.status === "in_transit");
  const deliveredTrips = trips.filter(t => t.status === "delivered");

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards with soft grid container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Gross Revenue */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm"
          id="stat-card-revenue"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 font-mono">
              Audited Gross Revenue
            </span>
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-sans font-bold tracking-tight text-gray-900 dark:text-zinc-100">
              £{grossRevenue.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1 font-sans flex items-center gap-1">
              <span>Awaiting Audit clearance:</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-medium">£{pendingRevenue.toLocaleString("en-GB")}</span>
            </p>
          </div>
        </motion.div>

        {/* Card 2: Active Shipments */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm"
          id="stat-card-shipments"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 font-mono">
              Active Shipments
            </span>
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Navigation className="w-4 h-4 animate-pulse" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-sans font-bold tracking-tight text-gray-900 dark:text-zinc-100">
              {activeShipmentsCount} In-Transit
            </h3>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1 font-sans">
              Across {trips.filter(x => x.status === "scheduled").length} pending lists
            </p>
          </div>
        </motion.div>

        {/* Card 3: Fleet Status / Readiness */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm"
          id="stat-card-readiness"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 font-mono">
              Fleet Utilization Rate
            </span>
            <span className="p-2 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-sans font-bold tracking-tight text-gray-900 dark:text-zinc-100">
              {dispatchRate}% Capacity
            </h3>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1 font-sans">
              {trucks.filter(x => x.status === "idle").length} idled • {trucks.filter(x => x.status === "maintenance").length} in maintenance
            </p>
          </div>
        </motion.div>

        {/* Card 4: Fuel Status Level */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm"
          id="stat-card-fuel"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 font-mono">
              Fleet Average Diesel Level
            </span>
            <span className="p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-lg">
              <Fuel className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-sans font-bold tracking-tight text-gray-900 dark:text-zinc-100">
              {avgFuel}% Diesel Vol
            </h3>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1 font-sans">
              Fuel thresholds are verified
            </p>
          </div>
        </motion.div>
      </div>

      {/* Visual Analytics Canvas: Mini-bar chart representation using responsive CSS elements */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="font-sans font-semibold text-gray-900 dark:text-zinc-100 text-sm">
              Freight Finance Overview & Revenue Ledger
            </h4>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500">
              Comparing audited invoice cash values vs. pending extractions
            </p>
          </div>

          <div className="flex gap-4 text-xs font-sans">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-indigo-500 block"></span>
              <span className="text-gray-500 dark:text-zinc-450">Audited Clear</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-400 block"></span>
              <span className="text-gray-500 dark:text-zinc-450">In-Queue Audit</span>
            </div>
          </div>
        </div>

        {/* Elegant custom bar-diagram using responsive grid spacing */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-zinc-400 font-mono mb-1.5">
              <span>Financial Total Ledger</span>
              <span>£{(grossRevenue + pendingRevenue).toLocaleString()} Total Value</span>
            </div>
            {/* Visual stacked indicator bar */}
            <div className="w-full h-4.5 bg-gray-100 dark:bg-zinc-800 rounded-full flex overflow-hidden">
              <div
                style={{ width: `${(grossRevenue / (grossRevenue + pendingRevenue || 1)) * 100}%` }}
                className="bg-indigo-500 transition-all duration-300"
                title={`Audited: £${grossRevenue.toFixed(2)}`}
              ></div>
              <div
                style={{ width: `${(pendingRevenue / (grossRevenue + pendingRevenue || 1)) * 100}%` }}
                className="bg-amber-400 transition-all duration-300"
                title={`Pending: £${pendingRevenue.toFixed(2)}`}
              ></div>
            </div>
          </div>

          {/* Quick micro labels */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-3 bg-gray-50 dark:bg-zinc-850/45 border border-gray-150 dark:border-zinc-800/40 rounded-lg text-center">
              <p className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-wide font-mono">Invoice Volume</p>
              <h5 className="text-base font-sans font-bold text-gray-800 dark:text-zinc-200 mt-1">{invoices.length} Registered</h5>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-zinc-850/45 border border-gray-150 dark:border-zinc-800/40 rounded-lg text-center">
              <p className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-wide font-mono">Total Freight Line Items</p>
              <h5 className="text-base font-sans font-bold text-gray-800 dark:text-zinc-200 mt-1 truncate">
                {invoices.reduce((acc, curr) => acc + curr.line_items.length, 0)} Items
              </h5>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-zinc-850/45 border border-gray-150 dark:border-zinc-800/40 rounded-lg text-center">
              <p className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-wide font-mono">Average Invoice Value</p>
              <h5 className="text-base font-sans font-bold text-gray-800 dark:text-zinc-200 mt-1 truncate">
                £{Math.round((grossRevenue + pendingRevenue) / (invoices.length || 1)).toLocaleString()}
              </h5>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-zinc-850/45 border border-gray-150 dark:border-zinc-800/40 rounded-lg text-center">
              <p className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-wide font-mono">Active Drivers</p>
              <h5 className="text-base font-sans font-bold text-gray-800 dark:text-zinc-200 mt-1 truncate">
                {new Set(trips.map(t => t.driver_name)).size} Operators
              </h5>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Schedule Grid Area: Designed beautifully as columns of states */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-500" />
            <h4 className="font-sans font-semibold text-gray-900 dark:text-zinc-100 text-sm">
              Logistics Action Schedule & Route Deliveries
            </h4>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400 dark:text-zinc-500 bg-gray-100 dark:bg-zinc-800/45 px-2 py-1 rounded">
            Next 72 Hours
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Column 1: Scheduled */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-150 dark:border-zinc-800 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono">
                1 • Scheduled ({scheduledTrips.length})
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            </div>
            {scheduledTrips.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-zinc-500 text-center py-6 font-mono">No pending dispatches.</p>
            ) : (
              <div className="space-y-3">
                {scheduledTrips.map((trip) => (
                  <div key={trip.id} className="p-3.5 bg-gray-50 dark:bg-zinc-800/40 rounded-lg border border-gray-100 dark:border-zinc-800/50">
                    <div className="flex justify-between items-center text-xs font-bold text-indigo-650 dark:text-indigo-400">
                      <span>{trip.trip_number}</span>
                      <span className="font-mono">£{trip.freight_revenue}</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-850 dark:text-zinc-200 mt-2 truncate">
                      {trip.driver_name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-gray-400 dark:text-zinc-500">
                      <span className="truncate">{trip.origin}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span className="truncate">{trip.destination}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: In Transit */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-150 dark:border-zinc-800 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-mono">
                2 • In Transit ({inTransitTrips.length})
              </span>
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></span>
            </div>
            {inTransitTrips.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-zinc-500 text-center py-6 font-mono">No fleets on road currently.</p>
            ) : (
              <div className="space-y-3">
                {inTransitTrips.map((trip) => (
                  <div key={trip.id} className="p-3.5 bg-indigo-50/20 dark:bg-indigo-950/20 rounded-lg border border-indigo-100/40 dark:border-indigo-900/10">
                    <div className="flex justify-between items-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      <span>{trip.trip_number}</span>
                      <span className="font-mono">£{trip.freight_revenue}</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200 mt-2 truncate">
                      {trip.driver_name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-gray-500 dark:text-zinc-400">
                      <span className="truncate">{trip.origin}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="truncate">{trip.destination}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 3: Delivered / Completed */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-150 dark:border-zinc-800 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
                3 • Delivered ({deliveredTrips.length})
              </span>
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
            </div>
            {deliveredTrips.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-zinc-500 text-center py-6 font-mono">No deliveries recorded today.</p>
            ) : (
              <div className="space-y-3">
                {deliveredTrips.map((trip) => (
                  <div key={trip.id} className="p-3.5 bg-gray-50 dark:bg-zinc-800/40 rounded-lg border border-gray-100 dark:border-zinc-850 opacity-80 decoration-gray-400">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                      <span>{trip.trip_number}</span>
                      <span className="font-mono">£{trip.freight_revenue}</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 mt-2 truncate">
                      {trip.driver_name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-gray-400">
                      <span className="truncate line-through">{trip.origin}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span className="truncate line-through">{trip.destination}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
