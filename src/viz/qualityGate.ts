import type { DrawFn } from "./types"
import { clamp, label, rnd, roundRect, tint } from "./util"

/**
 * Kitesense: worksheets ride a conveyor through a QA gate. Most are stamped
 * aligned; the flagged ones drop to a fix lane and come back aligned.
 * The gate beam follows the pointer.
 */
export const qualityGate: DrawFn = (ctx, s) => {
    const { w, h, t, mx, hover, p } = s
    const b = (a: number) => tint(s.brand, a)
    const pad = 16
    const laneY = h * 0.42
    const fixY = h * 0.72
    const gateX = hover ? clamp(mx, w * 0.3, w * 0.75) : w * 0.52
    const speed = 46
    const every = 0.9
    const cardW = 26, cardH = 32

    // lanes
    ctx.strokeStyle = p.line(0.12)
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(pad, laneY + cardH / 2 + 4); ctx.lineTo(w - pad, laneY + cardH / 2 + 4); ctx.stroke()
    ctx.setLineDash([3, 4])
    ctx.beginPath(); ctx.moveTo(gateX + 20, fixY + cardH / 2 + 4); ctx.lineTo(w - pad, fixY + cardH / 2 + 4); ctx.stroke()
    ctx.setLineDash([])
    label(ctx, "worksheets", pad, laneY - cardH / 2 - 10, { size: 8, color: p.muted(0.8) })
    label(ctx, "fix lane", gateX + 20, fixY - cardH / 2 - 8, { size: 8, color: p.red(0.85) })

    let aligned = 0, flagged = 0
    const n = Math.floor(t / every)
    for (let k = Math.max(0, n - 14); k <= n; k++) {
        const born = k * every
        const x0 = pad + (t - born) * speed
        const bad = rnd(k, 17) < 0.22
        const past = x0 > gateX
        if (x0 > w + cardW) continue
        let x = x0, y = laneY
        let state: "pending" | "ok" | "flag" | "fixed" = "pending"
        if (past) {
            const after = (x0 - gateX) / speed // seconds since the gate
            if (!bad) { state = "ok"; aligned++ }
            else {
                // drop to the fix lane over 0.5 s, get fixed after 1.6 s
                const drop = clamp(after / 0.5, 0, 1)
                y = laneY + (fixY - laneY) * (drop * drop * (3 - 2 * drop))
                state = after > 1.6 ? "fixed" : "flag"
                if (state === "fixed") aligned++; else flagged++
            }
        }
        // card
        roundRect(ctx, x - cardW / 2, y - cardH / 2, cardW, cardH, 3)
        ctx.fillStyle = p.bg
        ctx.fill()
        ctx.strokeStyle = state === "flag" ? p.red(0.9) : state === "pending" ? p.line(0.35) : b(0.9)
        ctx.lineWidth = 1.2
        ctx.stroke()
        // text lines on the worksheet
        ctx.strokeStyle = state === "flag" ? p.red(0.5) : p.fg(0.3)
        ctx.lineWidth = 1
        for (let i = 0; i < 4; i++) {
            const ly = y - cardH / 2 + 7 + i * 6
            const lw = cardW - 10 - (i === 3 ? 8 : 0)
            ctx.beginPath(); ctx.moveTo(x - cardW / 2 + 5, ly); ctx.lineTo(x - cardW / 2 + 5 + lw, ly); ctx.stroke()
        }
        // stamp
        if (state !== "pending") {
            const ok = state !== "flag"
            ctx.fillStyle = ok ? b(0.95) : p.red(0.95)
            ctx.beginPath(); ctx.arc(x + cardW / 2 - 2, y - cardH / 2 + 2, 5, 0, Math.PI * 2); ctx.fill()
            ctx.strokeStyle = p.bg
            ctx.lineWidth = 1.4
            ctx.beginPath()
            if (ok) { ctx.moveTo(x + cardW / 2 - 4.5, y - cardH / 2 + 2); ctx.lineTo(x + cardW / 2 - 2.5, y - cardH / 2 + 4); ctx.lineTo(x + cardW / 2 + 0.5, y - cardH / 2 - 0.5) }
            else { ctx.moveTo(x + cardW / 2 - 4, y - cardH / 2); ctx.lineTo(x + cardW / 2, y - cardH / 2 + 4); ctx.moveTo(x + cardW / 2, y - cardH / 2); ctx.lineTo(x + cardW / 2 - 4, y - cardH / 2 + 4) }
            ctx.stroke()
        }
    }

    // gate beam
    const grad = ctx.createLinearGradient(0, laneY - 40, 0, fixY + 30)
    grad.addColorStop(0, b(0))
    grad.addColorStop(0.3, b(0.9))
    grad.addColorStop(0.7, b(0.9))
    grad.addColorStop(1, b(0))
    ctx.fillStyle = grad
    ctx.fillRect(gateX - 1, laneY - 40, 2, fixY - laneY + 70)
    ctx.shadowColor = b(0.8)
    ctx.shadowBlur = 16
    ctx.fillRect(gateX - 0.5, laneY - 30, 1, fixY - laneY + 50)
    ctx.shadowBlur = 0
    roundRect(ctx, gateX - 22, laneY - cardH / 2 - 26, 44, 14, 4)
    ctx.fillStyle = b(0.95)
    ctx.fill()
    label(ctx, "QA GATE", gateX, laneY - cardH / 2 - 19, { size: 8, align: "center", color: p.onAccent, weight: 600 })

    // HUD
    label(ctx, w < 420 ? "WORKSHEET QA" : "WORKSHEET QA · SUBJECTS × SCHOOLS", pad, 13, { size: 9, color: p.muted(0.9) })
    label(ctx, `${aligned} aligned · ${flagged} in fix`, w - pad, 13, { size: 9, color: b(0.95), align: "right" })
    label(ctx, hover ? "drag the gate →" : "misalignments caught, fixed, re-checked", pad, h - 11, { size: 9, color: p.muted(0.7) })
}
