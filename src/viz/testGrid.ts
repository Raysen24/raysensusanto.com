import type { DrawFn } from "./types"
import { clamp, dist, easeOut, label, rnd, roundRect, tint } from "./util"

/**
 * QA / research grid.
 *  - "qa": cells fill in reading order, some flag red then get fixed.
 *  - "heat": subject x school accuracy heatmap that brightens as misalignments are fixed.
 */
export function testGrid(variant: "qa" | "heat" = "qa"): DrawFn {
    return (ctx, s) => {
        const { w, h, t, mx, my, p } = s
        const b = (a: number) => tint(s.brand, a)
        const pad = 16
        const cols = variant === "qa" ? 16 : 15
        const rows = variant === "qa" ? 6 : 3
        const top = variant === "qa" ? 34 : 44
        const bottom = h - 28
        const left = variant === "heat" ? pad + 26 : pad
        const gap = 3
        const cw = (w - left - pad - gap * (cols - 1)) / cols
        const ch = (bottom - top - gap * (rows - 1)) / rows
        const total = cols * rows
        const cycle = 7
        const phase = (t % cycle) / cycle

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const i = r * cols + c
                const x = left + c * (cw + gap)
                const y = top + r * (ch + gap)
                const near = mx >= 0 ? clamp(1 - dist(mx, my, x + cw / 2, y + ch / 2) / 60, 0, 1) : 0
                let fill: string
                if (variant === "qa") {
                    const when = i / total
                    const done = clamp((phase - when * 0.75) / 0.03, 0, 1)
                    const defect = rnd(i, 21) < 0.1
                    const fixedAt = when * 0.75 + 0.1
                    const fixed = clamp((phase - fixedAt) / 0.03, 0, 1)
                    if (done <= 0) fill = p.line(0.06 + near * 0.2)
                    else if (defect && fixed < 1) fill = p.red(0.55 + 0.3 * (1 - fixed))
                    else fill = b(0.35 + 0.55 * done + near * 0.1)
                } else {
                    const base = 0.3 + rnd(i, 31) * 0.5
                    const gain = easeOut((phase - 0.2) / 0.6) * 0.34
                    const acc = clamp(base + gain, 0, 1)
                    fill = b(0.08 + acc * 0.8 + near * 0.1)
                }
                roundRect(ctx, x, y, cw, ch, 2)
                ctx.fillStyle = fill
                ctx.fill()
            }
        }

        if (variant === "qa") {
            const cov = Math.round(100 * easeOut(phase / 0.8))
            label(ctx, "TEST SUITE · NATIONAL ROLLOUT", pad, 14, { size: 9, color: p.muted(0.9) })
            label(ctx, `coverage ${cov}%`, w - pad, 14, { size: 10, color: p.fg(0.95), align: "right", weight: 600 })
            label(ctx, phase > 0.5 ? "defects caught and fixed before launch" : "executing cross-platform cases…", pad, h - 12, { size: 9, color: b(0.95) })
        } else {
            label(ctx, "WORKSHEET TOPIC ACCURACY", pad, 14, { size: 9, color: p.muted(0.9) })
            const gain = easeOut((phase - 0.2) / 0.6)
            label(ctx, gain > 0.95 ? "accuracy ↑ ✓" : "aligning topics…", w - pad, 14, { size: 10, color: b(0.95), align: "right", weight: 600 })
            const subjects = ["S1", "S2", "S3"]
            subjects.forEach((sj, r) => label(ctx, sj, pad, top + r * (ch + gap) + ch / 2, { size: 9, color: p.muted(0.9) }))
            label(ctx, "many schools  ·  several subjects  ·  GTM framework", pad, h - 12, { size: 9, color: p.muted(0.85) })
            label(ctx, "schools →", left, 30, { size: 8, color: p.muted(0.6) })
        }
    }
}
