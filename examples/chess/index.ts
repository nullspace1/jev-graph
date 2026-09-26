import { createServer, type ServerResponse } from "node:http"
import process from "node:process"
import { JChoice, JCondition, JGraph, JNode, JResponse, JevOpenRouter } from "@jev/core"
import { Chess } from "chess.js"

interface GameState {
    color: "white" | "black"
    board: string
    history: string[]
    lastMove?: string
}

interface AITurn {
    move: string
    board: string
    confidence: number
}

interface TurnRequest {
    fen: string
}

const initialBoard = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
const port = Number(process.env.PORT ?? 3000)
const maxPlies = Number(process.env.MAX_PLIES ?? 200)
const whiteModel = process.env.WHITE_MODEL ?? process.env.MODEL
const blackModel = process.env.BLACK_MODEL ?? process.env.MODEL

if (whiteModel === undefined || blackModel === undefined) {
    throw new Error("Set MODEL, or set both WHITE_MODEL and BLACK_MODEL, before starting")
}

function legalMoves(board: string): string[] {
    return new Chess(board).moves()
}

function applyMove(board: string, move: string): string {
    const chess = new Chess(board)
    chess.move(move)
    return chess.fen()
}

function createMoveGraph(model: string): JGraph<GameState, GameState> {
    const end = new JResponse<GameState>()
    const chooseMove = new JChoice<GameState>({
        question: "Select the strongest chess move for the indicated side to move.",
        questionName: "move",
        options: state => Object.fromEntries(legalMoves(state.board).map(move =>
            [move, [move, end] as [string, JNode<GameState>]]
        )),
        mapper: (move, _distribution, state) => ({
            ...state,
            history: [...state.history, state.board],
            lastMove: move,
            board: applyMove(state.board, move),
            color: state.color === "white" ? "black" : "white"
        })
    })

    return new JGraph(
        new JCondition({
            condition: state => legalMoves(state.board).length === 0,
            yes: end,
            no: chooseMove
        }),
        new JevOpenRouter(model)
    )
}

const whiteAI = createMoveGraph(whiteModel)
const blackAI = createMoveGraph(blackModel)

async function chooseAIMove(
    graph: JGraph<GameState, GameState>,
    board: string
): Promise<AITurn> {
    const chess = new Chess(board)
    const result = await graph.evaluate({
        color: chess.turn() === "w" ? "white" : "black",
        board,
        history: []
    })
    const move = result.state.value.lastMove
    if (move === undefined) {
        throw new Error("The AI did not select a move")
    }

    return {
        move,
        board: result.state.value.board,
        confidence: result.state.confidence
    }
}

async function readTurnRequest(request: AsyncIterable<Buffer>): Promise<TurnRequest> {
    let body = ""
    for await (const chunk of request) {
        body += chunk
        if (body.length > 16_384) throw new Error("Request body is too large")
    }
    const value = JSON.parse(body) as Partial<TurnRequest>
    if (typeof value.fen !== "string") throw new Error("A FEN string is required")
    return { fen: value.fen }
}

