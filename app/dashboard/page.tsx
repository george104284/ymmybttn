import { userServiceServer } from '@/lib/services/user-service'

export default async function DashboardPage() {
  const user = await userServiceServer.getCurrentServerUser()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600">Welcome to your restaurant inventory management system</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Your Profile</h3>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Full name</dt>
            <dd className="text-sm text-gray-900">{user?.full_name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="text-sm text-gray-900">{user?.email}</dd>
          </div>
          {user?.phone && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="text-sm text-gray-900">{user.phone}</dd>
            </div>
          )}
          {user?.mobile && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Mobile</dt>
              <dd className="text-sm text-gray-900">{user.mobile}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-gray-500">Preferred contact</dt>
            <dd className="text-sm text-gray-900">{user?.preferred_contact_method}</dd>
          </div>
        </dl>
      </div>

      {user?.assignments && user.assignments.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your Assignments</h3>
          <div className="space-y-3">
            {user.assignments.map((assignment) => (
              <div key={assignment.assignment_id} className="border border-gray-200 rounded p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {assignment.restaurant?.restaurant_name || assignment.distributor?.distributor_name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Role: {assignment.user_type.type_name}
                      {assignment.is_primary && ' (Primary Contact)'}
                    </p>
                    {assignment.notes && (
                      <p className="text-sm text-gray-500 mt-1">{assignment.notes}</p>
                    )}
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!user?.assignments || user.assignments.length === 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">No assignments yet</h3>
          <p className="text-yellow-700">
            You haven't been assigned to any restaurants yet. Contact your administrator to get access.
          </p>
        </div>
      )}
    </div>
  )
}