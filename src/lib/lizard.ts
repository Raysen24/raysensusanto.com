// Procedural "lizard follows cursor" creature.
// Ported from the vanilla canvas demo (Segment / LimbSystem / LegSystem /
// Creature inverse-kinematics) into a self-contained module that can be
// mounted on any canvas, resized, recoloured, paused and destroyed.
// The physics and skeleton construction are kept identical to the original;
// only the plumbing (input, timing, DPR, lifecycle) is new.

export interface LizardOptions {
    /** Skeleton scale. The original used 8 / sqrt(legPairs). */
    size?: number
    /** Number of leg pairs. */
    legs?: number
    /** Number of tail vertebrae. */
    tail?: number
    /** Stroke colour. */
    color?: string
    /** Stroke width in CSS px. */
    lineWidth?: number
    /** Overall opacity of the creature. */
    alpha?: number
    /** Simulation tick in ms. The original stepped every 33 ms. */
    tickMs?: number
}

interface Parented {
    x: number
    y: number
    absAngle: number
    children: Segment[]
    isSegment?: boolean
}

class Segment implements Parented {
    isSegment = true
    parent: Parented
    children: Segment[] = []
    size: number
    relAngle: number
    defAngle: number
    absAngle: number
    range: number
    stiffness: number
    x = 0
    y = 0

    constructor(parent: Parented, size: number, angle: number, range: number, stiffness: number) {
        this.parent = parent
        parent.children.push(this)
        this.size = size
        this.relAngle = angle
        this.defAngle = angle
        this.absAngle = parent.absAngle + angle
        this.range = range
        this.stiffness = stiffness
        this.updateRelative(false, true)
    }

    updateRelative(iter: boolean, flex: boolean) {
        this.relAngle =
            this.relAngle -
            2 * Math.PI * Math.floor((this.relAngle - this.defAngle) / 2 / Math.PI + 1 / 2)
        if (flex) {
            this.relAngle = Math.min(
                this.defAngle + this.range / 2,
                Math.max(
                    this.defAngle - this.range / 2,
                    (this.relAngle - this.defAngle) / this.stiffness + this.defAngle
                )
            )
        }
        this.absAngle = this.parent.absAngle + this.relAngle
        this.x = this.parent.x + Math.cos(this.absAngle) * this.size
        this.y = this.parent.y + Math.sin(this.absAngle) * this.size
        if (iter) {
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].updateRelative(iter, flex)
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D, iter: boolean) {
        ctx.moveTo(this.parent.x, this.parent.y)
        ctx.lineTo(this.x, this.y)
        if (iter) {
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].draw(ctx, true)
            }
        }
    }

    follow(iter: boolean) {
        const x = this.parent.x
        const y = this.parent.y
        const dist = ((this.x - x) ** 2 + (this.y - y) ** 2) ** 0.5 || 1e-6
        this.x = x + (this.size * (this.x - x)) / dist
        this.y = y + (this.size * (this.y - y)) / dist
        this.absAngle = Math.atan2(this.y - y, this.x - x)
        this.relAngle = this.absAngle - this.parent.absAngle
        this.updateRelative(false, true)
        if (iter) {
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].follow(true)
            }
        }
    }
}

class LimbSystem {
    end: Segment
    length: number
    creature: Creature
    speed: number
    nodes: Segment[] = []
    hip: Parented
    step = 0

    constructor(end: Segment, length: number, speed: number, creature: Creature) {
        this.end = end
        this.length = Math.max(1, length)
        this.creature = creature
        this.speed = speed
        creature.systems.push(this)
        let node: Parented = end
        for (let i = 0; i < length; i++) {
            this.nodes.unshift(node as Segment)
            node = (node as Segment).parent
            if (!node.isSegment) {
                this.length = i + 1
                break
            }
        }
        this.hip = this.nodes[0].parent
    }

