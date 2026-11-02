import type { DrawFn } from "./types"
import { clamp, dist, easeOut, label, rnd, roundRect, tint } from "./util"

/**
 * Shopee Express: a last-mile network. Parcels leave the hub along
 * Manhattan routes to drop points; each delivery is AI-validated on arrival.
 * Hover a drop point to inspect it.
 */
export const lastMile: DrawFn = (ctx, s) => {
    const { w, h, t, mx, my, p } = s
    const b = (a: number) => tint(s.brand, a)
    const pad = 16
    const top = 28, bottom = h - 26
    const hub = { x: pad + 26, y: (top + bottom) / 2 }

    // city grid
    ctx.strokeStyle = p.line(0.06)
    ctx.lineWidth = 1
    for (let x = pad; x < w; x += 26) { ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke() }
    for (let y = top; y < bottom; y += 26) { ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke() }

    // drop points on a loose grid
    const drops: { x: number; y: number }[] = []
    const n = 10
    for (let i = 0; i < n; i++) {
        const col = i % 5, row = Math.floor(i / 5)
        const x = hub.x + 54 + col * ((w - hub.x - 54 - pad - 8) / 4) + (rnd(i, 3) - 0.5) * 18
        const y = top + 18 + row * (bottom - top - 36) + (rnd(i, 4) - 0.5) * 22
        drops.push({ x, y })
    }

    // which drop is under the pointer
    let hot = -1
    if (mx >= 0) drops.forEach((d, i) => { if (dist(mx, my, d.x, d.y) < 22) hot = i })

    // routes: horizontal then vertical, faint; highlighted when hovered
    drops.forEach((d, i) => {
        ctx.strokeStyle = hot === i ? b(0.8) : p.line(0.12)
        ctx.lineWidth = hot === i ? 1.5 : 1
        ctx.setLineDash(hot === i ? [] : [3, 4])
        ctx.beginPath(); ctx.moveTo(hub.x, hub.y); ctx.lineTo(d.x, hub.y); ctx.lineTo(d.x, d.y); ctx.stroke()
    })
    ctx.setLineDash([])

    // parcels in flight: one every 0.45 s, 2.2 s per trip, destination by index
    const every = 0.45, trip = 2.2
    const arrived = new Array(n).fill(0)
    let delivered = 0
    for (let k = Math.floor((t - trip) / every); k <= Math.floor(t / every); k++) {
        if (k < 0) continue
        const born = k * every
        const f = (t - born) / trip
        const di = Math.floor(rnd(k, 9) * n)
        const d = drops[di]
        if (f >= 1) { delivered++; continue }
        if (f < 0) continue
        const horiz = Math.abs(d.x - hub.x), vert = Math.abs(d.y - hub.y)
        const total = horiz + vert
        const along = easeOut(f) * total
        let x: number, y: number
        if (along < horiz) { x = hub.x + Math.sign(d.x - hub.x) * along; y = hub.y }
        else { x = d.x; y = hub.y + Math.sign(d.y - hub.y) * (along - horiz) }
        roundRect(ctx, x - 3.5, y - 3.5, 7, 7, 1.5)
        ctx.fillStyle = b(0.95)
        ctx.shadowColor = b(0.7)
        ctx.shadowBlur = 8
        ctx.fill()
        ctx.shadowBlur = 0
        if (f > 0.92) arrived[di] = Math.max(arrived[di], (f - 0.92) / 0.08)
    }
    delivered += Math.max(0, Math.floor((t - trip) / every))

    // drop points with validation tick on arrival
    drops.forEach((d, i) => {
        const pulse = arrived[i]
        ctx.beginPath(); ctx.arc(d.x, d.y, 4, 0, Math.PI * 2)
        ctx.fillStyle = hot === i ? b(1) : pulse > 0 ? b(0.5 + 0.5 * pulse) : p.fg(0.35)
        ctx.fill()
        if (pulse > 0 || hot === i) {
            const r = 7 + 9 * (hot === i ? 0.4 : pulse)
            ctx.strokeStyle = b(hot === i ? 0.7 : 0.9 * (1 - pulse))
            ctx.lineWidth = 1.2
            ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, Math.PI * 2); ctx.stroke()
            ctx.strokeStyle = p.fg(0.95)
            ctx.lineWidth = 1.4
            ctx.beginPath(); ctx.moveTo(d.x - 2.5, d.y); ctx.lineTo(d.x - 0.5, d.y + 2); ctx.lineTo(d.x + 3, d.y - 2.5); ctx.stroke()
        }
    })

    // hub
    roundRect(ctx, hub.x - 9, hub.y - 9, 18, 18, 4)
    ctx.fillStyle = p.bg
    ctx.fill()
    ctx.strokeStyle = b(0.95)
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.fillStyle = b(0.95)
    ctx.beginPath(); ctx.arc(hub.x, hub.y, 2.5, 0, Math.PI * 2); ctx.fill()
    label(ctx, "HUB", hub.x, hub.y + 18, { size: 8, align: "center", color: p.muted(0.9) })

    // HUD
    label(ctx, w < 420 ? "LAST-MILE · AI" : "LAST-MILE NETWORK · AI VALIDATED", pad, 13, { size: 9, color: p.muted(0.9) })
    label(ctx, `${delivered} parcels validated`, w - pad, 13, { size: 9, color: b(0.95), align: "right" })
    label(ctx, hot >= 0 ? `drop ${String(hot + 1).padStart(2, "0")} · driver video checked · zone ok` : "hover a drop point", pad, h - 11, { size: 9, color: hot >= 0 ? b(0.95) : p.muted(0.7) })
    void clamp
}
