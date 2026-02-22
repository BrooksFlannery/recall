import { getSession } from "@/lib/session"
import { UserMenu } from "@/components/UserMenu"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session) {
    redirect("/sign-in")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white px-4 py-3 flex items-center justify-between">
        <Link href="/app" className="font-semibold text-lg">
          Recall
        </Link>
        <nav className="flex items-center gap-4">
          <UserMenu
            email={session.user.email}
            name={session.user.name}
            image={session.user.image ?? null}
          />
        </nav>
      </header>
      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