    moveTo(x: number, y: number) {
        this.nodes[0].updateRelative(true, true)
        const dist = ((x - this.end.x) ** 2 + (y - this.end.y) ** 2) ** 0.5
        let len = Math.max(0, dist - this.speed)
        for (let i = this.nodes.length - 1; i >= 0; i--) {
            const node = this.nodes[i]
            const ang = Math.atan2(node.y - y, node.x - x)
            node.x = x + len * Math.cos(ang)
            node.y = y + len * Math.sin(ang)
            x = node.x
            y = node.y
            len = node.size
        }
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i]
            node.absAngle = Math.atan2(node.y - node.parent.y, node.x - node.parent.x)
            node.relAngle = node.absAngle - node.parent.absAngle
            for (let ii = 0; ii < node.children.length; ii++) {
                const childNode = node.children[ii]
                if (!this.nodes.includes(childNode)) {
                    childNode.updateRelative(true, false)
                }
            }
        }
    }

    update(x: number, y: number) {
        this.moveTo(x, y)
    }
}

class LegSystem extends LimbSystem {
    goalX: number
    goalY: number
    forwardness = 0
    reach: number
    swing: number
    swingOffset: number

    constructor(end: Segment, length: number, speed: number, creature: Creature) {
        super(end, length, speed, creature)
        this.goalX = end.x
        this.goalY = end.y
        this.step = 0 // 0 stand still, 1 move forward
        this.reach = 0.9 * ((this.end.x - this.hip.x) ** 2 + (this.end.y - this.hip.y) ** 2) ** 0.5
        let relAngle =
            this.creature.absAngle - Math.atan2(this.end.y - this.hip.y, this.end.x - this.hip.x)
        relAngle -= 2 * Math.PI * Math.floor(relAngle / 2 / Math.PI + 1 / 2)
        this.swing = -relAngle + ((2 * (relAngle < 0 ? 1 : 0) - 1) * Math.PI) / 2
        this.swingOffset = this.creature.absAngle - this.hip.absAngle
    }

    update() {
        this.moveTo(this.goalX, this.goalY)
        if (this.step === 0) {
            const dist = ((this.end.x - this.goalX) ** 2 + (this.end.y - this.goalY) ** 2) ** 0.5
            if (dist > 1) {
                this.step = 1
                this.goalX =
                    this.hip.x +
                    this.reach * Math.cos(this.swing + this.hip.absAngle + this.swingOffset) +
                    ((2 * Math.random() - 1) * this.reach) / 2
                this.goalY =
                    this.hip.y +
                    this.reach * Math.sin(this.swing + this.hip.absAngle + this.swingOffset) +
                    ((2 * Math.random() - 1) * this.reach) / 2
            }
        } else if (this.step === 1) {
            const theta =
                Math.atan2(this.end.y - this.hip.y, this.end.x - this.hip.x) - this.hip.absAngle
            const dist = ((this.end.x - this.hip.x) ** 2 + (this.end.y - this.hip.y) ** 2) ** 0.5
            const forwardness2 = dist * Math.cos(theta)
            const dF = this.forwardness - forwardness2
            this.forwardness = forwardness2
            if (dF * dF < 1) {
                this.step = 0
                this.goalX = this.hip.x + (this.end.x - this.hip.x)
                this.goalY = this.hip.y + (this.end.y - this.hip.y)
            }
        }
    }
}

class Creature implements Parented {
    x: number
    y: number
    absAngle: number
    fSpeed = 0
    fAccel: number
    fFric: number
    fRes: number
    fThresh: number
    rSpeed = 0
    rAccel: number
    rFric: number
    rRes: number
    rThresh: number
    speed = 0
    children: Segment[] = []
    systems: LimbSystem[] = []

    constructor(
        x: number, y: number, angle: number,
        fAccel: number, fFric: number, fRes: number, fThresh: number,
        rAccel: number, rFric: number, rRes: number, rThresh: number
    ) {
        this.x = x
        this.y = y
        this.absAngle = angle
        this.fAccel = fAccel
        this.fFric = fFric
        this.fRes = fRes
        this.fThresh = fThresh
        this.rAccel = rAccel
        this.rFric = rFric
        this.rRes = rRes
        this.rThresh = rThresh
    }

