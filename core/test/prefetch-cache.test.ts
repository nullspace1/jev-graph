import JGraph from "../graph/graph"
import JNode from "../nodes/node"
import type { JNodeResult } from "../nodes/node_result"
import JQuestion from "../nodes/question"
import JResponse from "../nodes/response"
import { identityMapping, type StateMapping } from "../nodes/state-mapping"
import Uncertain from "../nodes/uncertain"
import type { JExecutionState } from "../graph/execution_state"
import type { Question, Questions } from "@typesafe-ai/sdk"
import { RecordingApi } from "./support"

interface State { value: string }

class QuestionlessPassThrough extends JNode<State, Record<string, Question>> {
    public apiQuestionReads = 0

    constructor(private readonly next: JNode<State>) {
        super({ shouldPrefetch: true })
    }

    public apiQuestions(): Record<string, Question> {
        this.apiQuestionReads++
        return {
            previous: {
                type: "noul",
                instructions: "A predecessor-only question",
                criteria: { true: "yes", false: "no" }
            }
        }
    }

    public async eval(
        state: Uncertain<State>,
        _executionState: JExecutionState<State>
    ): Promise<JNodeResult<State>> {
        return { state, node: this.next }
    }

    public edges(): [JNode<State>, string, StateMapping<State>][] {
        return [[this.next, "next", identityMapping]]
    }
}

function answersForQuestions(questions: Questions): Record<string, unknown> {
    return Object.fromEntries(
        Object.entries(questions).map(([key]) => [key, {
            noul: 1,
            confidence: 1
        }])
    )
}

function question(
    yes: JQuestion<State> | JResponse<State>,
    shouldPrefetch: boolean,
    modifiesState = false
): JQuestion<State> {
    return new JQuestion({
        question: "Continue?",
        projection: state => state,
        yes,
        no: new JResponse<State>(),
        shouldPrefetch,
        modifiesState
    })
}

describe("prefetch answer cache", () => {
    it("continues prefetch propagation when modifiesState is false", async () => {
        const api = new RecordingApi(answersForQuestions)
        const terminal = new JResponse<State>()
        const third = question(terminal, true)
        const second = question(third, true, false)
        const first = question(second, true)

        await new JGraph(first, api).evaluate({ value: "initial" })

        expect(api.calls).toHaveLength(1)
        expect(Object.keys(api.calls[0].questions)).toHaveLength(3)
    })

    it("excludes non-prefetching nodes from a prefetch cluster", async () => {
        const api = new RecordingApi(answersForQuestions)
        const terminal = new JResponse<State>()
        const second = question(terminal, false)
        const first = question(second, true)

        await new JGraph(first, api).evaluate({ value: "initial" })

        expect(api.calls).toHaveLength(2)
        expect(Object.keys(api.calls[0].questions)).toHaveLength(1)
        expect(Object.keys(api.calls[1].questions)).toHaveLength(1)
    })

    it("does not inspect or fetch predecessor questions", async () => {
        const api = new RecordingApi(answersForQuestions)
        const current = question(new JResponse<State>(), true)
        const previous = new QuestionlessPassThrough(current)

        await new JGraph(previous, api).evaluate({ value: "initial" })

        expect(previous.apiQuestionReads).toBe(0)
        expect(Object.keys(api.calls[0].questions)).not.toContain(
            `${previous.id}:previous`
        )
    })

    it("stops prefetch propagation at a state-modifying node", async () => {
        const api = new RecordingApi(answersForQuestions)
        const terminal = new JResponse<State>()
        const second = question(terminal, true)
        const stateBoundary = question(second, true, true)
        const first = question(stateBoundary, true)

        await new JGraph(first, api).evaluate({ value: "initial" })

        expect(api.calls).toHaveLength(2)
        expect(Object.keys(api.calls[0].questions)).toHaveLength(2)
        expect(Object.keys(api.calls[1].questions)).toHaveLength(1)
    })
})
