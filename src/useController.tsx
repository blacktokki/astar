import { useRef } from 'react';
import { Tiles, Units, Controller, Position } from './types'

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

const INIT_UNITS:Units = [
    {pos:INIT_POSITION, type:'Player'},
    {pos:INIT_POSITION, type:'Ai'}
]

export default function useController(){
    const tiles = useRef(INIT_TILES)
    return { getTiles:() => tiles.current } as Controller
}