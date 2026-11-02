import { useEffect, useRef, useState } from "react"

/**
 * Turns a photo into a WebGL point cloud: particles assemble from scatter into
 * the figure, breathe with noise, parallax with the pointer (pseudo-depth from
 * shading) and scatter away from the cursor when it comes close.
 *
 * The figure is faceless except for the nose. Shading comes from a heavily
 * blurred luminance map (large forms only), with a lightly blurred map blended
 * in inside a small "nose window" so the bridge and tip read while eyes, brows,
 * lips, teeth and nostrils stay averaged away.
 *
 * Below the neck the silhouette and shading are mirrored about the face axis
 * so the shoulders are balanced.
 *
 * Background removal: a bright, low-saturation backdrop is detected per pixel,
 * then flood-filled from the image border so enclosed bright regions (eye
 * whites, teeth) stay part of the figure instead of becoming holes.
 */

export interface NoseWindow {
    /** centre and radii in figure-box coordinates (0..1) */
    cx: number
    cy: number
    rx: number
    ry: number
}

interface Props {
    src: string
    /** "dark": luminous additive particles. "light": ink particles with normal blending. */
    mode?: "dark" | "light"
    /** Sampling step in source pixels. 2 is dense, 3 is lighter for phones. */
    step?: number
    /** Where to keep nose detail. Defaults are tuned for the current photo. */
    noseWindow?: NoseWindow
    /** Mirror the silhouette below this fraction of the figure height. */
    symmetrizeFrom?: number
    className?: string
}

const DEFAULT_NOSE: NoseWindow = { cx: 0.51, cy: 0.355, rx: 0.075, ry: 0.052 }

const VERT = `
precision highp float;
attribute vec2  a_uv;
attribute vec2  a_rand;
attribute float a_shade;   // shading 0..1
attribute float a_edge;    // large-scale edge strength 0..1

uniform vec2  uSize;
uniform vec4  uFit;
uniform vec2  uMouse;
uniform float uHasMouse;
uniform float uTime;
uniform float uProgress;
uniform float uDpr;

varying float v_alpha;
varying float v_edge;

void main(){
  vec2 tgt = uFit.xy + a_uv * uFit.zw;
  vec2 start = a_rand * uSize + (a_rand.yx - 0.5) * 420.0;
  float p = clamp(uProgress * 1.35 - a_rand.x * 0.35, 0.0, 1.0);
  p = 1.0 - pow(1.0 - p, 3.0);
  vec2 pos = mix(start, tgt, p);

  float depth = 0.5 * a_shade + 0.5 * (1.0 - clamp(length(a_uv - vec2(0.5, 0.38)) * 1.5, 0.0, 1.0));

  float amp = 1.1 + a_edge * 0.6;
  pos += vec2(sin(uTime * 0.9 + a_rand.x * 37.0), cos(uTime * 1.15 + a_rand.y * 41.0)) * amp;

  vec2 c = uFit.xy + uFit.zw * 0.5;
  vec2 m = (uMouse - c) / uSize;
  pos += m * (depth - 0.5) * 70.0 * uHasMouse;

  vec2 d = pos - uMouse;
  float L = max(length(d), 0.001);
  float push = smoothstep(110.0, 0.0, L) * 46.0 * uHasMouse;
  pos += (d / L) * push;

  float fade = 1.0 - smoothstep(0.78, 1.0, a_uv.y);
  v_alpha = (0.42 + 0.30 * a_shade + 0.55 * a_edge) * fade * p;
  v_edge = a_edge;

  float scale = uFit.z / 420.0;
  gl_PointSize = (1.7 + a_edge * 1.6 + depth * 0.7) * scale * uDpr;
  gl_Position = vec4(pos.x / uSize.x * 2.0 - 1.0, 1.0 - pos.y / uSize.y * 2.0, 0.0, 1.0);
}
`

const FRAG = `
precision mediump float;
uniform vec3  uColor;
uniform float uGain;
varying float v_alpha;
varying float v_edge;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float disc = 1.0 - smoothstep(0.55, 1.0, d);
  float a = disc * v_alpha * uGain;
  if (a <= 0.003) discard;
  gl_FragColor = vec4(uColor * a, a);
}
`

