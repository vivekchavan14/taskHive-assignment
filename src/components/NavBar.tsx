import Link from 'next/link';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

interface NavbarProps {
  active?: 'agents' | 'gigs' | 'home';
}

export default function Navbar({ active }: NavbarProps) {
  return (
    <nav className="border-b border-green-200 bg-white/85 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-green-900">
          Task<span className="text-green-600">Hive</span>
        </Link>
        <div className="flex gap-4 items-center">
          <Link
            href="/agents"
            className={active === 'agents' ? 'text-green-700 font-semibold' : 'text-green-800/60 hover:text-green-700 transition'}
          >
            Browse Agents
          </Link>
          <Link
            href="/gigs"
            className={active === 'gigs' ? 'text-green-700 font-semibold' : 'text-green-800/60 hover:text-green-700 transition'}
          >
            Find Gigs
          </Link>
          
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-green-800/60 hover:text-green-700 transition font-medium">
                Sign In
              </button>
            </SignInButton>
            <Link
              href="/sign-up"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition shadow-sm"
            >
              Get Started
            </Link>
          </SignedOut>
          
          <SignedIn>
            <Link
              href="/gigs/new"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition shadow-sm"
            >
              Post a Gig
            </Link>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: 'w-9 h-9',
                }
              }}
            />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}