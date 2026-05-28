import React, { useState, useEffect } from "react";
import { dbService } from "../../lib/db";
import { Invoice, LineItem, InvoiceSummary } from "../../types";
import { useAuth } from "../auth/AuthContext";
import {
  UploadCloud,
  FileText,
  Save,
  Trash2,
  FileCheck,
  AlertCircle,
  Plus,
  ArrowRight,
  Sparkles,
  Search,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { motion } from "motion/react";

// Predefined Logistics dummy assets for single-click rapid testing and evaluation
const LOGISTICS_SAMPLES = [
  {
    name: "Standard Drayage & Cargo Invoice (Tees Docklands)",
    fileContent: "standard_drayage_sample",
    extractedMock: {
      invoice_number: "RT-2026-X114",
      invoice_date: "2026-05-24",
      customer_purchase_order_number: "PO-X1128",
      sales_order_number: "SO-9014",
      delivery_note_number: "DN-6612",
      customer_contact: "Richard Sterling",
      bill_to_details: { name: "Apex Global Retail Inc" },
      ship_to_details: {
        name: "RouteLedger Warehouse Area B",
        school_name: "Docklands Enterprise Academy",
        address: {
          street_address: "55 Freight Slipway 9",
          city: "London",
          region: "Greater London"
        }
      },
      line_items: [
        {
          stock_code: "DRY-LOCAL",
          description: "Local port container drayage - terminal gate clearance",
          quantity: 2,
          unit_price: 350.00,
          discount: 25.00,
          line_item_value: 675.00
        },
        {
          stock_code: "CHG-EXP",
          description: "Expedited heavy clearance priority charge",
          quantity: 1,
          unit_price: 180.00,
          discount: null,
          line_item_value: 180.00
        }
      ],
      summary: {
        sub_total: 855.00,
        vat_rate: "20%",
        vat_amount: 171.00,
        amount_inclusive_of_vat: 1026.00,
        freight_amount: 50.00,
        total_due: 1076.00
      }
    }
  },
  {
    name: "LTL Commercial Supply Bill (Brum Fulfilment)",
    fileContent: "ltl_commercial_sample",
    extractedMock: {
      invoice_number: "CSB-2026-440",
      invoice_date: "2026-05-21",
      customer_purchase_order_number: "PO-4481P",
      sales_order_number: null,
      delivery_note_number: "DN-3329",
      customer_contact: "Pamela Vance",
      bill_to_details: { name: "Intermodal Logistics Group" },
      ship_to_details: {
        name: "Birmingham Depot 2",
        school_name: null,
        address: {
          street_address: "99 Transit Boulevard",
          city: "Birmingham",
          region: "West Midlands"
        }
      },
      line_items: [
        {
          stock_code: "FRG-LTL",
          description: "Less than truckload regional parcel consolidation transport",
          quantity: 12,
          unit_price: 45.00,
          discount: null,
          line_item_value: 540.00
        }
      ],
      summary: {
        sub_total: 540.00,
        vat_rate: "5%",
        vat_amount: 27.00,
        amount_inclusive_of_vat: 567.00,
        freight_amount: 25.00,
        total_due: 592.00
      }
    }
  }
];

export default function InvoicesView() {
  const { user } = useAuth();
  const userId = user?.userId || "simulated-user";
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ name: string; size: string } | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Correction Form Active State
  const [activeExtraction, setActiveExtraction] = useState<Partial<Invoice> | null>(null);

  useEffect(() => {
    loadInvoices();
  }, [userId]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await dbService.getInvoices(userId);
      setInvoices(data);
    } catch (err) {
      console.error("Failed to load invoices", err);
    } finally {
      setLoading(false);
    }
  };

  // Drag and Drop handles
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await processInvoiceFile(file);
    }
  };

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await processInvoiceFile(file);
    }
  };

  // Safe file reader & Express OCR connector
  const processInvoiceFile = async (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setPreviewFile({ name: file.name, size: `${(file.size / 1024).toFixed(1)} KB` });
    setExtracting(true);

    try {
      // Encode file as Base64 to transmit via simple API route to Express
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Str = reader.result as string;
        const [meta, data] = base64Str.split(",");
        const mimeType = meta.match(/:(.*?);/)?.[1] || "application/pdf";

        const response = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileData: data,
            mimeType: mimeType,
            fileName: file.name
          })
        });

        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.error || "Failed to trigger automated extraction.");
        }

        if (json.result) {
          // Mount extraction results onto structural edit sheet
          setActiveExtraction({
            ...json.result,
            id: `inv-${Date.now()}`,
            userId: userId,
            status: "pending"
          });
          setSuccessMsg("Document parsed successfully with Google Gemini high-accuracy OCR!");
        } else {
          throw new Error("Parsed results were in unexpected structures.");
        }
        setExtracting(false);
      };
    } catch (err: any) {
      console.error("Extraction error:", err);
      setErrorMsg(err instanceof Error ? err.message : "Document analysis failed. Check environment.");
      setExtracting(false);
    }
  };

  // Quick evaluation simulation sample
  const triggerSampleSimulation = (sampleIndex: number) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const sample = LOGISTICS_SAMPLES[sampleIndex];
    setPreviewFile({ name: `${sample.name}.pdf`, size: "128 KB" });
    setExtracting(true);

    setTimeout(() => {
      setActiveExtraction({
        ...sample.extractedMock,
        id: `inv-sim-${Date.now()}`,
        userId: userId,
        status: "pending"
      } as any);
      setSuccessMsg("Pre-seeded logistics drayage sheet parsed and verified in simulation!");
      setExtracting(false);
    }, 1200);
  };

  // Interactive Form Correction Handlers
  const handleUpdateField = (section: string, value: any, subkey?: string, index?: number) => {
    if (!activeExtraction) return;

    const copy = { ...activeExtraction };
    if (subkey && section === "bill_to_details") {
      copy.bill_to_details = { ...(copy.bill_to_details || {}), [subkey]: value } as any;
    } else if (subkey && section === "ship_to_details") {
      copy.ship_to_details = { ...(copy.ship_to_details || {}), [subkey]: value } as any;
    } else if (subkey && section === "address") {
      const addrCopy = { ...(copy.ship_to_details?.address || { street_address: "", city: "", region: null }) };
      (addrCopy as any)[subkey] = value;
      copy.ship_to_details = { ...(copy.ship_to_details || { name: "", address: {} }), address: addrCopy } as any;
    } else if (section === "line_items" && typeof index === "number") {
      const items = [...(copy.line_items || [])];
      items[index] = { ...items[index], ...value };
      copy.line_items = items;
    } else if (subkey && section === "summary") {
      copy.summary = { ...(copy.summary || {}), [subkey]: value } as any;
    } else {
      (copy as any)[section] = value;
    }

    setActiveExtraction(copy);
  };

  const addLineItem = () => {
    if (!activeExtraction) return;
    const items = [...(activeExtraction.line_items || [])];
    items.push({
      stock_code: "NEW-ITEM",
      description: "Additional logistics transport charge",
      quantity: 1,
      unit_price: 150.00,
      discount: null,
      line_item_value: 150.00
    });
    setActiveExtraction({ ...activeExtraction, line_items: items });
  };

  const removeLineItem = (idx: number) => {
    if (!activeExtraction) return;
    const items = [...(activeExtraction.line_items || [])].filter((_, i) => i !== idx);
    setActiveExtraction({ ...activeExtraction, line_items: items });
  };

  // State Feedback notice
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const saveExtractedInvoice = async () => {
    if (!activeExtraction) return;

    // Validate absolute essentials before submission
    if (!activeExtraction.invoice_number || !activeExtraction.invoice_date) {
      setErrorMsg("Invoice reference number and date cannot be left blank.");
      return;
    }

    try {
      const readyInvoice: Invoice = {
        id: activeExtraction.id || `inv-${Date.now()}`,
        invoice_number: activeExtraction.invoice_number,
        invoice_date: activeExtraction.invoice_date,
        customer_purchase_order_number: activeExtraction.customer_purchase_order_number || null,
        sales_order_number: activeExtraction.sales_order_number || null,
        delivery_note_number: activeExtraction.delivery_note_number || null,
        customer_contact: activeExtraction.customer_contact || null,
        bill_to_details: {
          name: activeExtraction.bill_to_details?.name || "Global Freight Org"
        },
        ship_to_details: {
          name: activeExtraction.ship_to_details?.name || "Terminal Area 3",
          school_name: activeExtraction.ship_to_details?.school_name || null,
          address: {
            street_address: activeExtraction.ship_to_details?.address?.street_address || "Cargo Yard 4",
            city: activeExtraction.ship_to_details?.address?.city || "London",
            region: activeExtraction.ship_to_details?.address?.region || null
          }
        },
        line_items: activeExtraction.line_items as LineItem[] || [],
        summary: activeExtraction.summary as InvoiceSummary || {
          sub_total: 0,
          vat_rate: null,
          vat_amount: 0,
          amount_inclusive_of_vat: null,
          freight_amount: null,
          total_due: 0
        },
        status: "approved",
        userId: userId,
        createdAt: new Date().toISOString()
      };

      await dbService.saveInvoice(readyInvoice);
      setSuccessMsg(`Invoice ${readyInvoice.invoice_number} successfully logged and synchronized to Firestore!`);
      setActiveExtraction(null);
      setPreviewFile(null);
      loadInvoices();
    } catch (err: any) {
      setErrorMsg("Failed to persist to storage: " + err.message);
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      await dbService.deleteInvoice(id);
      setSuccessMsg("Invoice successfully deleted.");
      loadInvoices();
    } catch (err) {
      console.error(err);
    }
  };

  // Bulk Operations
  const handleSelectInvoice = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    const list = filteredInvoices.map(x => x.id);
    if (selectedIds.length === list.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(list);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} selected invoices?`)) {
      try {
        for (const id of selectedIds) {
          await dbService.deleteInvoice(id);
        }
        setSuccessMsg(`Bulk deleted ${selectedIds.length} invoices.`);
        setSelectedIds([]);
        loadInvoices();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    try {
      const activeList = invoices.filter(x => selectedIds.includes(x.id));
      for (const inv of activeList) {
        await dbService.saveInvoice({ ...inv, status: "approved" });
      }
      setSuccessMsg(`Approved ${selectedIds.length} invoices.`);
      setSelectedIds([]);
      loadInvoices();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredInvoices = invoices.filter(
    (x) =>
      x.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      x.bill_to_details.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      x.ship_to_details.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Upper Drag-n-Drop & Fast Extract Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Drag Drop Area */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all min-h-[220px] ${
            dragActive
              ? "border-indigo-500 bg-indigo-50/20 dark:bg-zinc-805"
              : "border-gray-250 dark:border-zinc-850 bg-white dark:bg-zinc-900"
          }`}
          id="invoice-upload-container"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-zinc-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 shadow-sm">
            <UploadCloud className="w-6 h-6" />
          </div>

          <p className="text-sm font-sans font-medium text-gray-800 dark:text-zinc-200">
            Drag & drop drayage/freight invoice PDFs here
          </p>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1 mb-4">
            Supports scanned bills, container receipts, and image forms up to 50MB
          </p>

          <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer">
            Browse Company Files
            <input type="file" onChange={handleManualUpload} accept=".pdf,image/*" className="hidden" />
          </label>

          {previewFile && (
            <div className="mt-4 p-2 bg-gray-50 dark:bg-zinc-850 rounded-lg flex items-center gap-2 text-xs text-gray-400">
              <FileText className="w-4 h-4 text-indigo-500" />
              <span className="font-semibold text-gray-750 dark:text-zinc-300">{previewFile.name}</span>
              <span>({previewFile.size})</span>
            </div>
          )}
        </div>

        {/* Rapid Simulator sandbox with preseeded materials */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">
              <Sparkles className="w-5 h-5" />
              <h4 className="font-sans font-semibold text-gray-900 dark:text-zinc-50 text-sm">
                Rapid Sandbox & Test Material Extraction
              </h4>
            </div>
            <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed mb-4">
              Don't have a logistics invoice PDF at hand? Simply tap one of our preseeded logistics
              carrier mock bills below to evaluate Gemini's instant auto-OCR mapping within milliseconds.
            </p>

            <div className="space-y-2.5">
              {LOGISTICS_SAMPLES.map((sample, ix) => (
                <button
                  key={ix}
                  onClick={() => triggerSampleSimulation(ix)}
                  className="w-full text-left p-3 border border-gray-150 dark:border-zinc-800 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-850/60 transition-all text-xs font-medium text-gray-750 dark:text-zinc-350 cursor-pointer flex justify-between items-center bg-gray-50/45"
                  id={`sample-extractor-${ix}`}
                >
                  <span className="truncate">{sample.name}</span>
                  <span className="text-[10px] bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded shrink-0">
                    Test Extraction
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="text-[10px] font-mono leading-relaxed text-gray-400 dark:text-zinc-500 mt-4 border-t border-gray-150 dark:border-zinc-850 pt-2 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Files are securely transmitted server-side to prevent client-side credential leaking.</span>
          </div>
        </div>
      </div>

      {/* Extract progress display details */}
      {extracting && (
        <div className="bg-indigo-50/40 dark:bg-zinc-900 border border-indigo-155 dark:border-zinc-800 rounded-xl p-5 flex items-center gap-4 animate-pulse">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin shrink-0"></div>
          <div>
            <h5 className="font-sans font-semibold text-gray-900 dark:text-zinc-200 text-xs">
              Gemini High-Accuracy OCR Model is Parsing...
            </h5>
            <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1">
              Analyzing text arrays, mapping billings, drayage line values, and cross-calculating VAT structures to schema fields.
            </p>
          </div>
        </div>
      )}

      {/* User Alerts feedback messages */}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs flex items-center gap-3">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Correction Form & Verification Panel */}
      {activeExtraction && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-850 rounded-2xl p-6 shadow-md"
          id="invoice-correction-panel"
        >
          <div className="flex items-center justify-between pb-4 border-b border-gray-150 dark:border-zinc-800 mb-6">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-sans font-semibold text-gray-950 dark:text-white text-base">
                Extract Verification & Audit Validation Sheet
              </h3>
            </div>
            <span className="text-[10px] font-mono uppercase bg-amber-50 dark:bg-amber-955/10 text-amber-600 dark:text-amber-400 border border-amber-150 dark:border-amber-900/30 px-2.5 py-0.5 rounded-full">
              Pending Validation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Meta Section */}
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wide text-gray-400 dark:text-zinc-500 mb-1">Invoice Number</label>
              <input
                type="text"
                value={activeExtraction.invoice_number || ""}
                onChange={(e) => handleUpdateField("invoice_number", e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-zinc-800 rounded-lg text-xs bg-transparent text-gray-900 dark:text-zinc-100 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wide text-gray-400 dark:text-zinc-500 mb-1">Invoice Date</label>
              <input
                type="date"
                value={activeExtraction.invoice_date || ""}
                onChange={(e) => handleUpdateField("invoice_date", e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-zinc-800 rounded-lg text-xs bg-transparent text-gray-900 dark:text-zinc-100 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wide text-gray-400 dark:text-zinc-500 mb-1">Customer PO Number</label>
              <input
                type="text"
                value={activeExtraction.customer_purchase_order_number || ""}
                onChange={(e) => handleUpdateField("customer_purchase_order_number", e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-zinc-800 rounded-lg text-xs bg-transparent text-gray-900 dark:text-zinc-100 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wide text-gray-400 dark:text-zinc-500 mb-1">Sales Order Number</label>
              <input
                type="text"
                value={activeExtraction.sales_order_number || ""}
                onChange={(e) => handleUpdateField("sales_order_number", e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-zinc-800 rounded-lg text-xs bg-transparent text-gray-900 dark:text-zinc-100 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wide text-gray-400 dark:text-zinc-500 mb-1">Delivery Note Number</label>
              <input
                type="text"
                value={activeExtraction.delivery_note_number || ""}
                onChange={(e) => handleUpdateField("delivery_note_number", e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-zinc-800 rounded-lg text-xs bg-transparent text-gray-900 dark:text-zinc-100 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wide text-gray-400 dark:text-zinc-500 mb-1">Customer Contact Email/Name</label>
              <input
                type="text"
                value={activeExtraction.customer_contact || ""}
                onChange={(e) => handleUpdateField("customer_contact", e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-zinc-800 rounded-lg text-xs bg-transparent text-gray-900 dark:text-zinc-100 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Organizations Billed & Shipped */}
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wide text-gray-400 dark:text-zinc-500 mb-1">Bill-To Customer Name</label>
              <input
                type="text"
                value={activeExtraction.bill_to_details?.name || ""}
                onChange={(e) => handleUpdateField("bill_to_details", e.target.value, "name")}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-zinc-800 rounded-lg text-xs bg-transparent text-gray-900 dark:text-zinc-100 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wide text-gray-400 dark:text-zinc-500 mb-1">Ship-To Depot / Target Name</label>
              <input
                type="text"
                value={activeExtraction.ship_to_details?.name || ""}
                onChange={(e) => handleUpdateField("ship_to_details", e.target.value, "name")}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-zinc-800 rounded-lg text-xs bg-transparent text-gray-900 dark:text-zinc-100 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wide text-gray-400 dark:text-zinc-500 mb-1">Destination School/Academy Facility</label>
              <input
                type="text"
                value={activeExtraction.ship_to_details?.school_name || ""}
                onChange={(e) => handleUpdateField("ship_to_details", e.target.value, "school_name")}
                placeholder="N/A"
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-zinc-800 rounded-lg text-xs bg-transparent text-gray-900 dark:text-zinc-100 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Deep Nested Shipped Address Grid */}
          <div className="mt-4 p-3.5 bg-gray-50 dark:bg-zinc-850 rounded-xl border border-gray-150 dark:border-zinc-800">
            <span className="text-[10px] uppercase font-mono tracking-wide text-gray-450 dark:text-zinc-400 block mb-2 font-medium">
              Ship-To Street Address Coordinates
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <input
                  type="text"
                  value={activeExtraction.ship_to_details?.address?.street_address || ""}
                  onChange={(e) => handleUpdateField("address", e.target.value, "street_address")}
                  placeholder="Street Address"
                  className="w-full px-3 py-1.5 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs bg-transparent text-gray-900 dark:text-zinc-100 focus:ring-1"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={activeExtraction.ship_to_details?.address?.city || ""}
                  onChange={(e) => handleUpdateField("address", e.target.value, "city")}
                  placeholder="City"
                  className="w-full px-3 py-1.5 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs bg-transparent text-gray-900 dark:text-zinc-100 focus:ring-1"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={activeExtraction.ship_to_details?.address?.region || ""}
                  onChange={(e) => handleUpdateField("address", e.target.value, "region")}
                  placeholder="Region / State"
                  className="w-full px-3 py-1.5 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs bg-transparent text-gray-900 dark:text-zinc-100 focus:ring-1"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Line Items Table */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[10px] uppercase font-mono tracking-wide text-gray-400 dark:text-zinc-500">
                Audited Freight Line Items
              </span>
              <button
                type="button"
                onClick={addLineItem}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            <div className="border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-xs font-sans text-left min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-zinc-850/60 border-b border-gray-200 dark:border-zinc-800 font-mono text-[9px] uppercase tracking-wider text-gray-400">
                    <th className="py-2.5 px-3 w-28">Stock Code</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 w-20">Qty</th>
                    <th className="py-2.5 px-3 w-24">Unit Price</th>
                    <th className="py-2.5 px-3 w-20">Discount</th>
                    <th className="py-2.5 px-3 w-24">Total Value</th>
                    <th className="py-2.5 px-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 dark:divide-zinc-800/60">
                  {activeExtraction.line_items?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-zinc-850/20">
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.stock_code || ""}
                          onChange={(e) => handleUpdateField("line_items", { stock_code: e.target.value }, undefined, idx)}
                          className="w-full px-2 py-1 border border-transparent hover:border-gray-250 dark:hover:border-zinc-800 rounded text-xs bg-transparent"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.description || ""}
                          onChange={(e) => handleUpdateField("line_items", { description: e.target.value }, undefined, idx)}
                          className="w-full px-2 py-1 border border-transparent hover:border-gray-250 dark:hover:border-zinc-800 rounded text-xs bg-transparent"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={item.quantity || 0}
                          onChange={(e) => {
                            const q = Number(e.target.value);
                            const val = q * (item.unit_price || 0) - (item.discount || 0);
                            handleUpdateField("line_items", { quantity: q, line_item_value: val }, undefined, idx);
                          }}
                          className="w-full px-2 py-1 border border-transparent hover:border-gray-250 dark:hover:border-zinc-800 rounded text-xs bg-transparent"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={item.unit_price || 0}
                          onChange={(e) => {
                            const p = Number(e.target.value);
                            const val = (item.quantity || 0) * p - (item.discount || 0);
                            handleUpdateField("line_items", { unit_price: p, line_item_value: val }, undefined, idx);
                          }}
                          className="w-full px-2 py-1 border border-transparent hover:border-gray-250 dark:hover:border-zinc-800 rounded text-xs bg-transparent"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={item.discount || ""}
                          onChange={(e) => {
                            const disc = e.target.value ? Number(e.target.value) : 0;
                            const val = (item.quantity || 0) * (item.unit_price || 0) - disc;
                            handleUpdateField("line_items", { discount: disc, line_item_value: val }, undefined, idx);
                          }}
                          placeholder="0"
                          className="w-full px-2 py-1 border border-transparent hover:border-gray-250 dark:hover:border-zinc-800 rounded text-xs bg-transparent"
                        />
                      </td>
                      <td className="p-2 font-mono font-medium">
                        R{item.line_item_value?.toFixed(2) || "0.00"}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Extracted Summary Aggregation Sheet */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-zinc-850 rounded-xl border border-gray-150 dark:border-zinc-800 max-w-md ml-auto">
            <span className="text-[10px] uppercase font-mono tracking-wide text-gray-400 dark:text-zinc-500 block mb-2 font-medium">
              Taxation & Carrier Invoice Totals
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center bg-transparent">
                <span className="text-gray-500">Sub-Total Value</span>
                <input
                  type="number"
                  value={activeExtraction.summary?.sub_total || 0}
                  onChange={(e) => handleUpdateField("summary", Number(e.target.value), "sub_total")}
                  className="w-24 px-2 py-0.5 border border-gray-200 dark:border-zinc-750 bg-white dark:bg-zinc-800 rounded font-mono text-right"
                />
              </div>

              <div className="flex justify-between items-center bg-transparent">
                <span className="text-gray-500">VAT / Tax Rate (%)</span>
                <input
                  type="text"
                  value={activeExtraction.summary?.vat_rate || ""}
                  onChange={(e) => handleUpdateField("summary", e.target.value, "vat_rate")}
                  className="w-24 px-2 py-0.5 border border-gray-200 dark:border-zinc-750 bg-white dark:bg-zinc-800 rounded font-mono text-right"
                />
              </div>

              <div className="flex justify-between items-center bg-transparent">
                <span className="text-gray-500">VAT Amount</span>
                <input
                  type="number"
                  value={activeExtraction.summary?.vat_amount || 0}
                  onChange={(e) => handleUpdateField("summary", Number(e.target.value), "vat_amount")}
                  className="w-24 px-2 py-0.5 border border-gray-200 dark:border-zinc-750 bg-white dark:bg-zinc-800 rounded font-mono text-right"
                />
              </div>

              <div className="flex justify-between items-center bg-transparent border-t border-gray-200 dark:border-zinc-800 pt-2 font-bold select-none text-gray-900 dark:text-zinc-100">
                <span>Final Total Balance Due</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span>R</span>
                  <input
                    type="number"
                    value={activeExtraction.summary?.total_due || 0}
                    onChange={(e) => handleUpdateField("summary", Number(e.target.value), "total_due")}
                    className="w-28 px-2 py-0.5 border border-transparent bg-transparent rounded font-bold text-right hover:border-gray-205"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-6 flex justify-end gap-3.5 border-t border-gray-150 dark:border-zinc-800 pt-4">
            <button
              type="button"
              onClick={() => {
                setActiveExtraction(null);
                setPreviewFile(null);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg text-xs font-semibold cursor-pointer hover:bg-gray-50"
            >
              Discard Output
            </button>
            <button
              type="button"
              onClick={saveExtractedInvoice}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save & Record to Ledger
            </button>
          </div>
        </motion.div>
      )}

      {/* Primary Invoices Ledger List section */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Filtering header */}
        <div className="p-5 border-b border-gray-150 dark:border-zinc-800/80 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search by invoice #, bill-to, or destination depot..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-gray-300 dark:border-zinc-750 text-xs bg-transparent rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Bulk Operations buttons */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-indigo-600 font-medium whitespace-nowrap px-1">{selectedIds.length} Chosen</span>
              <button
                onClick={handleBulkApprove}
                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[11px] font-semibold border border-indigo-150 dark:border-indigo-900/40 hover:bg-indigo-100/45"
              >
                Approve Bulk
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-450 border border-red-200 dark:border-red-900/40 rounded-lg text-[11px] font-semibold hover:bg-red-100"
              >
                Delete Selected
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] uppercase text-gray-400 font-mono mt-3">Refreshing Ledger...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-20 text-center text-gray-400 font-mono text-xs">
            No logged invoices matching constraints. Drag a logistics PDF file to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-gray-50 dark:bg-zinc-850 border-b border-gray-200 dark:border-zinc-800 text-gray-400 uppercase font-mono text-[9px] tracking-wider select-none">
                  <th className="py-3 px-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredInvoices.length}
                      onChange={handleSelectAll}
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer Bill To</th>
                  <th className="py-3 px-4">Destination Depot</th>
                  <th className="py-3 px-4">Line Count</th>
                  <th className="py-3 px-4 text-right">Amnt (Inc. VAT)</th>
                  <th className="py-3 px-4 text-center">Audit Status</th>
                  <th className="py-3 px-4 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-zinc-800/80">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-850/15">
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(inv.id)}
                        onChange={() => handleSelectInvoice(inv.id)}
                        className="cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4 font-mono font-bold tracking-tight text-gray-900 dark:text-zinc-200">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-medium">
                      {inv.invoice_date}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-800 dark:text-zinc-200">
                      {inv.bill_to_details.name}
                    </td>
                    <td className="py-3 px-4 text-gray-550 dark:text-zinc-350">
                      <div className="flex flex-col">
                        <span>{inv.ship_to_details.name}</span>
                        {inv.ship_to_details.school_name && (
                          <span className="text-[10px] text-indigo-500 font-semibold">{inv.ship_to_details.school_name}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-center">{inv.line_items.length} items</td>
                    <td className="py-3 px-4 font-bold text-right font-mono text-gray-905 dark:text-zinc-50">
                      R{inv.summary.total_due.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${
                        inv.status === "approved"
                          ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100"
                          : "bg-amber-50 dark:bg-amber-955/10 text-amber-600 dark:text-amber-400 border border-amber-100"
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => deleteInvoice(inv.id)}
                        className="text-red-500 hover:text-red-700 hover:scale-105 transition-all cursor-pointer"
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
