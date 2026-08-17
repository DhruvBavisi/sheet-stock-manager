const PRODUCTS_KEY = "stocklog.products";
const CONFIG_KEY = "stocklog.config";
const LOG_KEY = "stocklog.log";

export type AppConfig = {
  scriptUrl: string;
  sheetId: string;
  sheetName: string;
};

export type LogEntry = {
  id: string;
  date: string;
  product: string;
  quantity: number;
  unit: string;
  synced: boolean;
};

const DEFAULT_PRODUCTS = ["Rice 5kg", "Sugar 1kg", "Cooking Oil 1L"];

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export const loadProducts = () => read<string[]>(PRODUCTS_KEY, DEFAULT_PRODUCTS);
export const saveProducts = (p: string[]) => write(PRODUCTS_KEY, p);

export const loadConfig = (): AppConfig => {
  const envUrl = (import.meta.env.VITE_APPS_SCRIPT_URL as string) || "";
  const envSheetId = (import.meta.env.VITE_GOOGLE_SHEET_ID as string) || "";
  const envSheetName = (import.meta.env.VITE_GOOGLE_SHEET_NAME as string) || "Sheet1";

  const stored = read<AppConfig>(CONFIG_KEY, { scriptUrl: "", sheetId: "", sheetName: "Sheet1" });

  return {
    scriptUrl: envUrl.trim() || stored.scriptUrl.trim(),
    sheetId: envSheetId.trim() || stored.sheetId.trim(),
    sheetName: envSheetName.trim() || stored.sheetName.trim() || "Sheet1",
  };
};
export const saveConfig = (c: AppConfig) => write(CONFIG_KEY, c);

export const loadLog = () => read<LogEntry[]>(LOG_KEY, []);
export const saveLog = (l: LogEntry[]) => write(LOG_KEY, l.slice(0, 100));

export function todayISO() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Formats a date string (YYYY-MM-DD or similar) into dd-mmm-yyyy (e.g. 12-Aug-2026).
 */
export function formatDateDDMMMYYYY(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parts[2].padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthName = months[monthIdx] || parts[1];
  return `${day}-${monthName}-${year}`;
}

/**
 * Converts kg to Tons if quantity is 1000 or above.
 */
export function convertKgToTons(qty: number, currentUnit: string): { quantity: number; unit: string; converted: boolean; originalQty?: number } {
  const lowerUnit = currentUnit.toLowerCase().trim();
  if ((lowerUnit === "kg" || lowerUnit === "kgs" || lowerUnit === "kilograms" || lowerUnit === "") && qty >= 1000) {
    const tons = Math.round((qty / 1000) * 1000) / 1000;
    return {
      quantity: tons,
      unit: tons === 1 ? "Ton" : "Tons",
      converted: true,
      originalQty: qty,
    };
  }
  return { quantity: qty, unit: currentUnit || "kg", converted: false };
}

/**
 * Appends a row to the Google Sheet via the Apps Script web app.
 * text/plain keeps it a "simple" request so the browser skips the CORS preflight.
 */
export async function appendRow(
  config: AppConfig,
  payload: { date: string; product: string; quantity: number; unit: string },
) {
  const formattedQuantity = `${payload.quantity} ${payload.unit}`.trim();
  const res = await fetch(config.scriptUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      sheetId: config.sheetId,
      sheetName: config.sheetName || "Sheet1",
      date: payload.date,
      product: payload.product,
      quantity: formattedQuantity,
      formattedQuantity,
    }),
    redirect: "follow",
  });
  const text = await res.text();
  let data: { ok?: boolean; error?: string } = {};
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Unexpected response from Apps Script. Check the deployment access setting.");
  }
  if (!res.ok || !data.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const APPS_SCRIPT_CODE = `function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.openById(body.sheetId);
    var sheet = ss.getSheetByName(body.sheetName || 'Sheet1') || ss.insertSheet(body.sheetName || 'Sheet1');

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Date', 'Product', 'Quantity']);
    }

    var qtyDisplay = body.formattedQuantity || body.quantity;

    sheet.appendRow([body.date, body.product, String(qtyDisplay)]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, status: 'ready' }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

