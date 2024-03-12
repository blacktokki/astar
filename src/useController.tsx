import { MutableRefObject, useEffect, useRef } from 'react';
import { TILESIZE } from './constants';
import { Tiles, Units, Controller, Position, CameraRef, UnitClass, MapRef, UnitListRef } from './types'

const DUMMY_TILECOUNT = 256
const DUMMY_TILEIDS_COUNT = 16
const INIT_POSITION:Position = [4 * TILESIZE, 4 * TILESIZE]

const INIT_TILES:Tiles = {
    width: DUMMY_TILECOUNT,
    height: DUMMY_TILECOUNT,
    ids: [...Array(DUMMY_TILECOUNT).keys()].map((value)=>
        [...Array(DUMMY_TILECOUNT).keys()].map((value2)=>(value + value2) % DUMMY_TILEIDS_COUNT)
    ),
    tileRecord: [...Array(DUMMY_TILEIDS_COUNT).keys()].reduce((prev, value)=>{
        prev[value] = `rgb(255, ${239 + value * (16 / DUMMY_TILEIDS_COUNT)}, ${239 + value  * (16 / DUMMY_TILEIDS_COUNT)})`
        return prev
    }, {} as Record<number, string>)
}

export default function useController(
    cameraRef:MutableRefObject<CameraRef>, 
    mapRef:MutableRefObject<MapRef>,
    unitListRef:MutableRefObject<UnitListRef>
){
    const tiles = useRef(INIT_TILES)
    const player:UnitClass = {
        postMove:(nextPos)=>{
            cameraRef.current.setFocusX && cameraRef.current.setFocusX(nextPos[0])
            cameraRef.current.setFocusY && cameraRef.current.setFocusY(nextPos[1])
        },
        resized:(pos)=>{
            cameraRef.current.setFocusX && cameraRef.current.setFocusX(pos[0])
            cameraRef.current.setFocusY && cameraRef.current.setFocusY(pos[1])
        }
    }
    const ai:UnitClass = {
        moveFinished:(unit)=>{
            const nextPos:Position = [
                Math.floor(Math.random() * tiles.current.width) * TILESIZE/4, 
                Math.floor(Math.random() * tiles.current.height) * TILESIZE/4
            ]
            unit.movement && unit.movement.setTargetPos(nextPos)
        }
    }
    const INIT_UNITS:Units = [
        {id:0, initPos:INIT_POSITION, ...player}
    ].concat([...Array(128).keys()].map((value)=>({id:value + 1, initPos:INIT_POSITION, ...ai})))
    const units = useRef(INIT_UNITS)
    // useEffect(()=>{
    //     const interval = setInterval(()=>{
    //         if(mapRef.current.getScrollInfo){
    //            const scrollInfo = mapRef.current.getScrollInfo()
    //            units.current.forEach((u)=>{
    //                 if(u.movement)
    //                     u.movement.checkVisible(scrollInfo)
    //             })
    //         }
    //     }, 1000)
    //     return ()=>clearInterval(interval)
    // }, [])
    return {
        getTiles:() => tiles.current,
        getUnits:() => units.current,
        setScrollX:(x)=>mapRef.current.setScrollX && mapRef.current?.setScrollX(x),
        setScrollY:(y)=>mapRef.current.setScrollY && mapRef.current?.setScrollY(y),
        setTargetPos:(pos)=>unitListRef.current.setTargetPos && unitListRef.current.setTargetPos(pos)
    } as Controller
}