interface Cloud {
    uv: Float32Array
    rand: Float32Array
    shade: Float32Array
    edge: Float32Array
    count: number
    aspect: number
}

/** Separable box blur, repeated to approximate a Gaussian. Edge-clamped. */
function boxBlur(src: Float32Array, W: number, H: number, r: number, passes = 3): Float32Array {
    const a = Float32Array.from(src)
    const b = new Float32Array(W * H)
    const n = 2 * r + 1
    for (let pss = 0; pss < passes; pss++) {
        for (let y = 0; y < H; y++) {
            const row = y * W
            let acc = 0
            for (let x = -r; x <= r; x++) acc += a[row + Math.min(W - 1, Math.max(0, x))]
            for (let x = 0; x < W; x++) {
                b[row + x] = acc / n
                acc += a[row + Math.min(W - 1, x + r + 1)] - a[row + Math.max(0, x - r)]
            }
        }
        for (let x = 0; x < W; x++) {
            let acc = 0
            for (let y = -r; y <= r; y++) acc += b[Math.min(H - 1, Math.max(0, y)) * W + x]
            for (let y = 0; y < H; y++) {
                a[y * W + x] = acc / n
                acc += b[Math.min(H - 1, y + r + 1) * W + x] - b[Math.max(0, y - r) * W + x]
            }
        }
    }
    return a
}

