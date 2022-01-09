import { useState, useEffect, forwardRef, useImperativeHandle, useRef, memo, useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native';
import { Position, UnitListRef, Controller, Unit as UnitProps, Vector }from './types'
import { TILESIZE, SPEED_PER_STEP, MS_PER_STEP, VECTORS } from './constants'
import useInnerWindow from './useInnerWindow'
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue, withTiming, Easing, useAnimatedReaction, withSequence } from 'react-native-reanimated';

type ShareState = {
    x:number,
    y:number,
    visible:boolean
}

type UunitData = {
    shareState?:Animated.SharedValue<ShareState>
}

type SurfaceData = {
    vec:Vector
    getPos?:(index:number)=>Position
    setPos?:(pos:Position, index:number)=>void, 
    setVisible?:(visible:boolean, index:number)=>void,
}

const fish = <Text style={{paddingLeft:6}}>🐟</Text>//🧍

const distance = 100000000
const INIT_POSITION:Position = [-distance, -distance]

const UUnit = ({data}:{data:UunitData})=>{
    const shareState = useSharedValue({x:INIT_POSITION[0], y:INIT_POSITION[1], visible:true})
    useEffect(()=>{
        data.shareState = shareState
    }, [])
    const _style = useAnimatedStyle(()=>{
        return  {
            //overflow:'hidden',
            //width:shareState.value.visible?40:0,
            //height:shareState.value.visible?40:0,
            transform:[{translateX:shareState.value.x},{translateY:shareState.value.y}]
        }
    }, [])
    return <Animated.View style={[styles.unit, _style]}>{fish}</Animated.View>
}
const MAX_ELEMENT = 500

const Surface = ({data}:{data:SurfaceData}) =>{
    const pp = useSharedValue(0)
    const _style = useAnimatedStyle(() => {
        return {
            transform: [
                {translateX: pp.value * data.vec[0]},
                {translateY: pp.value * data.vec[1]}
            ],
        };
    });
    useEffect(()=>{
        data.getPos = (index)=>{
            'worklet'
            const _state = uunitData.current[index].shareState
            if(_state){
                return [pp.value*data.vec[0] + _state.value.x,pp.value*data.vec[1] + _state.value.y]
            }
            return INIT_POSITION
        },
        data.setPos = (pos, index)=>{
            'worklet'
            const _state = uunitData.current[index].shareState
            if(_state){
                _state.value = {
                    x:pos[0] - pp.value*data.vec[0],
                    y:pos[1] - pp.value*data.vec[1],
                    visible:_state.value.visible
                }
            }
        }
        data.setVisible = (visible, index)=>{
            'worklet'
            const _state = uunitData.current[index].shareState
            if(_state){
                _state.value = {
                    x:_state.value.x,
                    y:_state.value.y,
                    visible:visible
                }
            }
        }
        pp.value = withSequence(withTiming(distance,  { duration: distance * MS_PER_STEP/SPEED_PER_STEP,  easing:Easing.linear }), withTiming(0, { duration: 1 }))
    }, [])
    const uunitData = useRef([...Array(MAX_ELEMENT)].map((v)=>({} as UunitData)))
    const uunit = useRef(uunitData.current.map((v,k)=><UUnit key={k} data={v}/>))
    return <Animated.View style={[styles.unit, _style]}>
        {uunit.current}
    </Animated.View>

}

// const vecToNum = (v:Vector)=>  4 + v[0] + v[1] * 3 + v[2] * 9

export default forwardRef<UnitListRef, {controller:Controller}>(({controller}, ref)=>{
    const surfaceRef = useRef<SurfaceData[]>(VECTORS.map(v=>({vec:v})))
    // const move = (unit:UnitProps)=>{
    //     if (unit.movePattern){
    //         unit.vec = [0, 0, 0]
            
    //         if(unit.targetPos)
    //             unit.vec = unit.movePattern(unit.targetPos)
    //         const surface = surfaceRef.current[vecToNum(unit.vec)]
    //             surface.add && surface.add(unit)
    //     }
    // }
    useImperativeHandle(ref, ()=>({
        setTargetPos: (pos)=>{
            controller.getUnits()[0].targetPos = pos
        },
    }))
    useEffect(()=>{
        let prevLen = surfaceRef.current.map(()=>0)
        const interval = setInterval(()=>{
            let cacheLen = surfaceRef.current.map(()=>0)
            const d = new Date()
            controller.getUnits().map((unit)=>{
                let pos = unit.initPos
                if(unit.movement){
                    const fromSurface = surfaceRef.current[unit.movement.vecIdx]
                    pos = fromSurface.getPos?fromSurface.getPos(unit.movement.idx):pos
                }
                return {unit, pos}
            }).forEach(({unit, pos})=>{
                const idx = Math.floor(Math.random()* VECTORS.length)
                const surface = surfaceRef.current[idx]
                surface.setPos && surface.setPos(pos, cacheLen[idx])
                unit.movement = {
                    vecIdx:idx,
                    idx:cacheLen[idx]
                }
                cacheLen[idx]++
            })
            surfaceRef.current.forEach((surface, i)=>{
                let t = cacheLen[i]
                while(t < prevLen[i]){
                    surface.setPos && surface.setPos(INIT_POSITION, t)
                    t++
                }
            })
            prevLen = cacheLen
            console.log('@@@@', new Date().valueOf() - d.valueOf())
        }, 1000)
        return ()=>clearInterval(interval)
    }, [])
    return <View style={{...StyleSheet.absoluteFillObject, width:0, height:0}}>
        {surfaceRef.current.map((d, i)=><Surface key={i} data={d}/>)}
    </View>
})

const styles = StyleSheet.create({
    unit: {position: 'absolute'}
  });