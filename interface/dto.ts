

export interface JevInput<T> {
    state: T,
    model: string
    questions: Record<string, Question> 
}

export interface NoulQuestion {
    type: "noul",
    instructions: string,
    criteria: {
        true: string,
        false: string
    } | null
}

export interface ChoiceQuestion {
    type: "choice",
    instructions: string,
    criteria: Record<string, string | null>
}

export interface ScoreQuestion {
    type: "score",
    instructions: string,
    criteria: string[]
}

export type Question = NoulQuestion | ChoiceQuestion | ScoreQuestion


export interface JevOutput {
    model: string,
    answers: Record<string, Answer>
    usage: {
        input_tokens: number,
        output_tokens: number
    }
}

export interface NoulAnswer {
    type: "noul",
    answer: number
}

export interface ChoiceAnswer {
    type: "choice",
    choice: string
    probabilities: Record<string, number>
    confidence: number
}

export interface ScoreAnswer {
    type: "score",
    score: number
    legend: Record<string, number>
    probabilities: Record<string, number>
    confidence: number
}

export type Answer = NoulAnswer | ChoiceAnswer | ScoreAnswer


