import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import process from "node:process"
import { JChoice, JCondition, JGraph, JNode, JResponse, JevOpenRouter } from "@jev/core"
import { Chess } from "chess.js"

interface GameState {
    color: "white" | "black"
    board: string
    history: string[]
    lastMove?: string
}

interface MoveRequest {
    fen: string
    move?: {
        from: string
        to: string
        promotion?: "q" | "r" | "b" | "n"
    }
}

const initialBoard = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
const model = process.env.MODEL
const port = Number(process.env.PORT ?? 3000)

if (model === undefined) {
    throw new Error("Set MODEL before starting the chess server")
}

function legalMoves(board: string): string[] {
    return new Chess(board).moves()
}

function applyMove(board: string, move: string): string {
    const chess = new Chess(board)
    chess.move(move)
    return chess.fen()
}

const end = new JResponse<GameState>()
const chooseMove = new JChoice<GameState>({
    question: "Select the strongest legal chess move for the side to move.",
    questionName: "move",
    options: state => Object.fromEntries(legalMoves(state.board).map(move =>
        [move, [move, end] as [string, JNode<GameState>]]
    )),
    mapper: (move, state) => ({
        ...state,
        history: [...state.history, state.board],
        lastMove: move,
        board: applyMove(state.board, move),
        color: state.color === "white" ? "black" : "white"
    })
})
const graph = new JGraph<GameState, GameState>(
    new JCondition({
        condition: state => legalMoves(state.board).length === 0,
        yes: end,
        no: chooseMove
    }),
    new JevOpenRouter(model)
)

const page = `<!doctype html>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Jev Chess</title>
<script type="module" src="https://unpkg.com/chessboard-element?module"></script>
<style>
:root{color-scheme:dark;font-family:system-ui,sans-serif}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#17191f;color:#edf1f7}main{width:min(92vw,640px)}chess-board{display:block;width:100%;--light-color:#e7c89c;--dark-color:#a96f42}.controls{display:flex;gap:.75rem;align-items:center;margin-top:1rem}button{border:0;border-radius:.45rem;padding:.7rem 1rem;font:inherit;font-weight:700;cursor:pointer;background:#7fd1ae;color:#10251c}button:disabled{opacity:.55;cursor:wait}#status{min-height:1.5em;color:#b7c0cf}
</style>
<main><h1>Jev Chess</h1><p>Choose a side, then move a piece. The AI replies automatically.</p><chess-board id="board" draggable-pieces position="${initialBoard}"></chess-board><div class="controls"><label>Your color <select id="color"><option value="white">White</option><option value="black">Black</option></select></label><button id="reset">New game</button><p id="status"></p></div></main>
<script>
const initialFen=${JSON.stringify(initialBoard)};let fen=initialFen,humanColor="white",waiting=false;const board=document.querySelector("#board"),status=document.querySelector("#status"),color=document.querySelector("#color");
function render(){board.orientation=humanColor;board.setPosition(fen,true)}
async function play(move){waiting=true;status.textContent="AI is thinking…";try{const response=await fetch("/api/move",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({fen,move})}),result=await response.json();if(!response.ok)throw new Error(result.error);fen=result.fen;status.textContent=result.gameOver?"Game over.":"AI played "+result.move;render()}catch(error){status.textContent=error instanceof Error?error.message:"Unable to play that move.";render()}finally{waiting=false}}
board.addEventListener("drop",event=>{const {source,target,piece}=event.detail;if(waiting||piece[0]!==humanColor[0]){render();return}play({from:source,to:target,promotion:"q"})});
function reset(){fen=initialFen;status.textContent="";render();if(humanColor==="black")play()}
color.addEventListener("change",()=>{humanColor=color.value;reset()});
document.querySelector("#reset").addEventListener("click",reset);
</script>`

function writeJson(response: ServerResponse, status: number, body: object): void {
    response.writeHead(status, { "content-type": "application/json; charset=utf-8" })
    response.end(JSON.stringify(body))
}

async function readMoveRequest(request: IncomingMessage): Promise<MoveRequest> {
    let body = ""
    for await (const chunk of request) {
        body += chunk
        if (body.length > 16_384) throw new Error("Request body is too large")
    }
    const value = JSON.parse(body) as Partial<MoveRequest>
    if (typeof value.fen !== "string") throw new Error("A FEN string is required")
    if (value.move !== undefined && (
        typeof value.move.from !== "string" ||
        typeof value.move.to !== "string"
    )) {
        throw new Error("A move must include source and target squares")
    }
    return value as MoveRequest
}

createServer(async (request, response) => {
    if (request.method === "GET" && request.url === "/") {
        response.writeHead(200, { "content-type": "text/html; charset=utf-8" })
        response.end(page)
        return
    }
    if (request.method !== "POST" || request.url !== "/api/move") {
        writeJson(response, 404, { error: "Not found" })
        return
    }
    try {
        const { fen, move } = await readMoveRequest(request)
        const chess = new Chess(fen)
        if (move !== undefined) {
            chess.move(move)
        }
        if (chess.isGameOver()) {
            writeJson(response, 200, { fen: chess.fen(), gameOver: true })
            return
        }
        const board = chess.fen()
        const result = await graph.evaluate({
            color: chess.turn() === "w" ? "white" : "black",
            board,
            history: []
        })
        writeJson(response, 200, {
            fen: result.state.value.board,
            move: result.state.value.lastMove,
            confidence: result.state.confidence,
            gameOver: false
        })
    } catch (error) {
        writeJson(response, 400, {
            error: error instanceof Error ? error.message : "Unable to choose a move"
        })
    }
}).listen(port, () => {
    console.log(`Jev Chess is listening at http://localhost:${port}`)
})
