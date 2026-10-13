// A "task" is the top-level choice the user makes first. The two tasks are
// completely separate workflows that happen to share the same Google Sheet file:
//   - "Machines"  → production logging on the PUL-32 / PUL-25 / Sieving tabs
//   - "Logistics" → truck / tempo IN–OUT timings on the Logistics tab
export type TaskType = "Machines" | "Logistics";

// Production sheets that live under the "Machines" task.
export type MachineSheet = "PUL-32" | "PUL-25" | "Sieving";

// Every physical Google Sheet tab the app can write to.
export type SheetType = MachineSheet | "Logistics";

export const TASKS: { id: TaskType; label: string; description: string }[] = [
  {
    id: "Machines",
    label: "Machines",
    description: "Log production quantities for PUL-32, PUL-25 and Sieving.",
  },
  {
    id: "Logistics",
    label: "Logistics",
    description: "Log truck / tempo IN–OUT timings with vehicle number and material.",
  },
];

export const MACHINE_SHEETS: { id: MachineSheet; label: string; description: string }[] = [
  { id: "PUL-32", label: "PUL-32", description: "Columns: Date, TIME, Material, Qty-40, Qty-25, Qty-20" },
  { id: "PUL-25", label: "PUL-25", description: "Columns: Date, TIME, Material, Qty-40, Qty-25, Qty-20" },
  { id: "Sieving", label: "Sieving", description: "Columns: Date, TIME, Material, 1-No, 2-No, 3-No, 4-No" },
];

export const LOGISTICS_SHEET: { id: "Logistics"; label: string; description: string } = {
  id: "Logistics",
  label: "Logistics",
  description: "Columns: Date, Vehicle No, Transporter Name, Material, Movement, In-Time, Out-Time",
};

// All sheets across both tasks (machine tabs first, then Logistics).
export const SHEETS: { id: SheetType; label: string; description: string }[] = [
  ...MACHINE_SHEETS,
  LOGISTICS_SHEET,
];

/** Which task a given sheet tab belongs to. */
export function taskForSheet(sheet: SheetType): TaskType {
  return sheet === "Logistics" ? "Logistics" : "Machines";
}

export const PREDEFINED_MATERIALS = [
  "RML",
  "9T",
  "5T",
  "3T",
  "17T",
  "20T",
  "Chamak",
  "UC4",
  "MGO",
  "Putha",
  "CB-DN",
  "CB-PW",
  "Pen",
] as const;

// Quick-pick transporters offered on the Logistics form. The field itself is a
// free-text input; these are just one-tap shortcuts.
export const PREDEFINED_TRANSPORTERS = ["SGL"] as const;

const MATERIALS_KEY = "stocklog.materials";
const TRANSPORTERS_KEY = "stocklog.transporters";
const CONFIG_KEY = "stocklog.config";
const LOG_KEY = "stocklog.log";

export type AppConfig = {
  // Account 1 / Email 1
  scriptUrl: string;
  sheetId: string;
  // Account 2 / Email 2 (Optional)
  scriptUrl2?: string;
  sheetId2?: string;
  // Account 3 / Email 3 (Optional)
  scriptUrl3?: string;
  sheetId3?: string;
  sheetName: string;
};

export type LogEntry = {
  id: string;
  task: TaskType;
  sheetName: SheetType;
  date: string;
  dayNight?: "Day" | "Night" | "";
  material: string;
  // Columns for PUL-32 & PUL-25 (Machines)
  qty40?: number | string;
  qty25?: number | string;
  qty20?: number | string;
  // Columns for Sieving (Machines)
  qty1No?: number | string;
  qty2No?: number | string;
  qty3No?: number | string;
  qty4No?: number | string;
  // Columns for Logistics
  vehicleNo?: string; // number plate, e.g. "GJ-01-AB-1234"
  transporter?: string; // transporter / carrier name, e.g. "SGL"
  movement?: "In" | "Out" | ""; // goods arrived at facility (In) or sent out (Out)
  inTime?: string; // "HH:mm"
  outTime?: string; // "HH:mm"
  synced: boolean;
  syncedCount?: number;
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
  const merged = Array.from(new Set([...PREDEFINED_MATERIALS, ...loaded]));
  return merged;
};

export const saveMaterials = (m: string[]) => write(MATERIALS_KEY, m);

export const loadTransporters = (): string[] => {
  const loaded = read<string[]>(TRANSPORTERS_KEY, [...PREDEFINED_TRANSPORTERS]);
  return Array.from(new Set([...PREDEFINED_TRANSPORTERS, ...loaded]));
};

export const saveTransporters = (t: string[]) => write(TRANSPORTERS_KEY, t);

