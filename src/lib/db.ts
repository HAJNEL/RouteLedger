import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  getDocFromServer
} from "firebase/firestore";
import { db, auth, isRealFirebase } from "./firebase";
import { Invoice, Trip, Truck, UserSession, Warehouse } from "../types";

// Firebase Integration error handling enum and interface as mandated in SKILL.md
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null,
    },
    operationType,
    path,
  };
  console.error("RouteLedger Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Pre-seeded high fidelity mock invoices
const PRE_SEEDED_INVOICES: Invoice[] = [
  {
    id: "inv-001",
    invoice_number: "RT-2026-9810",
    invoice_date: "2026-05-15",
    customer_purchase_order_number: "PO-7721A",
    sales_order_number: "SO-1129",
    delivery_note_number: "DN-88120",
    customer_contact: "Jonathan Miller (Main Logistics)",
    bill_to_details: {
      name: "Global Freight Corp"
    },
    ship_to_details: {
      name: "RouteLedger Depot 4",
      school_name: "Tees Transport Academy",
      address: {
        street_address: "102 Cargo Way, Docklands",
        city: "London",
        region: "Greater London"
      }
    },
    line_items: [
      {
        stock_code: "FRG-HUL",
        description: "Heavy freight haulage - Route London to Manchester (Tri-axle Flatbed)",
        quantity: 1,
        unit_price: 1850.00,
        discount: 100.00,
        line_item_value: 1750.00
      },
      {
        stock_code: "WHS-STR",
        description: "Secure palletized dry storage - 14 days block rate",
        quantity: 8,
        unit_price: 45.00,
        discount: null,
        line_item_value: 360.00
      }
    ],
    summary: {
      sub_total: 2110.00,
      vat_rate: "20%",
      vat_amount: 422.00,
      amount_inclusive_of_vat: 2532.00,
      freight_amount: 150.00,
      total_due: 2682.00
    },
    status: "approved",
    userId: "simulated-user",
    createdAt: "2026-05-15T10:30:00Z"
  },
  {
    id: "inv-002",
    invoice_number: "RT-2026-4412",
    invoice_date: "2026-05-24",
    customer_purchase_order_number: "PO-9904X",
    sales_order_number: null,
    delivery_note_number: "DN-44021",
    customer_contact: "Alice Henderson",
    bill_to_details: {
      name: "Apex Retail Solutions Ltd"
    },
    ship_to_details: {
      name: "Apex Fulfilment Hub",
      school_name: null,
      address: {
        street_address: "88 Logistics Boulevard",
        city: "Birmingham",
        region: "West Midlands"
      }
    },
    line_items: [
      {
        stock_code: "FRG-LTL",
        description: "Less-than-Truckload (LTL) local delivery service",
        quantity: 3,
        unit_price: 240.00,
        discount: null,
        line_item_value: 720.00
      }
    ],
    summary: {
      sub_total: 720.00,
      vat_rate: "20%",
      vat_amount: 144.00,
      amount_inclusive_of_vat: 864.00,
      freight_amount: 45.00,
      total_due: 909.00
    },
    status: "pending",
    userId: "simulated-user",
    createdAt: "2026-05-24T14:15:00Z"
  }
];

// Pre-seeded Trips
const PRE_SEEDED_TRIPS: Trip[] = [
  {
    id: "trip-1",
    trip_number: "TRIP-091",
    truck_id: "truck-1",
    driver_name: "Marcus Vance",
    origin: "London Gateway Ports",
    destination: "Manchester Logistics Park",
    scheduled_date: "2026-05-28",
    status: "scheduled",
    freight_revenue: 1950.00
  },
  {
    id: "trip-2",
    trip_number: "TRIP-092",
    truck_id: "truck-2",
    driver_name: "Sarah Jenkins",
    origin: "Birmingham Depot 2",
    destination: "Bristol Cargo Airport",
    scheduled_date: "2026-05-29",
    status: "in_transit",
    freight_revenue: 850.00
  },
  {
    id: "trip-3",
    trip_number: "TRIP-088",
    truck_id: "truck-3",
    driver_name: "Dave Kincaid",
    origin: "Glasgow Port Centre",
    destination: "Leeds Sorting Hub",
    scheduled_date: "2026-05-26",
    status: "delivered",
    freight_revenue: 2150.00
  },
  {
    id: "trip-4",
    trip_number: "TRIP-095",
    truck_id: "truck-1",
    driver_name: "Marcus Vance",
    origin: "Liverpool Intermodal Hub",
    destination: "London Depot 4",
    scheduled_date: "2026-05-30",
    status: "scheduled",
    freight_revenue: 1650.00
  }
];

// Pre-seeded Trucks
const PRE_SEEDED_TRUCKS: Truck[] = [
  {
    id: "truck-1",
    license_plate: "GB26 FLT",
    model: "Scania R450 Heavy Duty",
    capacity_tons: 26,
    status: "active",
    mileage: 124500,
    fuel_level: 82
  },
  {
    id: "truck-2",
    license_plate: "LD68 KPR",
    model: "Volvo FH16 Globetrotter",
    capacity_tons: 44,
    status: "active",
    mileage: 218400,
    fuel_level: 45
  },
  {
    id: "truck-3",
    license_plate: "MN72 TXD",
    model: "DAF XF 530 Super Space",
    capacity_tons: 32,
    status: "maintenance",
    mileage: 95100,
    fuel_level: 12
  },
  {
    id: "truck-4",
    license_plate: "BH21 ZWP",
    model: "Mercedes-Benz Actros MP4",
    capacity_tons: 18,
    status: "idle",
    mileage: 63800,
    fuel_level: 95
  }
];

// Pre-seeded high fidelity warehouses
const PRE_SEEDED_WAREHOUSES: Warehouse[] = [
  {
    id: "wh-1",
    name: "London Gateway Central Depot",
    address: "Royal Albert Dock, London E16 2QX",
    lat: 51.5074,
    lng: 0.1278,
    capacity_sqm: 12500,
    contact_number: "+44 20 7918 2000",
    userId: "simulated-user"
  },
  {
    id: "wh-2",
    name: "Midlands Freight Hub",
    address: "Intermodal Park, Birmingham B46 1AL",
    lat: 52.4862,
    lng: -1.8904,
    capacity_sqm: 8400,
    contact_number: "+44 121 496 0321",
    userId: "simulated-user"
  }
];

// Initialize local storage states if empty
const initLocalStorage = () => {
  if (!localStorage.getItem("rl_invoices")) {
    localStorage.setItem("rl_invoices", JSON.stringify(PRE_SEEDED_INVOICES));
  }
  if (!localStorage.getItem("rl_trips")) {
    localStorage.setItem("rl_trips", JSON.stringify(PRE_SEEDED_TRIPS));
  }
  if (!localStorage.getItem("rl_trucks")) {
    localStorage.setItem("rl_trucks", JSON.stringify(PRE_SEEDED_TRUCKS));
  }
  if (!localStorage.getItem("rl_warehouses")) {
    localStorage.setItem("rl_warehouses", JSON.stringify(PRE_SEEDED_WAREHOUSES));
  }
  if (!localStorage.getItem("rl_user")) {
    localStorage.setItem("rl_user", JSON.stringify({ userId: "simulated-user", email: "hajnel20@gmail.com" }));
  }
};

initLocalStorage();

export const dbService = {
  // Test Firestore Connection
  async validateFirestoreConnection(): Promise<boolean> {
    if (!isRealFirebase || !db) return false;
    try {
      await getDocFromServer(doc(db, "test", "connection"));
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes("the client is offline")) {
        console.warn("Firestore client is offline, using offline fallback engine.");
      }
      return false;
    }
  },

  // Invoices Driver
  async getInvoices(uid: string): Promise<Invoice[]> {
    if (isRealFirebase && db) {
      const colPath = "invoices";
      try {
        const q = query(collection(db, colPath), where("userId", "==", uid));
        const snapshot = await getDocs(q);
        const docsList = snapshot.docs.map(docSnapshot => ({
          id: docSnapshot.id,
          ...docSnapshot.data()
        })) as Invoice[];
        return docsList;
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, colPath);
      }
    }

    // LocalStorage Fallback
    const raw = localStorage.getItem("rl_invoices");
    const list = raw ? JSON.parse(raw) : [];
    return list.filter((item: Invoice) => item.userId === uid || item.userId === "simulated-user");
  },

  async saveInvoice(invoice: Invoice): Promise<void> {
    if (isRealFirebase && db) {
      const docPath = `invoices/${invoice.id}`;
      try {
        await setDoc(doc(db, "invoices", invoice.id), {
          ...invoice,
          createdAt: invoice.createdAt || new Date().toISOString()
        });
        return;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      }
    }

    // LocalStorage Fallback
    const raw = localStorage.getItem("rl_invoices");
    const list = raw ? JSON.parse(raw) : [];
    const index = list.findIndex((x: Invoice) => x.id === invoice.id);
    if (index >= 0) {
      list[index] = invoice;
    } else {
      list.unshift(invoice);
    }
    localStorage.setItem("rl_invoices", JSON.stringify(list));
  },

  async deleteInvoice(invoiceId: string): Promise<void> {
    if (isRealFirebase && db) {
      const docPath = `invoices/${invoiceId}`;
      try {
        await deleteDoc(doc(db, "invoices", invoiceId));
        return;
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, docPath);
      }
    }

    // LocalStorage Fallback
    const raw = localStorage.getItem("rl_invoices");
    let list = raw ? JSON.parse(raw) : [];
    list = list.filter((x: Invoice) => x.id !== invoiceId);
    localStorage.setItem("rl_invoices", JSON.stringify(list));
  },

  // Trips Driver (Sync with localstorage to keep lightweight logistics scheduling)
  async getTrips(): Promise<Trip[]> {
    const raw = localStorage.getItem("rl_trips");
    return raw ? JSON.parse(raw) : PRE_SEEDED_TRIPS;
  },

  async saveTrip(trip: Trip): Promise<void> {
    const raw = localStorage.getItem("rl_trips");
    const list = raw ? JSON.parse(raw) : [];
    const index = list.findIndex((x: Trip) => x.id === trip.id);
    if (index >= 0) {
      list[index] = trip;
    } else {
      list.push(trip);
    }
    localStorage.setItem("rl_trips", JSON.stringify(list));
  },

  async deleteTrip(tripId: string): Promise<void> {
    const raw = localStorage.getItem("rl_trips");
    let list = raw ? JSON.parse(raw) : [];
    list = list.filter((x: Trip) => x.id !== tripId);
    localStorage.setItem("rl_trips", JSON.stringify(list));
  },

  // Trucks Driver
  async getTrucks(): Promise<Truck[]> {
    const raw = localStorage.getItem("rl_trucks");
    return raw ? JSON.parse(raw) : PRE_SEEDED_TRUCKS;
  },

  async saveTruck(truck: Truck): Promise<void> {
    const raw = localStorage.getItem("rl_trucks");
    const list = raw ? JSON.parse(raw) : [];
    const index = list.findIndex((x: Truck) => x.id === truck.id);
    if (index >= 0) {
      list[index] = truck;
    } else {
      list.push(truck);
    }
    localStorage.setItem("rl_trucks", JSON.stringify(list));
  },

  async deleteTruck(truckId: string): Promise<void> {
    const raw = localStorage.getItem("rl_trucks");
    let list = raw ? JSON.parse(raw) : [];
    list = list.filter((x: Truck) => x.id !== truckId);
    localStorage.setItem("rl_trucks", JSON.stringify(list));
  },

  // Warehouses Driver
  async getWarehouses(uid: string): Promise<Warehouse[]> {
    if (isRealFirebase && db) {
      const colPath = "warehouses";
      try {
        const q = query(collection(db, colPath), where("userId", "==", uid));
        const snapshot = await getDocs(q);
        const docsList = snapshot.docs.map(docSnapshot => ({
          id: docSnapshot.id,
          ...docSnapshot.data()
        })) as Warehouse[];
        return docsList;
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, colPath);
      }
    }

    // LocalStorage Fallback
    const raw = localStorage.getItem("rl_warehouses");
    const list = raw ? JSON.parse(raw) : [];
    return list.filter((item: Warehouse) => item.userId === uid || item.userId === "simulated-user");
  },

  async saveWarehouse(warehouse: Warehouse): Promise<void> {
    if (isRealFirebase && db) {
      const docPath = `warehouses/${warehouse.id}`;
      try {
        await setDoc(doc(db, "warehouses", warehouse.id), {
          ...warehouse
        });
        return;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      }
    }

    // LocalStorage Fallback
    const raw = localStorage.getItem("rl_warehouses");
    const list = raw ? JSON.parse(raw) : [];
    const index = list.findIndex((x: Warehouse) => x.id === warehouse.id);
    if (index >= 0) {
      list[index] = warehouse;
    } else {
      list.unshift(warehouse);
    }
    localStorage.setItem("rl_warehouses", JSON.stringify(list));
  },

  async deleteWarehouse(warehouseId: string): Promise<void> {
    if (isRealFirebase && db) {
      const docPath = `warehouses/${warehouseId}`;
      try {
        await deleteDoc(doc(db, "warehouses", warehouseId));
        return;
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, docPath);
      }
    }

    // LocalStorage Fallback
    const raw = localStorage.getItem("rl_warehouses");
    let list = raw ? JSON.parse(raw) : [];
    list = list.filter((x: Warehouse) => x.id !== warehouseId);
    localStorage.setItem("rl_warehouses", JSON.stringify(list));
  }
};
