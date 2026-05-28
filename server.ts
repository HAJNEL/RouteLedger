import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Let's expand limits for base64 file transmissions
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Initialize Gemini safely using recommended SDK configuration
  // The Gemini API key remains 100% server-side.
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not defined or is empty.");
    }
    return new GoogleGenAI({
      apiKey: apiKey || "dummy-key",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // REST API Route to parse invoices with high-accuracy schema enforcement
  app.post("/api/extract", async (req, res) => {
    try {
      const { fileData, mimeType, fileName } = req.body;

      if (!fileData || !mimeType) {
        return res.status(400).json({ error: "Missing fileData (base64) or mimeType" });
      }

      const ai = getGeminiClient();

      // Setup Gemini parameters to extract matching the exact schema requested by the user
      const documentPart = {
        inlineData: {
          mimeType: mimeType,
          data: fileData,
        },
      };

      const promptPart = {
        text: `Analyze this invoice named "${fileName || "invoice"}" and extract all details with extreme precision. 
Make sure line items are parsed accurately. If values are missing and not required, output null. Enforce numerical fields correctly.`,
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [documentPart, promptPart],
        config: {
          systemInstruction: "You are an intelligent logistics OCR and automated data extraction agent. Extract structured JSON strictly matching the provided schema.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              invoice_number: { type: Type.STRING },
              invoice_date: { type: Type.STRING },
              customer_purchase_order_number: { type: Type.STRING, description: "PO number or null" },
              sales_order_number: { type: Type.STRING, description: "Sales order number or null" },
              delivery_note_number: { type: Type.STRING, description: "Delivery note or null" },
              customer_contact: { type: Type.STRING, description: "Contact person or null" },
              bill_to_details: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING }
                },
                required: ["name"]
              },
              ship_to_details: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  school_name: { type: Type.STRING, description: "School name or destination center or null" },
                  address: {
                    type: Type.OBJECT,
                    properties: {
                      street_address: { type: Type.STRING },
                      city: { type: Type.STRING },
                      region: { type: Type.STRING, description: "State or province or null" }
                    },
                    required: ["street_address", "city"]
                  }
                },
                required: ["name", "address"]
              },
              line_items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    stock_code: { type: Type.STRING },
                    description: { type: Type.STRING },
                    quantity: { type: Type.NUMBER },
                    unit_price: { type: Type.NUMBER },
                    discount: { type: Type.NUMBER, description: "Discount percentage/value or null" },
                    line_item_value: { type: Type.NUMBER }
                  },
                  required: ["stock_code", "description", "quantity", "unit_price", "line_item_value"]
                }
              },
              summary: {
                type: Type.OBJECT,
                properties: {
                  sub_total: { type: Type.NUMBER },
                  vat_rate: { type: Type.STRING, description: "Tax / VAT percentage or null" },
                  vat_amount: { type: Type.NUMBER },
                  amount_inclusive_of_vat: { type: Type.NUMBER, description: "Total inclusive of VAT or null" },
                  freight_amount: { type: Type.NUMBER, description: "Freight/shipping charges or null" },
                  total_due: { type: Type.NUMBER }
                },
                required: ["sub_total", "vat_amount", "total_due"]
              }
            },
            required: [
              "invoice_number",
              "invoice_date",
              "bill_to_details",
              "ship_to_details",
              "line_items",
              "summary"
            ]
          }
        }
      });

      const jsonStr = response.text || "{}";
      const parsedData = JSON.parse(jsonStr.trim());

      return res.json({ result: parsedData });
    } catch (error: any) {
      console.error("AI Invoice extraction error: ", error);
      return res.status(500).json({
        error: "Failed to extract invoice data accurately.",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express multi-tier server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
