import os from 'os';
import { prisma } from '../../config/database';
import { supabaseAdmin } from '../../config/supabase';
import { env } from '../../config/env';

const START_TIME = Date.now();

type ServiceStatus = 'operational' | 'degraded' | 'down';

interface ServiceCheck {
  status: ServiceStatus;
  latencyMs: number | null;
  detail?: string;
}

interface HealthReport {
  status: ServiceStatus;
  timestamp: string;
  uptimeSeconds: number;
  version: string;
  environment: string;
  services: {
    database: ServiceCheck;
    storage: ServiceCheck;
  };
  system: {
    nodeVersion: string;
    platform: string;
    arch: string;
    memoryUsedMb: number;
    memoryTotalMb: number;
    memoryUsedPercent: number;
    loadAvg: number[];
  };
}

async function checkDatabase(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'operational', latencyMs: Date.now() - start };
  } catch (err) {
    return {
      status: 'down',
      latencyMs: null,
      detail: env.NODE_ENV === 'production' ? 'Connection failed' : String(err),
    };
  }
}

async function checkStorage(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const { error } = await supabaseAdmin.storage.getBucket(env.SUPABASE_STORAGE_BUCKET);
    if (error) {
      return { status: 'degraded', latencyMs: Date.now() - start, detail: error.message };
    }
    return { status: 'operational', latencyMs: Date.now() - start };
  } catch (err) {
    return {
      status: 'down',
      latencyMs: null,
      detail: env.NODE_ENV === 'production' ? 'Connection failed' : String(err),
    };
  }
}

function deriveOverallStatus(checks: ServiceCheck[]): ServiceStatus {
  if (checks.some(c => c.status === 'down')) return 'down';
  if (checks.some(c => c.status === 'degraded')) return 'degraded';
  return 'operational';
}

export async function getHealthReport(): Promise<HealthReport> {
  const [database, storage] = await Promise.all([checkDatabase(), checkStorage()]);

  const memUsed = process.memoryUsage().heapUsed;
  const memTotal = os.totalmem();

  return {
    status: deriveOverallStatus([database, storage]),
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - START_TIME) / 1000),
    version: process.env.npm_package_version ?? '1.0.0',
    environment: env.NODE_ENV,
    services: { database, storage },
    system: {
      nodeVersion: process.version,
      platform: os.platform(),
      arch: os.arch(),
      memoryUsedMb: Math.round(memUsed / 1024 / 1024),
      memoryTotalMb: Math.round(memTotal / 1024 / 1024),
      memoryUsedPercent: Math.round((memUsed / memTotal) * 100),
      loadAvg: os.loadavg().map(v => Math.round(v * 100) / 100),
    },
  };
}

// Ringkasan minimal untuk response publik (tidak expose internal detail)
export async function getPublicHealthSummary() {
  const [database, storage] = await Promise.all([checkDatabase(), checkStorage()]);
  const overall = deriveOverallStatus([database, storage]);

  const STATUS_LABEL: Record<ServiceStatus, string> = {
    operational: 'Beroperasi Normal',
    degraded: 'Gangguan Sebagian',
    down: 'Tidak Tersedia',
  };

  return {
    status: overall,
    statusLabel: STATUS_LABEL[overall],
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - START_TIME) / 1000),
    services: {
      database: {
        name: 'Database',
        status: database.status,
        statusLabel: STATUS_LABEL[database.status],
        latencyMs: database.latencyMs,
      },
      storage: {
        name: 'File Storage',
        status: storage.status,
        statusLabel: STATUS_LABEL[storage.status],
        latencyMs: storage.latencyMs,
      },
    },
  };
}
