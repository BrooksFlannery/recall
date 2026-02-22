import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/server/auth"

// Routes that are publicly accessible without authentication
const PUBLIC_PREFIXES = ["/api/auth", "/sign-in", "/sign-up"]
const PUBLIC_EXACT = ["/"]

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.includes(pathname)) { return true }
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const session = await auth.api.getSession({ headers: request.headers })

  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