export const loadConfig = (): AppConfig => {
  const envUrl = (import.meta.env["APPS_SCRIPT_URL"] ?? "") as string;
  const envSheetId = (import.meta.env["GOOGLE_SHEET_ID"] ?? "") as string;
  const envUrl2 = (import.meta.env["APPS_SCRIPT_URL_2"] ?? "") as string;
  const envSheetId2 = (import.meta.env["GOOGLE_SHEET_ID_2"] ?? "") as string;
  const envUrl3 = (import.meta.env["APPS_SCRIPT_URL_3"] ?? "") as string;
  const envSheetId3 = (import.meta.env["GOOGLE_SHEET_ID_3"] ?? "") as string;
  const envSheetName = (import.meta.env["GOOGLE_SHEET_NAME"] ?? "PUL-32") as string;

  const stored = read<AppConfig>(CONFIG_KEY, {
    scriptUrl: "",
    sheetId: "",
    scriptUrl2: "",
    sheetId2: "",
    scriptUrl3: "",
    sheetId3: "",
    sheetName: "PUL-32",
  });

  return {
    scriptUrl: (envUrl || stored?.scriptUrl || "").trim(),
    sheetId: (envSheetId || stored?.sheetId || "").trim(),
    scriptUrl2: (envUrl2 || stored?.scriptUrl2 || "").trim(),
    sheetId2: (envSheetId2 || stored?.sheetId2 || "").trim(),
    scriptUrl3: (envUrl3 || stored?.scriptUrl3 || "").trim(),
    sheetId3: (envSheetId3 || stored?.sheetId3 || "").trim(),
    sheetName: (envSheetName || stored?.sheetName || "PUL-32").trim(),
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

export function formatDateDDMMMYYYY(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;

  const [year, month, day] = parts;
  if (!year || !month || !day) return dateStr;

  const monthIdx = Number.parseInt(month, 10) - 1;
  const safeDay = day.padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthName = months[monthIdx] || month;
  return `${safeDay}-${monthName}-${year}`;
}

export type AppendRowPayload = {
  sheetName: SheetType;
  date: string;
  dayNight?: "Day" | "Night" | "";
  material: string;
  qty40?: number | string;
  qty25?: number | string;
  qty20?: number | string;
  qty1No?: number | string;
  qty2No?: number | string;
  qty3No?: number | string;
  qty4No?: number | string;
  // Logistics
  vehicleNo?: string;
  transporter?: string;
  movement?: string;
  inTime?: string;
  outTime?: string;
};

function normalizeSheetValue(value: unknown): string {
  if (value === undefined || value === null) return "";
  const raw = typeof value === "string" ? value : String(value);
  const str = raw.trim();
  if (!str) return "";

  const lower = str.toLowerCase();
  if (
    lower === "undefined" ||
    lower === "null" ||
    lower === "nan"
  ) {
    return "";
  }

  return str;
}

export function normalizeAppendRowPayload(payload: AppendRowPayload): AppendRowPayload {
  return {
    sheetName: payload.sheetName,
    date: normalizeSheetValue(payload.date),
    dayNight: normalizeSheetValue(payload.dayNight) as "Day" | "Night" | "",
    material: normalizeSheetValue(payload.material),
    qty40: normalizeSheetValue(payload.qty40),
    qty25: normalizeSheetValue(payload.qty25),
    qty20: normalizeSheetValue(payload.qty20),
    qty1No: normalizeSheetValue(payload.qty1No),
    qty2No: normalizeSheetValue(payload.qty2No),
    qty3No: normalizeSheetValue(payload.qty3No),
    qty4No: normalizeSheetValue(payload.qty4No),
    vehicleNo: normalizeSheetValue(payload.vehicleNo),
    transporter: normalizeSheetValue(payload.transporter),
    movement: normalizeSheetValue(payload.movement),
    inTime: normalizeSheetValue(payload.inTime),
    outTime: normalizeSheetValue(payload.outTime),
  };
}

export type SyncEndpoint = {
  name: string;
  url: string;
  sheetId: string;
};

export function getConfiguredEndpoints(config: AppConfig): SyncEndpoint[] {
  const endpoints: SyncEndpoint[] = [];

  const url1 = config?.scriptUrl?.trim();
  const id1 = config?.sheetId?.trim();
  if (url1 && id1) {
    endpoints.push({ name: "Account 1", url: url1, sheetId: id1 });
  }

  const url2 = config?.scriptUrl2?.trim();
  const id2 = config?.sheetId2?.trim();
  if (url2 && id2) {
    endpoints.push({ name: "Account 2", url: url2, sheetId: id2 });
  }

  const url3 = config?.scriptUrl3?.trim();
  const id3 = config?.sheetId3?.trim();
  if (url3 && id3) {
    endpoints.push({ name: "Account 3", url: url3, sheetId: id3 });
  }

  return endpoints;
}

/**
 * Sends a single POST payload to one Apps Script Web App URL.
 */
async function sendToEndpoint(url: string, sheetId: string, payload: AppendRowPayload) {
  if (!url || !sheetId) return { ok: false, error: "Missing URL or Sheet ID" };

  const cleanPayload = normalizeAppendRowPayload(payload);
  const legacyQuantity = cleanPayload.sheetName === "Sieving"
    ? cleanPayload.qty1No ?? ""
    : cleanPayload.sheetName === "Logistics"
      ? ""
      : cleanPayload.qty40 ?? "";

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      sheetId: sheetId.trim(),
      sheetName: cleanPayload.sheetName,
      product: cleanPayload.material,
      quantity: legacyQuantity,
      formattedQuantity: legacyQuantity,
      vehicleNumber: cleanPayload.vehicleNo ?? "",
      transporterName: cleanPayload.transporter ?? "",
      movementType: cleanPayload.movement ?? "",
      entryTime: cleanPayload.inTime ?? "",
      exitTime: cleanPayload.outTime ?? "",
      date: cleanPayload.date,
      dayNight: cleanPayload.dayNight ?? "",
      material: cleanPayload.material,
      qty40: cleanPayload.qty40 ?? "",
      qty25: cleanPayload.qty25 ?? "",
      qty20: cleanPayload.qty20 ?? "",
      qty1No: cleanPayload.qty1No ?? "",
      qty2No: cleanPayload.qty2No ?? "",
      qty3No: cleanPayload.qty3No ?? "",
      qty4No: cleanPayload.qty4No ?? "",
      vehicleNo: cleanPayload.vehicleNo ?? "",
      transporter: cleanPayload.transporter ?? "",
      movement: cleanPayload.movement ?? "",
      inTime: cleanPayload.inTime ?? "",
      outTime: cleanPayload.outTime ?? "",
    }),
    redirect: "follow",
  });

  const text = await res.text();
  let data: { ok?: boolean; error?: string } = {};
  try {
    data = JSON.parse(text);
  } catch {
    const isHtml = text.trimStart().startsWith("<!DOCTYPE html") || text.includes("window['ppConfig']");
    throw new Error(
      isHtml
        ? `Apps Script returned a Google login/consent page (${res.status}). Redeploy the web app as "Execute as: Me" and set "Who has access" to "Anyone" for anonymous server-side calls, or use a Sheets API/service-account flow for Workspace-only access.`
        : `Unexpected response from Apps Script (${res.status}). Check deployment access setting and authorization.`,
    );
  }
  if (!res.ok || !data.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

/**
 * Appends a row via the same-origin API route so the browser does not call Google Sheets directly.
 */
export async function appendRow(config: AppConfig, payload: AppendRowPayload) {
  const endpoints = getConfiguredEndpoints(config);

  if (endpoints.length === 0) {
    throw new Error("No Google Sheet endpoints configured in .env");
  }

  const safePayload = normalizeAppendRowPayload(payload);

  const res = await fetch("/api/sheets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoints,
      payload: safePayload,
    }),
  });

  const text = await res.text();
  let data: { ok?: boolean; syncedCount?: number; totalEndpoints?: number; errors?: string[]; error?: string } = {};

  try {
    data = JSON.parse(text);
  } catch {
    const snippet = text.slice(0, 180).replace(/\s+/g, " ");
    throw new Error(`Unexpected response from sync API (${res.status}). ${snippet}`);
  }

  if (!res.ok || !data.ok) {
    throw new Error(data.error || `Sync API failed (${res.status})`);
  }

  return {
    ok: true,
    syncedCount: data.syncedCount ?? endpoints.length,
    totalEndpoints: data.totalEndpoints ?? endpoints.length,
    errors: data.errors ?? [],
  };
}

