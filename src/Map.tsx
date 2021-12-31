import { MutableRefObject, useMemo, forwardRef, memo, useState, useImperativeHandle } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Position, UnitListRef, MapRef, Controller, Tiles } from './types'
import { TILESIZE} from './constants'
import useInnerWindow from './useInnerWindow'
import Quadtree from 'quadtree-lib'


type Item = {
    pos: Position,
    x: number,
    y: number,
    key: string,
    record: string
}

const ItemComponent = memo((item:Item)=>{
    return <View style={{...StyleSheet.absoluteFillObject, left:item.pos[0], top:item.pos[1], width:TILESIZE, height:TILESIZE, backgroundColor:item.record}}/>
})

type Props = {
    unitListRef:MutableRefObject<UnitListRef>
    controller:Controller
}

export default forwardRef<MapRef, Props>(({unitListRef, controller}, ref)=>{
    const [scrollX, setScrollX] = useState<number>(0)
    const [scrollY, setScrollY] = useState<number>(0)
    const [margin, setMargin] = useState<[number, number]>([0, 0])
    const window = useInnerWindow()
    const windowResize = useMemo(()=>({width:window.width, height: window.height}) ,[window])
    useImperativeHandle(ref, ()=>({
        setScrollX,
        setScrollY,
        setMargin
    }))
    const tiles = useMemo(()=>controller.getTiles(), [controller])
    const data:Quadtree<Item> = useMemo(()=>{
        const quadtree = new Quadtree<Item>({width:tiles.width, height:tiles.height});
        [...Array(tiles.width).keys()].forEach((value)=>{
            quadtree.pushAll([...Array(tiles.height).keys()].map((value2)=>{
                return {pos:[value * TILESIZE, value2 * TILESIZE], record:tiles.tileRecord[tiles.ids[value][value2]], x:value, y:value2, key:`${value}:${value2}`}
            }))
        })
        return quadtree
    }, [tiles])
    return (<TouchableOpacity style={{width:TILESIZE * tiles.width, height:TILESIZE * tiles.height}} onPress={(e)=>{
            const x = scrollX + (e.nativeEvent.pageX - margin[0]) / TILESIZE
            const y = scrollY + (e.nativeEvent.pageY - margin[1]) / TILESIZE
            // console.log(Math.floor(x), Math.floor(y))
            unitListRef.current.setTargetPos && unitListRef.current.setTargetPos([Math.floor(x) * TILESIZE, Math.floor(y) * TILESIZE])
        }} activeOpacity={0.9}>
        {data.colliding({x:scrollX, y:scrollY, width:windowResize.width/TILESIZE, height:windowResize.height/TILESIZE}).map(
            (item)=><ItemComponent {...item}/>
        )}
    </TouchableOpacity>)
})