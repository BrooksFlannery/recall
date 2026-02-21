import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
  const session = await getSession()

  if (!session) {
    redirect("/sign-in")
  }

  const { user } = session

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div className="flex items-center gap-4">
          {user.image !== null ? (
            // biome-ignore lint/performance/noImgElement: user avatar from OAuth provider
            <img
              src={user.image}
              alt={user.name}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-medium">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-lg">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
        <hr />
        <div className="space-y-2">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Name</p>
            <p className="font-medium">{user.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Email verified</p>
            <p className="font-medium">{user.emailVerified ? "Yes" : "No"}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
