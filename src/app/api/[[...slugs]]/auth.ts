import { redis } from "@/lib/redis"
import Elysia from "elysia"

class AuthError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "AuthError"
    }
}

export const authMiddleware = new Elysia({ name: "auth" })
    .error({ AuthError })
    .onError(({ code, set }) => {
        if (code === "AuthError") {
            set.status = 401
            return { error: "Unauthorized" }

        }
    })
    .derive({ as: "scoped" }, async ({ query, cookie }) => {
        const roomID = query.roomID
        const token = cookie["x-auth-token"]?.value as string | undefined

        if (!roomID || !token) {
            throw new AuthError("Missing roomId or token.")
        }
        const isConnected = await redis.sismember(`connected:${roomID}`, token)

        if (!isConnected) {
            throw new AuthError("Invalid token")
        }

        return { auth: { roomID, token } }

    })