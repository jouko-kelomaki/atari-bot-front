import React, { FunctionComponent, useRef, useState } from 'react'
import blackStoneFile from './images/black.png'
import whiteStoneFile from './images/white.png'
import bgImage from './images/shinkaya.jpg'
import useImage from 'use-image'
import axios, { AxiosResponse } from 'axios'
import Button from '@material-ui/core/Button'
import { RadioGroup, FormControl, FormControlLabel, Radio } from '@material-ui/core'

enum Stone {
    empty,
    black,
    white
}

type Point = {
    x: number
    y: number
}

const generateStateFromRecord = (record: Record, boardSize: number) => {
    let board = createInitialBoardState(boardSize)
    for(let i = 0; i < record.length; i++) {
        board[record[i][0]][record[i][1]] = (i % 2) + 1
    }
    return board
}

const countIntersectionCoordinates = (x: number, y: number, boardSize: number, boardElementSize: number, intersectionOffset: number) => {
    return {
        x: intersectionOffset + (x * (boardElementSize-2*intersectionOffset) / (boardSize - 1)),
        y: intersectionOffset + (y * (boardElementSize-2*intersectionOffset) / (boardSize - 1))
    }
}

const drawLine = (start: Point, end: Point, ctx: CanvasRenderingContext2D) => {
    if(ctx == null) {
        return
    }
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    ctx.stroke()
}

const drawGrid = (context: CanvasRenderingContext2D, boardSize: number, boardElementSize: number, intersectionOffset: number) => {
    for(let row = 0; row < boardSize; row++) {
        drawLine(countIntersectionCoordinates(0, row, boardSize, boardElementSize, intersectionOffset), 
        countIntersectionCoordinates(boardSize-1, row, boardSize, boardElementSize, intersectionOffset), context)
    }

    for(let col = 0; col < boardSize; col++) {
        drawLine(countIntersectionCoordinates(col, 0, boardSize, boardElementSize, intersectionOffset),
        countIntersectionCoordinates(col, boardSize-1, boardSize, boardElementSize, intersectionOffset), context)
    }
}

const drawStones = (boardState: Stone[][], boardSize: number, context: CanvasRenderingContext2D, blackImage: HTMLImageElement,
        whiteImage: HTMLImageElement, stoneOffset: number, stoneSize: number, boardElementSize: number, intersectionOffset: number) => {
    for(let row = 0; row < boardSize; row++) {
        for(let col = 0; col < boardSize; col++){
            switch(boardState[row][col]){
                case Stone.black:
                    context.drawImage(blackImage,
                        countIntersectionCoordinates(row, col, boardSize, boardElementSize, intersectionOffset).x - stoneOffset, 
                        countIntersectionCoordinates(row, col, boardSize, boardElementSize, intersectionOffset).y - stoneOffset, 
                        stoneSize, stoneSize)
                    break;
                case Stone.white:
                    context.drawImage(whiteImage, 
                        countIntersectionCoordinates(row, col, boardSize, boardElementSize, intersectionOffset).x - stoneOffset, 
                        countIntersectionCoordinates(row, col, boardSize, boardElementSize, intersectionOffset).y - stoneOffset, 
                        stoneSize, stoneSize)
                    break;

            }
        }
    }
}

const sendAIfetchRequest = async () => {
    try {
        let response = (await axios.get("http://127.0.0.1:5000/availableai"))
        return response.data.availableAi
    } catch(e) {
        console.log("failed to fetch AI")
        return []
    }
}

