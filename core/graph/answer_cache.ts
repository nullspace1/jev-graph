import { Question, Questions, ResultFor, SystemOneResult } from "@typesafe-ai/sdk"
import type JNode from "../nodes/node"
import { JConnectedNodes } from "./connected_nodes"

/** Caches API answers by projected state and the node-qualified question name. */
export class JAnswerCache<TAllowedStates extends object> {

    private readonly answersByState = new Map<
        object,
        Map<string, ResultFor<any>>
    >()

    public hasAnswersFor(
        projectedState: object,
        node: JNode<TAllowedStates>,
        questions: Record<string, Question>
    ): boolean {
        const answers = this.answersFor(projectedState)

        return Object.keys(questions).every(questionName =>
            answers.has(JConnectedNodes.questionKey(node, questionName))
        )
    }

    public questionsToFetch(
        projectedState: object,
        nodes: Iterable<JNode<TAllowedStates>>
    ): Record<string, Question> {
        const questions: Record<string, Question> = {}
        const answers = this.answersFor(projectedState)

        for (const node of nodes) {
            for (const [questionName, question] of Object.entries(node.apiQuestions())) {
                const cacheKey = JConnectedNodes.questionKey(node, questionName)
                if (!answers.has(cacheKey)) {
                    questions[cacheKey] = question
                }
            }
        }

        return questions
    }

    public store(projectedState: object, output: SystemOneResult<Questions>): void {
        const answers = this.answersFor(projectedState)

        for (const [cacheKey, answer] of Object.entries(output.answers)) {
            answers.set(cacheKey, answer)
        }
    }

    public outputFor(
        projectedState: object,
        node: JNode<TAllowedStates>,
        questions: Record<string, Question>,
        model: string,
        usage: SystemOneResult<Questions>["usage"]
    ): SystemOneResult<Questions> {
        const cachedAnswers = this.answersFor(projectedState)
        const answers: Record<string, ResultFor<any>> = {}

        for (const questionName of Object.keys(questions)) {
            const cacheKey = JConnectedNodes.questionKey(node, questionName)
            const answer = cachedAnswers.get(cacheKey)
            if (answer !== undefined) {
                answers[questionName] = answer
            }
        }

        return { model, answers, usage }
    }

    private answersFor(projectedState: object): Map<string, ResultFor<any>> {
        let answers = this.answersByState.get(projectedState)
        if (answers === undefined) {
            answers = new Map<string, ResultFor<any>>()
            this.answersByState.set(projectedState, answers)
        }
        return answers
    }
}
