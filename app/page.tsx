import { authServer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  // Check if user is authenticated
  const user = await authServer.getUser()
  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold mb-4">ymmybttn</h1>
        <p className="text-lg text-gray-600">Restaurant Inventory Management System</p>
        <p className="text-gray-500 max-w-md">
          Find the best prices across multiple distributors and streamline your restaurant's inventory management.
        </p>
        
        <div className="flex space-x-4 justify-center mt-8">
          <Link 
            href="/auth/sign-in"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Sign In
          </Link>
          <Link 
            href="/auth/sign-up"
            className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-md transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  )
}