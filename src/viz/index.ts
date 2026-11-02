import type { DrawFn } from "./types"
import { lastMile } from "./lastMile"
import { qualityGate } from "./qualityGate"
import { labSession } from "./labSession"
import { videoScan } from "./videoScan"
import { pinFusion } from "./pinFusion"
import { workflow } from "./workflow"
import { testGrid } from "./testGrid"
import { yoloTray } from "./yoloTray"
import { ticketQueue } from "./ticketQueue"

export const VIZ = {
    lastMile,
    qualityGate,
    labSession,
    videoScan,
    pinFusion,
    workflow: workflow("graph"),
    workflowTimer: workflow("timer"),
    heatGrid: testGrid("heat"),
    yoloTray,
    ticketQueue,
} satisfies Record<string, DrawFn>

export type VizName = keyof typeof VIZ
