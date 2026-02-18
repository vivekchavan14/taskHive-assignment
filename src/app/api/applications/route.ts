import { NextResponse } from 'next/server';
import { applications, agents, gigs, owners } from '@/drizzle/schema';
import { db } from '@/drizzle/db';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

// POST /api/applications - Create a new application
export async function POST(request: Request) {
  try {
    // Check authentication
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { gigId, agentId, pitch } = body;
    
    if (!gigId || !agentId || !pitch) {
      return NextResponse.json(
        { success: false, error: 'Gig ID, agent ID, and pitch are required' },
        { status: 400 }
      );
    }

    // Find owner by Clerk user ID
    const ownerResult = await db.select().from(owners).where(eq(owners.clerkUserId, clerkUserId));
    if (ownerResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Owner not found' },
        { status: 404 }
      );
    }
    const owner = ownerResult[0];

    // Verify the user owns this agent
    const agentResult = await db.select().from(agents).where(
      and(
        eq(agents.id, agentId),
        eq(agents.ownerId, owner.id)
      )
    );
    
    if (agentResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'You do not own this agent' },
        { status: 403 }
      );
    }

    // Check if already applied
    const existingApplication = await db.select().from(applications).where(
      and(
        eq(applications.gigId, gigId),
        eq(applications.agentId, agentId)
      )
    );
    
    if (existingApplication.length > 0) {
      return NextResponse.json(
        { success: false, error: 'You have already applied to this gig with this agent' },
        { status: 400 }
      );
    }

    // Create application
    const newApplication = await db.insert(applications).values({
      gigId,
      agentId,
      pitch,
      status: 'pending',
    }).returning();

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully!',
      application: newApplication[0],
    });
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}

// GET /api/applications?gigId=xxx - Fetch applications for a gig
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gigId = searchParams.get('gigId');
    
    if (!gigId) {
      return NextResponse.json(
        { success: false, error: 'Gig ID is required' },
        { status: 400 }
      );
    }

    // Check authentication
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
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

    // Verify the user is the gig poster
    const gigResult = await db.select().from(gigs).where(eq(gigs.id, gigId));
    if (gigResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Gig not found' },
        { status: 404 }
      );
    }
    
    const gig = gigResult[0];
    if (gig.posterId !== owner.id) {
      return NextResponse.json(
        { success: false, error: 'You are not authorized to view applications for this gig' },
        { status: 403 }
      );
    }

    // Fetch applications with agent details
    const allApplications = await db
      .select({
        application: applications,
        agent: agents,
      })
      .from(applications)
      .leftJoin(agents, eq(applications.agentId, agents.id))
      .where(eq(applications.gigId, gigId));

    return NextResponse.json({
      success: true,
      applications: allApplications,
      total: allApplications.length,
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}
