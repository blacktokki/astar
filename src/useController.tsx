import { MutableRefObject, useEffect, useRef } from 'react';
import { MS_PER_STEP, TILESIZE } from './constants';
import { Tiles, Units, Controller, Position, CameraRef, UnitClass } from './types'

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

export default function useController(cameraRef:MutableRefObject<CameraRef>){
    const tiles = useRef(INIT_TILES)
    const player:UnitClass = {
        move:(nextPos, setPos)=>{
            cameraRef.current.setFocusX && cameraRef.current.setFocusX(nextPos[0])
            cameraRef.current.setFocusY && cameraRef.current.setFocusY(nextPos[1])
            setPos(nextPos)
        },
        resized:(pos)=>{
            cameraRef.current.setFocusX && cameraRef.current.setFocusX(pos[0])
            cameraRef.current.setFocusY && cameraRef.current.setFocusY(pos[1])
        }
    }
    const ai:UnitClass = {
        move:(nextPos, setPos)=>{
            setPos(nextPos)
        },
        moveFinished:(unit)=>{
            const nextPos:Position = [
                Math.floor(Math.random() * tiles.current.width / 4) * TILESIZE, 
                Math.floor(Math.random() * tiles.current.height / 4) * TILESIZE
            ]
            unit.setTargetPos && unit.setTargetPos(nextPos)
        }
    }
    const INIT_UNITS:Units = [
        {id:0, initPos:INIT_POSITION, ...player}
    ].concat([...Array(0).keys()].map((value)=>({id:value + 1, initPos:INIT_POSITION, ...ai})))
    const units = useRef(INIT_UNITS)
    useEffect(()=>{
        const interval = setInterval(()=>{
            units.current.forEach((unit)=>{
                if(unit.nextPos && unit.setPos)
                    unit.move(unit.nextPos, unit.setPos)
            })
        }, MS_PER_STEP)
        return ()=>clearInterval(interval)
    }, [])
    return {
        getTiles:() => tiles.current,
        getUnits:() => units.current    
    } as Controller
}