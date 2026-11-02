import type { DrawFn } from "./types"
import { clamp, cornerBox, dist, easeOut, label, roundRect, tint } from "./util"

interface Item { name: string; price: number; x: number; y: number; w: number; h: number; shape: "ring" | "rect" | "tri" | "oval" | "dot"; tone: string }

const ITEMS: Item[] = [
    { name: "croissant", price: 18, x: 0.10, y: 0.18, w: 0.26, h: 0.26, shape: "oval", tone: "214,160,98" },
    { name: "donut", price: 15, x: 0.42, y: 0.12, w: 0.22, h: 0.3, shape: "ring", tone: "222,126,140" },
    { name: "sourdough", price: 32, x: 0.68, y: 0.2, w: 0.26, h: 0.3, shape: "rect", tone: "196,142,88" },
    { name: "cake slice", price: 24, x: 0.14, y: 0.56, w: 0.24, h: 0.3, shape: "tri", tone: "226,178,120" },
    { name: "cookie", price: 9, x: 0.5, y: 0.6, w: 0.17, h: 0.24, shape: "dot", tone: "170,116,72" },
]

/** Bakery self-checkout: YOLO boxes appear over pastries, receipt totals up. */
export const yoloTray: DrawFn = (ctx, s) => {
    const { w, h, t, mx, my, p } = s
    const b = (a: number) => tint(s.brand, a)
    const pad = 14
    const trayW = Math.min(w * 0.6, w - 150)
    const tx = pad, ty = 26, tw = trayW, th = h - ty - pad
    const period = 6
    const phase = (t % period) / period

    // tray
    roundRect(ctx, tx, ty, tw, th, 10)
    ctx.fillStyle = "rgba(255,255,255,0.03)"
    ctx.fill()
    ctx.strokeStyle = p.line(0.14)
    ctx.lineWidth = 1
    ctx.stroke()

    let total = 0
    let detected = 0
    ITEMS.forEach((it, i) => {
        const x = tx + it.x * tw, y = ty + it.y * th, iw = it.w * tw, ih = it.h * th
        const cx = x + iw / 2, cy = y + ih / 2
        // pastry
        ctx.fillStyle = `rgba(${it.tone},0.75)`
        ctx.beginPath()
        if (it.shape === "ring") { ctx.arc(cx, cy, Math.min(iw, ih) / 2, 0, Math.PI * 2); ctx.arc(cx, cy, Math.min(iw, ih) / 5, 0, Math.PI * 2, true) }
        else if (it.shape === "rect") { roundRect(ctx, x, y + ih * 0.15, iw, ih * 0.7, 8) }
        else if (it.shape === "tri") { ctx.moveTo(x, y + ih); ctx.lineTo(cx, y); ctx.lineTo(x + iw, y + ih); ctx.closePath() }
        else if (it.shape === "oval") { ctx.ellipse(cx, cy, iw / 2, ih / 3, -0.4, 0, Math.PI * 2) }
        else { ctx.arc(cx, cy, Math.min(iw, ih) / 2.3, 0, Math.PI * 2) }
        ctx.fill()

        // detection timing
        const at = 0.08 + i * 0.11
        const k = easeOut((phase - at) / 0.08)
        const near = mx >= 0 && dist(mx, my, cx, cy) < Math.max(iw, ih) * 0.7
        if (k > 0 || near) {
            detected++
            total += it.price
            const col = near ? p.fg(0.95) : b(0.95)
            const grow = near ? 1 : k
            const bx = cx - (iw / 2 + 5) * grow, by = cy - (ih / 2 + 5) * grow
            cornerBox(ctx, bx, by, (iw + 10) * grow, (ih + 10) * grow, col, 0.22, 1.3)
            if (grow > 0.8) {
                const conf = (0.93 + 0.06 * (1 - i / ITEMS.length)).toFixed(2)
                const txt = `${it.name} ${conf}`
                ctx.font = "600 8px \"JetBrains Mono\", monospace"
                const lw = ctx.measureText(txt).width + 8
                roundRect(ctx, bx, by - 12, lw, 11, 3)
                ctx.fillStyle = col
                ctx.fill()
                label(ctx, txt, bx + 4, by - 6.5, { size: 8, color: p.onAccent, weight: 600 })
            }
        }
    })

    // receipt
    const rx = tx + tw + 12, rw = w - rx - pad
    roundRect(ctx, rx, ty, rw, th, 8)
    ctx.fillStyle = "rgba(255,255,255,0.03)"
    ctx.fill()
    ctx.strokeStyle = p.line(0.14)
    ctx.stroke()
    label(ctx, "SELF-CHECKOUT", rx + 10, ty + 14, { size: 8, color: p.muted(0.9) })
    let ly = ty + 32
    ITEMS.forEach((it, i) => {
        const at = 0.08 + i * 0.11
        if (phase < at) return
        label(ctx, it.name, rx + 10, ly, { size: 8, color: p.fg(0.85) })
        label(ctx, `${it.price}k`, rx + rw - 10, ly, { size: 8, color: p.muted(0.9), align: "right" })
        ly += 14
    })
    ctx.strokeStyle = p.line(0.14)
    ctx.beginPath(); ctx.moveTo(rx + 10, th + ty - 34); ctx.lineTo(rx + rw - 10, th + ty - 34); ctx.stroke()
    label(ctx, "total", rx + 10, th + ty - 20, { size: 8, color: p.muted(0.9) })
    label(ctx, `Rp ${total}k`, rx + rw - 10, th + ty - 20, { size: 11, color: b(0.95), align: "right", weight: 600 })

    label(ctx, `YOLOv8 · OpenCV · ${detected}/${ITEMS.length} items`, pad, 13, { size: 9, color: p.muted(0.9) })
    label(ctx, clamp(phase / 0.7, 0, 1) > 0.95 ? "wait time ↓ ✓" : "checking out…", w - pad, 13, { size: 9, color: b(0.95), align: "right" })
}
