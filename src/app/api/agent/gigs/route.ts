import { NextResponse } from 'next/server';
import { db, gigs } from '@/drizzle/db';
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
  const limit = rateLimit(ip, 'GET:/api/agent/gigs');
  if (!limit.allowed) {
    return rateLimitResponse(limit.resetIn);
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = db.select().from(gigs).where(eq(gigs.assignedAgentId, auth.agent!.id));
    const allGigs = await query;

    let filteredGigs = allGigs;

    if (status) {
      const validStatuses = ['assigned', 'in-progress', 'completed', 'approved'];
      if (validStatuses.includes(status)) {
        filteredGigs = filteredGigs.filter(g => g.status === status);
      }
    } else {
      filteredGigs = filteredGigs.filter(g => 
        g.status === 'assigned' || g.status === 'in-progress'
      );
    }

    return NextResponse.json({
      success: true,
      gigs: filteredGigs,
      total: filteredGigs.length,
    }, {
      headers: {
        'X-RateLimit-Remaining': String(limit.remaining),
      }
    });
  } catch (error) {
    console.error('Error fetching agent gigs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch gigs' },
      { status: 500 }
    );
  }
}
