export const MONO = '"JetBrains Mono", ui-monospace, monospace'
export const SANS = '"Inter", system-ui, sans-serif'

/** Deterministic pseudo-random in [0,1) for an integer index and salt. */
export function rnd(i: number, salt = 0): number {
    let x = (i * 374761393 + salt * 668265263) | 0
    x = Math.imul(x ^ (x >>> 13), 1274126177)
    return ((x ^ (x >>> 16)) >>> 0) / 4294967296
}

export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3)
export const easeInOut = (t: number) => { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 }
export const pulse = (t: number, period = 1) => 0.5 + 0.5 * Math.sin((t / period) * Math.PI * 2)

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    const rr = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + rr, y)
    ctx.arcTo(x + w, y, x + w, y + h, rr)
    ctx.arcTo(x + w, y + h, x, y + h, rr)
    ctx.arcTo(x, y + h, x, y, rr)
    ctx.arcTo(x, y, x + w, y, rr)
    ctx.closePath()
}

export function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, opts: { size?: number; color?: string; align?: CanvasTextAlign; font?: string; weight?: number } = {}) {
    ctx.font = `${opts.weight ?? 500} ${opts.size ?? 11}px ${opts.font ?? MONO}`
    ctx.fillStyle = opts.color ?? "rgba(128,128,128,0.9)"
    ctx.textAlign = opts.align ?? "left"
    ctx.textBaseline = "middle"
    ctx.fillText(text, x, y)
}

/** Draws the four corner ticks of a detection box. */
export function cornerBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, k = 0.25, lw = 1.5) {
    const cx = w * k, cy = h * k
    ctx.strokeStyle = color
    ctx.lineWidth = lw
    ctx.beginPath()
    ctx.moveTo(x, y + cy); ctx.lineTo(x, y); ctx.lineTo(x + cx, y)
    ctx.moveTo(x + w - cx, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + cy)
    ctx.moveTo(x + w, y + h - cy); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - cx, y + h)
    ctx.moveTo(x + cx, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - cy)
    ctx.stroke()
}

export function fmt(n: number) {
    return Math.round(n).toLocaleString("en-US")
}

export function dist(ax: number, ay: number, bx: number, by: number) {
    return Math.hypot(ax - bx, ay - by)
}

/** rgba() from a hex colour and an alpha. */
export function tint(hex: string, a: number): string {
    const h = hex.replace("#", "")
    const n = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16)
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}
