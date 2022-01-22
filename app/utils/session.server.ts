import { db } from "./db.server"
import bcrypt from "bcrypt"
import { createCookieSessionStorage, redirect } from "remix"
import { User } from "@prisma/client"

type Login = {
    email: string
    password: string
}

type Register = {
    email: string
    password: string
    masterPassword: string
}

const secret = process.env.SESSION_SECRET
if (!secret) {
    throw new Error("env.SESSION_SECRET needs to be set!")
}

const storage = createCookieSessionStorage({
    cookie: {
        name: "SCI_PM_SESSION",
        secure: process.env.NODE_ENV === "production",
        secrets: [secret],
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60,
        httpOnly: true
    }
})

export async function setAttemptCount(user: User, attemptCount: number) {
    await db.user.update({
        where: {
            id: user.id
        },
        data: {
            attemptCount: attemptCount
        }
    })
}

export function isLoginAllowed(user: User) {
    const nextAllowedAttempt = user.nextAllowedAttempt
    if (nextAllowedAttempt === null) {
        return true
    }

    return new Date() > nextAllowedAttempt
}

export async function applyLoginStrike(user: User) {
    const post15Minutes = new Date(Date.now() + 15 * 60000)

    await db.user.update({
        where: {
            id: user.id
        },
        data: {
            attemptCount: 0,
            nextAllowedAttempt: post15Minutes
        }
    })
}

export async function getUserByEmail(email: string) {
    const user = await db.user.findUnique({
        where: {email}
    })
    if (!user) {
        return null
    }

    return user
}

export async function checkLoginPassword(user: User, password: string) {
    return await bcrypt.compare(
        password, user.passwordHash
    )
}

export async function login({email, password}: Login) {
    const user = await db.user.findUnique({
        where: {email}
    })
    if (!user) {
        return null
    }
    
    const passwordCorrect = await bcrypt.compare(
        password, user.passwordHash
    )
    if (!passwordCorrect) {
        return null
    }

    return user
}

export async function createUser(
    {email, password, masterPassword}: Register
) {
    const passwordHash = await bcrypt.hash(password, 13)
    const masterPasswordHash = await bcrypt.hash(masterPassword, 13)

    return await db.user.create({
        data: {
            email,
            passwordHash,
            masterPasswordHash
        }
    })
}

export async function createSession(userId: string, redirectPath: string) {
    const session = await storage.getSession()
    session.set("userId", userId)

    return redirect(
        redirectPath, {
            headers: {
                "Set-Cookie": await storage.commitSession(session)
            }
        }
    )
}

export function getSession(request: Request) {
    return storage.getSession(request.headers.get("Cookie"))
}

export async function logout(request: Request) {
    const session = await getSession(request)
    
    return redirect(
        "/login", {
            headers: {
                "Set-Cookie": await storage.destroySession(session)
            }
        }
    )
}

export async function getUserId(request: Request) {
    const session = await getSession(request)
    const userId = session.get("userId")

    if (!userId || typeof userId !== "string") {
        return null
    }

    return userId
}

export async function requireUserId(
    request: Request,
    redirectPath: string = new URL(request.url).pathname
) {
    const session = await getSession(request)
    const userId = session.get("userId")

    if (!userId || typeof userId !== "string") {
        const searchParams = new URLSearchParams([
            ["redirect", redirectPath]
        ])
        throw redirect(`/login?${searchParams}`)
    }

    return userId
}

export async function getUser(request: Request) {
    const userId = await getUserId(request)
    if (typeof userId !== "string") {
        return null
    }

    try {
        const user = await db.user.findUnique({
            where: {id: userId}
        })

        return user
    } catch {
        throw logout(request)
    }
}

export async function checkMasterPassword(request: Request, masterPassword: string) {
    const user = await getUser(request)
    if (!user) {
        return false
    }

    return await bcrypt.compare(
        masterPassword, user.masterPasswordHash
    )
}