const page = [
    '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
    '<title>Jev Chess AI Simulation</title>',
    '<script type="module" src="https://unpkg.com/chessboard-element?module"></script>',
    '<style>',
    ':root{color-scheme:dark;font-family:system-ui,sans-serif}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#17191f;color:#edf1f7}main{width:min(92vw,760px)}.game{display:grid;grid-template-columns:52px minmax(0,1fr) 52px;gap:1rem;align-items:center}chess-board{display:block;width:100%;--light-color:#e7c89c;--dark-color:#a96f42}.meter{height:min(76vw,600px);background:#2c313d;border-radius:.4rem;display:flex;flex-direction:column;justify-content:end;overflow:hidden}.meter div{background:#7fd1ae;width:100%;transition:height .4s}.meter label{text-align:center;font-size:.8rem;color:#b7c0cf;writing-mode:vertical-rl;margin:.5rem auto}.controls{display:flex;gap:.75rem;align-items:center;margin:1rem 0}button{border:0;border-radius:.45rem;padding:.7rem 1rem;font:inherit;font-weight:700;cursor:pointer;background:#7fd1ae;color:#10251c}button:disabled{opacity:.55;cursor:wait}#status{color:#b7c0cf}textarea{width:100%;min-height:12rem;box-sizing:border-box;padding:.8rem;background:#101217;color:#edf1f7;border:1px solid #444b59;border-radius:.4rem;font-family:ui-monospace,monospace;resize:vertical}',
    '</style>',
    '<main><h1>Jev Chess: AI vs AI</h1><p>White and Black independently choose each move.</p><div class="game"><div><div class="meter"><div id="white-meter"></div></div><label>White confidence</label></div><chess-board id="board" position="' + initialBoard + '"></chess-board><div><div class="meter"><div id="black-meter"></div></div><label>Black confidence</label></div></div><div class="controls"><label>Delay <input id="delay" type="number" min="0" step="100" value="1000"> ms</label><button id="play">Play simulation</button><span id="status"></span></div><textarea id="game" readonly aria-label="Game notation"></textarea></main>',
    '<script>',
    'const initialFen=' + JSON.stringify(initialBoard) + ',maxPlies=' + maxPlies + ',board=document.querySelector("#board"),play=document.querySelector("#play"),delay=document.querySelector("#delay"),status=document.querySelector("#status"),game=document.querySelector("#game"),whiteMeter=document.querySelector("#white-meter"),blackMeter=document.querySelector("#black-meter");',
    'function setConfidence(meter,value){meter.style.height=(Math.max(0,Math.min(1,value))*100)+"%"}',
    'function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms))}function notation(moves){return moves.map((move,index)=>index%2===0?(Math.floor(index/2)+1)+". "+move:move).join(" ")}',
    'play.addEventListener("click",async()=>{let fen=initialFen,whiteTotal=0,blackTotal=0,whiteTurns=0,blackTurns=0,moves=[];play.disabled=true;delay.disabled=true;game.value="";setConfidence(whiteMeter,0);setConfidence(blackMeter,0);board.setPosition(fen,false);try{for(;;){if(moves.length>=maxPlies){status.textContent="Move limit reached.";break}status.textContent="AI is thinking...";const response=await fetch("/api/turn",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({fen})}),result=await response.json();if(!response.ok)throw new Error(result.error);if(result.gameOver&&!result.move){status.textContent="Game complete.";break}fen=result.fen;moves.push(result.move);if(result.color==="white"){whiteTotal+=result.confidence;whiteTurns++}else{blackTotal+=result.confidence;blackTurns++}setConfidence(whiteMeter,whiteTurns?whiteTotal/whiteTurns:0);setConfidence(blackMeter,blackTurns?blackTotal/blackTurns:0);game.value=notation(moves);board.setPosition(fen,true);if(result.gameOver){status.textContent="Game complete.";break}await wait(Math.max(0,Number(delay.value)||0))}}catch(error){status.textContent=error instanceof Error?error.message:"Unable to run simulation."}finally{play.disabled=false;delay.disabled=false}});',
    '</script>'
].join("")

function writeJson(response: ServerResponse, status: number, body: object): void {
    response.writeHead(status, { "content-type": "application/json; charset=utf-8" })
    response.end(JSON.stringify(body))
}

createServer(async (request, response) => {
    if (request.method === "GET" && request.url === "/") {
        response.writeHead(200, { "content-type": "text/html; charset=utf-8" })
        response.end(page)
        return
    }

    if (request.method !== "POST" || request.url !== "/api/turn") {
        writeJson(response, 404, { error: "Not found" })
        return
    }

    try {
        const { fen } = await readTurnRequest(request)
        const chess = new Chess(fen)
        if (chess.isGameOver()) {
            writeJson(response, 200, { fen, gameOver: true })
            return
        }

        const color = chess.turn() === "w" ? "white" : "black"
        const turn = await chooseAIMove(color === "white" ? whiteAI : blackAI, fen)
        writeJson(response, 200, {
            fen: turn.board,
            move: turn.move,
            confidence: turn.confidence,
            color,
            gameOver: new Chess(turn.board).isGameOver()
        })
    } catch (error) {
        writeJson(response, 500, {
            error: error instanceof Error ? error.message : "Unable to run simulation"
        })
    }
}).listen(port, () => {
    console.log("Jev Chess is listening at http://localhost:" + port)
})
