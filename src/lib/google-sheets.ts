// ---------------------------------------------------------------------------
// インメモリデータストア
// Vercelサーバーレス環境でも動作する。コールドスタート時にデモデータで初期化。
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// ヘッダー行定義（各シートの1行目）
// ---------------------------------------------------------------------------
const HEADERS: Record<string, string[]> = {
  スタッフ一覧: [
    "id", "name", "role", "pinHash", "displayOrder",
    "isActive", "weeklyMaxHours", "createdAt", "updatedAt",
  ],
  シフトパターン: [
    "id", "name", "shortName", "startTime", "endTime",
    "breakMinutes", "color", "displayOrder", "isActive", "createdAt",
  ],
  シフト希望: [
    "id", "staffId", "date", "patternId", "customStartTime", "customEndTime",
    "availability", "note", "submittedAt", "updatedAt",
  ],
  確定シフト: [
    "id", "staffId", "date", "patternId", "customStartTime", "customEndTime",
    "status", "adminNote", "confirmedBy", "confirmedAt", "updatedAt",
  ],
  店舗設定: ["key", "value", "description", "updatedAt"],
};

// ---------------------------------------------------------------------------
// デモデータ生成
// ---------------------------------------------------------------------------
const bcryptHash0000 =
  "$2b$10$QASBeLDvOr/D9K1icny8KODnTBHX35sf6eqBOdPDYhUe33Thxsyo6";

const STAFF_IDS = {
  admin: "staff_admin_001",
  tanaka: "staff_sample_001",
  sato: "staff_sample_002",
  suzuki: "staff_sample_003",
  yamada: "staff_sample_004",
};