    follow(x: number, y: number) {
        const dist = ((this.x - x) ** 2 + (this.y - y) ** 2) ** 0.5
        const angle = Math.atan2(y - this.y, x - this.x)
        // forward
        let accel = this.fAccel
        if (this.systems.length > 0) {
            let sum = 0
            for (let i = 0; i < this.systems.length; i++) {
                sum += this.systems[i].step === 0 ? 1 : 0
            }
            accel *= sum / this.systems.length
        }
        this.fSpeed += accel * (dist > this.fThresh ? 1 : 0)
        this.fSpeed *= 1 - this.fRes
        this.speed = Math.max(0, this.fSpeed - this.fFric)
        // rotation
        let dif = this.absAngle - angle
        dif -= 2 * Math.PI * Math.floor(dif / (2 * Math.PI) + 1 / 2)
        if (Math.abs(dif) > this.rThresh && dist > this.fThresh) {
            this.rSpeed -= this.rAccel * (2 * (dif > 0 ? 1 : 0) - 1)
        }
        this.rSpeed *= 1 - this.rRes
        if (Math.abs(this.rSpeed) > this.rFric) {
            this.rSpeed -= this.rFric * (2 * (this.rSpeed > 0 ? 1 : 0) - 1)
        } else {
            this.rSpeed = 0
        }
        // position
        this.absAngle += this.rSpeed
        this.absAngle -= 2 * Math.PI * Math.floor(this.absAngle / (2 * Math.PI) + 1 / 2)
        this.x += this.speed * Math.cos(this.absAngle)
        this.y += this.speed * Math.sin(this.absAngle)
        this.absAngle += Math.PI
        for (let i = 0; i < this.children.length; i++) {
            this.children[i].follow(true)
        }
        for (let i = 0; i < this.systems.length; i++) {
            this.systems[i].update(x, y)
        }
        this.absAngle -= Math.PI
    }

    draw(ctx: CanvasRenderingContext2D) {
        const r = 4
        ctx.beginPath()
        ctx.arc(this.x, this.y, r, Math.PI / 4 + this.absAngle, (7 * Math.PI) / 4 + this.absAngle)
        ctx.moveTo(
            this.x + r * Math.cos((7 * Math.PI) / 4 + this.absAngle),
            this.y + r * Math.sin((7 * Math.PI) / 4 + this.absAngle)
        )
        ctx.lineTo(
            this.x + r * Math.cos(this.absAngle) * 2 ** 0.5,
            this.y + r * Math.sin(this.absAngle) * 2 ** 0.5
        )
        ctx.lineTo(
            this.x + r * Math.cos(Math.PI / 4 + this.absAngle),
            this.y + r * Math.sin(Math.PI / 4 + this.absAngle)
        )
        for (let i = 0; i < this.children.length; i++) {
            this.children[i].draw(ctx, true)
        }
        ctx.stroke()
    }
}

/** Builds the lizard skeleton exactly as the original setupLizard did. */
function buildLizard(x: number, y: number, s: number, legs: number, tail: number): Creature {
    const critter = new Creature(x, y, 0, s * 10, s * 2, 0.5, 16, 0.5, 0.085, 0.5, 0.3)
    let spinal: Parented = critter
    // Neck
    for (let i = 0; i < 6; i++) {
        spinal = new Segment(spinal, s * 4, 0, (3.1415 * 2) / 3, 1.1)
        for (let ii = -1; ii <= 1; ii += 2) {
            let node = new Segment(spinal, s * 3, ii, 0.1, 2)
            for (let iii = 0; iii < 3; iii++) {
                node = new Segment(node, s * 0.1, -ii * 0.1, 0.1, 2)
            }
        }
    }
    // Torso and legs
    for (let i = 0; i < legs; i++) {
        if (i > 0) {
            // Vertebrae and ribs
            for (let ii = 0; ii < 6; ii++) {
                spinal = new Segment(spinal, s * 4, 0, 1.571, 1.5)
                for (let iii = -1; iii <= 1; iii += 2) {
                    let node = new Segment(spinal, s * 3, iii * 1.571, 0.1, 1.5)
                    for (let iv = 0; iv < 3; iv++) {
                        node = new Segment(node, s * 3, -iii * 0.3, 0.1, 2)
                    }
                }
            }
        }
        // Legs and shoulders
        for (let ii = -1; ii <= 1; ii += 2) {
            let node = new Segment(spinal, s * 12, ii * 0.785, 0, 8) // hip
            node = new Segment(node, s * 16, -ii * 0.785, 6.28, 1) // humerus
            node = new Segment(node, s * 16, ii * 1.571, 3.1415, 2) // forearm
            for (let iii = 0; iii < 4; iii++) {
                new Segment(node, s * 4, (iii / 3 - 0.5) * 1.571, 0.1, 4) // fingers
            }
            new LegSystem(node, 3, s * 12, critter)
        }
    }
    // Tail
    for (let i = 0; i < tail; i++) {
        spinal = new Segment(spinal, s * 4, 0, (3.1415 * 2) / 3, 1.1)
        for (let ii = -1; ii <= 1; ii += 2) {
            let node = new Segment(spinal, s * 3, ii, 0.1, 2)
            for (let iii = 0; iii < 3; iii++) {
                node = new Segment(node, (s * 3 * (tail - i)) / tail, -ii * 0.1, 0.1, 2)
            }
        }
    }
    return critter
}

