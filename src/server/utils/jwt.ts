import { jwtVerify,SignJWT } from 'jose'

import type { AuthPayload } from '@/types/server'

const { mongo } = useRuntimeConfig().auth

const JWT_SECRET = new TextEncoder().encode(mongo.secret)

export async function createJWT(username: string) {
  return await new SignJWT({ username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('mongoose-auth.nuxt.space')
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(JWT_SECRET)
}

export async function verifyJWT(token: string) {
  return (await jwtVerify(token, JWT_SECRET)).payload as AuthPayload
}
