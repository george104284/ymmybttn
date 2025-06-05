import { authServer } from '@/lib/auth'
import { userServiceServer } from '@/lib/services/user-service'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Require authentication
  const authUser = await authServer.getUser()
  if (!authUser) {
    redirect('/auth/sign-in')
  }

  // Get user profile
  const user = await userServiceServer.getCurrentServerUser()
  if (!user) {
    // User exists in auth but not in our database - this shouldn't happen
    // but handle gracefully
    redirect('/auth/sign-in?error=profile_not_found')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                ymmybttn Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user.full_name}
              </span>
              <form action="/auth/sign-out" method="post">
                <button
                  type="submit"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}