import type { DrawFn } from "./types"
import { clamp, cornerBox, label, rnd, roundRect, tint } from "./util"

/** Driver video validation: frames scroll, a scan line validates each one. */
export const videoScan: DrawFn = (ctx, s) => {
    const { w, h, t, mx, hover, p } = s
    const b = (a: number) => tint(s.brand, a)
    const pad = 16
    const fw = Math.min(118, (w - pad * 2) / 3.6)
    const fh = fw * 0.68
    const gap = 14
    const stride = fw + gap
    const y = (h - fh) / 2 + 6
    const speed = 26
    const scroll = t * speed
    const scanX = hover ? clamp(mx, pad, w - pad) : w * (0.5 + 0.38 * Math.sin(t * 0.55))

    const count = Math.ceil(w / stride) + 2
    const first = Math.floor(scroll / stride) - 1
    let validated = Math.max(0, Math.floor(t * 0.9))

    for (let k = first; k < first + count; k++) {
        const x = pad + k * stride - scroll + w * 0.2
        if (x + fw < -10 || x > w + 10) continue
        const flagged = rnd(k, 3) < 0.18
        const passed = x + fw / 2 < scanX
        const seen = passed || Math.abs(scanX - (x + fw / 2)) < 6

        // frame
        roundRect(ctx, x, y, fw, fh, 6)
        ctx.fillStyle = p.fg(0.03)
        ctx.fill()
        ctx.strokeStyle = p.line(0.14)
        ctx.lineWidth = 1
        ctx.stroke()

        // driver glyph: head, torso, wheel
        const cx = x + fw * 0.5, cy = y + fh * 0.42
        ctx.strokeStyle = p.fg(seen ? 0.75 : 0.35)
        ctx.lineWidth = 1.2
        ctx.beginPath(); ctx.arc(cx, cy - fh * 0.12, fh * 0.11, 0, Math.PI * 2); ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(cx - fw * 0.16, y + fh * 0.78)
        ctx.quadraticCurveTo(cx, y + fh * 0.22, cx + fw * 0.16, y + fh * 0.78)
        ctx.stroke()
        ctx.beginPath(); ctx.arc(cx, y + fh * 0.86, fw * 0.22, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke()
        // timecode
        label(ctx, `00:${String((k * 7) % 60).padStart(2, "0")}:${String((k * 13) % 30).padStart(2, "0")}`, x + 6, y + 9, { size: 7, color: p.muted(0.8) })

        if (seen) {
            const col = flagged ? p.amber(0.95) : b(0.95)
            cornerBox(ctx, x + 8, y + 10, fw - 16, fh - 20, col, 0.22, 1.4)
            const tag = flagged ? "REVIEW" : "VALID ✓"
            ctx.font = "600 8px \"JetBrains Mono\", monospace"
            const tw = ctx.measureText(tag).width + 10
            roundRect(ctx, x + fw - tw - 6, y + fh - 16, tw, 12, 3)
            ctx.fillStyle = col
            ctx.fill()
            label(ctx, tag, x + fw - 6 - tw / 2, y + fh - 10, { size: 8, align: "center", color: p.onAccent, weight: 600 })
        }
    }

    // scan line
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, b(0))
    grad.addColorStop(0.5, b(0.9))
    grad.addColorStop(1, b(0))
    ctx.fillStyle = grad
    ctx.fillRect(scanX - 1, 0, 2, h)
    ctx.shadowColor = b(0.8)
    ctx.shadowBlur = 18
    ctx.fillRect(scanX - 0.5, h * 0.15, 1, h * 0.7)
    ctx.shadowBlur = 0

    // HUD
    const rec = Math.floor(t * 2) % 2 === 0
    ctx.fillStyle = rec ? "rgba(255,95,109,0.95)" : "rgba(255,95,109,0.3)"
    ctx.beginPath(); ctx.arc(pad + 4, 14, 3, 0, Math.PI * 2); ctx.fill()
    label(ctx, w < 400 ? "REC  driver-cam" : "REC  driver-cam  ·  CV validation", pad + 12, 14, { size: 9, color: p.muted(0.95) })
    label(ctx, `${validated.toLocaleString()} frames validated`, w - pad, 14, { size: 9, color: p.fg(0.85), align: "right" })
    label(ctx, hover ? "drag the scan line →" : "replaces a manual review queue", pad, h - 12, { size: 9, color: p.muted(0.8) })
}
