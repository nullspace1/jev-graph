import {
    MultiplicativeConfidencePolicy,
    multiplicativeConfidencePolicy
} from "../nodes/confidence-policy"

describe("multiplicative confidence policy", () => {
    it("uses one as its identity and multiplies confidences", () => {
        const policy = new MultiplicativeConfidencePolicy()

        expect(policy.identity).toBe(1)
        expect(policy.combine(0.8, 0.5)).toBe(0.4)
        expect(multiplicativeConfidencePolicy.combine(1, 0.25)).toBe(0.25)
    })
})
