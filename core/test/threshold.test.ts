import JResponse from "../nodes/response"
import JThreshold from "../nodes/threshold"
import Uncertain from "../nodes/uncertain"

describe("JThreshold", () => {
    it("accepts confidence at or above the threshold", async () => {
        const accepted = new JResponse<{ value: string }>()
        const rejected = new JResponse<{ value: string }>()
        const threshold = new JThreshold({ threshold: 0.5, accepted, rejected })

        expect((await threshold.eval(new Uncertain({ value: "x" }, 0.5), null as never)).node)
            .toBe(accepted)
        expect((await threshold.eval(new Uncertain({ value: "x" }, 0.49), null as never)).node)
            .toBe(rejected)
    })

    it.each([-0.01, 1.01])("rejects threshold %s outside [0, 1]", value => {
        expect(() => new JThreshold({
            threshold: value,
            accepted: new JResponse(),
            rejected: new JResponse()
        })).toThrow(RangeError)
    })
})
