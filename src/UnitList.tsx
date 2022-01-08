import { useState, useEffect, forwardRef, useImperativeHandle, useRef, RefObject, MutableRefObject, useDebugValue, useCallback, useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native';
import { Position, UnitListRef, Controller, Unit as UnitProps, ScrollInfo }from './types'
import { TILESIZE, SPEED_PER_STEP, MS_PER_STEP } from './constants'
import useInnerWindow from './useInnerWindow'
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue, withTiming, Easing, useCode, call, useAnimatedReaction, cancelAnimation } from 'react-native-reanimated';

const fish = <Text style={{paddingLeft:6}}>🐟</Text>//🧍


const useTargetCursor = (targetPos:Animated.SharedValue<Position>)=>{
    const animStyleTarget = useAnimatedStyle(() => {
        return {
            transform: [
                {translateX: targetPos.value[0]},
                {translateY: targetPos.value[1]},
            ],
            width:TILESIZE, height:TILESIZE, borderWidth:2, borderColor:'greenyellow'
        };
    });
    return useRef(<Animated.View style={[styles.unitStyle, animStyleTarget]}/>)
}


const getNextPos = (currentPos:Position, targetPos:Position)=>{
    'worklet'
    const distanceX = Math.abs(targetPos[0] - currentPos[0])
    const distanceY = Math.abs(targetPos[1] - currentPos[1])
    const distance = distanceX>0 && distanceY?Math.min(distanceX, distanceY):Math.max(distanceX, distanceY)
    return currentPos.map((value, index)=>{
        if (value < targetPos[index])
            return value + distance
        if (value > targetPos[index])
            return value - distance
        return value
    }) as Position
}

const Unit = ({unit}:{unit:UnitProps})=>{
    'worklet'
    const _styles = styles
    const [visible, setVisible] = useState(true)
    const runs = useSharedValue(1)
    const livePos = useDerivedValue<Position>(()=>{
        if (unit.movement){
            return [
                unit.movement.prevPos[0] * (1 - runs.value) + unit.movement.nextPos[0] * runs.value,
                unit.movement.prevPos[1] * (1 - runs.value) + unit.movement.nextPos[1] * runs.value
            ]
        }
        return unit.initPos
    })
    const callback = useCallback(()=>{
        'worklet'
        if (unit.movement){
            if(unit.movement.nextPos[0]!=unit.movement.targetPos[0] || unit.movement.nextPos[1] != unit.movement.targetPos[1]){
                unit.movement.prevPos = unit.movement.nextPos
                unit.movement.nextPos = getNextPos(unit.movement.nextPos, unit.movement.targetPos)
                const distance = Math.sqrt(Math.pow(unit.movement.nextPos[0] - unit.movement.prevPos[0], 2) + Math.pow(unit.movement.nextPos[1] - unit.movement.prevPos[1], 2))
                runs.value = 0
            runs.value = withTiming(1, {duration:distance * MS_PER_STEP / SPEED_PER_STEP, easing:Easing.linear},(fin)=>{if(fin)callback()})
            }
            else{
                unit.moveFinished && unit.moveFinished(unit)
            }
        }
    }, [unit])
    useEffect(()=>{
        unit.movement = {
            targetPos: unit.initPos,
            prevPos: unit.initPos,
            nextPos: unit.initPos,
            setTargetPos: (pos) =>{
                if(unit.movement){
                    unit.movement.prevPos = livePos.value
                    unit.movement.nextPos = livePos.value
                    unit.movement.targetPos = pos
                    callback()
                }
            },
            checkVisible:(scrollInfo:ScrollInfo)=>{}
        }
        callback()
    }, [])
    useEffect(()=>{
        if(unit.movement)
            unit.movement.checkVisible = (scrollInfo)=>{
                'worklet'
                const v = scrollInfo[0] < livePos.value[0] && 
                scrollInfo[2] > livePos.value[0] && 
                scrollInfo[1] < livePos.value[1] && 
                scrollInfo[3] > livePos.value[1]
                if(v != visible)setVisible(v)
            }
    }, [visible])

    const animStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {translateX: visible?livePos.value[0]:-1000},
                {translateY: visible?livePos.value[1]:-1000},
            ],
        }
    }, [visible]);

    unit.postMove && useAnimatedReaction(
        () => {unit.postMove && unit.postMove(livePos.value)}, 
        (result, previous) => {},
        [livePos]
    );
    // const cursor = useTargetCursor(targetPos)
    unit.resized && useEffect(()=>unit.resized?unit.resized(livePos.value):()=>{}, [useInnerWindow()])
    return <>
        {/*cursor.current*/}
        {<Animated.View style={[_styles.unitStyle, animStyle]}>
            {fish}
        </Animated.View>}
    </>
}
const createUnit = (unit:UnitProps)=><Unit key={unit.id} unit={unit}/>

export default forwardRef<UnitListRef, {controller:Controller}>(({controller}, ref)=>{
    useImperativeHandle(ref, ()=>({
        setTargetPos: (pos)=>{
            controller.getUnits()[0].movement?.setTargetPos(pos)
        },
    }))
    const units = useMemo(()=>controller.getUnits().map(createUnit), [controller])
    return <View style={{...StyleSheet.absoluteFillObject, width:0, height:0}}>
        {units}
    </View>
})

const styles = StyleSheet.create({
    unitStyle: {position: 'absolute'}
  });
