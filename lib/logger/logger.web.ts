import fs from 'fs';
import path from 'path';
import type { LogEntry, LogCategory, LoggerOptions } from './logger.types';

const SEPARATOR = '─'.repeat(52);

export function formatEntry(entry: LogEntry): string {
  // Formato del header: DD/MM/YYYY HH:MM AM/PM | CATEGORY | MESSAGE
  const date = new Date(entry.timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
  const displayHours = date.getHours() % 12 || 12;

  const headerTime = `${day}/${month}/${year} ${String(displayHours).padStart(2, '0')}:${minutes} ${ampm}`;
  const header = `${headerTime} | ${entry.category} | ${entry.message}`;

  const lines: string[] = [header];

  if (entry.endpoint) lines.push(`  URL         : ${entry.endpoint}`);
  if (entry.isEditing !== undefined) lines.push(`  isEditing   : ${entry.isEditing}`);
  if (entry.documentId !== undefined) lines.push(`  documentId  : ${entry.documentId}`);
  lines.push(`  date        : ${entry.timestamp}`);
  if (entry.userId) lines.push(`  userId      : ${entry.userId}`);
  if (entry.pageUrl) lines.push(`  pageUrl     : ${entry.pageUrl}`);

  if (entry.payload !== undefined) {
    const payloadStr = JSON.stringify(entry.payload, null, 2);
    const payloadLines = payloadStr.split('\n').map(l => '    ' + l);
    lines.push(`  payload:`);
    lines.push(payloadLines.join('\n'));
  }

  if (entry.responseBody !== undefined) {
    const responseStr = JSON.stringify(entry.responseBody, null, 2);
    const responseLines = responseStr.split('\n').map(l => '    ' + l);
    lines.push(`  response:`);
    lines.push(responseLines.join('\n'));
  }

  if (entry.errorCode !== undefined) lines.push(`  errorCode   : ${entry.errorCode}`);
  if (entry.stackTrace) lines.push(`  stackTrace  :\n${entry.stackTrace}`);

  lines.push(SEPARATOR);

  return lines.join('\n') + '\n';
}

export function ensureDirectory(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

export function getLogFilePath(category: LogCategory, timestamp: string): string {
  const date = timestamp.slice(0, 10); // YYYY-MM-DD
  const dir = path.join(process.cwd(), 'logs', category.toLowerCase());
  ensureDirectory(dir);
  return path.join(dir, `${date}.txt`);
}

export function writeLog(entry: LogEntry, options?: LoggerOptions): void {
  const filePath = getLogFilePath(entry.category, entry.timestamp);
  const text = formatEntry(entry);
  fs.appendFileSync(filePath, text, 'utf8');

  if (options?.printToConsole) {
    console.log(text);
  }
}

export class ISyncWebLogger {
  private options: LoggerOptions;

  constructor(options: LoggerOptions = {}) {
    this.options = options;
  }

  setUser(userId: string): void {
    this.options.userId = userId;
  }

  private buildEntry(partial: Omit<LogEntry, 'timestamp'>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      userId: this.options.userId,
      ...partial,
    };
  }

  logQuotation({ endpoint, payload, message = 'Oferta procesada', documentId, isEditing }: {
    endpoint: string;
    payload?: unknown;
    message?: string;
    documentId?: string;
    isEditing?: boolean;
  }): void {
    const entry = this.buildEntry({ level: 'INFO', category: 'PEDIDO', endpoint, payload, message, documentId, isEditing });
    writeLog(entry, this.options);
  }

  logQuotationError({ endpoint, payload, errorCode, message, responseBody, stackTrace, documentId, isEditing }: {
    endpoint: string;
    payload?: unknown;
    errorCode: number | string;
    message: string;
    responseBody?: unknown;
    stackTrace?: string;
    documentId?: string;
    isEditing?: boolean;
  }): void {
    const entry = this.buildEntry({
      level: 'ERROR', category: 'PEDIDO',
      endpoint, payload, errorCode, message, responseBody, stackTrace, documentId, isEditing,
    });
    writeLog(entry, this.options);
  }

  logGetError({ endpoint, category = 'GENERAL', errorCode, message, responseBody, stackTrace }: {
    endpoint: string;
    category?: import('./logger.types').LogCategory;
    errorCode: number | string;
    message: string;
    responseBody?: unknown;
    stackTrace?: string;
  }): void {
    const entry = this.buildEntry({
      level: 'ERROR', category,
      endpoint, errorCode, message, responseBody, stackTrace,
    });
    writeLog(entry, this.options);
  }

  logPostError({ endpoint, category = 'PEDIDO', payload, errorCode, message, responseBody, stackTrace }: {
    endpoint: string;
    category?: import('./logger.types').LogCategory;
    payload?: unknown;
    errorCode: number | string;
    message: string;
    responseBody?: unknown;
    stackTrace?: string;
  }): void {
    const entry = this.buildEntry({
      level: 'ERROR', category,
      endpoint, payload, errorCode, message, responseBody, stackTrace,
    });
    writeLog(entry, this.options);
  }

  log(partial: Omit<LogEntry, 'timestamp'>): void {
    const entry = this.buildEntry(partial);
    writeLog(entry, this.options);
  }

  listLogs(category?: LogCategory): string[] {
    const baseDir = path.join(process.cwd(), 'logs');
    if (category) {
      const dir = path.join(baseDir, category.toLowerCase());
      if (!fs.existsSync(dir)) return [];
      return fs.readdirSync(dir).map((f) => path.join(dir, f));
    }

    if (!fs.existsSync(baseDir)) return [];
    const categories = fs.readdirSync(baseDir);
    return categories.flatMap((cat) => {
      const dir = path.join(baseDir, cat);
      return fs.readdirSync(dir).map((f) => path.join(dir, f));
    });
  }

  readLog(filePath: string): string {
    return fs.readFileSync(filePath, 'utf8');
  }

  cleanOldLogs(olderThanDays = 30): void {
    const files = this.listLogs();
    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

    for (const filePath of files) {
      const name = path.basename(filePath, '.txt'); // YYYY-MM-DD
      const fileDate = new Date(name).getTime();
      if (!isNaN(fileDate) && fileDate < cutoff) {
        fs.unlinkSync(filePath);
      }
    }
  }
}

export const webLogger = new ISyncWebLogger({
  printToConsole: process.env.NODE_ENV === 'development',
});