// needs proper typing for the response
const sendRequest = async (board: BoardData, record: Record, aiOpponent: string) => {
    console.log("record to be sent", record)
    try {
        let response = (await axios.post("http://127.0.0.1:5000/test", {
            test: "fromFront",
            board: board,
            record: record,
            opponent: aiOpponent,
            turnColor: 2
        }, {
            headers: {
                "content-type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        }))
        // In the wrong place, needs some refactoring
        if(response.data.winner && response.data.winner != 0) {
            alert(`${response.data.winner == 2 ? "White" : "Black"} is victorious!`)
        }


        let newBoard: BoardData = response.data.board
        let newRecord: Record = response.data.record
        console.log("record from back", newRecord)
        return {boardData: newBoard, record: newRecord}
    } catch (err) {
        console.log("failed to fetch board")
        return {boardData: board, record: record}
    }
}

const getWindowDimensions = () => {
    const { innerWidth: width, innerHeight: height } = window
    return {
        width,
        height
    }
}

const elementConstantsFromBoardElementSize = (boardElementSize: number) => ({
    boardElementSize: boardElementSize,
    intersectionOffset: 0.1 * boardElementSize,
    stoneOffset: 0.05 * boardElementSize - 3,
    stoneSize: 0.1 * boardElementSize - 6 // seems to need fixing according to boardSize
})

const createInitialBoardState = (boardSize: number) => {
    let board = Array(boardSize)
    for(let i = 0; i < boardSize; i++) {
        board[i] = Array(boardSize).fill(Stone.empty)
    }
    return board
}

type BoardData = Array<Array<number>>
type Record = Array<Array<number>>

const Board = (props: {defaultboardsize: number}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const [bgImg] = useImage(bgImage)
    const [blackStone] = useImage(blackStoneFile)
    const [whiteStone] = useImage(whiteStoneFile)

    const [boardSize, setBoardSize] = useState(props.defaultboardsize)

    const [boardState, setBoardState] = useState(createInitialBoardState(props.defaultboardsize))
    const [currentTurn, setCurrentTurn] = useState(Stone.black)

    const initialElementValues = elementConstantsFromBoardElementSize(getWindowDimensions().height) // assumes a landscape screen
    const [boardElementSize, setBoardElementSize] = useState(initialElementValues.boardElementSize)
    const [stoneOffset, setStoneOffset] = useState(initialElementValues.stoneOffset)
    const [intersectionOffset, setIntersectionOffset] = useState(initialElementValues.intersectionOffset)
    const [stoneSize, setStoneSize] = useState(initialElementValues.stoneSize)

    const [playAllowed, setPlayAllowed] = useState(false)
    const [boardSizeRadioValue, setBoardSizeRadioValue] = useState(9)
    const [availableAi, setAvailableAi] = useState([])
    const [aiRadioValue, setAiRadioValue] = useState("")

    const [gameRecord, setGameRecord] = useState<Array<Array<number>>>([])
    const [currentReplayMove, setCurrentReplayMove] = useState(0)

    React.useEffect(() => {sendAIfetchRequest().then(aiArray => setAvailableAi(aiArray))}, [])

    React.useEffect(() => {
        const handleResize = () => {
            // assume a standard-shaped landscape screen
            const nextBoardElementSize = getWindowDimensions().height
            const nextElementValues = elementConstantsFromBoardElementSize(nextBoardElementSize)
            setBoardElementSize(nextElementValues.boardElementSize)
            setIntersectionOffset(nextElementValues.intersectionOffset)
            setStoneOffset(nextElementValues.stoneOffset)
            setStoneSize(nextElementValues.stoneSize)
        }
        
        // not entirely sure what these do
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)    
    })

    React.useEffect(() => {
        const canvas = canvasRef.current
        if(canvas == null) return
        const context = canvas.getContext('2d')
        if(context == null) return

        bgImg && context.drawImage(bgImg, 0, 0)
        drawGrid(context, boardSize, boardElementSize, intersectionOffset)
        console.log(boardState)
        blackStone && whiteStone && boardState && drawStones(boardState, boardSize, context, blackStone, whiteStone, stoneOffset, stoneSize, 
            boardElementSize, intersectionOffset)
    })

    React.useEffect(() => {
        setBoardState(() => {
            let newRecord = Array.from(gameRecord)
            let newBoard = generateStateFromRecord(newRecord.slice(undefined, currentReplayMove), boardSize)
            return newBoard
        })
    }, [currentReplayMove])

    const clickHandler = (x: number, y: number) => {
        if(!canvasRef.current) return
        let canvasX = x - canvasRef.current.getBoundingClientRect().left
        let canvasY = y - canvasRef.current.getBoundingClientRect().top
        for(let row = 0; row < boardSize; row++) {
            for(let col = 0; col < boardSize; col++) {
                const intersection = countIntersectionCoordinates(row, col, boardSize, boardElementSize, intersectionOffset)
                if(Math.sqrt(Math.pow(canvasX - intersection.x, 2) + Math.pow(canvasY - intersection.y, 2)) < stoneOffset) {
                    
                    if(boardState[row][col] === Stone.empty && playAllowed) {
                        setBoardState(prevBoardState => {
                            let newBoardState = Array.from(prevBoardState)
                            newBoardState[row][col] = currentTurn

                            //currently off because the server plays the other color
                            //setCurrentTurn(currentTurn === Stone.black ? Stone.white : Stone.black)

                            return newBoardState
                        })

                        // quality deepclone
                        let newGameRecord = JSON.parse(JSON.stringify(gameRecord))
                        newGameRecord.push([row, col])
                        
                        aiRadioValue && sendRequest(boardState, newGameRecord, aiRadioValue).then(({boardData, record}) => {
                            setBoardState(boardData)
                            setGameRecord(record)
                        })
                    }
                }
            }
        }
    }

    return (
        <div className="boardall">
            <canvas
            ref={canvasRef}
            width={boardElementSize} 
            height={boardElementSize}
            onClick={clickEvent=> 
                clickHandler(clickEvent.clientX, clickEvent.clientY)
            }
            />
            <div className="controls">
                <div className="new-game-controls">
                    <FormControl component="fieldset">
                        <RadioGroup row value={`${boardSizeRadioValue}`} onChange={e => {setBoardSizeRadioValue(parseInt(e.target.value))}}>
                            <FormControlLabel value="9" control={<Radio/>} label="9x9" />
                            <FormControlLabel value="7" control={<Radio/>} label="7x7" />
                            <FormControlLabel value="5" control={<Radio/>} label="5x5" />
                        </RadioGroup>
                    </FormControl>
                    <FormControl component="fieldset">
                        <RadioGroup row value={`${aiRadioValue}`} onChange={e => {setAiRadioValue(e.target.value)}}>
                            {availableAi.map(aiName => 
                                <FormControlLabel value={aiName} control={<Radio/>} label={aiName}/>
                            )}
                        </RadioGroup>
                    </FormControl>
                    <Button 
                        onClick={() => {
                            setPlayAllowed(true)
                            setBoardSize(boardSizeRadioValue)
                            setBoardState(createInitialBoardState(boardSizeRadioValue))
                            console.log(availableAi)
                        }} variant="contained">Start a new game
                    </Button>
                </div>
                <div className="replay-controls">
                    <div>{`Move: ${currentReplayMove}`}</div>
                    <div>{gameRecord.map(r => `(${r[0]}, ${r[1]}), `)}</div>
                    <Button
                        onClick={() => {
                            setPlayAllowed(false)
                            setCurrentReplayMove(gameRecord.length)
                        }} variant="contained">Review Record
                    </Button>
                    <div>
                        <Button onClick={() => {
                            setCurrentReplayMove(prevMove => prevMove > 0 ? prevMove - 1 : prevMove)
                        }} variant="contained">prev</Button>
                        <Button onClick={() => {
                            setCurrentReplayMove(prevMove => prevMove < gameRecord.length ? prevMove + 1 : prevMove)
                        }} variant="contained">next</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Board