function buildCloud(img: HTMLImageElement, step: number, nose: NoseWindow, symFrom: number): Cloud {
    const W = img.naturalWidth
    const H = img.naturalHeight
    const c = document.createElement("canvas")
    c.width = W
    c.height = H
    const ctx = c.getContext("2d", { willReadFrequently: true })!
    ctx.drawImage(img, 0, 0)
    const d = ctx.getImageData(0, 0, W, H).data

    // 1. per-pixel backdrop guess: bright and nearly grey
    const bgLike = new Uint8Array(W * H)
    const luma = new Float32Array(W * H)
    for (let i = 0, k = 0; i < W * H; i++, k += 4) {
        const r = d[k], g = d[k + 1], b = d[k + 2]
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
        bgLike[i] = (d[k + 3] < 10 || (mx >= 135 && mx - mn <= 20)) ? 1 : 0
        luma[i] = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    }

    // 2. flood fill backdrop from the border so interior bright patches stay figure
    const bg = new Uint8Array(W * H)
    const stack: number[] = []
    const push = (i: number) => { if (!bg[i] && bgLike[i]) { bg[i] = 1; stack.push(i) } }
    for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x) }
    for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1) }
    while (stack.length) {
        const i = stack.pop()!
        const x = i % W, y = (i - x) / W
        if (x > 0) push(i - 1)
        if (x < W - 1) push(i + 1)
        if (y > 0) push(i - W)
        if (y < H - 1) push(i + W)
    }
    const fig = new Uint8Array(W * H)
    for (let i = 0; i < W * H; i++) fig[i] = bg[i] ? 0 : 1

    // 3. figure bounding box and face axis (centre of the head rows)
    let minX = W, maxX = 0, minY = H, maxY = 0
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (!fig[y * W + x]) continue
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
    }
    if (maxX <= minX || maxY <= minY) { minX = 0; minY = 0; maxX = W - 1; maxY = H - 1 }
    let bh = maxY - minY + 1
    let axisSum = 0, axisN = 0
    for (let y = minY + Math.round(bh * 0.15); y < minY + Math.round(bh * 0.45); y++) {
        let l = -1, r = -1
        for (let x = 0; x < W; x++) if (fig[y * W + x]) { if (l < 0) l = x; r = x }
        if (l >= 0) { axisSum += (l + r) / 2; axisN++ }
    }
    const axis = axisN ? axisSum / axisN : (minX + maxX) / 2

    // 4. shading maps: heavy blur everywhere, light blur kept inside the nose window
    const bwGuess = maxX - minX + 1
    const heavy = boxBlur(luma, W, H, Math.max(6, Math.round(bwGuess * 0.035)), 3)
    const light = boxBlur(luma, W, H, Math.max(2, Math.round(bwGuess * 0.011)), 2)

    // 5. balance the shoulders: below the neck, mirror the silhouette and shading
    //    about the face axis (union of both sides, averaged shading)
    const symY = minY + Math.round(bh * symFrom)
    const fig2 = Uint8Array.from(fig)
    const shade = Float32Array.from(heavy)
    for (let y = symY; y < H; y++) {
        const blend = Math.min(1, (y - symY) / Math.max(1, bh * 0.08))
        for (let x = 0; x < W; x++) {
            const mx = Math.round(2 * axis - x)
            if (mx < 0 || mx >= W) continue
            const i = y * W + x, j = y * W + mx
            if (fig[i] && fig[j]) shade[i] = heavy[i] * (1 - blend * 0.5) + heavy[j] * blend * 0.5
            else if (!fig[i] && fig[j] && blend > 0.5) { fig2[i] = 1; shade[i] = heavy[j] }
        }
    }
    // recompute bbox after mirroring
    minX = W; maxX = 0
    for (let y = minY; y <= maxY; y++) for (let x = 0; x < W; x++) if (fig2[y * W + x]) { if (x < minX) minX = x; if (x > maxX) maxX = x }
    const bw = maxX - minX + 1
    bh = maxY - minY + 1

    const uv: number[] = [], rand: number[] = [], sh: number[] = [], edge: number[] = []
    let seed = 1234567
    const R = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
    const idx = (x: number, y: number) => Math.max(0, Math.min(H - 1, y)) * W + Math.max(0, Math.min(W - 1, x))
    const noseW = (u: number, v: number) => {
        const nx = (u - nose.cx) / nose.rx, ny = (v - nose.cy) / nose.ry
        const r = Math.sqrt(nx * nx + ny * ny)
        return r >= 1 ? 0 : r <= 0.6 ? 1 : (1 - r) / 0.4
    }

    for (let y = minY; y <= maxY; y += step) {
        for (let x = minX; x <= maxX; x += step) {
            const i = y * W + x
            if (!fig2[i]) continue
            const u = (x - minX) / bw, v = (y - minY) / bh
            const nw = noseW(u, v)
            const sAt = (xx: number, yy: number) => {
                const k = idx(xx, yy)
                return nw > 0 ? shade[k] * (1 - nw) + light[k] * nw : shade[k]
            }
            const s = sAt(x, y)
            const gx = sAt(x + step * 2, y) - sAt(x - step * 2, y)
            const gy = sAt(x, y + step * 2) - sAt(x, y - step * 2)
            const g = Math.sqrt(gx * gx + gy * gy)
            // strong large-scale edges (silhouette, hairline, collar) plus gentle nose relief
            const e = Math.max(0, Math.min(1, (g * 4.0 - 0.12) / 0.5)) * (1 - nw) + Math.min(1, g * 3.0) * nw * 0.7
            uv.push(u, v)
            rand.push(R(), R())
            sh.push(s)
            edge.push(e)
        }
    }
    return {
        uv: new Float32Array(uv),
        rand: new Float32Array(rand),
        shade: new Float32Array(sh),
        edge: new Float32Array(edge),
        count: sh.length,
        aspect: bw / bh,
    }
}

