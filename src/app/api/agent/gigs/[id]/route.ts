import { NextResponse } from 'next/server';
import { db, gigs } from '@/drizzle/db';
import { eq } from 'drizzle-orm';
import { 
  authenticateAgent, 
  rateLimitResponse, 
  validationErrorResponse,
  parseBodyWithLimit,
  getClientIP, 
  rateLimit 
} from '@/lib/security';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateAgent(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: auth.error || 'Authentication required' },
      { status: 401 }
    );
  }

  const ip = getClientIP(request);
  const limit = rateLimit(auth.agent!.id, 'PATCH:/api/agent/gigs');
  if (!limit.allowed) {
    return rateLimitResponse(limit.resetIn);
  }

  const parsed = await parseBodyWithLimit(request, 50 * 1024);
  if (!parsed.ok) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const gigId = params.id;
    const body = parsed.body as Record<string, unknown>;
    const action = body.action as string;

    const gigResult = await db.select().from(gigs).where(eq(gigs.id, gigId));
    
    if (gigResult.length === 0) {
      return validationErrorResponse('Gig not found');
    }

    const gig = gigResult[0];

    if (gig.assignedAgentId !== auth.agent!.id) {
      return NextResponse.json(
        { success: false, error: 'You are not assigned to this gig' },
        { status: 403 }
      );
    }

    if (action === 'start') {
      if (gig.status !== 'assigned') {
        return validationErrorResponse('Gig must be in assigned status to start');
      }

      await db.update(gigs)
        .set({ 
          status: 'in-progress', 
          startedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(gigs.id, gigId));

      return NextResponse.json({
        success: true,
        message: 'Gig started successfully',
      });

    } else if (action === 'update') {
      const logEntry = body.log as string;
      
      if (!logEntry) {
        return validationErrorResponse('Log entry is required');
      }

      const currentLogs = gig.executionLogs || '';
      const timestamp = new Date().toISOString();
      const newLogs = currentLogs + `\n[${timestamp}] ${logEntry}`;

      await db.update(gigs)
        .set({ 
          executionLogs: newLogs,
          updatedAt: new Date()
        })
        .where(eq(gigs.id, gigId));

      return NextResponse.json({
        success: true,
        message: 'Progress updated',
      });

    } else if (action === 'complete') {
      const deliverables = body.deliverables as string;

      if (!deliverables) {
        return validationErrorResponse('Deliverables are required');
      }

      if (gig.status !== 'in-progress' && gig.status !== 'assigned') {
        return validationErrorResponse('Gig must be in-progress or assigned to complete');
      }

      await db.update(gigs)
        .set({ 
          status: 'completed',
          completedAt: new Date(),
          deliverables,
          updatedAt: new Date()
        })
        .where(eq(gigs.id, gigId));

      return NextResponse.json({
        success: true,
        message: 'Gig completed successfully',
      });

    } else {
      return validationErrorResponse('Invalid action. Must be: start, update, or complete');
    }

  } catch (error) {
    console.error('Error updating gig:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update gig' },
      { status: 500 }
    );
  }
}
