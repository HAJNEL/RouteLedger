import React, { useState, useEffect } from "react";
import { dbService } from "../../lib/db";
import { Trip, Truck } from "../../types";
import {
  Milestone,
  Plus,
  Trash2,
  Search,
  CheckCircle,
  Truck as TruckIcon,
  Play,
  ClipboardList,
  AlertCircle
} from "lucide-react";

export default function TripsView() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // New trip state form
  const [showForm, setShowForm] = useState(false);
  const [driverName, setDriverName] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [freightRevenue, setFreightRevenue] = useState(1200);
  const [truckId, setTruckId] = useState("");
  const [notif, setNotif] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const dataTrips = await dbService.getTrips();
      const dataTrucks = await dbService.getTrucks();
      setTrips(dataTrips);
      setTrucks(dataTrucks);
      if (dataTrucks.length > 0) setTruckId(dataTrucks[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName || !origin || !destination || !scheduledDate) return;

    try {
      const newTrip: Trip = {
        id: `trip-${Date.now()}`,
        trip_number: `TRIP-${Math.floor(100 + Math.random() * 900)}`,
        truck_id: truckId,
        driver_name: driverName,
        origin,
        destination,
        scheduled_date: scheduledDate,
        status: "scheduled",
        freight_revenue: Number(freightRevenue)
      };

      await dbService.saveTrip(newTrip);
      setNotif(`Created and scheduled new cargo transport routes: ${newTrip.trip_number}`);
      setShowForm(false);
      setDriverName("");
      setOrigin("");
      setDestination("");
      setScheduledDate("");
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdvanceStatus = async (trip: Trip) => {
    let nextStatus: Trip["status"] = trip.status;
    if (trip.status === "scheduled") nextStatus = "in_transit";
    else if (trip.status === "in_transit") nextStatus = "delivered";

    if (nextStatus === trip.status) return;

    try {
      const updatedTrip = { ...trip, status: nextStatus };
      await dbService.saveTrip(updatedTrip);
      setNotif(`Trip ${trip.trip_number} route advanced to ${nextStatus.toUpperCase()}`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTrip = async (id: string) => {
    try {
      await dbService.deleteTrip(id);
      setNotif("Trip plan removed successfully.");
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTrips = trips.filter(
    (x) =>
      x.trip_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      x.driver_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      x.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      x.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Overview Analytics Bars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h5 className="text-xl font-sans font-bold text-gray-900 dark:text-zinc-100">
              {trips.filter(x => x.status === "scheduled").length} Runs
            </h5>
            <p className="text-[10px] uppercase font-mono tracking-wider text-gray-400 dark:text-zinc-500">Scheduled Dispatch</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <TruckIcon className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h5 className="text-xl font-sans font-bold text-gray-900 dark:text-zinc-100">
              {trips.filter(x => x.status === "in_transit").length} Trucks
            </h5>
            <p className="text-[10px] uppercase font-mono tracking-wider text-gray-400 dark:text-zinc-500">On The Road</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h5 className="text-xl font-sans font-bold text-gray-900 dark:text-zinc-100">
              {trips.filter(x => x.status === "delivered").length} Delivered
            </h5>
            <p className="text-[10px] uppercase font-mono tracking-wider text-gray-400 dark:text-zinc-500">Completed Routes</p>
          </div>
        </div>
      </div>

      {notif && (
        <div className="p-3 bg-indigo-50 dark:bg-indigo-955/15 border border-indigo-150 dark:border-indigo-900/40 text-xs text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{notif}</span>
        </div>
      )}

      {/* Scheduler control panel */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search trip reference #, origin, or carrier operator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 border border-gray-300 dark:border-zinc-750 text-xs bg-transparent rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <button
          onClick={() => {
            setShowForm(!showForm);
            setNotif(null);
          }}
          className="px-4 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Plan Freight Run
        </button>
      </div>

      {/* Plan Dispatch Modal Sheet */}
      {showForm && (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm max-w-xl">
          <div className="pb-3 border-b border-gray-150 dark:border-zinc-800 mb-4">
            <h4 className="font-semibold text-sm text-gray-950 dark:text-zinc-150">Create New Freight Run</h4>
            <p className="text-[11px] text-gray-450 dark:text-zinc-505">Fill in driver and ship parameters to route logistics</p>
          </div>

          <form onSubmit={handleCreateTrip} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">Carrier Operator Driver Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marcus Vance"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-zinc-800 rounded-lg text-xs bg-transparent focus:ring-1"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">Assign Truck Fleet ID</label>
                <select
                  value={truckId}
                  onChange={(e) => setTruckId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-zinc-800 rounded-lg text-xs bg-transparent focus:ring-1 dark:bg-zinc-900 text-gray-700 dark:text-zinc-350"
                >
                  {trucks.map(truck => (
                    <option key={truck.id} value={truck.id}>
                      {truck.license_plate} - {truck.model} ({truck.capacity_tons} Tons)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">Origin Cargo Port/Bay</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. London Gateway Port"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-zinc-800 rounded-lg text-xs bg-transparent focus:ring-1"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">Destination Logistics Depot</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Manchester Logistics"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-zinc-800 rounded-lg text-xs bg-transparent focus:ring-1"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">Scheduled Start Date</label>
                <input
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-zinc-800 rounded-lg text-xs bg-transparent focus:ring-1"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">Freight Invoice Revenue (R)</label>
                <input
                  type="number"
                  required
                  value={freightRevenue}
                  onChange={(e) => setFreightRevenue(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-zinc-800 rounded-lg text-xs bg-transparent focus:ring-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3.5 py-1.5 border border-gray-300 dark:border-zinc-700 rounded-lg text-xs hover:bg-gray-50 text-gray-650"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Schedule cargo run
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Routes Schedule Ledger */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] uppercase text-gray-400 font-mono mt-3">Refreshing runs list...</p>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="py-16 text-center text-gray-400 font-mono text-xs">
            No freight schedules matching queries. Create a plan above.
          </div>
        ) : (
          <table className="w-full text-left text-xs font-sans border-collapse">
            <thead>
              <tr className="bg-gray-50/70 dark:bg-zinc-850 border-b border-gray-200 dark:border-zinc-800 uppercase font-mono text-[9px] text-gray-400 tracking-wider">
                <th className="py-3 px-4">Trip Code</th>
                <th className="py-3 px-4">Operator Driver</th>
                <th className="py-3 px-4">Assigned Vehicle</th>
                <th className="py-3 px-4">Cargo Transit Route</th>
                <th className="py-3 px-4">Ship Date</th>
                <th className="py-3 px-4 text-right">Freight Revenue</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Dispatch Control</th>
                <th className="py-3 px-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 dark:divide-zinc-800/80">
              {filteredTrips.map((trip) => {
                const associatedTruck = trucks.find(t => t.id === trip.truck_id);
                return (
                  <tr key={trip.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-855">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900 dark:text-zinc-200">
                      {trip.trip_number}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-800 dark:text-zinc-200">
                      {trip.driver_name}
                    </td>
                    <td className="py-3 px-4">
                      {associatedTruck ? (
                        <div className="flex flex-col text-[11px]">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">{associatedTruck.license_plate}</span>
                          <span className="text-gray-400 text-[10px]">{associatedTruck.model}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Not Assigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-zinc-400">
                        <span className="font-medium">{trip.origin}</span>
                        <span>→</span>
                        <span className="font-semibold">{trip.destination}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-400">
                      {trip.scheduled_date}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-gray-900 dark:text-zinc-50">
                      R{trip.freight_revenue.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${
                        trip.status === "delivered"
                          ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100"
                          : trip.status === "in_transit"
                          ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100"
                          : "bg-amber-50 dark:bg-amber-955/10 text-amber-600 dark:text-amber-400 border border-amber-100"
                      }`}>
                        {trip.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {trip.status !== "delivered" ? (
                        <button
                          onClick={() => handleAdvanceStatus(trip)}
                          className="px-2.5 py-1 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:border-indigo-400 hover:text-indigo-650 text-[10px] font-semibold cursor-pointer flex items-center gap-1 mx-auto"
                        >
                          <Play className="w-3 h-3 text-indigo-505" />
                          <span>{trip.status === "scheduled" ? "Start Route" : "Confirm Delivery"}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 block font-mono">Delivered ✓</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteTrip(trip.id)}
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                        title="Delete Run Plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
