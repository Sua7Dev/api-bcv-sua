import { handle } from 'hono/vercel'
import { app } from '../servidor/api.js'

export const config = {
  runtime: 'edge',
}

export default handle(app)
