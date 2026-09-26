import JAction from "../nodes/action"
import JDecision from "../nodes/decision"
import JGraph from "../graph/graph"
import JResponse from "../nodes/response"
import { answerForOnlyQuestion, RecordingApi } from "./support"

interface State {
    mode: "a" | "b"
    selected?: string
}

describe("JDecision", () => {
    it("sends fixed choice criteria, maps state, confidence, and route", async () => {
        let distribution: Record<string, number> | undefined
        const complete = new JResponse<State>()
        const selected = new JAction<State>({
            node: complete,
            action: state => ({ ...state, selected: "a" })
        })
        const api = new RecordingApi(questions => answerForOnlyQuestion(questions, {
            choice: "a",
            confidence: 0.8,
            probabilities: { a: 0.8 }
        }))
        const decision = new JDecision<State>({
            question: "Choose a mode",
            questionName: "mode",
            projection: state => ({ mode: state.mode }),
            options: { a: ["Mode A", selected] },
            mapper: (choice, probabilities, state) => {
                distribution = probabilities
                return { ...state, selected: choice }
            }
        })

        const result = await new JGraph(decision, api).evaluate({ mode: "a" })

        expect(api.calls[0].state).toEqual({ mode: "a" })
        expect(Object.values(api.calls[0].questions)).toEqual([{
            type: "choice",
            instructions: "Choose a mode",
            criteria: { a: "Mode A" }
        }])
        expect(result.state.value).toEqual({ mode: "a", selected: "a" })
        expect(result.state.confidence).toBe(0.8)
        expect(distribution).toEqual({ a: 0.8 })
    })

    it("resolves dynamic options at runtime and does not prefetch", async () => {
        const complete = new JResponse<State>()
        const api = new RecordingApi(questions => answerForOnlyQuestion(questions, {
            choice: "b",
            confidence: 0.5,
            probabilities: { b: 0.5 }
        }))
        const decision = new JDecision<State>({
            question: "Choose dynamically",
            projection: state => ({ mode: state.mode }),
            options: state => ({ [state.mode]: ["Current mode", complete] })
        })

        expect(decision.shouldPrefetch).toBe(false)
        const result = await new JGraph(decision, api).evaluate({ mode: "b" })

        expect(Object.values(api.calls[0].questions)[0]).toMatchObject({
            type: "choice",
            criteria: { b: "Current mode" }
        })
        expect(result.state.value).toEqual({ mode: "b" })
        expect(result.state.confidence).toBe(0.5)
    })

    it("rejects empty fixed options in the constructor", () => {
        expect(() => new JDecision<State>({
            question: "Choose",
            projection: state => state,
            options: {}
        })).toThrow(RangeError)
    })

    it("uses the input state as the default projection", async () => {
        const complete = new JResponse<State>()
        const api = new RecordingApi(questions => answerForOnlyQuestion(questions, {
            choice: "a",
            confidence: 1,
            probabilities: { a: 1 }
        }))
        const decision = new JDecision<State>({
            question: "Choose",
            options: { a: ["Mode A", complete] }
        })

        await new JGraph(decision, api).evaluate({ mode: "a" })

        expect(api.calls[0].state).toEqual({ mode: "a" })
    })

    it("rejects empty dynamic options at evaluation time", async () => {
        const api = new RecordingApi(() => ({}))
        const decision = new JDecision<State>({
            question: "Choose",
            projection: state => state,
            options: () => ({})
        })

        await expect(new JGraph(decision, api).evaluate({ mode: "a" }))
            .rejects.toThrow("Decision options cannot be empty")
        expect(api.calls).toHaveLength(0)
    })
})
