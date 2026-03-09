import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// ローカル JSON ファイルベースのデータストア
// Google Sheets API と同じインターフェースを提供する
// ---------------------------------------------------------------------------

const DATA_DIR = path.join(process.cwd(), "data");

// シート名 → JSONファイル名のマッピング
const FILE_MAP: Record<string, string> = {
  スタッフ一覧: "staff.json",
  シフトパターン: "shift-patterns.json",
  シフト希望: "shift-requests.json",
  確定シフト: "confirmed-shifts.json",
  店舗設定: "store-settings.json",
};

// ---------------------------------------------------------------------------
// ヘッダー行定義（各シートの1行目）
// ---------------------------------------------------------------------------
const HEADERS: Record<string, string[]> = {
  スタッフ一覧: [
    "id",
    "name",
    "role",
    "pinHash",
    "displayOrder",
    "isActive",
    "weeklyMaxHours",
    "createdAt",
    "updatedAt",
  ],
  シフトパターン: [
    "id",
    "name",
    "shortName",
    "startTime",
    "endTime",
    "breakMinutes",
    "color",
    "displayOrder",
    "isActive",
    "createdAt",
  ],
  シフト希望: [
    "id",
    "staffId",
    "date",
    "patternId",
    "availability",
    "note",
    "submittedAt",
    "updatedAt",
  ],
  確定シフト: [
    "id",
    "staffId",
    "date",
    "patternId",
    "status",
    "adminNote",
    "confirmedBy",
    "confirmedAt",
    "updatedAt",
  ],
  店舗設定: ["key", "value", "description", "updatedAt"],
};

// ---------------------------------------------------------------------------
// 初期データ（スタッフ一覧のみ: 管理者 admin / PIN: 0000）
// ---------------------------------------------------------------------------
const bcryptHash0000 =
  "$2b$10$QASBeLDvOr/D9K1icny8KODnTBHX35sf6eqBOdPDYhUe33Thxsyo6";
// ↑ bcryptjs.hashSync("0000", 10) の結果

const INITIAL_DATA: Record<string, string[][]> = {
  スタッフ一覧: [
    [
      "staff_admin_001",
      "管理者",
      "admin",
      bcryptHash0000,
      "1",
      "TRUE",
      "",
      new Date().toISOString(),
      new Date().toISOString(),
    ],
    [
      "staff_sample_001",
      "田中太郎",
      "staff",
      bcryptHash0000,
      "2",
      "TRUE",
      "40",
      new Date().toISOString(),
      new Date().toISOString(),
    ],
    [
      "staff_sample_002",
      "佐藤花子",
      "staff",
      bcryptHash0000,
      "3",
      "TRUE",
      "30",
      new Date().toISOString(),
      new Date().toISOString(),
    ],
  ],
  シフトパターン: [
    [
      "pat_early",
      "早番",
      "早",
      "09:00",
      "15:00",
      "60",
      "#FF9500",
      "1",
      "TRUE",
      new Date().toISOString(),
    ],
    [
      "pat_late",
      "遅番",
      "遅",
      "15:00",
      "22:00",
      "60",
      "#007AFF",
      "2",
      "TRUE",
      new Date().toISOString(),
    ],
    [
      "pat_full",
      "通し",
      "通",
      "09:00",
      "22:00",
      "120",
      "#34C759",
      "3",
      "TRUE",
      new Date().toISOString(),
    ],
  ],
};

// ---------------------------------------------------------------------------
// ファイル操作ヘルパー
// ---------------------------------------------------------------------------

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getFilePath(sheetName: string): string {
  const fileName = FILE_MAP[sheetName];
  if (!fileName) {
    throw new Error(`Unknown sheet: ${sheetName}`);
  }
  return path.join(DATA_DIR, fileName);
}

function readData(sheetName: string): string[][] {
  ensureDataDir();
  const filePath = getFilePath(sheetName);

  if (!fs.existsSync(filePath)) {
    // 初回: ヘッダー + 初期データでファイル作成
    const header = HEADERS[sheetName] || [];
    const initial = INITIAL_DATA[sheetName] || [];
    const data = [header, ...initial];
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    return data;
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as string[][];
}

function writeData(sheetName: string, data: string[][]): void {
  ensureDataDir();
  const filePath = getFilePath(sheetName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// ---------------------------------------------------------------------------
// 公開API（Google Sheets API と同じインターフェース）
// ---------------------------------------------------------------------------

/**
 * 指定シートの全行を取得する（ヘッダー行含む）
 */
export async function getSheetData(sheetName: string): Promise<string[][]> {
  return readData(sheetName);
}

/**
 * 指定シートに行を追加する
 */
export async function appendRow(
  sheetName: string,
  values: string[],
): Promise<void> {
  const data = readData(sheetName);
  data.push(values);
  writeData(sheetName, data);
}

/**
 * 指定シートの行を更新する
 * @param rowIndex 0ベース（ヘッダー行を除いたデータ行のインデックス）
 */
export async function updateRow(
  sheetName: string,
  rowIndex: number,
  values: string[],
): Promise<void> {
  const data = readData(sheetName);
  const actualIndex = rowIndex + 1; // ヘッダー行分をスキップ

  if (actualIndex >= data.length) {
    throw new Error(
      `Row index ${rowIndex} out of bounds (${data.length - 1} data rows)`,
    );
  }

  data[actualIndex] = values;
  writeData(sheetName, data);
}

/**
 * 指定シートの行を削除する
 * @param rowIndex 0ベース（ヘッダー行を除いたデータ行のインデックス）
 */
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

/**
 * 指定シートの特定列で値を検索し、最初に一致した行のインデックスを返す
 * @returns 0ベース（ヘッダー除く）、見つからなければ null
 */
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

/**
 * 複数行を一括更新する
 * @param updates 各要素の rowIndex は 0ベース（ヘッダー除く）
 */
export async function batchUpdateRows(
  sheetName: string,
  updates: { rowIndex: number; values: string[] }[],
): Promise<void> {
  if (updates.length === 0) return;

  const data = readData(sheetName);

  for (const { rowIndex, values } of updates) {
    const actualIndex = rowIndex + 1;
    if (actualIndex < data.length) {
      data[actualIndex] = values;
    }
  }

  writeData(sheetName, data);
}
