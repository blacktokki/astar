import { useState, useEffect, forwardRef, useImperativeHandle, useRef, RefObject, MutableRefObject, useDebugValue } from 'react'
import { View, Text, StyleSheet } from 'react-native';
import { Position, UnitListRef, Controller, Unit as UnitProps }from './types'
import { TILESIZE, SPEED_PER_STEP, MS_PER_STEP } from './constants'
import useInnerWindow from './useInnerWindow'
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue, withTiming, Easing, useCode, call, useAnimatedReaction, cancelAnimation } from 'react-native-reanimated';

function useMoveable(unit:UnitProps){
    const targetPos = useSharedValue(unit.initPos)
    const tx = useSharedValue(unit.initPos[0])
    const ty = useSharedValue(unit.initPos[1])
    const subtargetPos = useDerivedValue(()=>{return [tx.value, ty.value] as Position})
    const ttx = useDerivedValue(()=>withTiming(tx.value, {duration:TILESIZE/SPEED_PER_STEP * MS_PER_STEP, easing:Easing.linear}, animCallback))
    const tty = useDerivedValue(()=>withTiming(ty.value, {duration:TILESIZE/SPEED_PER_STEP * MS_PER_STEP, easing:Easing.linear}, animCallback))
    const callback = ()=>{
        if(subtargetPos.value[0]!=targetPos.value[0] || subtargetPos.value[1] != targetPos.value[1]){
            const _pos = subtargetPos.value.map((value, index)=>{
                const res = value - value % TILESIZE
                if (value < targetPos.value[index])
                    return res + TILESIZE
                if (value > targetPos.value[index])
                    return res - TILESIZE
                return res
            }) as Position
            tx.value = _pos[0]
            ty.value = _pos[1]
        }
        else
            unit.moveFinished && unit.moveFinished(unit)
    }
    unit.setTargetPos = (pos) =>{
        targetPos.value = pos;
        callback()
    }
    let finished = 2
    const animCallback = (isFinite:boolean) =>{
        finished += 1
        if (isFinite && finished==2)callback()
    }

    const animStyle = useAnimatedStyle(() => {
        finished = 0
        const style = {
            ...StyleSheet.absoluteFillObject,
            transform: [
                {translateX: ttx.value},
                {translateY: tty.value},
            ],
        }
        return style
    });
    useAnimatedReaction(
        () => {
            unit.postMove && unit.postMove([ttx.value, tty.value])
        }, 
        (result, previous) => {
        },
        [ttx, tty]
    );
    return [ttx, tty, targetPos, animStyle] as [Animated.SharedValue<number>, Animated.SharedValue<number> ,  Animated.SharedValue<Position>, typeof animStyle]
}

const man = <Text style={{paddingLeft:6}}>🧍</Text>

const Unit = ({unit}:{unit:UnitProps})=>{
    const [ttx, tty, targetPos, animStyle] = useMoveable(unit)
    const animStyleTarget = useAnimatedStyle(() => {
        return {
            ...StyleSheet.absoluteFillObject,
            transform: [
                {translateX: targetPos.value[0]},
                {translateY: targetPos.value[1]},
            ],
            width:TILESIZE, height:TILESIZE, borderWidth:2, borderColor:'greenyellow'
        };
    });
    unit.resized && useEffect(()=>unit.resized?unit.resized([ttx.value, tty.value]):()=>{}, [useInnerWindow()])
    return <View>
        <Animated.View style={{...animStyleTarget}}/>
        <Animated.View style={{...animStyle}}>
            {man}
        </Animated.View>
    </View>
}
const createUnit = (unit:UnitProps)=><Unit key={unit.id} unit={unit}/>

export default forwardRef<UnitListRef, {controller:Controller}>(({controller}, ref)=>{
    useImperativeHandle(ref, ()=>({
        setTargetPos: controller.getUnits()[0].setTargetPos
    }))
    const units = controller.getUnits().map(createUnit)
    return <View style={{...StyleSheet.absoluteFillObject, width:0, height:0}}>
        {units}
    </View>
})