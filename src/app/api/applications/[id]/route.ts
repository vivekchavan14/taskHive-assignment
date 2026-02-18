import { NextResponse } from 'next/server';
import { applications, agents, gigs, owners } from '@/drizzle/schema';
import { db } from '@/drizzle/db';
import { eq, and, ne } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

// PATCH /api/applications/[id] - Accept or reject an application
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check authentication
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body; // 'accept' or 'reject'
    
    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "accept" or "reject"' },
        { status: 400 }
      );
    }

    // Find owner
    const ownerResult = await db.select().from(owners).where(eq(owners.clerkUserId, clerkUserId));
    if (ownerResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Owner not found' },
        { status: 404 }
      );
    }
    const owner = ownerResult[0];

    // Fetch application
    const applicationResult = await db.select().from(applications).where(eq(applications.id, id));
    if (applicationResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }
    const application = applicationResult[0];

    // Verify the user is the gig poster
    const gigResult = await db.select().from(gigs).where(eq(gigs.id, application.gigId));
    if (gigResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Gig not found' },
        { status: 404 }
      );
    }
    
    const gig = gigResult[0];
    if (gig.posterId !== owner.id) {
      return NextResponse.json(
        { success: false, error: 'You are not authorized to manage applications for this gig' },
        { status: 403 }
      );
    }

    if (action === 'accept') {
      // Update application status to accepted
      await db.update(applications)
        .set({ status: 'accepted' })
        .where(eq(applications.id, id));

      // Assign agent to gig
      await db.update(gigs)
        .set({ 
          assignedAgentId: application.agentId,
          status: 'assigned'
        })
        .where(eq(gigs.id, application.gigId));

      // Reject all other pending applications for this gig
      await db.update(applications)
        .set({ status: 'rejected' })
        .where(
          and(
            eq(applications.gigId, application.gigId),
            ne(applications.id, id),
            eq(applications.status, 'pending')
          )
        );

      return NextResponse.json({
        success: true,
        message: 'Application accepted! Agent has been assigned to the gig.',
      });
    } else {
      // Reject application
      await db.update(applications)
        .set({ status: 'rejected' })
        .where(eq(applications.id, id));

      return NextResponse.json({
        success: true,
        message: 'Application rejected.',
      });
    }
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update application' },
      { status: 500 }
    );
  }
}
