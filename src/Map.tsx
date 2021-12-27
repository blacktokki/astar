import { MutableRefObject, useMemo, forwardRef, memo, useState, useImperativeHandle } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Position, UpperRef, MapRef } from './types'
import { TILESIZE, CAMWIDTH, CAMHEIGHT } from './constants'
import Quadtree from 'quadtree-lib'

type Item = {
    pos: Position,
    x: number,
    y: number,
    upperRef: MutableRefObject<UpperRef>,
}

const ItemComponent = memo(({item}:{item:Item})=>{
    return <TouchableOpacity
        style={{...StyleSheet.absoluteFillObject, left:item.pos[0], top:item.pos[1]}}
        onPress={()=>item.upperRef.current.setTargetPos && item.upperRef.current.setTargetPos(item.pos)}
    >
        <View style={{width:TILESIZE, height:TILESIZE, backgroundColor:`rgb(255, ${224 + (item.pos[0]/TILESIZE * 4) % 32}, ${224 + (item.pos[1]/TILESIZE * 4)% 32})`}}>
            <Text style={{fontSize:7}}>{`${item.pos[0]/TILESIZE}:${item.pos[1]/TILESIZE}`}</Text>
        </View>
    </TouchableOpacity>
})

export default forwardRef<MapRef, {upperRef:MutableRefObject<UpperRef>}>(({upperRef}, ref)=>{
    const [scrollX, setScrollX] = useState<number>(0)
    const [scrollY, setScrollY] = useState<number>(0)
    useImperativeHandle(ref, ()=>({
        setScrollX(pos){setScrollX(pos)},
        setScrollY(pos){setScrollY(pos)}
    }))
    const data:Quadtree<Item> = useMemo(()=>{
        const quadtree = new Quadtree<Item>({width:100, height:100});
        [...Array(100).keys()].forEach((value)=>{
            quadtree.pushAll([...Array(100).keys()].map((value2)=>{
                return {pos:[value * TILESIZE, value2 * TILESIZE], upperRef:upperRef, x:value, y:value2}
            }))
        })
        return quadtree
    }, [upperRef])
    const filt = data.colliding({x:scrollX, y:scrollY, width:CAMWIDTH/TILESIZE, height:CAMHEIGHT/TILESIZE}).map((item)=><ItemComponent key = {`${item.pos[0]}:${item.pos[1]}`} item={item}/>)
    return (<View style={{width:TILESIZE * 100, height:TILESIZE * 100}}>
        {filt}
    </View>)
})