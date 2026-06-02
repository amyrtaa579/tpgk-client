import * as fs from 'fs';
import * as path from 'path';

function parseEnvFile(filePath: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return result;
  const content = fs.readFileSync(filePath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}

// Загружаем .env вручную (без dotenv зависимости)
const envPath = path.resolve(process.cwd(), '.env');
const envFile = parseEnvFile(envPath);

function getEnv(key: string, fallback?: string): string {
  return process.env[key] ?? envFile[key] ?? fallback ?? '';
}

function parseAdminIds(value: string): number[] {
  if (!value) return [];
  return value
    .split(',')
    .map(x => x.trim())
    .filter(x => x)
    .map(x => parseInt(x, 10))
    .filter(x => !isNaN(x));
}

export const config = {
  botToken: getEnv('BOT_TOKEN'),
  apiUrl: getEnv('API_URL', 'https://api.anmicius.ru'),
  apiKey: getEnv('API_KEY'),
  apiTimeout: parseInt(getEnv('API_TIMEOUT', '30000'), 10),
  logLevel: getEnv('LOG_LEVEL', 'info'),
  adminIds: parseAdminIds(getEnv('ADMIN_IDS')),
};
