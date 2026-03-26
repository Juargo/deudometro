import 'dotenv/config'
import express, { type Express } from 'express'
import cors from 'cors'

const app: Express = express()
const PORT = process.env.PORT ?? 3001

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim().replace(/\/+$/, ''))
  : ['http://localhost:3000']

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}))
app.use(express.json())

// Health check — no auth required (ROUTER.md §2)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Mount routers (ROUTER.md §2)
import { profileRouter } from './router/profile.router'
import { debtRouter } from './router/debt.router'
import { planRouter } from './router/plan.router'
import { paymentRouter } from './router/payment.router'
import { milestoneRouter } from './router/milestone.router'
app.use('/api', profileRouter)
app.use('/api', debtRouter)
app.use('/api', planRouter)
app.use('/api', paymentRouter)
app.use('/api', milestoneRouter)

// 404 for unknown routes (ROUTER.md rule 8)
app.use((_req, res) => {
  res.status(404).json({ error: 'UNKNOWN_ROUTE', message: 'Ruta no encontrada' })
})

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})

export default app
