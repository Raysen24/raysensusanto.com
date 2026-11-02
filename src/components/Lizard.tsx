import { useEffect, useRef } from "react"
import { mountLizard, type LizardHandle } from "../lib/lizard"

interface Props {
    enabled: boolean
    color?: string
    alpha?: number
}

/**
 * Full-viewport, click-through overlay in which the procedural lizard chases
 * the pointer. It is mounted once and paused/resumed via `enabled`, so the
 * creature keeps its pose when toggled back on.
 */
export default function Lizard({ enabled, color = "#ffffff", alpha = 0.8 }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const handleRef = useRef<LizardHandle | null>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const lizard = mountLizard(canvas, { legs: 4, size: 3.4, tail: 18, color, alpha, lineWidth: 1 })
        handleRef.current = lizard

        // Until the pointer moves, aim for a slow wander so the creature is
        // alive on first paint rather than frozen at the centre.
        let hasPointer = false
        let wanderRaf = 0
        const t0 = performance.now()
        const wander = (now: number) => {
            wanderRaf = requestAnimationFrame(wander)
            if (hasPointer) return
            const t = (now - t0) / 1000
            const w = window.innerWidth
            const h = window.innerHeight
            lizard.setTarget(
                w * (0.5 + 0.32 * Math.sin(t * 0.35)),
                h * (0.5 + 0.28 * Math.sin(t * 0.52 + 1.3))
            )
        }
        wanderRaf = requestAnimationFrame(wander)

        const onMove = (e: PointerEvent) => {
            if (e.pointerType === "touch") return
            hasPointer = true
            lizard.setTarget(e.clientX, e.clientY)
        }
        window.addEventListener("pointermove", onMove, { passive: true })

        return () => {
            cancelAnimationFrame(wanderRaf)
            window.removeEventListener("pointermove", onMove)
            lizard.destroy()
            handleRef.current = null
        }
    }, [])

    useEffect(() => {
        handleRef.current?.setOptions({ color, alpha })
    }, [color, alpha])

    useEffect(() => {
        if (enabled) handleRef.current?.resume()
        else handleRef.current?.pause()
    }, [enabled])

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="lizard-layer"
            style={{ opacity: enabled ? 1 : 0 }}
        />
    )
}
