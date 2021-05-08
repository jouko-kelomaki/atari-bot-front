import React from 'react'
import blackStone from './images/black.png'
import whiteStone from './images/white.png'
import bgImage from './images/shinkaya.jpg'

type StateType = {
    images: {
        bgImage: HTMLImageElement
        blackStone: HTMLImageElement
        whiteStone: HTMLImageElement
    }
    dummyString: string
}

type PropType = {
    propstr: string
}

type Point = {
    x: number
    y: number
}

const loadableImages = ["bgImage", "blackStone", "whiteStone"] as const

class Board extends React.Component<PropType, StateType> {
    canvasRef: React.RefObject<HTMLCanvasElement>
    contextRef: CanvasRenderingContext2D | null
    imageLoaded: { bgImage: boolean; blackStone: boolean; whiteStone: boolean }
    IsComponentMounted: boolean

    constructor(props: PropType) {
        super(props)
        this.canvasRef = React.createRef()
        this.contextRef = null
        this.IsComponentMounted = false

        this.imageLoaded = {
            bgImage: false,
            blackStone: false,
            whiteStone: false
        }
        
        this.state = {
            images: this.createImageElements(),
            dummyString: "a",
        }
    }

    createImageElements(): {[I in typeof loadableImages[number]]: HTMLImageElement} {
        let loadHelper = (imageName: typeof loadableImages[number]) => () => { 
            this.imageLoaded = {...this.imageLoaded, [imageName]: true}
            this.IsComponentMounted && this.forceUpdate()

            if(this.IsComponentMounted && this.imageLoaded.bgImage && this.imageLoaded.blackStone && this.imageLoaded.whiteStone) {
                this.drawBoardUtil()
            }
        }

        let bgImg = new Image()
        bgImg.src = bgImage
        bgImg.onload = loadHelper("bgImage")
        
        let blackImg = new Image()
        blackImg.src = blackStone
        blackImg.onload = loadHelper("blackStone")

        let whiteImg = new Image()
        whiteImg.src = whiteStone
        whiteImg.onload = loadHelper("whiteStone")
        return {
            bgImage: bgImg,
            blackStone: blackImg,
            whiteStone: whiteImg
        }
    }

    drawLineUtil(start: Point, end: Point){
        let ctx = this.contextRef
        if(ctx == null) {
            return
        }
        ctx.beginPath()
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
        ctx.stroke()
    }

    drawGrid(gridSize: number){
        if(this.contextRef == null) return
        let offset: number = 100;
        for(let row=0; row < gridSize; row++) {
            this.drawLineUtil(
                {
                    x: offset,
                    y: offset+(row*(1000-2*offset)/(gridSize-1))
                },
                {
                    x: 1000-offset,
                    y: offset+(row*(1000-2*offset)/(gridSize-1))
                }
            )
        }
        
        for(let col=0; col < gridSize; col++) {
            this.drawLineUtil(
                {
                    y: offset,
                    x: offset+(col*(1000-2*offset)/(gridSize-1))
                },
                {
                    y: 1000-offset,
                    x: offset+(col*(1000-2*offset)/(gridSize-1))
                }
            )
        }


    }

    //drawStones(){
    //
    //}

    drawBoardUtil(){
        if(this.contextRef == null) return
        this.contextRef.drawImage(this.state.images.bgImage, 0, 0)  

        this.drawGrid(9)
    }
  
    componentDidMount() {
        this.IsComponentMounted = true
        const canvas = this.canvasRef.current
        if (canvas === null) return
        this.contextRef = canvas.getContext('2d') 
    }

    render() {
        return (<canvas ref={this.canvasRef} width="1000" height="1000" {...this.props}/>)
    } 
}

const boardIntersectionCoordinates = (boardWidthAndHeight: number, gridPadding: number, boardSize: number) => {
    const interval = (boardWidthAndHeight - 2 * gridPadding) / (boardSize - 1)
    

}



export default Board