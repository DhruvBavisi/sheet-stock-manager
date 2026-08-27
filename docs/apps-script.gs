/**
 * StockLog — Google Apps Script Web App backend
 * ------------------------------------------------------------------
 * This is the standalone, copy-paste version of the script that the app
 * also embeds in `src/lib/stocklog.ts` (exported as `APPS_SCRIPT_CODE` and
 * shown inside the in-app Settings dialog). Keep the two in sync — the
 * embedded string is the source of truth; this file mirrors it for easy
 * pasting into the Apps Script editor.
 *
 * It supports BOTH tasks the app can log:
 *   • Machines  → PUL-32 / PUL-25 (Date, Material, Qty-40, Qty-25, Qty-20)
 *                 Sieving         (Date, Material, 1-No, 2-No, 3-No, 4-No)
 *   • Logistics → Logistics       (Date, Vehicle No, Transporter Name, Material, Movement, In-Time, Out-Time)
 *
 * The correct tab is chosen by `body.sheetName`; the header row is
 * auto-created per tab type on first write. Quantities are coerced to
 * Number; times are kept as plain "HH:mm" strings (do NOT Number() them).
 *
 * ── Deployment (must match, or Google returns an HTML login page) ──
 *   1. Open the target Google Sheet → Extensions → Apps Script.
 *   2. Paste this file, Save.
 *   3. Deploy → New deployment → type "Web app".
 *        • Execute as:      Me
 *        • Who has access:  Anyone
 *   4. Copy the /exec Web App URL into the app's Settings (or APPS_SCRIPT_URL).
 *   5. Put the Google Sheet ID (from its URL) into GOOGLE_SHEET_ID.
 *   For dual-account sync, repeat for the 2nd account and use the *_2 vars.
 */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.openById(body.sheetId);
    var sheetName = body.sheetName || 'PUL-32';
    var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

    // Auto-create header row if sheet is empty
    if (sheet.getLastRow() === 0) {
      if (sheetName === 'Sieving') {
        sheet.appendRow(['Date', 'Material', '1-No', '2-No', '3-No', '4-No']);
      } else if (sheetName === 'Logistics') {
        sheet.appendRow(['Date', 'Vehicle No', 'Transporter Name', 'Material', 'Movement', 'In-Time', 'Out-Time']);
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
    } else if (sheetName === 'Logistics') {
      sheet.appendRow([
        body.date || '',
        body.vehicleNo || '',
        body.transporter || '',
        body.material || '',
        body.movement || '',
        body.inTime || '',
        body.outTime || ''
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
}
