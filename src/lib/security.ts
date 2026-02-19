import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db, agents } from '@/drizzle/db';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const RATE_LIMIT_CONFIGS: Record<string, { max: number; windowMs: number }> = {
  'GET:/api/agents': { max: 100, windowMs: 60000 },
  'POST:/api/agents': { max: 5, windowMs: 3600000 },
  'GET:/api/gigs': { max: 100, windowMs: 60000 },
  'POST:/api/gigs': { max: 10, windowMs: 3600000 },
  'POST:/api/applications': { max: 20, windowMs: 3600000 },
  'GET:/api/agent/gigs': { max: 100, windowMs: 60000 },
  'PATCH:/api/agent/gigs': { max: 50, windowMs: 60000 },
};

export function rateLimit(
  identifier: string,
  endpoint: string
): { allowed: boolean; remaining: number; resetIn: number } {
  const config = RATE_LIMIT_CONFIGS[endpoint] || { max: 100, windowMs: 60000 };
  const key = `${identifier}:${endpoint}`;
  const now = Date.now();

  let entry = rateLimitMap.get(key);

  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + config.windowMs };
    rateLimitMap.set(key, entry);
  }

  entry.count++;

  return {
    allowed: entry.count <= config.max,
    remaining: Math.max(0, config.max - entry.count),
    resetIn: Math.ceil((entry.resetAt - now) / 1000),
  };
}

export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') return '';
  return input
    .slice(0, maxLength)
    .replace(/[<>]/g, '')
    .trim();
}

export function validateSkills(skills: unknown): string[] {
  if (!Array.isArray(skills)) return [];
  const validSkills = [
    'coding', 'research', 'automation', 'writing', 'data-analysis',
    'web-scraping', 'api-integration', 'testing', 'documentation',
    'design', 'social-media', 'email', 'calendar', 'file-management',
    'devops', 'video-editing', 'translation', 'data-entry'
  ];
  return skills
    .filter(s => typeof s === 'string' && validSkills.includes(s))
    .slice(0, 10);
}

export async function authenticateAgent(request: Request): Promise<{
  authenticated: boolean;
  agent?: { id: string; slug: string; name: string };
  error?: string;
}> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false, error: 'Missing or invalid Authorization header' };
  }

  const apiKey = authHeader.slice(7);

  if (!apiKey.startsWith('thv_')) {
    return { authenticated: false, error: 'Invalid API key format' };
  }

  const allAgents = await db.select().from(agents);

  for (const agent of allAgents) {
    if (agent.apiKeyHash) {
      const matches = await bcrypt.compare(apiKey, agent.apiKeyHash);
      if (matches) {
        return {
          authenticated: true,
          agent: { id: agent.id, slug: agent.slug, name: agent.name },
        };
      }
    }
  }

  return { authenticated: false, error: 'Invalid API key' };
}

export function rateLimitResponse(resetIn: number) {
  return NextResponse.json(
    {
      success: false,
      error: 'Rate limit exceeded',
      retryAfter: resetIn,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(resetIn),
        'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + resetIn),
      }
    }
  );
}

export function authRequiredResponse(error: string = 'Authentication required') {
  return NextResponse.json(
    { success: false, error },
    { status: 401 }
  );
}

export function validationErrorResponse(error: string) {
  return NextResponse.json(
    { success: false, error },
    { status: 400 }
  );
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return 'unknown';
}

export async function parseBodyWithLimit(
  request: Request,
  maxSize: number = 10 * 1024
): Promise<{ ok: true; body: unknown } | { ok: false; error: string }> {
  const contentLength = request.headers.get('content-length');

  if (contentLength && parseInt(contentLength) > maxSize) {
    return { ok: false, error: `Request body too large (max ${maxSize} bytes)` };
  }

  try {
    const text = await request.text();
    if (text.length > maxSize) {
      return { ok: false, error: `Request body too large (max ${maxSize} bytes)` };
    }
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return { ok: false, error: 'Invalid JSON body' };
  }
}
