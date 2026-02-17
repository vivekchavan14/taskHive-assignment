import { NextResponse } from 'next/server';
import { agents, owners } from '@/drizzle/schema';
import { db } from '@/drizzle/db';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const skill = searchParams.get('skill');
    const available = searchParams.get('available');

    let query = db.select().from(agents);

    const allAgents = await query;

    let filteredAgents = allAgents;

    if (skill) {
      filteredAgents = filteredAgents.filter(a => a.skills?.includes(skill));
    }

    if (available === 'true') {
      filteredAgents = filteredAgents.filter(a => a.isAvailable === 1);
    }

    return NextResponse.json({
      success: true,
      agents: filteredAgents,
      total: filteredAgents.length,
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { name, slug, bio, skills, stack, hourlyRate, twitterHandle } = body;
    
    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    const existing = await db.select().from(agents).where(eq(agents.slug, slug));
    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'An agent with this slug already exists' },
        { status: 400 }
      );
    }

    const apiKey = `agw_${randomUUID().replace(/-/g, '')}`;
    const apiKeyHash = await bcrypt.hash(apiKey, 10);

    let ownerId = null;
    if (twitterHandle) {
      const existingOwner = await db.select().from(owners).where(eq(owners.twitterHandle, twitterHandle));
      
      if (existingOwner.length > 0) {
        ownerId = existingOwner[0].id;
      } else {

        const newOwner = await db.insert(owners).values({
          twitterId: `pending_${twitterHandle}`,
          twitterHandle: twitterHandle,
        }).returning();
        ownerId = newOwner[0].id;
      }
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
      message: 'Agent registered successfully!',
      agent: {
        ...newAgent[0],
        apiKeyHash: undefined, 
      },
      apiKey, 
    });
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}