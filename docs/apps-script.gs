function clean(value) {
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
      ? ['Date', 'Material', '1-No', '2-No', '3-No', '4-No']
      : isLogistics
        ? ['Date', 'Vehicle No', 'Transporter Name', 'Material', 'Movement', 'In-Time', 'Out-Time']
        : ['Date', 'Material', 'Qty-40', 'Qty-25', 'Qty-20'];

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(defaultHeaders);
    }

    var lastCol = Math.max(sheet.getLastColumn(), defaultHeaders.length);
    var headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

    var valuesMap = {
      date: clean(data.date),
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
      var h = String(headerRow[i] || '').trim().toLowerCase().replace(/[\s\-_\.]/g, '');
      var val = '';

      if (h === 'date') { val = valuesMap.date; hasHeaderMatch = true; }
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
        row = [valuesMap.date, valuesMap.material, valuesMap.qty1no, valuesMap.qty2no, valuesMap.qty3no, valuesMap.qty4no];
      } else if (isLogistics) {
        row = [valuesMap.date, valuesMap.vehicleno, valuesMap.transporter, valuesMap.material, valuesMap.movement, valuesMap.intime, valuesMap.outtime];
      } else {
        row = [valuesMap.date, valuesMap.material, valuesMap.qty40, valuesMap.qty25, valuesMap.qty20];
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
}
