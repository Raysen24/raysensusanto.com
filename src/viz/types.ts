import type { Palette } from "../theme"

export interface VizState {
    w: number
    h: number
    /** seconds since the canvas first became visible (runs faster on hover) */
    t: number
    dt: number
    /** pointer in css px, -1 when not hovering */
    mx: number
    my: number
    hover: boolean
    /** theme-aware neutrals */
    p: Palette
    /** brand / subject colour for this visual, as a hex string */
    brand: string
}

export type DrawFn = (ctx: CanvasRenderingContext2D, s: VizState) => void
