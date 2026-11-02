import type { DrawFn } from "./types"
import { clamp, easeOut, label, rnd, roundRect, tint } from "./util"

/** Playground ticketing: a manual gate queues people up, the ERP gate flows. */
export const ticketQueue: DrawFn = (ctx, s) => {
    const { w, h, t, p } = s
    const b = (a: number) => tint(s.brand, a)
    const pad = 16
    const lanes = [
        { name: "manual counter", y: h * 0.36, every: 1.7, col: p.line(0.55), wait: 1 },
        { name: "android ERP gate", y: h * 0.72, every: 0.22, col: b(0.95), wait: 0.1 },
    ]
    const gateX = w * 0.62
    const spawnEvery = 0.3
    const speed = 42

    lanes.forEach((lane, li) => {
        // lane line
        ctx.strokeStyle = p.line(0.1)
        ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(pad, lane.y); ctx.lineTo(w - pad, lane.y); ctx.stroke()
        // gate
        roundRect(ctx, gateX - 3, lane.y - 16, 6, 32, 3)
        ctx.fillStyle = li === 0 ? p.line(0.35) : b(0.8)
        ctx.fill()
        label(ctx, lane.name, pad, lane.y - 24, { size: 9, color: p.muted(0.9) })

        // people: spawned every spawnEvery seconds, processed at the gate every lane.every seconds
        const n = Math.floor(t / spawnEvery)
        let queued = 0
        for (let k = Math.max(0, n - 40); k <= n; k++) {
            const born = k * spawnEvery
            const age = t - born
            // time at which the gate lets person k through (FIFO at lane rate, never before arrival)
            const arrive = born + (gateX - pad - 10) / speed
            const release = Math.max(arrive, lane.every * k + (gateX - pad - 10) / speed)
            let x: number
            if (t < arrive) x = pad + age * speed
            else if (t < release) {
                // waiting: stack behind the gate
                const ahead = Math.round((release - t) / lane.every)
                x = gateX - 12 - ahead * 9
                queued++
            } else x = gateX + 6 + (t - release) * speed
            if (x > w - pad) continue
            const jitter = (rnd(k, 5) - 0.5) * 6
            const passed = x > gateX
            ctx.fillStyle = passed ? lane.col : li === 0 && t >= arrive && t < release ? "rgba(255,95,109,0.8)" : p.fg(0.55)
            ctx.beginPath(); ctx.arc(x, lane.y + jitter, 2.6, 0, Math.PI * 2); ctx.fill()
        }

        // wait bar
        const intro = easeOut((t - 0.5) / 1.5)
        const barW = (w - pad * 2) * 0.32
        const bx = w - pad - barW, by = lane.y + 14
        roundRect(ctx, bx, by, Math.max(3, barW * lane.wait * intro), 6, 3)
        ctx.fillStyle = lane.col
        ctx.fill()
        label(ctx, li === 0 ? "long wait" : (intro > 0.9 ? "minimal wait" : "wait shrinking…"), bx, by + 14, { size: 8, color: p.muted(0.9) })
        if (li === 0 && queued > 2) label(ctx, `${queued} waiting`, gateX - 16, lane.y - 10, { size: 8, color: "rgba(255,95,109,0.9)", align: "right" })
    })

    label(ctx, "TICKETING · AUTOMATED", pad, 13, { size: 9, color: p.muted(0.9) })
    label(ctx, clamp((t - 0.5) / 1.5, 0, 1) > 0.95 ? "queues cleared ✓" : "automating…", w - pad, 13, { size: 9, color: b(0.95), align: "right" })
}
