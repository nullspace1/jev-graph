import { Questions, SystemOneResult } from "@typesafe-ai/sdk"


/** Configured entry point for calls to Jev. */
interface JevApi {
     call<T extends object, Q extends Questions>(state: T, questions: Q): Promise<SystemOneResult<Q>> 
     model: string
}

export default JevApi
