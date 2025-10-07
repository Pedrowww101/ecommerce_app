import { createFactory } from 'hono/factory'
import { Env } from './auth.type.js'

const factory = createFactory<Env>()

export { factory }