const PATTERN_IDS = {
  early: "pat_early",
  late: "pat_late",
  full: "pat_full",
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function generateDemoShifts(): string[][] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const ts = now.toISOString();

  const staffIds = [STAFF_IDS.admin, STAFF_IDS.tanaka, STAFF_IDS.sato, STAFF_IDS.suzuki, STAFF_IDS.yamada];
  const patternIds = [PATTERN_IDS.early, PATTERN_IDS.late, PATTERN_IDS.full];
  const rows: string[][] = [];

  // 当月分の確定シフトを生成
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let counter = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${pad2(month + 1)}-${pad2(day)}`;
    const dow = new Date(year, month, day).getDay();

    for (const staffId of staffIds) {
      // 日曜は全員休み
      if (dow === 0) continue;

      // 各スタッフに曜日に応じたパターンを割り当て
      let patternId: string | null = null;

      if (staffId === STAFF_IDS.admin) {
        // 管理者: 平日は通し、土曜は早番
        if (dow >= 1 && dow <= 5) patternId = PATTERN_IDS.full;
        else if (dow === 6) patternId = PATTERN_IDS.early;
      } else if (staffId === STAFF_IDS.tanaka) {
        // 田中: 月水金は早番、火木は遅番、土曜休み
        if ([1, 3, 5].includes(dow)) patternId = PATTERN_IDS.early;
        else if ([2, 4].includes(dow)) patternId = PATTERN_IDS.late;
      } else if (staffId === STAFF_IDS.sato) {
        // 佐藤: 火木土は早番、月水金は遅番
        if ([2, 4, 6].includes(dow)) patternId = PATTERN_IDS.early;
        else if ([1, 3, 5].includes(dow)) patternId = PATTERN_IDS.late;
      } else if (staffId === STAFF_IDS.suzuki) {
        // 鈴木: 月火水は早番、木金は通し、土曜休み
        if ([1, 2, 3].includes(dow)) patternId = PATTERN_IDS.early;
        else if ([4, 5].includes(dow)) patternId = PATTERN_IDS.full;
      } else if (staffId === STAFF_IDS.yamada) {
        // 山田: 水木金土は遅番
        if ([3, 4, 5, 6].includes(dow)) patternId = PATTERN_IDS.late;
      }

      if (patternId) {
        counter++;
        rows.push([
          `conf_${counter}`,
          staffId,
          dateStr,
          patternId,
          "", // customStartTime
          "", // customEndTime
          "published",
          "",
          STAFF_IDS.admin,
          ts,
          ts,
        ]);
      }
    }
  }

  return rows;
}

function generateDemoRequests(): string[][] {
  const now = new Date();
  // 来月分の希望
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const year = nextMonth.getFullYear();
  const month = nextMonth.getMonth();
  const ts = now.toISOString();

  const rows: string[][] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let counter = 0;

  // 田中太郎の来月シフト希望
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${pad2(month + 1)}-${pad2(day)}`;
    const dow = new Date(year, month, day).getDay();

    if (dow === 0) {
      counter++;
      rows.push([
        `req_${counter}`, STAFF_IDS.tanaka, dateStr, "", "", "",
        "unavailable", "日曜は休みたいです", ts, ts,
      ]);
    } else if ([1, 3, 5].includes(dow)) {
      counter++;
      rows.push([
        `req_${counter}`, STAFF_IDS.tanaka, dateStr, PATTERN_IDS.early, "", "",
        "preferred", "", ts, ts,
      ]);
    } else if ([2, 4].includes(dow)) {
      counter++;
      rows.push([
        `req_${counter}`, STAFF_IDS.tanaka, dateStr, PATTERN_IDS.late, "", "",
        "available", "", ts, ts,
      ]);
    }
  }

  // 佐藤花子の来月シフト希望
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${pad2(month + 1)}-${pad2(day)}`;
    const dow = new Date(year, month, day).getDay();

    if (dow === 0 || dow === 6) {
      counter++;
      rows.push([
        `req_${counter}`, STAFF_IDS.sato, dateStr, "", "", "",
        "unavailable", "週末は予定があります", ts, ts,
      ]);
    } else {
      counter++;
      rows.push([
        `req_${counter}`, STAFF_IDS.sato, dateStr, PATTERN_IDS.early, "", "",
        "preferred", "", ts, ts,
      ]);
    }
  }

  return rows;
}

function buildInitialData(): Record<string, string[][]> {
  const ts = new Date().toISOString();

  return {
    スタッフ一覧: [
      [STAFF_IDS.admin, "管理者", "admin", bcryptHash0000, "1", "TRUE", "", ts, ts],
      [STAFF_IDS.tanaka, "田中太郎", "staff", bcryptHash0000, "2", "TRUE", "40", ts, ts],
      [STAFF_IDS.sato, "佐藤花子", "staff", bcryptHash0000, "3", "TRUE", "30", ts, ts],
      [STAFF_IDS.suzuki, "鈴木一郎", "staff", bcryptHash0000, "4", "TRUE", "40", ts, ts],
      [STAFF_IDS.yamada, "山田美咲", "staff", bcryptHash0000, "5", "TRUE", "24", ts, ts],
    ],
    シフトパターン: [
      [PATTERN_IDS.early, "早番", "早", "09:00", "15:00", "60", "#FF9500", "1", "TRUE", ts],
      [PATTERN_IDS.late, "遅番", "遅", "15:00", "22:00", "60", "#007AFF", "2", "TRUE", ts],
      [PATTERN_IDS.full, "通し", "通", "09:00", "22:00", "120", "#34C759", "3", "TRUE", ts],
    ],
    シフト希望: generateDemoRequests(),
    確定シフト: generateDemoShifts(),
    店舗設定: [
      ["store_name", "カフェ サンプル", "店舗名", ts],
      ["request_deadline_day", "20", "シフト希望提出期限日", ts],
      ["target_month_offset", "1", "対象月オフセット", ts],
      ["business_start_time", "09:00", "営業開始時刻", ts],
      ["business_end_time", "22:00", "営業終了時刻", ts],
      ["min_staff_per_slot", "2", "最小スタッフ数", ts],
      ["max_staff_per_slot", "5", "最大スタッフ数", ts],
      ["allowed_start_times", "09:00,09:30,10:00,10:30,11:00", "選択可能な出勤時刻", ts],
      ["allowed_end_times", "15:00,16:00,17:00,18:00,19:00,20:00,21:00,22:00", "選択可能な退勤時刻", ts],
    ],
  };
}

// ---------------------------------------------------------------------------
// インメモリストア（グローバル変数でホットリロード対応）
// ---------------------------------------------------------------------------

const globalStore = globalThis as unknown as {
  __shiftStore?: Map<string, string[][]>;
};

function getStore(): Map<string, string[][]> {
  if (!globalStore.__shiftStore) {
    globalStore.__shiftStore = new Map();
  }
  return globalStore.__shiftStore;
}

function readData(sheetName: string): string[][] {
  const store = getStore();

  if (!store.has(sheetName)) {
    const header = HEADERS[sheetName] || [];
    const initialData = buildInitialData();
    const initial = initialData[sheetName] || [];
    const data = [header, ...initial];
    store.set(sheetName, data);
    return data;
  }

  return store.get(sheetName)!;
}

function writeData(sheetName: string, data: string[][]): void {
  const store = getStore();
  store.set(sheetName, data);
}

// ---------------------------------------------------------------------------
// 公開API
// ---------------------------------------------------------------------------

export async function getSheetData(sheetName: string): Promise<string[][]> {
  // deep copy して返す（呼び出し側の変更がストアに影響しないように）
  return readData(sheetName).map((row) => [...row]);
}

export async function appendRow(
  sheetName: string,
  values: string[],
): Promise<void> {
  const data = readData(sheetName);
  data.push([...values]);
  writeData(sheetName, data);
}

export async function updateRow(
  sheetName: string,
  rowIndex: number,
  values: string[],
): Promise<void> {
  const data = readData(sheetName);
  const actualIndex = rowIndex + 1;

  if (actualIndex >= data.length) {
    throw new Error(
      `Row index ${rowIndex} out of bounds (${data.length - 1} data rows)`,
    );
  }

  data[actualIndex] = [...values];
  writeData(sheetName, data);
}

export async function deleteRow(
  sheetName: string,
  rowIndex: number,
): Promise<void> {
  const data = readData(sheetName);
  const actualIndex = rowIndex + 1;

  if (actualIndex >= data.length) {
    throw new Error(
      `Row index ${rowIndex} out of bounds (${data.length - 1} data rows)`,
    );
  }

  data.splice(actualIndex, 1);
  writeData(sheetName, data);
}

export async function findRowIndex(
  sheetName: string,
  columnIndex: number,
  value: string,
): Promise<number | null> {
  const data = readData(sheetName);

  for (let i = 1; i < data.length; i++) {
    if (data[i]?.[columnIndex] === value) {
      return i - 1;
    }
  }

  return null;
}

export async function batchUpdateRows(
  sheetName: string,
  updates: { rowIndex: number; values: string[] }[],
): Promise<void> {
  if (updates.length === 0) return;

  const data = readData(sheetName);

  for (const { rowIndex, values } of updates) {
    const actualIndex = rowIndex + 1;
    if (actualIndex < data.length) {
      data[actualIndex] = [...values];
    }
  }

  writeData(sheetName, data);
}
