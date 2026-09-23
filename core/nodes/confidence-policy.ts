interface ConfidencePolicy {
    readonly identity: number
    combine(currentConfidence: number, newConfidence: number): number
}

class MultiplicativeConfidencePolicy implements ConfidencePolicy {
    public readonly identity = 1

    combine(currentConfidence: number, newConfidence: number): number {
        return currentConfidence * newConfidence
    }
}

const multiplicativeConfidencePolicy = new MultiplicativeConfidencePolicy()

export {
    type ConfidencePolicy,
    MultiplicativeConfidencePolicy,
    multiplicativeConfidencePolicy
}
