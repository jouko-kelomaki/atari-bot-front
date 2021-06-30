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

const stoneOffset = 47 // should be dependent on size
const intersectionOffset = 100

const countIntersectionCoordinates = (x: number, y: number, boardSize: number) => {
    return {
        x: intersectionOffset + (x * (1000-2*intersectionOffset) / (boardSize - 1)),
        y: intersectionOffset + (y * (1000-2*intersectionOffset) / (boardSize - 1))
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

const drawGrid = (context: CanvasRenderingContext2D, boardSize: number) => {
    const offset = intersectionOffset;

    for(let row = 0; row < boardSize; row++) {
        drawLine(countIntersectionCoordinates(0, row, boardSize), countIntersectionCoordinates(boardSize-1, row, boardSize), context)
    }

    for(let col = 0; col < boardSize; col++) {
        drawLine(countIntersectionCoordinates(col, 0, boardSize), countIntersectionCoordinates(col, boardSize-1, boardSize), context)
    }
}

const drawStones = (boardState: Stone[][], boardSize: number, context: CanvasRenderingContext2D, blackImage: HTMLImageElement, whiteImage: HTMLImageElement) => {
    const stoneSize = 94

    for(let row = 0; row < boardSize; row++) {
        for(let col = 0; col < boardSize; col++){
            switch(boardState[row][col]){
                case Stone.black:
                    context.drawImage(blackImage, countIntersectionCoordinates(row, col, boardSize).x - stoneOffset, 
                        countIntersectionCoordinates(row, col, boardSize).y - stoneOffset, stoneSize, stoneSize)
                    break;
                case Stone.white:
                    context.drawImage(whiteImage, countIntersectionCoordinates(row, col, boardSize).x - stoneOffset, 
                        countIntersectionCoordinates(row, col, boardSize).y - stoneOffset, stoneSize, stoneSize)
                    break;

            }
        }
    }
}

const sendRequest = async (board: BoardData) => {

    try {
        let newBoard: BoardData = (await axios.post("http://127.0.0.1:5000/test", {
            test: "fromFront",
            board: board,
            opponent: "eval1",
            turnColor: 2
        }, {
            headers: {
                "content-type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        })).data.board
        console.log("got board?")
        return newBoard
    } catch (err) {
        console.log("failed to fetch board")
        return board
    }
}

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

    React.useEffect(() => {
        const canvas = canvasRef.current
        if(canvas == null) return
        const context = canvas.getContext('2d')
        if(context == null) return

        bgImg && context.drawImage(bgImg, 0, 0)
        drawGrid(context, 9)
        blackStone && whiteStone && drawStones(boardState, props.boardsize, context, blackStone, whiteStone)
    })

    const clickHandler = (x: number, y: number) => {
        if(!canvasRef.current) return
        let canvasX = x - canvasRef.current.getBoundingClientRect().left
        let canvasY = y - canvasRef.current.getBoundingClientRect().top
        for(let row = 0; row < props.boardsize; row++) {
            for(let col = 0; col < props.boardsize; col++) {
                const intersection = countIntersectionCoordinates(row, col, props.boardsize)
                if(Math.sqrt(Math.pow(canvasX - intersection.x, 2) + Math.pow(canvasY - intersection.y, 2)) < stoneOffset) {
                    
                    if(boardState[row][col] === Stone.empty) {
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
        <canvas
            ref={canvasRef}
            width="1000" 
            height="1000"
            onClick={clickEvent=> 
                clickHandler(clickEvent.clientX, clickEvent.clientY)
            }
        />
    )
}


export default Board