export interface LizardHandle {
    setTarget(x: number, y: number): void
    setOptions(o: Partial<Pick<LizardOptions, "color" | "lineWidth" | "alpha">>): void
    pause(): void
    resume(): void
    destroy(): void
}

export function mountLizard(canvas: HTMLCanvasElement, opts: LizardOptions = {}): LizardHandle {
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Lizard: 2D context unavailable")

    const legs = Math.max(1, Math.round(opts.legs ?? 4))
    const size = opts.size ?? 8 / Math.sqrt(legs)
    const tail = Math.max(1, Math.round(opts.tail ?? 20))
    const tickMs = opts.tickMs ?? 33
    let color = opts.color ?? "#ffffff"
    let lineWidth = opts.lineWidth ?? 1
    let alpha = opts.alpha ?? 1

    let w = 0
    let h = 0
    let dpr = 1
    const fit = () => {
        dpr = Math.min(window.devicePixelRatio || 1, 2)
        w = canvas.clientWidth || window.innerWidth
        h = canvas.clientHeight || window.innerHeight
        const bw = Math.max(1, Math.round(w * dpr))
        const bh = Math.max(1, Math.round(h * dpr))
        if (canvas.width !== bw || canvas.height !== bh) {
            canvas.width = bw
            canvas.height = bh
        }
    }
    fit()

    const target = { x: w / 2, y: h / 2 }
    const critter = buildLizard(w / 2, h / 2, size, legs, tail)

    let running = true
    let raf = 0
    let acc = 0
    let last = performance.now()

    const frame = (now: number) => {
        raf = requestAnimationFrame(frame)
        const dt = Math.min(100, now - last)
        last = now
        if (!running) return
        acc += dt
        let stepped = false
        // Fixed-step the simulation at the original cadence so the gait feels the
        // same at 60, 120 or 144 Hz.
        while (acc >= tickMs) {
            critter.follow(target.x, target.y)
            acc -= tickMs
            stepped = true
        }
        if (!stepped) return
        fit()
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, w, h)
        ctx.globalAlpha = alpha
        ctx.strokeStyle = color
        ctx.lineWidth = lineWidth
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        critter.draw(ctx)
    }
    raf = requestAnimationFrame(frame)

    const onResize = () => fit()
    window.addEventListener("resize", onResize)

    return {
        setTarget(x, y) {
            target.x = x
            target.y = y
        },
        setOptions(o) {
            if (o.color) color = o.color
            if (typeof o.lineWidth === "number") lineWidth = o.lineWidth
            if (typeof o.alpha === "number") alpha = o.alpha
        },
        pause() {
            running = false
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx.clearRect(0, 0, w, h)
        },
        resume() {
            running = true
            last = performance.now()
            acc = 0
        },
        destroy() {
            cancelAnimationFrame(raf)
            window.removeEventListener("resize", onResize)
        },
    }
}
