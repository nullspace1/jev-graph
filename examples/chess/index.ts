import {
    JAction,
    JCondition,
    JDecision,
    JevApi,
    JevOpenRouter,
    JGraph,
    JNode,
    JQuestion,
    JResponse,
    MermaidRenderer,
    Questions,
    SystemOneResult,
    type Question
} from "@jev/core"

import { Chess } from "chess.js"



function checkValidMoves(board: string): string[] {
    const chess = new Chess(board)
    return chess.moves()
}

function applyMove(board: string, move: string): string {
    const chess = new Chess(board)
    chess.move(move)
    return chess.fen()
}


interface GameState {
    color: "white" | "black"
    board: string
    history: string[]
    validMoves: string[]
}


const decideValidMoves = new JDecision<GameState>({
    question: "What is your next move?",
    questionName: "Get Valid Moves",
    projection: (state) => state,
    options: (state) => {
        const moves = state.validMoves
        const moveRecord: Record<string, [string, JNode<GameState>]> = {}
        for (const move of moves) {
            moveRecord[move] = [move, new JResponse<GameState>()]
        }
        return moveRecord
    },
    mapper: (move, state) => {
        return {
            ...state,
            history: [...state.history, state.board],
            board: applyMove(state.board, move),
            color: state.color === "white" ? "black" : "white"
        }
    }
})

const getValidMoves = new JAction<GameState>(
    {
        action: (state) => {
            return {
                ...state,
                validMoves: checkValidMoves(state.board)
            }
        },
        node: decideValidMoves
    }
)

const isCheckMate = new JCondition<GameState>({
    condition: (state) => state.validMoves.length === 0,
    yes: new JResponse<GameState>(),
    no: getValidMoves
})


const initialGameState: GameState = {
    color: "white",
    board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    history: [],
    validMoves: []
}

const graph = new JGraph<GameState, GameState>(
    isCheckMate,
    new JevOpenRouter(process.env.MODEL as string)
)

graph.evaluate(initialGameState).then(([e, s]) => {
    console.log(e,s)
})