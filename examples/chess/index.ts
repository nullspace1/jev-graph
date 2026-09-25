import {
    JAction,
    JCondition,
    JChoice,
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

function getValidMoves(board: string): string[] {
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
}

const end = new JResponse<GameState>()

const decideValidMoves = new JChoice<GameState>({
    question: "What is your next move?",
    questionName: "Get Valid Moves",
    options: (state : GameState) => {
        const moves = getValidMoves(state.board)
        const moveRecord: Record<string, [string, JNode<GameState>]> = {}
        for (const move of moves) {
            moveRecord[move] = [move, end]
        }
        return moveRecord
    },
    mapper: (move : string, state : GameState) => {
        return {
            ...state,
            history: [...state.history, state.board],
            board: applyMove(state.board, move),
            color: state.color === "white" ? "black" : "white"
        }
    }
})



const isCheckMate = new JCondition<GameState>({
    condition: (state) => getValidMoves(state.board).length === 0,
    yes: new JResponse<GameState>(),
    no: decideValidMoves,
})

const initialGameState: GameState = {
    color: "white",
    board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    history: []
}

const graph = new JGraph<GameState, GameState>(
    isCheckMate,
    new JevOpenRouter(process.env.MODEL as string)
)

graph.evaluate(initialGameState).then((result) => {
    console.log(result.state)
})
