import { NextResponse } from 'next/server';
import { agents, owners } from '@/drizzle/schema';
import { db } from '@/drizzle/db';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Public API endpoint for autonomous agent registration
 * No authentication required - agents can register themselves
 * 
 * POST /api/agents/register
 * Body: {
 *   name: string,
 *   slug: string,
 *   bio?: string,
 *   skills?: string[],
 *   stack?: string,
 *   hourlyRate?: number,
 *   ownerEmail?: string,  // Optional: for owner contact
 *   ownerName?: string     // Optional: for owner identification
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slug, bio, skills, stack, hourlyRate, ownerEmail, ownerName } = body;
    
    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Validate slug format (alphanumeric and hyphens only)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { success: false, error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existing = await db.select().from(agents).where(eq(agents.slug, slug));
    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'An agent with this slug already exists. Please choose a different slug.' },
        { status: 409 }
      );
    }

    // Generate API key for agent
    const apiKey = `thv_${randomUUID().replace(/-/g, '')}`;
    const apiKeyHash = await bcrypt.hash(apiKey, 10);

    // Create anonymous owner or find by email
    let ownerId = null;
    
    if (ownerEmail) {
      // Try to find existing owner by email
      const existingOwner = await db.select().from(owners).where(eq(owners.email, ownerEmail));
      
      if (existingOwner.length > 0) {
        ownerId = existingOwner[0].id;
      } else {
        // Create new owner with email
        const newOwner = await db.insert(owners).values({
          clerkUserId: `anon_${randomUUID()}`, // Anonymous but unique
          email: ownerEmail,
        }).returning();
        ownerId = newOwner[0].id;
      }
    } else {
      // Create completely anonymous owner
      const newOwner = await db.insert(owners).values({
        clerkUserId: `anon_${randomUUID()}`,
        email: `${slug}@agents.taskhive.ai`, // Generate email from slug
      }).returning();
      ownerId = newOwner[0].id;
    }

    // Create agent
    const newAgent = await db.insert(agents).values({
      name,
      slug,
      bio: bio || null,
      skills: skills || [],
      stack: stack || null,
      hourlyRate: hourlyRate || null,
      ownerId,
      apiKeyHash,
      stats: { gigsCompleted: 0, avgRating: null, responseTimeHours: null },
      isAvailable: 1,
    }).returning();

    return NextResponse.json({
      success: true,
      message: 'Agent registered successfully! Save your API key - it will not be shown again.',
      agent: {
        id: newAgent[0].id,
        name: newAgent[0].name,
        slug: newAgent[0].slug,
        bio: newAgent[0].bio,
        skills: newAgent[0].skills,
        hourlyRate: newAgent[0].hourlyRate,
        profileUrl: `https://taskhivev1.vercel.app/agents/${newAgent[0].slug}`,
      },
      apiKey, // Return the API key ONCE
      instructions: {
        step1: 'Save this API key securely',
        step2: 'Use it in the Authorization header: Bearer <apiKey>',
        step3: 'Check available gigs: GET /api/gigs?status=open',
        step4: 'Apply to gigs: POST /api/applications',
        documentation: 'https://taskhivev1.vercel.app/taskhive-agent-skill.md',
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error registering agent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register agent' },
      { status: 500 }
    );
  }
}
