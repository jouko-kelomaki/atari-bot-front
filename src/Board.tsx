import React, { FunctionComponent, useRef, useState } from 'react'
import blackStoneFile from './images/black.png'
import whiteStoneFile from './images/white.png'
import bgImage from './images/shinkaya.jpg'
import useImage from 'use-image'
import axios, { AxiosResponse } from 'axios'

enum Stone {
    empty,
    black,
    white
}

type Point = {
    x: number
    y: number
}

//const stoneOffset = 47 // should be dependent on size
//const intersectionOffset = 100
//const boardElementSize = 1000
//const stoneSize = 95

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
    const offset = intersectionOffset;

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

// needs proper typing for the response
const sendRequest = async (board: BoardData) => {

    try {
        let response = (await axios.post("http://127.0.0.1:5000/test", {
            test: "fromFront",
            board: board,
            opponent: "eval1",
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
        console.log("got board?")
        return newBoard
    } catch (err) {
        console.log("failed to fetch board")
        return board
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
    stoneSize: 0.1 * boardElementSize - 6
})

type BoardData = Array<Array<number>>

const Board = (props: {boardsize: number}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const [bgImg] = useImage(bgImage)
    const [blackStone] = useImage(blackStoneFile)
    const [whiteStone] = useImage(whiteStoneFile)

    let initialBoardState: BoardData = Array(props.boardsize)
    for(let i = 0; i < props.boardsize; i++) {
        initialBoardState[i] = Array(props.boardsize).fill(Stone.empty)
    }

    const [boardState, setBoardState] = useState(initialBoardState)
    const [currentTurn, setCurrentTurn] = useState(Stone.black)

    const initialElementValues = elementConstantsFromBoardElementSize(getWindowDimensions().height) // assumes a landscape screen
    const [boardElementSize, setBoardElementSize] = useState(initialElementValues.boardElementSize)
    const [stoneOffset, setStoneOffset] = useState(initialElementValues.stoneOffset)
    const [intersectionOffset, setIntersectionOffset] = useState(initialElementValues.intersectionOffset)
    const [stoneSize, setStoneSize] = useState(initialElementValues.stoneSize)

    const [playAllowed, setPlayAllowed] = useState(false)

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
        drawGrid(context, 9, boardElementSize, intersectionOffset)
        blackStone && whiteStone && drawStones(boardState, props.boardsize, context, blackStone, whiteStone, stoneOffset, stoneSize, 
            boardElementSize, intersectionOffset)
    })

    const clickHandler = (x: number, y: number) => {
        if(!canvasRef.current) return
        let canvasX = x - canvasRef.current.getBoundingClientRect().left
        let canvasY = y - canvasRef.current.getBoundingClientRect().top
        for(let row = 0; row < props.boardsize; row++) {
            for(let col = 0; col < props.boardsize; col++) {
                const intersection = countIntersectionCoordinates(row, col, props.boardsize, boardElementSize, intersectionOffset)
                if(Math.sqrt(Math.pow(canvasX - intersection.x, 2) + Math.pow(canvasY - intersection.y, 2)) < stoneOffset) {
                    
                    if(boardState[row][col] === Stone.empty && playAllowed) {
                        setBoardState(prevBoardState => {
                            let newBoardState = Array.from(prevBoardState)
                            newBoardState[row][col] = currentTurn

                            //currently off because the server plays the other color
                            //setCurrentTurn(currentTurn === Stone.black ? Stone.white : Stone.black)

                            return newBoardState
                        })

                        sendRequest(boardState).then(bd => setBoardState(bd))
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
            <p>aerw</p>
        </div>
    )
}


export default Board