export default function ParticlePortrait({ src, mode = "dark", step = 2, noseWindow = DEFAULT_NOSE, symmetrizeFrom = 0.6, className }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [cloud, setCloud] = useState<Cloud | null>(null)

    useEffect(() => {
        let alive = true
        const img = new Image()
        img.onload = () => {
            if (!alive) return
            try { setCloud(buildCloud(img, step, noseWindow, symmetrizeFrom)) } catch (e) { console.error("ParticlePortrait: could not read image", e) }
        }
        img.onerror = () => console.error("ParticlePortrait: failed to load", src)
        img.src = src
        return () => { alive = false }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [src, step, noseWindow.cx, noseWindow.cy, noseWindow.rx, noseWindow.ry, symmetrizeFrom])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || !cloud) return
        const gl = canvas.getContext("webgl", { alpha: true, antialias: false, depth: false, premultipliedAlpha: true })
        if (!gl) return

        const mk = (type: number, s: string) => {
            const sh = gl.createShader(type)!
            gl.shaderSource(sh, s)
            gl.compileShader(sh)
            if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh))
            return sh
        }
        const prog = gl.createProgram()!
        gl.attachShader(prog, mk(gl.VERTEX_SHADER, VERT))
        gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, FRAG))
        gl.linkProgram(prog)
        gl.useProgram(prog)

        const buf = (data: Float32Array, name: string, size: number) => {
            const b = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, b)
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
            const loc = gl.getAttribLocation(prog, name)
            gl.enableVertexAttribArray(loc)
            gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0)
        }
        buf(cloud.uv, "a_uv", 2)
        buf(cloud.rand, "a_rand", 2)
        buf(cloud.shade, "a_shade", 1)
        buf(cloud.edge, "a_edge", 1)

        const U = (n: string) => gl.getUniformLocation(prog, n)
        const uSize = U("uSize"), uFit = U("uFit"), uMouse = U("uMouse"), uHas = U("uHasMouse")
        const uTime = U("uTime"), uProg = U("uProgress"), uDpr = U("uDpr"), uColor = U("uColor"), uGain = U("uGain")

        const mouse = { x: -1e4, y: -1e4, has: 0 }
        const onMove = (e: PointerEvent) => {
            if (e.pointerType === "touch") return
            const r = canvas.getBoundingClientRect()
            mouse.x = e.clientX - r.left
            mouse.y = e.clientY - r.top
            mouse.has = 1
        }
        const onLeave = () => { mouse.has = 0; mouse.x = -1e4; mouse.y = -1e4 }
        window.addEventListener("pointermove", onMove, { passive: true })
        document.documentElement.addEventListener("pointerleave", onLeave)

        gl.disable(gl.DEPTH_TEST)
        gl.enable(gl.BLEND)

        const t0 = performance.now()
        let raf = 0
        const frame = (now: number) => {
            raf = requestAnimationFrame(frame)
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            const cw = canvas.clientWidth || 1
            const ch = canvas.clientHeight || 1
            const bw = Math.round(cw * dpr), bh = Math.round(ch * dpr)
            if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh }
            gl.viewport(0, 0, bw, bh)
            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT)

            if (mode === "dark") {
                gl.blendFunc(gl.ONE, gl.ONE)
                gl.uniform3f(uColor, 0.93, 0.93, 0.97)
                gl.uniform1f(uGain, 0.9)
            } else {
                gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
                gl.uniform3f(uColor, 0.08, 0.08, 0.1)
                gl.uniform1f(uGain, 0.95)
            }

            const pad = 0.03
            let fw = cw * (1 - pad * 2)
            let fh = fw / cloud.aspect
            if (fh > ch * (1 - pad * 2)) { fh = ch * (1 - pad * 2); fw = fh * cloud.aspect }
            const fx = (cw - fw) / 2
            const fy = ch - fh - ch * pad   // sit the bust on the bottom edge

            const t = (now - t0) / 1000
            gl.uniform2f(uSize, cw, ch)
            gl.uniform4f(uFit, fx, fy, fw, fh)
            gl.uniform2f(uMouse, mouse.x, mouse.y)
            gl.uniform1f(uHas, mouse.has)
            gl.uniform1f(uTime, t)
            gl.uniform1f(uProg, Math.min(1, t / 2.4))
            gl.uniform1f(uDpr, dpr)
            gl.drawArrays(gl.POINTS, 0, cloud.count)
        }
        raf = requestAnimationFrame(frame)

        return () => {
            cancelAnimationFrame(raf)
            window.removeEventListener("pointermove", onMove)
            document.documentElement.removeEventListener("pointerleave", onLeave)
        }
    }, [cloud, mode])

    return <canvas ref={canvasRef} className={className} aria-label="Particle portrait of Raysen Susanto" role="img" />
}
