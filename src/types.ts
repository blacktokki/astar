export type Position = [number, number]

export type UnitListRef = {
    setTargetPos?: (pos:Position)=>void
}

export type MapRef = {
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
    getUnits: ()=>Units
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
    getPos?:()=>Position,
    setTargetPos?:(pos:Position)=>void
} & UnitClass

export type Units = Unit[]