import type { DrawFn } from "./types"
import { clamp, easeOut, label, MONO, roundRect, tint } from "./util"

const NODES = ["Files", "Parse", "Validate", "Reconcile", "Settle"]

/**
 * DANA settlement automation: packets stream through an n8n-style node graph
 * while a race below shows the manual run crawling and the automated run
 * finishing. Hover a node to read its step.
 */
export function workflow(variant: "graph" | "timer" = "graph"): DrawFn {
    return (ctx, s) => {
        const { w, h, t, mx, my, p } = s
        const b = (a: number) => tint(s.brand, a)
        const pad = 16
        const n = NODES.length
        const nodeW = Math.min(76, (w - pad * 2 - 14 * (n - 1)) / n)
        const nodeH = 28
        const gap = (w - pad * 2 - nodeW * n) / (n - 1)
        const gy = h * 0.3

        const xs = NODES.map((_, i) => pad + i * (nodeW + gap))
        let hovered = -1
        xs.forEach((x, i) => { if (mx >= x && mx <= x + nodeW && my >= gy - 6 && my <= gy + nodeH + 6) hovered = i })

        // edges
        ctx.strokeStyle = p.line(0.2)
        ctx.lineWidth = 1
        for (let i = 0; i < n - 1; i++) {
            ctx.beginPath(); ctx.moveTo(xs[i] + nodeW, gy + nodeH / 2); ctx.lineTo(xs[i + 1], gy + nodeH / 2); ctx.stroke()
        }

        // packets
        const travel = 2.4, every = 0.5
        const flash = new Array(n).fill(0)
        let settled = 0
        for (let k = Math.floor((t - travel) / every); k <= Math.floor(t / every); k++) {
            if (k < 0) continue
            const prog = (t - k * every) / travel
            if (prog >= 1) { settled++; continue }
            if (prog < 0) continue
            const seg = prog * (n - 1)
            const i = Math.min(n - 2, Math.floor(seg))
            const f = seg - i
            const x = xs[i] + nodeW + (xs[i + 1] - xs[i] - nodeW) * f
            ctx.fillStyle = b(0.95)
            ctx.shadowColor = b(0.8)
            ctx.shadowBlur = 10
            ctx.beginPath(); ctx.arc(x, gy + nodeH / 2, 2.8, 0, Math.PI * 2); ctx.fill()
            ctx.shadowBlur = 0
            if (f < 0.12) flash[i] = Math.max(flash[i], 1 - f / 0.12)
            if (f > 0.88) flash[i + 1] = Math.max(flash[i + 1], (f - 0.88) / 0.12)
        }
        settled += Math.max(0, Math.floor((t - travel) / every))

        // nodes
        xs.forEach((x, i) => {
            const hot = hovered === i
            roundRect(ctx, x, gy, nodeW, nodeH, 7)
            ctx.fillStyle = hot ? b(0.16) : p.fg(0.04 + flash[i] * 0.08)
            ctx.fill()
            ctx.strokeStyle = hot || flash[i] > 0.2 ? b(0.6 + flash[i] * 0.4) : p.line(0.22)
            ctx.lineWidth = 1
            ctx.stroke()
            ctx.fillStyle = b(0.9)
            ctx.beginPath(); ctx.arc(x + 10, gy + nodeH / 2, 2.5, 0, Math.PI * 2); ctx.fill()
            label(ctx, NODES[i], x + 18, gy + nodeH / 2 + 0.5, { size: 9, color: p.fg(0.9) })
        })

        // the race: manual vs automated, repeating
        const raceY = gy + nodeH + 30
        const trackW = w - pad * 2 - 150
        const raceT = (t % 7) / 7
        const auto = easeOut(clamp(raceT / 0.18, 0, 1))
        const manual = clamp(raceT * 0.42, 0, 1)
        const rows: [string, number, string, boolean][] = [
            ["manual", manual, p.fg(0.3), false],
            ["automated", auto, b(0.95), auto >= 1],
        ]
        rows.forEach(([name, f, col, done], i) => {
            const y = raceY + i * 22
            label(ctx, name, pad, y, { size: 9, color: p.muted(0.9) })
            roundRect(ctx, pad + 64, y - 3, trackW, 6, 3)
            ctx.fillStyle = p.line(0.08)
            ctx.fill()
            roundRect(ctx, pad + 64, y - 3, Math.max(6, trackW * f), 6, 3)
            ctx.fillStyle = col
            ctx.fill()
            ctx.beginPath(); ctx.arc(pad + 64 + trackW * f, y, 4, 0, Math.PI * 2)
            ctx.fillStyle = col
            ctx.fill()
            label(ctx, done ? "settled ✓" : i === 0 ? "still running…" : "", pad + 64 + trackW + 10, y, { size: 8, color: done ? b(0.95) : p.muted(0.7) })
        })

        label(ctx, "n8n · MCP · RPA PIPELINE", pad, 13, { size: 9, color: p.muted(0.9) })
        label(ctx, hovered >= 0 ? `step ${hovered + 1}/${n} · ${NODES[hovered].toLowerCase()} settlement files` : `${settled} batches settled`, w - pad, 13, { size: 9, color: b(0.95), align: "right" })

        if (variant === "timer") {
            ctx.font = `600 14px ${MONO}`
            ctx.fillStyle = p.fg(0.95)
            ctx.textAlign = "right"
            ctx.textBaseline = "middle"
            ctx.fillText(auto >= 1 ? "hours → minutes" : "hours → …", w - pad, h - 13)
            label(ctx, "the daily run, every day", pad, h - 13, { size: 9, color: p.muted(0.7) })
        } else {
            label(ctx, auto >= 1 ? "processing time collapsed ✓" : "re-engineering the run…", pad, h - 13, { size: 9, color: p.muted(0.7) })
        }
    }
}
