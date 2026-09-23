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

    public static from<T>(value: T): Uncertain<T> {
        return new Uncertain(value, 1)
    }

    public apply<V>(fn: (value: T) => V): Uncertain<V> {
        return new Uncertain(fn(this.value), this.confidence)
    }

}

export default Uncertain
