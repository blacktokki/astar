export type Position = [number, number]

export type ScrollInfo = [number, number, number, number]

export type UnitListRef = {
    setTargetPos?: (pos:Position)=>void
}

export type MapRef = {
    getScrollInfo?: ()=>ScrollInfo
    setScrollX?: (x:number)=>void
    setScrollY?: (y:number)=>void
    setMargin?: (margin:[number, number])=>void
}
export type CameraRef = {
    setFocusX?: (x:number)=>void
    setFocusY?: (y:number)=>void
}

export type Controller = {
    getTiles: ()=>Tiles,
    getUnits: ()=>Units,
    setTargetPos: (pos:Position)=>void,
    setScrollX: (x:number)=>void,
    setScrollY: (x:number)=>void
}

type Model = {}

export type Tiles = Model & {
    width:number,
    height:number,
    ids: number[][]
    tileRecord: Record<number, string>
}

export type UnitClass = {
    postMove?:(pos:Position)=>void
    moveFinished?:(unit:Unit)=>void
    resized?:(pos:Position)=>void
}

export type Unit = Model & {
    id:number,
    initPos:Position,
    movement?:{
        targetPos:Position,
        prevPos:Position,
        nextPos:Position
        setTargetPos:(pos:Position)=>void
        checkVisible:(scrollInfo:ScrollInfo)=>void
    }
} & UnitClass

export type Units = Unit[]