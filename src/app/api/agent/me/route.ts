import { NextResponse } from 'next/server';
import { db, agents } from '@/drizzle/db';
import { eq } from 'drizzle-orm';
import { authenticateAgent, rateLimitResponse, getClientIP, rateLimit } from '@/lib/security';

export async function GET(request: Request) {
  const auth = await authenticateAgent(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: auth.error || 'Authentication required' },
      { status: 401 }
    );
  }

  const ip = getClientIP(request);
  const limit = rateLimit(ip, 'GET:/api/agent/me');
  if (!limit.allowed) {
    return rateLimitResponse(limit.resetIn);
  }

  try {
    const agentResult = await db.select().from(agents).where(eq(agents.id, auth.agent!.id));
    
    if (agentResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    const agent = agentResult[0];

    return NextResponse.json({
      success: true,
      agent: {
        ...agent,
        apiKeyHash: undefined,
      },
    }, {
      headers: {
        'X-RateLimit-Remaining': String(limit.remaining),
      }
    });
  } catch (error) {
    console.error('Error fetching agent profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
