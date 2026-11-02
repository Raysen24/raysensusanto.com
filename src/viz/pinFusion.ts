import type { DrawFn } from "./types"
import { clamp, dist, easeInOut, label, rnd, tint } from "./util"

function pin(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, fill = false) {
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.arc(x, y - r * 1.6, r, Math.PI * 0.85, Math.PI * 2.15)
    ctx.lineTo(x, y)
    ctx.closePath()
    if (fill) ctx.fill(); else ctx.stroke()
}

/** Final-pin accuracy: noisy pins converge into one fused pin inside the right zone. */
export const pinFusion: DrawFn = (ctx, s) => {
    const { w, h, t, mx, my, hover, p } = s
    const b = (a: number) => tint(s.brand, a)
    const pad = 16

    // map grid
    ctx.strokeStyle = p.line(0.06)
    ctx.lineWidth = 1
    for (let x = pad; x < w; x += 28) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
    for (let y = 8; y < h; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }

    // two delivery zones split by a jagged road
    const splitX = w * 0.56
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = p.line(0.25)
    ctx.beginPath()
    ctx.moveTo(splitX - 20, 0)
    ctx.lineTo(splitX + 10, h * 0.35)
    ctx.lineTo(splitX - 8, h * 0.7)
    ctx.lineTo(splitX + 18, h)
    ctx.stroke()
    ctx.setLineDash([])
    label(ctx, "ZONE A", pad, h - 14, { size: 9, color: p.muted(0.8) })
    label(ctx, "ZONE B", w - pad, h - 14, { size: 9, color: p.muted(0.8), align: "right" })

    // true location: pointer, or a slow drift
    const tx = hover ? clamp(mx, pad + 20, w - pad - 20) : w * (0.36 + 0.1 * Math.sin(t * 0.3))
    const ty = hover ? clamp(my, 40, h - 40) : h * (0.5 + 0.12 * Math.cos(t * 0.23))

    // convergence cycle
    const period = 4.2
    const phase = (t % period) / period
    const conv = easeInOut(clamp((phase - 0.15) / 0.6, 0, 1))
    const spread = (1 - conv) * Math.min(w, h) * 0.36 + 4

    const n = 14
    let sx = 0, sy = 0, sw = 0
    for (let i = 0; i < n; i++) {
        const a = rnd(i, 11) * Math.PI * 2
        const r = Math.sqrt(rnd(i, 12)) * spread
        const px = tx + Math.cos(a) * r + Math.sin(t * 0.8 + i) * 1.5
        const py = ty + Math.sin(a) * r + Math.cos(t * 0.7 + i) * 1.5
        const wgt = 1 / (1 + r * 0.05)
        sx += px * wgt; sy += py * wgt; sw += wgt
        const wrongZone = (px > splitX) !== (tx > splitX)
        pin(ctx, px, py, 3.2, wrongZone ? "rgba(255,95,109,0.7)" : p.fg(0.25 + 0.3 * conv))
    }
    const fx = sx / sw, fy = sy / sw

    // confidence ring
    const ring = spread * 0.9 + 10
    ctx.strokeStyle = b(0.25 + 0.5 * conv)
    ctx.lineWidth = 1
    ctx.setLineDash([3, 5])
    ctx.beginPath(); ctx.arc(fx, fy, ring, 0, Math.PI * 2); ctx.stroke()
    ctx.setLineDash([])

    // fused pin
    const glow = 0.4 + 0.6 * conv
    ctx.shadowColor = b(glow)
    ctx.shadowBlur = 16 * conv
    pin(ctx, fx, fy, 5.5, b(glow), true)
    ctx.shadowBlur = 0
    const pct = Math.round(52 + 46 * conv)
    label(ctx, `fused pin · ${pct}%`, fx + 12, fy - 14, { size: 9, color: p.fg(0.9) })

    // header
    label(ctx, "FINAL-PIN FUSION", pad, 14, { size: 9, color: p.muted(0.9) })
    label(ctx, conv < 0.99 ? (w < 400 ? "fusing samples…" : "GBM · batch detector · Bayesian fusion") : "pin corrected ✓", w - pad, 14, { size: 9, color: conv < 0.99 ? p.muted(0.8) : b(0.95), align: "right" })
    if (!hover) label(ctx, "move the pointer to place the true location", pad, 30, { size: 8, color: p.muted(0.55) })
    void dist
}
