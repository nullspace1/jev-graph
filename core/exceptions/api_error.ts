import type JevApi from "../interface/api"

/** An error raised when the configured Jev API cannot complete a call. */
class APIError extends Error {
    public readonly api: JevApi
    public readonly cause: unknown

    constructor(api: JevApi, cause: unknown) {
        const causeMessage = cause instanceof Error
            ? cause.message
            : String(cause)

        super(`API call for model "${api.model}" failed: ${causeMessage}`)

        this.name = "APIError"
        this.api = api
        this.cause = cause

        // Required when targeting JavaScript runtimes with imperfect Error subclassing.
        Object.setPrototypeOf(this, new.target.prototype)
    }
}

export default APIError
