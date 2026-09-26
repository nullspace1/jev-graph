import type { JEventData } from "../events/event"
import { JListener } from "../events/listener"
import JGraph from "../graph/graph"
import type { JExecutionState } from "../graph/execution_state"
import JResponse from "../nodes/response"
import { RecordingApi } from "./support"

interface State { value: string }

class NodeEndListener extends JListener<State, JEventData> {
    public notifications = 0

    constructor() {
        super("node_end")
    }

    public listen(_state: JExecutionState<State>): void {
        this.notifications++
    }
}

describe("execution listeners", () => {
    it("notifies a listener when its matching event is recorded", async () => {
        const listener = new NodeEndListener()
        const graph = new JGraph<State, State>(
            new JResponse<State>(),
            new RecordingApi(() => ({}))
        )
        graph.addListener(listener)

        await graph.evaluate({ value: "test" })

        expect(listener.notifications).toBe(1)
    })
})
