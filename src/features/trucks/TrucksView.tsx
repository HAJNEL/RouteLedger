import React, { useState, useEffect } from "react";
import { dbService } from "../../lib/db";
import { Truck } from "../../types";
import {
  Truck as TruckIcon,
  Plus,
  Trash2,
  Gauge,
  Fuel,
  Wrench,
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react";
import { motion } from "motion/react";

export default function TrucksView() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);

  // New truck form
  const [showForm, setShowForm] = useState(false);
  const [licensePlate, setLicensePlate] = useState("");
  const [model, setModel] = useState("");
  const [capacityTons, setCapacityTons] = useState(26);
  const [mileage, setMileage] = useState(85000);
  const [fuelLevel, setFuelLevel] = useState(100);
  const [notif, setNotif] = useState<string | null>(null);

  useEffect(() => {
    loadTrucks();
  }, []);

  const loadTrucks = async () => {
    try {
      setLoading(true);
      const data = await dbService.getTrucks();
      setTrucks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTruck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licensePlate || !model) return;

    try {
      const newTruck: Truck = {
        id: `truck-${Date.now()}`,
        license_plate: licensePlate.toUpperCase(),
        model,
        capacity_tons: Number(capacityTons),
        status: "idle",
        mileage: Number(mileage),
        fuel_level: Number(fuelLevel)
      };

      await dbService.saveTruck(newTruck);
      setNotif(`Registered new transport fleet asset: ${newTruck.license_plate}`);
      setShowForm(false);
      setLicensePlate("");
      setModel("");
      loadTrucks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (truckId: string, status: Truck["status"]) => {
    const truck = trucks.find(t => t.id === truckId);
    if (!truck) return;

    try {
      const updated = { ...truck, status };
      await dbService.saveTruck(updated);
      setNotif(`Vehicle ${truck.license_plate} status updated to ${status.toUpperCase()}`);
      loadTrucks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTruck = async (id: string) => {
    try {
      await dbService.deleteTruck(id);
      setNotif("Fleet asset retired from transport records.");
      loadTrucks();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Fleet quick logs summary banner */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="font-sans font-semibold text-gray-900 dark:text-zinc-100 text-sm">
            Company Fleet Assets & HGV Fleet Registry
          </h4>
          <p className="text-xs text-gray-400 dark:text-zinc-500">
            Total HGV Vehicles: {trucks.length} • Active Runners: {trucks.filter(t => t.status === "active").length} • Out of Service: {trucks.filter(t => t.status === "maintenance").length}
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm(!showForm);
            setNotif(null);
          }}
          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer self-stretch sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Register Fleet Asset
        </button>
      </div>

      {notif && (
        <div className="p-3 bg-indigo-50 dark:bg-indigo-955/20 border border-indigo-150 dark:border-indigo-900/45 text-xs text-indigo-600 dark:text-indigo-450 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{notif}</span>
        </div>
      )}

      {/* Manual Fleet Registration Drawer */}
      {showForm && (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm max-w-xl">
          <div className="pb-3 border-b border-gray-150 dark:border-zinc-800 mb-4">
            <h4 className="font-semibold text-sm text-gray-955 dark:text-zinc-200 animate-pulse">Provision HGV vehicle</h4>
            <p className="text-[11px] text-gray-400">Fill details to deploy commercial logistics lorry.</p>
          </div>

          <form onSubmit={handleCreateTruck} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">License Plate Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GB26 FLT"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-zinc-800 rounded-lg text-xs bg-transparent focus:ring-1"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">Vehicle Model Manufacturer</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mercedes-Benz Actros MP4"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-zinc-800 rounded-lg text-xs bg-transparent focus:ring-1"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">Load Limit Capacity (Tons)</label>
                <input
                  type="number"
                  required
                  value={capacityTons}
                  onChange={(e) => setCapacityTons(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-zinc-800 rounded-lg text-xs bg-transparent focus:ring-1"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">Accumulated Odometer Mileage (Miles)</label>
                <input
                  type="number"
                  required
                  value={mileage}
                  onChange={(e) => setMileage(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-zinc-800 rounded-lg text-xs bg-transparent focus:ring-1"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">Current Diesel Fuel Level (%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={fuelLevel}
                  onChange={(e) => setFuelLevel(Number(e.target.value))}
                  className="w-full"
                />
                <span className="text-[10px] font-mono text-indigo-505 dark:text-indigo-400">{fuelLevel}% Diesel</span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3.5 py-1.5 border border-gray-300 dark:border-zinc-700 rounded-lg text-xs hover:bg-gray-50 text-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Register Lorry
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Vehicles Bento grid */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] uppercase text-gray-400 font-mono mt-3">Re-indexing heavy vehicles list...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {trucks.map((truck) => {
            const isFuelCritical = truck.fuel_level < 20;
            return (
              <motion.div
                key={truck.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-850 rounded-xl p-5 shadow-sm space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide bg-gray-50 dark:bg-zinc-800/80 px-2.5 py-1 rounded-md border border-gray-200 dark:border-zinc-750 font-mono">
                      {truck.license_plate}
                    </span>
                    <h5 className="font-semibold text-gray-700 dark:text-zinc-200 mt-2 text-xs">
                      {truck.model}
                    </h5>
                  </div>

                  <button
                    onClick={() => handleDeleteTruck(truck.id)}
                    className="text-gray-300 hover:text-red-600 p-1 rounded hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                    title="Retire Asset"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Sub-specification highlights */}
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-100 dark:border-zinc-800 text-[11px]">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 dark:text-zinc-500 block">Payload Limit</span>
                    <span className="font-sans font-bold text-gray-800 dark:text-zinc-300">{truck.capacity_tons} Tons (Max)</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 dark:text-zinc-500 block">Distance Covered</span>
                    <span className="font-mono text-gray-800 dark:text-zinc-300">{truck.mileage.toLocaleString()} Miles</span>
                  </div>
                </div>

                {/* Fuel gauge bar */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono mb-1 text-gray-400">
                    <span className="flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5" /> Fuel Level
                    </span>
                    <span className={isFuelCritical ? "text-amber-550 font-bold" : ""}>{truck.fuel_level}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${truck.fuel_level}%` }}
                      className={`h-full rounded-full ${isFuelCritical ? "bg-amber-500" : "bg-indigo-600 dark:bg-indigo-400"}`}
                    ></div>
                  </div>
                  {isFuelCritical && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Refuel Recommended before departure</span>
                    </div>
                  )}
                </div>

                {/* Dispatch state control switcher dropdown */}
                <div className="flex justify-between items-center bg-gray-50 dark:bg-zinc-850/45 p-2 rounded-lg border border-gray-150 dark:border-zinc-800">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 dark:text-zinc-500 font-medium block">
                    Telemetry Status
                  </span>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={truck.status}
                      onChange={(e) => handleUpdateStatus(truck.id, e.target.value as Truck["status"])}
                      className="text-xs bg-transparent font-semibold focus:outline-none cursor-pointer border-none text-gray-800 dark:text-zinc-300"
                    >
                      <option value="active" className="dark:bg-zinc-900">Active RUN</option>
                      <option value="maintenance" className="dark:bg-zinc-900">Maintenance</option>
                      <option value="idle" className="dark:bg-zinc-900">Idle IDLE</option>
                    </select>

                    {/* Simple status dot */}
                    <span className={`w-2 h-2 rounded-full block ${
                      truck.status === "active" ? "bg-emerald-500" : truck.status === "maintenance" ? "bg-amber-500" : "bg-zinc-400"
                    }`}></span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
