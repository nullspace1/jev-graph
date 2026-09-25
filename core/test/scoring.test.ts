import InvalidStateError from "../exceptions/invalid_state"
import JGraph from "../graph/graph"
import JAction from "../nodes/action"
import JResponse from "../nodes/response"
import JScoring from "../nodes/scoring"
import { answerForOnlyQuestion, RecordingApi } from "./support"

interface State { selected?: string, score?: number }

function scoringGraph(score: number) {
    const complete = new JResponse<State>()
    const nodeFor = (selected: string) => new JAction<State>({
        node: complete,
        action: state => ({ ...state, selected })
    })
    const api = new RecordingApi(questions => answerForOnlyQuestion(questions, {
        score,
        confidence: 0.5
    }))
    const scoring = new JScoring<State, readonly [string, string]>({
        question: "Rate this",
        questionName: "rating",
        projection: state => state,
        options: ["poor", "good"],
        action: [
            [0, nodeFor("low")],
            [10, nodeFor("medium")],
            [20, nodeFor("high")]
        ],
        mapper: (value, state) => ({ ...state, score: value })
    })

    return { api, graph: new JGraph(scoring, api) }
}

describe("JScoring", () => {
    it.each([
        [0, "low"],
        [9.9, "low"],
        [10, "medium"],
        [19.9, "medium"],
        [20, "high"],
        [200, "high"]
    ])("selects %s at score %s", async (score, selected) => {
        const { api, graph } = scoringGraph(score)

        const result = await graph.evaluate({})

        expect(Object.values(api.calls[0].questions)[0]).toMatchObject({
            type: "score",
            instructions: "Rate this",
            criteria: ["poor", "good"]
        })
        expect(result.state.value).toEqual({ selected, score })
        expect(result.state.confidence).toBe(0.5)
    })

    it.each([
        [[]],
        [[[1, new JResponse()]]],
        [[[0, new JResponse()], [0, new JResponse()]]],
        [[[0, new JResponse()], [2, new JResponse()], [1, new JResponse()]]]
    ])("rejects invalid action starts", action => {
        expect(() => new JScoring({
            question: "Rate",
            projection: (state: State) => state,
            options: ["low", "high"] as const,
            action: action as never
        })).toThrow(RangeError)
    })

    it("rejects a negative score that has no route", async () => {
        const { graph } = scoringGraph(-1)

        await expect(graph.evaluate({})).rejects.toMatchObject({
            cause: expect.any(InvalidStateError)
        })
    })
})
