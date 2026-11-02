export type Theme = "dark" | "light"

type RGB = [number, number, number]

export interface Palette {
    theme: Theme
    bg: string
    fgHex: string
    /** rgba helpers for canvas work */
    fg: (a: number) => string
    muted: (a: number) => string
    line: (a: number) => string
    accent: (a: number) => string
    red: (a: number) => string
    amber: (a: number) => string
    /** text colour to put on top of a solid accent fill */
    onAccent: string
    /** colours handed to the WebGL layers */
    particleBase: string
    particleAccent: string
    lizard: string
}

const rgba = (c: RGB) => (a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`

export const PALETTES: Record<Theme, Palette> = {
    dark: {
        theme: "dark",
        bg: "#060606",
        fgHex: "#f2f2f2",
        fg: rgba([242, 242, 242]),
        muted: rgba([150, 150, 158]),
        line: rgba([255, 255, 255]),
        accent: rgba([255, 255, 255]),
        red: rgba([255, 95, 109]),
        amber: rgba([255, 196, 77]),
        onAccent: "#0a0a0a",
        particleBase: "#ffffff",
        particleAccent: "#ffffff",
        lizard: "#ffffff",
    },
    light: {
        theme: "light",
        bg: "#f4f3ef",
        fgHex: "#111111",
        fg: rgba([17, 17, 17]),
        muted: rgba([108, 108, 116]),
        line: rgba([0, 0, 0]),
        accent: rgba([17, 17, 17]),
        red: rgba([214, 54, 72]),
        amber: rgba([190, 120, 0]),
        onAccent: "#f4f3ef",
        particleBase: "#111111",
        particleAccent: "#111111",
        lizard: "#111111",
    },
}

const KEY = "raysen.theme"

export function readStoredTheme(): Theme | null {
    try {
        const v = localStorage.getItem(KEY)
        return v === "light" || v === "dark" ? v : null
    } catch {
        return null
    }
}

export function storeTheme(t: Theme) {
    try { localStorage.setItem(KEY, t) } catch {}
}
