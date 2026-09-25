import JCondition from "../nodes/condition"
import JResponse from "../nodes/response"
import Uncertain from "../nodes/uncertain"

describe("JCondition", () => {
    it.each([[true, "yes"], [false, "no"]] as const)(
        "routes %s to the %s node while preserving state and confidence",
        async (enabled, branch) => {
            const yes = new JResponse<{ enabled: boolean }>()
            const no = new JResponse<{ enabled: boolean }>()
            const condition = new JCondition({
                condition: state => state.enabled,
                yes,
                no
            })
            const state = new Uncertain({ enabled }, 0.6)

            const result = await condition.eval(state, null as never)

            expect(result.node).toBe(branch === "yes" ? yes : no)
            expect(result.state.value).toEqual(state.value)
            expect(result.state.confidence).toBe(state.confidence)
        }
    )

    it.each([[true, "yes"], [false, "no"]] as const)(
        "applies the %s mapping on the %s branch",
        async (enabled, branch) => {
            const condition = new JCondition({
                condition: state => state.enabled,
                yes: new JResponse<{ enabled: boolean, branch?: string }>(),
                no: new JResponse<{ enabled: boolean, branch?: string }>(),
                yesMapping: state => ({ ...state, branch: "yes" }),
                noMapping: state => ({ ...state, branch: "no" })
            })

            const result = await condition.eval(
                new Uncertain({ enabled }, 0.6),
                null as never
            )

            expect(result.state.value.branch).toBe(branch)
            expect(result.state.confidence).toBe(0.6)
        }
    )
})
