import JAction from "../nodes/action"
import JResponse from "../nodes/response"
import Uncertain from "../nodes/uncertain"

describe("JAction", () => {
    it("applies its transformation without changing uncertainty", async () => {
        const next = new JResponse<{ count: number }>()
        const action = new JAction({
            node: next,
            action: state => ({ count: state.count + 1 })
        })

        const result = await action.eval(
            new Uncertain({ count: 2 }, 0.7),
            null as never
        )

        expect(result.node).toBe(next)
        expect(result.state.value).toEqual({ count: 3 })
        expect(result.state.confidence).toBe(0.7)
    })
})
