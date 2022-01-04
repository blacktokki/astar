import { useState, useEffect, forwardRef, useImperativeHandle, useRef, RefObject, MutableRefObject, useDebugValue } from 'react'
import { View, Text, StyleSheet } from 'react-native';
import { Position, UnitListRef, Controller, Unit as UnitProps }from './types'
import { TILESIZE, SPEED_PER_STEP, MS_PER_STEP } from './constants'
import useInnerWindow from './useInnerWindow'
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue, withTiming, Easing, useCode, call, useAnimatedReaction, cancelAnimation } from 'react-native-reanimated';

const DURATION = TILESIZE/SPEED_PER_STEP * MS_PER_STEP

function useMoveable(unit:UnitProps){
    'worklet'
    const prevPos = useSharedValue(unit.initPos)
    const targetPos = useSharedValue(unit.initPos)
    const tx = useSharedValue(unit.initPos[0])
    const ty = useSharedValue(unit.initPos[1])
    const tds = useSharedValue(0)
    const subtargetPos = useDerivedValue(()=>{return [tx.value, ty.value] as Position})
    const runs = useDerivedValue(()=>{
        'worklet'
        if (tds.value == 0){
            return withTiming(0, {duration:1}, (fin)=>{
                if(fin)callback()
            })
        }
        else
            return withTiming(1, {duration:DURATION/TILESIZE * tds.value, easing:Easing.linear}, (fin)=>{
                if(fin){
                    prevPos.value = subtargetPos.value
                    tds.value = 0
                }
            })
    })
    const ttx = useDerivedValue(()=>prevPos.value[0] * (1 - runs.value) + subtargetPos.value[0] * runs.value)
    const tty = useDerivedValue(()=>prevPos.value[1] * (1 - runs.value) + subtargetPos.value[1] * runs.value)
    const callback = ()=>{
        if(subtargetPos.value[0]!=targetPos.value[0] || subtargetPos.value[1] != targetPos.value[1]){
            // const _pos = subtargetPos.value.map((value, index)=>{
            //     const res = value - value % TILESIZE
            //     if (value < targetPos.value[index])
            //         return res + TILESIZE
            //     if (value > targetPos.value[index])
            //         return res - TILESIZE
            //     return res
            // }) as Position
            // tx.value = _pos[0]
            // ty.value = _pos[1]
            tds.value = Math.sqrt(Math.pow(targetPos.value[0] - tx.value, 2) + Math.pow(targetPos.value[1] - ty.value, 2))
            tx.value = targetPos.value[0]
            ty.value = targetPos.value[1]
        }
        else{
            unit.moveFinished && unit.moveFinished(unit)
        }
    }
    unit.setTargetPos = (pos) =>{
        tx.value = ttx.value
        ty.value = tty.value
        prevPos.value = [ttx.value, tty.value]
        targetPos.value = pos;
        tds.value = 0;
    }
    useEffect(()=>{
        setTimeout(callback, Math.random() * 128)
    }, [])

    const animStyle = useAnimatedStyle(() => {
        const style = {
            transform: [
                {translateX: ttx.value},
                {translateY: tty.value},
            ],
        }
        return style
    });
    unit.postMove && useAnimatedReaction(
        () => {
            unit.postMove && unit.postMove([ttx.value, tty.value])
        }, 
        (result, previous) => {
        },
        [ttx, tty]
    );
    return [ttx, tty, targetPos, animStyle] as [Animated.SharedValue<number>, Animated.SharedValue<number> ,  Animated.SharedValue<Position>, typeof animStyle]
}

const fish = <Text style={{paddingLeft:6}}>🐟</Text>//🧍

const Unit = ({unit}:{unit:UnitProps})=>{
    const [ttx, tty, targetPos, animStyle] = useMoveable(unit)
    // const animStyleTarget = useAnimatedStyle(() => {
    //     return {
    //         transform: [
    //             {translateX: targetPos.value[0]},
    //             {translateY: targetPos.value[1]},
    //         ],
    //         width:TILESIZE, height:TILESIZE, borderWidth:2, borderColor:'greenyellow'
    //     };
    // });
    unit.resized && useEffect(()=>unit.resized?unit.resized([ttx.value, tty.value]):()=>{}, [useInnerWindow()])
    return <>
        {/*<Animated.View style={[styles.unit, animStyleTarget]}/>*/}
        {unit.id == 0 && (<Animated.View style={[styles.unit, animStyle]}>
            {fish}
        </Animated.View>)}
    </>
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

const styles = StyleSheet.create({
    unit: {position: 'absolute'}
  });