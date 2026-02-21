"use client"

import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

interface UserMenuProps {
  email: string
  name: string
  image: string | null
}

export function UserMenu({ email, name, image }: UserMenuProps) {
  const router = useRouter()

  async function handleSignOut() {
    await authClient.signOut()
    router.push("/")
  }

  return (
    <div className="flex items-center gap-3">
      {image !== null ? (
        // biome-ignore lint/performance/noImgElement: user avatar from OAuth provider
        <img
          src={image}
          alt={name}
          width={32}
          height={32}
          className="w-8 h-8 rounded-full object-cover"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-medium">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="text-sm font-medium hidden sm:block">{name || email}</span>
      <button
        type="button"
        onClick={handleSignOut}
        className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
      >
        Sign out
      </button>
    </div>
  )
}
