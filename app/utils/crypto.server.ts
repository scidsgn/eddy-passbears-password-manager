import { Site, User } from "@prisma/client"
import { createHash, createCipheriv, createDecipheriv, randomBytes } from "crypto"
import { db } from "./db.server"
import { getUser } from "./session.server"

type SiteInfo = {
    website: string
    password: string
    masterPassword: string
}

export function hashPassword(password: string) {
    const hash = createHash("sha256")
    hash.update(password, "utf-8")

    return hash.digest()
}

export function createIVKey(masterPassword: string) {
    const key = hashPassword(masterPassword)
    const iv = randomBytes(16)

    return { iv, key }
}

export function encryptPassword(password: string, iv: Buffer, key: Buffer) {
    const cipher = createCipheriv("aes-256-cbc", key, iv)
    const encrypted = cipher.update(password)

    return Buffer.concat([encrypted, cipher.final()])
}

export function decryptPassword(encrypted: Buffer, iv: Buffer, key: Buffer) {
    const cipher = createDecipheriv("aes-256-cbc", key, iv)
    const decrypted = cipher.update(encrypted)

    return Buffer.concat([decrypted, cipher.final()])

}

export async function addSite(request: Request, { website, password, masterPassword }: SiteInfo) {
    const user = await getUser(request)
    if (!user) {
        return null
    }

    const { iv, key } = createIVKey(masterPassword)
    const encrypted = encryptPassword(password, iv, key)

    try {
        return await db.site.create({
            data: {
                website,
                encryptedPassword: iv.toString("hex") + encrypted.toString("hex"),
                userId: user.id
            }
        })
    } catch {
        return null
    }
}

export async function getSites(user: User) {
    try {
        return await db.site.findMany({
            where: {
                userId: user.id
            }
        })
    } catch {
        return []
    }
}

export async function getSite(user: User, id: string) {
    try {
        return await db.site.findFirst({
            where: {
                id,
                userId: user.id
            }
        })
    } catch {
        return null
    }
}

export async function deleteSite(site: Site) {
    await db.site.delete({
        where: {
            id: site.id
        }
    })
}