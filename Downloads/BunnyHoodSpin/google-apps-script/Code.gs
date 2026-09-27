function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function safeCell_(value) {
  var text = String(value == null ? "" : value);
  return /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
}

function validUuid_(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function validDate_(value) {
  return !isNaN(Date.parse(String(value || "")));
}

function normalizedWallet_(value) {
  return String(value || "").trim().toLowerCase();
}

function sheetWithHeader_(name, header) {
  var workbook = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = workbook.getSheetByName(name);
  if (!sheet) sheet = workbook.insertSheet(name);
  if (sheet.getLastRow() === 0) sheet.appendRow(header);
  return sheet;
}

function findRowById_(sheet, id) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  var match = sheet.getRange(2, 1, lastRow - 1, 1)
    .createTextFinder(String(id))
    .matchEntireCell(true)
    .findNext();
  return match ? match.getRow() : 0;
}

function validSpinUser_(payload) {
  return validUuid_(payload.userId)
    && /^[0-9]{1,25}$/.test(String(payload.xUserId || ""))
    && /^[A-Za-z0-9_]{1,15}$/.test(String(payload.xUsername || ""))
    && String(payload.xName || "").length <= 100
    && Number.isInteger(Number(payload.spinsAvailable))
    && Number(payload.spinsAvailable) >= 0
    && Number.isInteger(Number(payload.points))
    && Number(payload.points) >= 0
    && validDate_(payload.updatedAt);
}

function handleSpinUser_(payload) {
  if (!validSpinUser_(payload)) return { ok: false, code: "INVALID_SPIN_USER" };
  var sheet = sheetWithHeader_("Spin Users", [
    "User ID", "X User ID", "X Username", "X Name", "Spins Available",
    "Spins Used", "Points", "Total Wins", "Updated At"
  ]);
  var values = [[
    safeCell_(payload.userId), safeCell_(payload.xUserId), safeCell_(payload.xUsername),
    safeCell_(payload.xName), Number(payload.spinsAvailable), Number(payload.spinsUsed || 0),
    Number(payload.points), Number(payload.totalWins || 0), safeCell_(payload.updatedAt)
  ]];
  var row = findRowById_(sheet, payload.userId);
  if (row) {
    var savedUpdatedAt = String(sheet.getRange(row, 9).getDisplayValue() || "");
    if (validDate_(savedUpdatedAt) && Date.parse(savedUpdatedAt) >= Date.parse(payload.updatedAt)) {
      return { ok: true, duplicate: true, stale: true };
    }
    sheet.getRange(row, 1, 1, values[0].length).setValues(values);
  } else {
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, values[0].length).setValues(values);
  }
  return { ok: true, duplicate: Boolean(row) };
}

function validSpinWin_(payload) {
  var wallet = String(payload.wallet || "");
  return validUuid_(payload.winId)
    && validUuid_(payload.userId)
    && /^[0-9]{1,25}$/.test(String(payload.xUserId || ""))
    && /^[A-Za-z0-9_]{1,15}$/.test(String(payload.xUsername || ""))
    && ["GTD", "FCFS1", "FCFS2"].indexOf(String(payload.prizeType || "")) >= 0
    && validDate_(payload.wonAt)
    && (!wallet || /^0x[a-fA-F0-9]{40}$/.test(wallet))
    && (!payload.walletSubmittedAt || validDate_(payload.walletSubmittedAt));
}

function handleSpinWin_(payload) {
  if (!validSpinWin_(payload)) return { ok: false, code: "INVALID_SPIN_WIN" };
  var sheet = sheetWithHeader_("Spin Wins", [
    "Win ID", "User ID", "X User ID", "X Username", "X Name", "Prize",
    "Won At", "EVM Wallet", "Wallet Submitted At"
  ]);
  var row = findRowById_(sheet, payload.winId);
  if (row) {
    var savedWallet = String(sheet.getRange(row, 8).getDisplayValue() || "");
    if (savedWallet && normalizedWallet_(savedWallet) !== normalizedWallet_(payload.wallet)) {
      return { ok: false, code: "WALLET_LOCKED" };
    }
  }
  var values = [[
    safeCell_(payload.winId), safeCell_(payload.userId), safeCell_(payload.xUserId),
    safeCell_(payload.xUsername), safeCell_(payload.xName), safeCell_(payload.prizeType),
    safeCell_(payload.wonAt), safeCell_(payload.wallet || ""), safeCell_(payload.walletSubmittedAt || "")
  ]];
  if (row) sheet.getRange(row, 1, 1, values[0].length).setValues(values);
  else sheet.getRange(sheet.getLastRow() + 1, 1, 1, values[0].length).setValues(values);
  return { ok: true, duplicate: Boolean(row) };
}

function doPost(e) {
  try {
    var rawBody = e && e.postData ? String(e.postData.contents || "") : "";
    if (!rawBody || rawBody.length > 16384) return jsonResponse_({ ok: false, code: "INVALID_REQUEST" });
    var payload = JSON.parse(rawBody);
    var expectedToken = PropertiesService.getScriptProperties().getProperty("BUNNY_HOOD_WEBHOOK_TOKEN");
    if (!expectedToken || String(payload.webhookToken || "") !== expectedToken) {
      return jsonResponse_({ ok: false, code: "UNAUTHORIZED" });
    }
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      if (payload.source === "bunny-hood-spin-v1" && payload.eventType === "spin_user") {
        return jsonResponse_(handleSpinUser_(payload));
      }
      if (payload.source === "bunny-hood-spin-v1" && payload.eventType === "spin_win") {
        return jsonResponse_(handleSpinWin_(payload));
      }
      return jsonResponse_({ ok: false, code: "UNKNOWN_EVENT" });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    console.error("Bunny Hood Sheet webhook rejected a request.");
    return jsonResponse_({ ok: false, code: "REQUEST_REJECTED" });
  }
}
