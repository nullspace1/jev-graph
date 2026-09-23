import {
    JAction,
    JDecision,
    JevApi,
    JGraph,
    JQuestion,
    JResponse,
    MermaidRenderer,
    Questions,
    SystemOneResult
} from "@jev/core"

import fs from 'fs';

interface SupportRequest {
    ticketId: string
    message: string
}

interface SupportWorkflowState extends SupportRequest {
    team?: "support" | "billing" | "incident"
    outcome?: "solved automatically" | "request generated"
    resolution?: string
}

class Api implements JevApi {
    model: string = "gpt-4o-mini";
    
    constructor() {
        this.model = process.env.MODEL || "gpt-4o-mini";
    }

    async call<T extends object, Q extends Questions>(state: T, questions: Q): Promise<SystemOneResult<Q>> {
        throw new Error("Not implemented")
    }
}

const completed = new JResponse<SupportWorkflowState>({
    name: "Output"
})

const automaticResolution = new JAction<SupportWorkflowState>({
    node: completed,
    name: "Resolve automatically",
    action: (state: SupportWorkflowState) => ({
        ...state,
        outcome: "solved automatically"
    })
})

const checkAutomaticResolution = new JQuestion<SupportWorkflowState>({
    question: "Can this support request be solved automatically?",
    name: "Check if the resolution is automatic",
    projection: state => ({ message: state.message }),
    yes: automaticResolution,
    no: completed,
    questionName: "automatic_resolution",
    criteriaForYes: "The request has a documented, safe automated resolution.",
    criteriaForNo: "The request needs human follow-up.",
    yesMapping: state => ({ ...state, outcome: "solved automatically" }),
    noMapping: state => ({ ...state, outcome: "request generated" })
})

const assignTeam = new JDecision<SupportWorkflowState>({
    question: "Which team should handle this support request?",
    name: "Assign team",
    projection: state => ({ message: state.message }),
    options: {
        support: ["General product or account support.", checkAutomaticResolution],
        billing: ["Invoices, payments, or subscriptions.", checkAutomaticResolution],
        incident: ["An outage, defect, or security incident.", checkAutomaticResolution]
    },
    shouldPrefetch: false,
    mapper: (choice, state) => ({
        ...state,
        team: choice as SupportWorkflowState["team"]
    })
})

const graph = new JGraph<SupportRequest, SupportWorkflowState>(
    assignTeam,
    new Api()
)

const drawing = graph.draw()

const mermaidRenderer = new MermaidRenderer()

const render = mermaidRenderer.render(drawing)



fs.writeFileSync("graph.mmd", render)
