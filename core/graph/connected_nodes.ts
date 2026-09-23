import type { Question } from "../interface/dto"
import type JNode from "../nodes/node"
import type { Json } from "../nodes/node"

/** Nodes that receive the same state value during one section of a graph. */
export class JConnectedNodes<TAllowedStates extends object> {
    public readonly nodes: ReadonlySet<JNode<TAllowedStates>>

    constructor(nodes: Iterable<JNode<TAllowedStates>>) {
        this.nodes = new Set(nodes)
    }

    public equals(other: JConnectedNodes<TAllowedStates> | null): boolean {
        if (other === null || this.nodes.size !== other.nodes.size) {
            return false
        }

        for (const node of this.nodes) {
            if (!other.nodes.has(node)) {
                return false
            }
        }

        return true
    }

    public apiQuestions(): Record<string, Question> {
        const questions: Record<string, Question> = {}

        for (const node of this.nodes) {
            for (const [questionName, question] of Object.entries(node.apiQuestions())) {
                questions[JConnectedNodes.questionKey(node, questionName)] = question
            }
        }

        return questions
    }

    public static questionKey(
        node: JNode<any>,
        questionName: string
    ): string {
        return `${node.id}:${questionName}`
    }
}
