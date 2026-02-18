import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-950 mb-2">
            Welcome to <span className="text-green-600">TaskHive</span>
          </h1>
          <p className="text-gray-500 text-sm">
            Sign in to your account
          </p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: 'bg-green-600 hover:bg-green-700',
              footerActionLink: 'text-green-600 hover:text-green-700',
            }
          }}
        />
      </div>
    </div>
  );
}
