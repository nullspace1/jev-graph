import {
    type JevOutput,
    type Question
} from "../interface/dto"

/** Configured entry point for calls to Jev. */
abstract class JevApi {
    constructor(public readonly model: string) {}

    abstract call<T>(state: T, questions: Record<string, Question>): JevOutput
}

export default JevApi
