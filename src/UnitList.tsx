import { useState, useEffect, forwardRef, useImperativeHandle, useRef, RefObject, MutableRefObject } from 'react'
import { View, Text, StyleSheet } from 'react-native';
import { Position, UnitListRef, Controller, Unit as UnitProps }from './types'
import { TILESIZE, SPEED_PER_STEP } from './constants'
import useInnerWindow from './useInnerWindow'
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';

function useMoveable(unit:UnitProps){
    const targetPos = useSharedValue(unit.initPos)
    const pos =  useSharedValue(unit.initPos)
    const subtargetPos = useSharedValue(unit.initPos)
    const callback = ()=>{
        let changed = false
        const nextPos = pos.value.map((value, index)=>{
            if (value < subtargetPos.value[index]){
                changed = true
                return value + SPEED_PER_STEP
            }
            if (value > subtargetPos.value[index]){
                changed = true
                return value - SPEED_PER_STEP
            }
            return value
        }) as Position
        // console.log(pos, nextPos, subtargetPos, targetPos)
        if (changed)
            unit.nextPos = nextPos
        else {
            unit.nextPos = undefined
            if(pos.value[0]!=targetPos.value[0] || pos.value[1] != targetPos.value[1]){
                subtargetPos.value = pos.value.map((value, index)=>{
                    const res = value - value % TILESIZE
                    if (value < targetPos.value[index])
                        return res + TILESIZE
                    if (value > targetPos.value[index])
                        return res - TILESIZE
                    return res
                }) as Position
                callback()
            }
            else
                unit.moveFinished && unit.moveFinished(unit)
        }
    }
    unit.setPos = (_pos) =>{
        pos.value = _pos
        callback()
    }
    unit.setTargetPos = (pos) =>{
        targetPos.value = pos;
        unit.nextPos = undefined
        callback()
    }
    useEffect(()=>{unit.setTargetPos && unit.setTargetPos(pos.value)}, [])
    return [pos, targetPos] as [Animated.SharedValue<Position>,  Animated.SharedValue<Position>]
}

const man = <Text style={{paddingLeft:6}}>🧍</Text>

const Unit = ({unit}:{unit:UnitProps})=>{
    const [pos, targetPos] = useMoveable(unit)
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
    const animStyle = useAnimatedStyle(() => {
        return {
            ...StyleSheet.absoluteFillObject,
            transform: [
                {translateX: pos.value[0]},
                {translateY: pos.value[1]},
            ],
        };
    });
    unit.resized && useEffect(()=>unit.resized?unit.resized(pos.value):()=>{}, [useInnerWindow()])
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