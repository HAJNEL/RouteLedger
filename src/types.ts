export interface BillToDetails {
  name: string;
}

export interface Address {
  street_address: string;
  city: string;
  region: string | null;
}

export interface ShipToDetails {
  name: string;
  school_name: string | null;
  address: Address;
}

export interface LineItem {
  stock_code: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number | null;
  line_item_value: number;
}

export interface InvoiceSummary {
  sub_total: number;
  vat_rate: string | null;
  vat_amount: number;
  amount_inclusive_of_vat: number | null;
  freight_amount: number | null;
  total_due: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  customer_purchase_order_number: string | null;
  sales_order_number: string | null;
  delivery_note_number: string | null;
  customer_contact: string | null;
  bill_to_details: BillToDetails;
  ship_to_details: ShipToDetails;
  line_items: LineItem[];
  summary: InvoiceSummary;
  // Metadata for logis keeping
  status: "pending" | "approved" | "rejected";
  userId: string;
  createdAt: string;
}

export interface Trip {
  id: string;
  trip_number: string;
  truck_id: string;
  driver_name: string;
  origin: string;
  destination: string;
  scheduled_date: string;
  status: "scheduled" | "in_transit" | "delivered" | "cancelled";
  freight_revenue: number;
}

export interface Truck {
  id: string;
  license_plate: string;
  model: string;
  capacity_tons: number;
  status: "active" | "maintenance" | "idle";
  mileage: number;
  fuel_level: number; // percentage (0-100)
}

export interface UserSession {
  userId: string;
  email: string;
}

export type MenuSection = "Dashboard" | "Invoices" | "Trips" | "Trucks" | "Settings";
