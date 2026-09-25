import type JevApi from "../interface/api"
import type { Questions, SystemOneResult } from "@typesafe-ai/sdk"

export class RecordingApi implements JevApi {
    public readonly model = "test-model"
    public readonly calls: Array<{ state: object, questions: Questions }> = []

    constructor(
        private readonly answerFor: (questions: Questions) => Record<string, unknown>
    ) {}

    async call<T extends object, Q extends Questions>(
        state: T,
        questions: Q
    ): Promise<SystemOneResult<Q>> {
        this.calls.push({ state, questions })
        return {
            model: this.model,
            answers: this.answerFor(questions),
            usage: { input_tokens: 1, output_tokens: 1 }
        } as SystemOneResult<Q>
    }
}

export function answerForOnlyQuestion(
    questions: Questions,
    answer: unknown
): Record<string, unknown> {
    const [questionKey] = Object.keys(questions)
    return { [questionKey]: answer }
}
