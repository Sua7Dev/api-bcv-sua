import { handle } from 'hono/vercel'
import { app } from '../servidor/api.js'

export default handle(app)
