import { EntryType, Questions, RequestOptions, SystemOneResult, TypeSafeClient } from "@typesafe-ai/sdk";
import process from "node:process";
import JevApi from "./api";

export class JevOpenRouter implements JevApi {

    model : string
    client : TypeSafeClient
    options? : RequestOptions

    constructor(model: string, options?: RequestOptions) {
        this.model = model;
        this.client = new TypeSafeClient({
            apiKey: process.env.OPENROUTER_API_KEY,
            baseURL: 'https://openrouter.ai/api', 
        }
        )
        this.options = options
    }

    async call<T extends object, Q extends Questions>(state: T, questions: Q): Promise<SystemOneResult<Q>> {
        
        const serializedState = state as EntryType
        const result = await this.client.systemOne({
            state: serializedState,
            model: this.model,
            questions: questions
        }, this.options)
        return result

    }
}
