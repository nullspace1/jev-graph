import JGraph from "../graph/graph"
import JQuestion from "../nodes/question"
import JResponse from "../nodes/response"
import { answerForOnlyQuestion, RecordingApi } from "./support"

interface State { value: string }

describe("JExecutionResult event filtering", () => {
    it("returns only events matching the requested label", async () => {
        const api = new RecordingApi(questions => answerForOnlyQuestion(questions, {
            noul: 1,
            confidence: 1
        }))
        const graph = new JGraph<State, State>(
            new JQuestion({
                question: "Continue?",
                projection: state => state,
                yes: new JResponse<State>(),
                no: new JResponse<State>()
            }),
            api
        )

        const result = await graph.evaluate({ value: "test" })

        expect(result.getEvents("node_start")).toHaveLength(2)
        expect(result.getEvents("node_end")).toHaveLength(2)
        expect(result.getEvents("api_call")).toHaveLength(1)
        expect(result.getEvents("exception")).toHaveLength(0)
        expect(result.getEvents("api_call")[0].data.output.model).toBe("test-model")
    })
})
