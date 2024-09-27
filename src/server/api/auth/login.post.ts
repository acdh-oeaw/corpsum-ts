import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

import type { UserDocument } from "@/server/models/user.schema";


const errorMessage = 'username or password is wrong! please try again'

export default defineEventHandler(async (event) => {
  const { username, password }: UserDocument = await readBody(event)

  if (!username || !password) {
    throw createError({
      statusMessage: 'required field missing',
    })
  }

  const user = await mongoose.connection.db?.collection<UserDocument>('users').findOne({ username })

  if (!user) {
    throw createError({
      statusMessage: errorMessage,
    })
  }

  const matches = bcrypt.compareSync(password, user.password)

  if (!matches) {
    throw createError({
      statusMessage: errorMessage,
    })
  }

  await setAuth(event, user.username)

  return {
    loggedIn: true,
    user: user.username,
  }
})
