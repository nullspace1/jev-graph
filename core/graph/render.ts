import type { JDrawing } from "./draw"

export interface Renderer<T> {
    render(drawing: JDrawing): T
}
