import type { DrawFn } from "./types"
import { clamp, dist, easeOut, label, rnd, roundRect, tint } from "./util"

const TOPICS = ["MVC", "SQL", "Git", "Data"]

/**
 * Binus teaching: a lecturer node pulses a topic across a room of seats; each
 * seat lights as the idea lands and gradually earns its pass tick over the
 * session. Hover seats to see them respond.
 */
export const labSession: DrawFn = (ctx, s) => {
    const { w, h, t, mx, my, p } = s
    const b = (a: number) => tint(s.brand, a)
    const pad = 16
    const lect = { x: pad + 30, y: h / 2 + 4 }
    const cols = 6, rows = 4
    const gx0 = lect.x + 56, gx1 = w - pad - 6
    const gy0 = 36, gy1 = h - 30
    const period = 2.4
    const cycle = Math.floor(t / period)
    const phase = (t % period) / period
    const topic = TOPICS[cycle % TOPICS.length]
    const ringR = easeOut(phase) * (gx1 - lect.x + 20)

    // lecturer
    ctx.strokeStyle = b(0.9)
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.arc(lect.x, lect.y - 10, 6, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(lect.x - 9, lect.y + 10); ctx.quadraticCurveTo(lect.x, lect.y - 6, lect.x + 9, lect.y + 10); ctx.stroke()
    // pulse ring
    ctx.strokeStyle = b(0.9 * (1 - phase))
    ctx.lineWidth = 1.2
    ctx.beginPath(); ctx.arc(lect.x, lect.y, ringR, -Math.PI / 2.2, Math.PI / 2.2); ctx.stroke()
    // topic bubble
    ctx.font = "600 9px \"JetBrains Mono\", monospace"
    const tw = ctx.measureText(topic).width + 12
    roundRect(ctx, lect.x - tw / 2, lect.y - 36, tw, 14, 4)
    ctx.fillStyle = b(0.95)
    ctx.fill()
    label(ctx, topic, lect.x, lect.y - 29, { size: 9, align: "center", color: p.onAccent, weight: 600 })

    // seats
    const session = clamp(t / 16, 0, 1)   // the session matures over time
    let passed = 0
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const i = r * cols + c
            const x = gx0 + (c / (cols - 1)) * (gx1 - gx0)
            const y = gy0 + (r / (rows - 1)) * (gy1 - gy0)
            const dl = dist(x, y, lect.x, lect.y)
            const lit = clamp(1 - Math.abs(ringR - dl) / 22, 0, 1) * (1 - phase * 0.5)
            const near = mx >= 0 ? clamp(1 - dist(mx, my, x, y) / 40, 0, 1) : 0
            const readiness = rnd(i, 23)
            const pass = session > readiness * 0.9 + 0.05
            if (pass) passed++
            // desk
            roundRect(ctx, x - 9, y - 7, 18, 14, 3)
            ctx.fillStyle = p.fg(0.04 + lit * 0.1 + near * 0.08)
            ctx.fill()
            ctx.strokeStyle = pass ? b(0.5 + lit * 0.5) : p.line(0.2 + lit * 0.5)
            ctx.lineWidth = 1
            ctx.stroke()
            // student
            ctx.fillStyle = pass ? b(0.9) : p.fg(0.35 + lit * 0.5 + near * 0.3)
            ctx.beginPath(); ctx.arc(x, y - 1, 2.6 + near * 1.2, 0, Math.PI * 2); ctx.fill()
            if (pass) {
                ctx.strokeStyle = p.fg(0.95)
                ctx.lineWidth = 1.3
                ctx.beginPath(); ctx.moveTo(x + 4, y + 4); ctx.lineTo(x + 6, y + 6); ctx.lineTo(x + 9.5, y + 1.5); ctx.stroke()
            }
        }
    }

    // HUD
    label(ctx, w < 420 ? "WEEKLY LAB" : "WEEKLY LAB · SOFTWARE DEV & DATABASES", pad, 13, { size: 9, color: p.muted(0.9) })
    label(ctx, session >= 1 ? "cohort passed ✓" : `${passed}/${cols * rows} ready`, w - pad, 13, { size: 9, color: b(0.95), align: "right" })
    label(ctx, mx >= 0 ? "students respond to the pointer" : "ideas propagate seat by seat", pad, h - 11, { size: 9, color: p.muted(0.7) })
}
