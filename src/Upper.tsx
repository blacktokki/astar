import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { View, Text, StyleSheet } from 'react-native';
import { Position, UpperRef }from './types'
import { TILESIZE, SPEED_PER_STEP, INIT_POSITION, MS_PER_STEP } from './constants'

export default forwardRef<UpperRef, {}>((props, ref)=>{
    const [targetPos, setTargetPos] = useState<Position>(INIT_POSITION)
    const [pos, setPos] = useState<Position>(INIT_POSITION)
    const [subtargetPos, setSubtargetPos] = useState<Position>(INIT_POSITION)
    let timeout:any = null
    useImperativeHandle(ref, ()=>({
        setTargetPos(pos){clearTimeout(timeout);setTargetPos(pos)}
    }))
    useEffect(()=>{
        let changed = false
        const nextPos = pos.map((value, index)=>{
            if (value < subtargetPos[index]){
                changed = true
                return value + SPEED_PER_STEP
            }
            if (value > subtargetPos[index]){
                changed = true
                return value - SPEED_PER_STEP
            }
            return value
        }) as Position
        // console.log(pos, nextPos, subtargetPos, targetPos)
        if (changed)
            timeout = setTimeout(()=>setPos(nextPos), MS_PER_STEP)
        else if(pos[0]!=targetPos[0] || pos[1] != targetPos[1]){
            setSubtargetPos(pos.map((value, index)=>{
                const res = value - value % TILESIZE
                if (value < targetPos[index])
                    return res + TILESIZE
                if (value > targetPos[index])
                    return res - TILESIZE
                return res
            }) as Position)
        }
    }, [pos, subtargetPos, targetPos])
    
    return <View style={{...StyleSheet.absoluteFillObject, width:0, height:0}}>
        <View style={{left:pos[0],top:pos[1]}}>
            <Text>a</Text>
        </View>
    </View>
})