export const APPS_SCRIPT_CODE = `function clean(value) {
  if (value === undefined || value === null) return '';
  var text = String(value).trim();
  return text === 'undefined' || text === 'null' || text === 'NaN' ? '' : text;
}

function number(value) {
  var text = clean(value);
  if (text === '') return '';
  var n = Number(text);
  return isNaN(n) ? text : n;
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'No POST data received' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);
    var spreadsheet = SpreadsheetApp.openById(clean(data.sheetId));
    var name = clean(data.sheetName) || 'PUL-32';
    var sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);

    var isSieving = name.toLowerCase() === 'sieving';
    var isLogistics = name.toLowerCase() === 'logistics';

    var defaultHeaders = isSieving
      ? ['Date', 'TIME', 'Material', '1-No', '2-No', '3-No', '4-No']
      : isLogistics
        ? ['Date', 'Vehicle No', 'Transporter Name', 'Material', 'Movement', 'In-Time', 'Out-Time']
        : ['Date', 'TIME', 'Material', 'Qty-40', 'Qty-25', 'Qty-20'];

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(defaultHeaders);
    } else if (!isLogistics) {
      var firstHeader = String(sheet.getRange(1, 1).getValue() || '').trim().toLowerCase();
      var secondHeader = String(sheet.getRange(1, 2).getValue() || '').trim().toLowerCase().replace(/[\s\-_\.\/]/g, '');
      if (firstHeader === 'date' && secondHeader !== 'time') {
        if (secondHeader === 'period' || secondHeader === 'daynight' || secondHeader === 'shift') {
          sheet.getRange(1, 2).setValue('TIME');
        } else {
          sheet.insertColumnAfter(1);
          sheet.getRange(1, 2).setValue('TIME');
        }
      }
    }

    var lastCol = Math.max(sheet.getLastColumn(), defaultHeaders.length);
    var headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

    var valuesMap = {
      date: clean(data.date),
      daynight: clean(data.dayNight || data.shift),
      material: clean(data.material || data.product),
      qty40: number(data.qty40),
      qty25: number(data.qty25),
      qty20: number(data.qty20),
      qty1no: number(data.qty1No),
      qty2no: number(data.qty2No),
      qty3no: number(data.qty3No),
      qty4no: number(data.qty4No),
      vehicleno: clean(data.vehicleNo || data.vehicleNumber),
      transporter: clean(data.transporter || data.transporterName),
      movement: clean(data.movement || data.movementType),
      intime: clean(data.inTime || data.entryTime),
      outtime: clean(data.outTime || data.exitTime)
    };

    var row = [];
    var hasHeaderMatch = false;

    for (var i = 0; i < headerRow.length; i++) {
      var h = String(headerRow[i] || '').trim().toLowerCase().replace(/[\\s\\-_\\.]/g, '');
      var val = '';

      if (h === 'date') { val = valuesMap.date; hasHeaderMatch = true; }
      else if (h === 'time' || h === 'period' || h === 'daynight' || h === 'shift') { val = valuesMap.daynight; hasHeaderMatch = true; }
      else if (h === 'material' || h === 'product') { val = valuesMap.material; hasHeaderMatch = true; }
      else if (h === 'qty40' || h === '40') { val = valuesMap.qty40; hasHeaderMatch = true; }
      else if (h === 'qty25' || h === '25') { val = valuesMap.qty25; hasHeaderMatch = true; }
      else if (h === 'qty20' || h === '20') { val = valuesMap.qty20; hasHeaderMatch = true; }
      else if (h === '1no' || h === 'qty1no') { val = valuesMap.qty1no; hasHeaderMatch = true; }
      else if (h === '2no' || h === 'qty2no') { val = valuesMap.qty2no; hasHeaderMatch = true; }
      else if (h === '3no' || h === 'qty3no') { val = valuesMap.qty3no; hasHeaderMatch = true; }
      else if (h === '4no' || h === 'qty4no') { val = valuesMap.qty4no; hasHeaderMatch = true; }
      else if (h === 'vehicleno' || h === 'vehiclenumber' || h === 'vehicle') { val = valuesMap.vehicleno; hasHeaderMatch = true; }
      else if (h === 'transportername' || h === 'transporter') { val = valuesMap.transporter; hasHeaderMatch = true; }
      else if (h === 'movement' || h === 'movementtype') { val = valuesMap.movement; hasHeaderMatch = true; }
      else if (h === 'intime' || h === 'entrytime') { val = valuesMap.intime; hasHeaderMatch = true; }
      else if (h === 'outtime' || h === 'exittime') { val = valuesMap.outtime; hasHeaderMatch = true; }

      row.push(val);
    }

    if (!hasHeaderMatch) {
      if (isSieving) {
        row = [valuesMap.date, valuesMap.daynight, valuesMap.material, valuesMap.qty1no, valuesMap.qty2no, valuesMap.qty3no, valuesMap.qty4no];
      } else if (isLogistics) {
        row = [valuesMap.date, valuesMap.vehicleno, valuesMap.transporter, valuesMap.material, valuesMap.movement, valuesMap.intime, valuesMap.outtime];
      } else {
        row = [valuesMap.date, valuesMap.daynight, valuesMap.material, valuesMap.qty40, valuesMap.qty25, valuesMap.qty20];
      }
    }

    sheet.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(error) })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, status: 'ready' })).setMimeType(ContentService.MimeType.JSON);
}`;




