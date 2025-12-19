import { NextRequest, NextResponse } from "next/server"
import { redis } from "@/lib/redis"
import { nanoid } from "nanoid"

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

    const newToken = nanoid()
    await redis.sadd(`connected:${roomID}`, newToken)

    const response = NextResponse.next()
    response.cookies.set("x-auth-token", newToken, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })

    return response
  } catch (error) {
    return NextResponse.next()
  }
}

export const config = {
  matcher: "/room/:path*",
}
