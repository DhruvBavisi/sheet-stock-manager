export type SheetType = "PUL-32" | "PUL-25" | "Sieving";

export const SHEETS: { id: SheetType; label: string; description: string }[] = [
  { id: "PUL-32", label: "PUL-32", description: "Columns: Date, Material, Qty-40, Qty-25, Qty-20" },
  { id: "PUL-25", label: "PUL-25", description: "Columns: Date, Material, Qty-40, Qty-25, Qty-20" },
  { id: "Sieving", label: "Sieving", description: "Columns: Date, Material, 1-No, 2-No, 3-No, 4-No" },
];

export const PREDEFINED_MATERIALS = [
  "9T",
  "5T",
  "3T",
  "20T",
  "Chamak",
  "UC4",
  "Putha",
  "CB-DN",
  "CB-PW",
  "Pen",
] as const;

const MATERIALS_KEY = "stocklog.materials";
const CONFIG_KEY = "stocklog.config";
const LOG_KEY = "stocklog.log";

export type AppConfig = {
  scriptUrl: string;
  sheetId: string;
  sheetName: string;
};

export type LogEntry = {
  id: string;
  sheetName: SheetType;
  date: string;
  material: string;
  // Columns for PUL-32 & PUL-25
  qty40?: number | string;
  qty25?: number | string;
  qty20?: number | string;
  // Columns for Sieving
  qty1No?: number | string;
  qty2No?: number | string;
  qty3No?: number | string;
  qty4No?: number | string;
  synced: boolean;
};

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

export const loadMaterials = (): string[] => {
  const loaded = read<string[]>(MATERIALS_KEY, [...PREDEFINED_MATERIALS]);
  // Ensure all predefined materials are present
  const merged = Array.from(new Set([...PREDEFINED_MATERIALS, ...loaded]));
  return merged;
};

export const saveMaterials = (m: string[]) => write(MATERIALS_KEY, m);

export const loadConfig = (): AppConfig => {
  const envUrl = (import.meta.env.VITE_APPS_SCRIPT_URL as string) || "";
  const envSheetId = (import.meta.env.VITE_GOOGLE_SHEET_ID as string) || "";
  const envSheetName = (import.meta.env.VITE_GOOGLE_SHEET_NAME as string) || "PUL-32";

  const stored = read<AppConfig>(CONFIG_KEY, { scriptUrl: "", sheetId: "", sheetName: "PUL-32" });

  return {
    scriptUrl: envUrl.trim() || stored.scriptUrl.trim(),
    sheetId: envSheetId.trim() || stored.sheetId.trim(),
    sheetName: envSheetName.trim() || stored.sheetName.trim() || "PUL-32",
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
 * Formats a date string (YYYY-MM-DD or similar) into dd-mmm-yyyy (e.g. 18-Aug-2026).
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

export type AppendRowPayload = {
  sheetName: SheetType;
  date: string;
  material: string;
  qty40?: number | string;
  qty25?: number | string;
  qty20?: number | string;
  qty1No?: number | string;
  qty2No?: number | string;
  qty3No?: number | string;
  qty4No?: number | string;
};

/**
 * Appends a row to the specified Google Sheet tab via the Apps Script web app.
 */
export async function appendRow(config: AppConfig, payload: AppendRowPayload) {
  const res = await fetch(config.scriptUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      sheetId: config.sheetId,
      sheetName: payload.sheetName,
      date: payload.date,
      material: payload.material,
      qty40: payload.qty40 ?? "",
      qty25: payload.qty25 ?? "",
      qty20: payload.qty20 ?? "",
      qty1No: payload.qty1No ?? "",
      qty2No: payload.qty2No ?? "",
      qty3No: payload.qty3No ?? "",
      qty4No: payload.qty4No ?? "",
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
    var sheetName = body.sheetName || 'PUL-32';
    var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

    // Auto-create header row if sheet is empty
    if (sheet.getLastRow() === 0) {
      if (sheetName === 'Sieving') {
        sheet.appendRow(['Date', 'Material', '1-No', '2-No', '3-No', '4-No']);
      } else {
        sheet.appendRow(['Date', 'Material', 'Qty-40', 'Qty-25', 'Qty-20']);
      }
    }

    // Append row based on sheet type
    if (sheetName === 'Sieving') {
      sheet.appendRow([
        body.date || '',
        body.material || '',
        body.qty1No !== undefined && body.qty1No !== '' ? Number(body.qty1No) : '',
        body.qty2No !== undefined && body.qty2No !== '' ? Number(body.qty2No) : '',
        body.qty3No !== undefined && body.qty3No !== '' ? Number(body.qty3No) : '',
        body.qty4No !== undefined && body.qty4No !== '' ? Number(body.qty4No) : ''
      ]);
    } else {
      sheet.appendRow([
        body.date || '',
        body.material || '',
        body.qty40 !== undefined && body.qty40 !== '' ? Number(body.qty40) : '',
        body.qty25 !== undefined && body.qty25 !== '' ? Number(body.qty25) : '',
        body.qty20 !== undefined && body.qty20 !== '' ? Number(body.qty20) : ''
      ]);
    }

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


