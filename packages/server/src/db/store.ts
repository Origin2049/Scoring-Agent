import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';

const DATA_DIR = path.resolve(process.cwd(), 'data', 'db');
const TABLES = ['agents', 'rubric_configs', 'test_definitions', 'scoring_runs', 'test_results'] as const;

type TableName = (typeof TABLES)[number];

// Ensure data directory and table files exist
function ensureDb(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  for (const table of TABLES) {
    const filePath = tablePath(table);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]', 'utf-8');
    }
  }
}

function tablePath(table: TableName): string {
  return path.join(DATA_DIR, `${table}.json`);
}

function readTable<T>(table: TableName): T[] {
  ensureDb();
  const raw = fs.readFileSync(tablePath(table), 'utf-8');
  return JSON.parse(raw) as T[];
}

function writeTable<T>(table: TableName, data: T[]): void {
  ensureDb();
  fs.writeFileSync(tablePath(table), JSON.stringify(data, null, 2), 'utf-8');
}

// Generic CRUD operations
export function findAll<T extends { id?: number }>(table: TableName): T[] {
  return readTable<T>(table);
}

export function findById<T extends { id?: number }>(table: TableName, id: number): T | undefined {
  return readTable<T>(table).find((row) => row.id === id);
}

export function findWhere<T extends { id?: number }>(
  table: TableName,
  predicate: (row: T) => boolean,
): T[] {
  return readTable<T>(table).filter(predicate);
}

export function findOne<T extends { id?: number }>(
  table: TableName,
  predicate: (row: T) => boolean,
): T | undefined {
  return readTable<T>(table).find(predicate);
}

export function insert<T extends { id?: number }>(table: TableName, data: Omit<T, 'id'>): T {
  const rows = readTable<T>(table);
  const maxId = rows.reduce((max, r) => Math.max(max, r.id ?? 0), 0);
  const newRow = { ...data, id: maxId + 1 } as T;
  rows.push(newRow);
  writeTable(table, rows);
  return newRow;
}

export function insertMany<T extends { id?: number }>(table: TableName, dataArray: Omit<T, 'id'>[]): T[] {
  const rows = readTable<T>(table);
  let maxId = rows.reduce((max, r) => Math.max(max, r.id ?? 0), 0);
  const newRows: T[] = [];
  for (const data of dataArray) {
    maxId++;
    newRows.push({ ...data, id: maxId } as T);
  }
  rows.push(...newRows);
  writeTable(table, rows);
  return newRows;
}

export function update<T extends { id?: number }>(
  table: TableName,
  id: number,
  data: Partial<T>,
): T | undefined {
  const rows = readTable<T>(table);
  const index = rows.findIndex((r) => r.id === id);
  if (index === -1) return undefined;
  rows[index] = { ...rows[index], ...data, id } as T;
  writeTable(table, rows);
  return rows[index];
}

export function remove(table: TableName, id: number): boolean {
  const rows = readTable(table);
  const index = rows.findIndex((r) => (r as { id?: number }).id === id);
  if (index === -1) return false;
  rows.splice(index, 1);
  writeTable(table, rows);
  return true;
}

export function count(table: TableName): number {
  return readTable(table).length;
}

export function countWhere<T extends { id?: number }>(
  table: TableName,
  predicate: (row: T) => boolean,
): number {
  return readTable<T>(table).filter(predicate).length;
}

// Initialize on import
ensureDb();
