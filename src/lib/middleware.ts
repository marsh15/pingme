import { NextRequest, NextResponse } from "next/server"
import { redis } from "@/lib/redis"

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  const roomMatch = pathname.match(/^\/room\/([^/]+)$/)

  if (!roomMatch) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  const roomID = roomMatch[1]

  try {
    const exists = await redis.exists(`meta:${roomID}`)
    if (!exists) {
      return NextResponse.redirect(new URL("/?error=room-not-found", req.url))
    }

    const token = req.cookies.get("x-auth-token")?.value
    const isMember = token ? await redis.sismember(`connected:${roomID}`, token) : 0

    if (isMember) {
      return NextResponse.next()
    }

    const count = await redis.scard(`connected:${roomID}`)
    if (count >= 2) {
      return NextResponse.redirect(new URL("/?error=room-full", req.url))
    }

    return NextResponse.next()
  } catch (error) {
    return NextResponse.next()
  }
}

export const config = {
  matcher: "/room/:path*",
}
