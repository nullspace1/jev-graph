import {
    type ConfidencePolicy,
    multiplicativeConfidencePolicy
} from "./confidence-policy"

class Uncertain<T> {
    constructor(
        public readonly value: T,
        public readonly confidence: number
    ) {}

    addUncertainty(
        confidence: number,
        policy: ConfidencePolicy = multiplicativeConfidencePolicy
    ): Uncertain<T> {
        return new Uncertain(
            this.value,
            policy.combine(this.confidence, confidence)
        )
    }
}

export default Uncertain
