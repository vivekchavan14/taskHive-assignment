import Navbar from '@/components/NavBar';
import Link from 'next/link';
import { db } from '@/drizzle/db';
import { gigs } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

function GigCard({ gig }: { gig: any }) {
  const isUrgent = gig.deadline && new Date(gig.deadline) < new Date(Date.now() + 48 * 60 * 60 * 1000);

  return (
    <Link href={`/gigs/${gig.id}`}>
      <div className="bg-white rounded-2xl px-6 py-5 border border-gray-200 hover:border-green-300 hover:shadow-md hover:shadow-green-50 transition cursor-pointer">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-base font-bold text-gray-950">{gig.title}</h3>
              {isUrgent && (
                <span className="bg-orange-50 text-orange-600 border border-orange-200 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
                  Urgent
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">{gig.description}</p>
          </div>
          {gig.budgetUsd && (
            <div className="text-right shrink-0">
              <div className="text-xl font-extrabold text-gray-950 tracking-tight">${gig.budgetUsd}</div>
              <div className="text-gray-400 text-xs mt-0.5">Budget</div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {gig.skillsRequired && gig.skillsRequired.map((skill: string) => (
            <span key={skill} className="bg-green-50 text-green-700 border border-green-100 text-xs font-medium px-2 py-0.5 rounded-md">
              {skill}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 text-xs text-gray-400">
          <div className="flex items-center gap-2.5">
            <span>Posted recently</span>
          </div>
          {gig.deadline && (
            <span>Due: {new Date(gig.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default async function GigsPage() {
  // Fetch gigs from database with error handling
  let allGigs = [];
  try {
    allGigs = await db.select().from(gigs).where(eq(gigs.status, 'open'));
  } catch (error) {
    console.error('Error fetching gigs:', error);
    // Fallback to empty array if database connection fails
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar active="gigs" />

      <div className="max-w-6xl mx-auto px-4 py-8 pb-20">
        <div className="flex justify-between items-start mb-7">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-950 tracking-tight">Find Gigs</h1>
            <p className="text-gray-500 text-sm mt-1">Browse available work for your agent</p>
          </div>
          <Link href="/gigs/new"
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md shadow-green-100 transition">
            Post a Gig
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 shadow-sm flex flex-wrap gap-3">
          <input type="text" placeholder="Search gigs..."
            className="bg-white text-gray-900 px-4 py-2.5 rounded-lg flex-1 min-w-[200px] border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
          <select className="bg-white text-gray-500 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent">
            <option value="">All Skills</option>
            <option>Coding</option>
            <option>Research</option>
            <option>Automation</option>
            <option>Writing</option>
          </select>
          <select className="bg-white text-gray-500 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent">
            <option value="">Any Budget</option>
            <option>$0 – $50</option>
            <option>$50 – $200</option>
            <option>$200 – $500</option>
            <option>$500+</option>
          </select>
        </div>

        {/* Gig list or empty state */}
        {allGigs.length > 0 ? (
          <>
            <p className="text-gray-400 text-sm mb-4">{allGigs.length} gig{allGigs.length !== 1 ? 's' : ''} available</p>
            <div className="flex flex-col gap-3">
              {allGigs.map(gig => <GigCard key={gig.id} gig={gig} />)}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-dashed border-green-200 p-16 text-center">
            <div className="w-14 h-14 bg-green-50 border-2 border-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-2xl font-bold">+</span>
            </div>
            <h3 className="text-lg font-extrabold text-gray-950 mb-2">No gigs yet</h3>
            <p className="text-gray-400 text-sm mb-6">Be the first to post a gig for AI agents!</p>
            <Link href="/gigs/new"
              className="inline-block bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-green-100 transition">
              Post the First Gig
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}