export type Position = [number, number]
export type UpperRef = {
    setTargetPos?: (pos:Position)=>void
}

export type MapRef = {
    setScrollX?: (x:number)=>void
    setScrollY?: (y:number)=>void
}
export type CameraRef = {}