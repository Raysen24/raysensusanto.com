import { useEffect, useRef } from "react"
import type { DrawFn } from "../viz/types"
import type { Palette } from "../theme"

interface Props {
    draw: DrawFn
    palette: Palette
    /** brand / subject colour for this visual */
    brand: string
    /** width / height */
    ratio?: number
    className?: string
}

/**
 * A small animated canvas. It only runs while on screen, tracks the pointer
 * in CSS pixels, and hands a stateless draw function the elapsed time so each
 * visualisation can be written as a pure function of (t, pointer).
 */
export default function Viz({ draw, palette, brand, ratio = 16 / 10, className }: Props) {
    const ref = useRef<HTMLCanvasElement>(null)
    const drawRef = useRef(draw)
    drawRef.current = draw
    const palRef = useRef(palette)
    palRef.current = palette
    const brandRef = useRef(brand)
    brandRef.current = brand

    useEffect(() => {
        const canvas = ref.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const st = { t: reduced ? 7 : 0, mx: -1, my: -1, hover: false }
        let visible = false
        let raf = 0
        let last = 0
        let dpr = 1
        let w = 0
        let h = 0

        const fit = () => {
            dpr = Math.min(window.devicePixelRatio || 1, 2)
            w = canvas.clientWidth
            h = canvas.clientHeight
            const bw = Math.max(1, Math.round(w * dpr))
            const bh = Math.max(1, Math.round(h * dpr))
            if (canvas.width !== bw || canvas.height !== bh) {
                canvas.width = bw
                canvas.height = bh
            }
        }

        const paint = (dt: number) => {
            fit()
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx.clearRect(0, 0, w, h)
            drawRef.current(ctx, { w, h, t: st.t, dt, mx: st.mx, my: st.my, hover: st.hover, p: palRef.current, brand: brandRef.current })
        }

        const loop = (now: number) => {
            raf = requestAnimationFrame(loop)
            const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
            last = now
            st.t += dt * (st.hover ? 1.6 : 1)
            paint(dt)
        }

        const start = () => { if (!raf) { last = 0; raf = requestAnimationFrame(loop) } }
        const stop = () => { cancelAnimationFrame(raf); raf = 0 }

        const io = new IntersectionObserver(
            (es) => {
                visible = es[0]?.isIntersecting ?? false
                if (visible && !reduced) start()
                else { stop(); if (reduced) paint(0) }
            },
            { rootMargin: "80px" }
        )
        io.observe(canvas)

        const onMove = (e: PointerEvent) => {
            const r = canvas.getBoundingClientRect()
            st.mx = e.clientX - r.left
            st.my = e.clientY - r.top
            st.hover = true
        }
        const onLeave = () => { st.mx = -1; st.my = -1; st.hover = false }
        canvas.addEventListener("pointermove", onMove)
        canvas.addEventListener("pointerleave", onLeave)
        const ro = new ResizeObserver(() => { if (!visible || reduced) paint(0) })
        ro.observe(canvas)

        return () => {
            stop()
            io.disconnect()
            ro.disconnect()
            canvas.removeEventListener("pointermove", onMove)
            canvas.removeEventListener("pointerleave", onLeave)
        }
    }, [])

    return (
        <canvas
            ref={ref}
            className={"viz " + (className ?? "")}
            style={{ aspectRatio: String(ratio) }}
            aria-hidden="true"
        />
    )
}
