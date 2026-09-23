import type JNode from "../nodes/node"
import type { JDrawing } from "./draw"
import type { Renderer } from "./render"

export type MermaidDirection = "TB" | "TD" | "BT" | "RL" | "LR"

export interface MermaidRendererOptions {
    direction?: MermaidDirection
    includeDescriptions?: boolean
    includeTags?: boolean
}

/** Converts a graph drawing into a Mermaid flowchart definition. */
export class MermaidRenderer implements Renderer<string> {
    private readonly direction: MermaidDirection
    private readonly includeDescriptions: boolean
    private readonly includeTags: boolean

    constructor(options: MermaidRendererOptions = {}) {
        this.direction = options.direction ?? "TD"
        this.includeDescriptions = options.includeDescriptions ?? true
        this.includeTags = options.includeTags ?? false
    }

    public render(drawing: JDrawing): string {
        const nodeIds = this.createNodeIds(drawing)
        const lines = [`flowchart ${this.direction}`]

        for (const drawNode of drawing.visited.values()) {
            const sourceId = nodeIds.get(drawNode.node)
            if (sourceId === undefined) {
                continue
            }

            lines.push(`    ${sourceId}["${this.nodeLabel(drawNode.node)}"]`)

            for (const edge of drawNode.children) {
                const targetId = nodeIds.get(edge.target.node)
                if (targetId === undefined) {
                    continue
                }

                const arrow = edge.recursive ? "-.->" : "-->"
                lines.push(
                    `    ${sourceId} ${arrow}|"${this.escape(edge.description)}"| ${targetId}`
                )
            }
        }

        return `${lines.join("\n")}\n`
    }

    private createNodeIds(
        drawing: JDrawing
    ): Map<JNode<any>, string> {
        const nodeIds = new Map<JNode<any>, string>()
        let index = 0

        for (const node of drawing.visited.keys()) {
            // Sequential IDs are deterministic and always valid Mermaid IDs.
            nodeIds.set(node, `node${index}`)
            index++
        }

        return nodeIds
    }

    private nodeLabel(node: JNode<any>): string {
        const parts = [node.name ?? node.constructor.name]

        if (this.includeDescriptions && node.description) {
            parts.push(node.description)
        }

        if (this.includeTags && node.tags && node.tags.length > 0) {
            parts.push(`Tags: ${node.tags.join(", ")}`)
        }

        return parts.map(part => this.escape(part)).join("<br/>")
    }

    private escape(value: string): string {
        return value
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\|/g, "&#124;")
            .replace(/\r?\n/g, "<br/>")
    }
}
