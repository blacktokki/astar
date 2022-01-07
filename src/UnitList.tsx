import { useState, useEffect, forwardRef, useImperativeHandle, useRef, memo, useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native';
import { Position, UnitListRef, Controller, Unit as UnitProps, Vector }from './types'
import { TILESIZE, SPEED_PER_STEP, MS_PER_STEP, VECTORS } from './constants'
import useInnerWindow from './useInnerWindow'
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue, withTiming, Easing, useAnimatedReaction, withSequence } from 'react-native-reanimated';

const DURATION = TILESIZE/SPEED_PER_STEP * MS_PER_STEP
type SurfaceData = {
    vec:Vector
    units?:UnitProps[],
    setUnits?:(units:UnitProps[])=>void, 
    getOffset?:()=>Position
}
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
    // unit.setTargetPos = (pos) =>{
    //     tx.value = ttx.value
    //     ty.value = tty.value
    //     prevPos.value = [ttx.value, tty.value]
    //     targetPos.value = pos;
    //     tds.value = 0;
    // }
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


const fish = <Text style={{paddingLeft:6}}>🐟</Text>//🧍

const _SIZE = 250
const _CNT = 5

const UUnit = memo(({unit}:{unit:UnitProps})=>{
    const [x, setX] = useState(unit.initPos[0])
    const [y, setY] = useState(unit.initPos[1])
    useEffect(()=>{
        console.log('@')
        unit.movement = {setX, setY, x, y}
    }, [])
    useEffect(()=>{
        if(unit.movement){
            unit.movement.x = x
            unit.movement.y = y
            }
    }, [x, y])
    return <View style={[styles.unit, {left:x, top:y}]}>{fish}</View>
}, (prevProps, nextProps)=>{
    console.log(prevProps, nextProps, prevProps==nextProps)
    return prevProps.unit == nextProps.unit
})
const Surface = ({data}:{ data:SurfaceData}) =>{
    const pp = useSharedValue(0)
    const _style = useAnimatedStyle(() => {
        return {
            transform: [
                {translateX: pp.value * data.vec[0]},
                {translateY: pp.value * data.vec[1]}
            ],
        };
    });
    const distance = 100000000
    const [units, setUnits] = useState<UnitProps[]>([])
    useEffect(()=>{
        data.getOffset = () => [pp.value*data.vec[0], pp.value*data.vec[1]]
        data.setUnits = setUnits
        data.units = units
        pp.value = withSequence(withTiming(distance,  { duration: distance * MS_PER_STEP/SPEED_PER_STEP * 10,  easing:Easing.linear }), withTiming(0, { duration: 1 }))
    }, [])
    useEffect(()=>{data.units = units}, [units])
    return <Animated.View style={[styles.unit, _style]}>
        {units.map((v)=>v.component)}
    </Animated.View>

}

const vecToNum = (v:Vector)=>  4 + v[0] + v[1] * 3 + v[2] * 9

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
        const initSurface = surfaceRef.current[vecToNum([0, 0, 0])]
        const initUnits = controller.getUnits()
        initSurface.setUnits && initSurface.setUnits(initUnits)
        initUnits.forEach(unit=>{
            unit.component = <UUnit key={unit.id} unit={unit}/>
        })
        const cacheUnits:(UnitProps)[] = new Array(10000)
        const interval = setInterval(()=>{
            let cacheLen = 0
            const newUnits = surfaceRef.current.map((surface)=>{
                if(surface.getOffset && surface.units){
                    const offset = surface.getOffset()
                    return surface.units.filter((unit)=>{
                        if (1){
                            cacheUnits[cacheLen] = unit
                            cacheLen += 1
                            return false
                        }
                        return true
                    })
                }
                return []
            })
            for(let i = 0;i<cacheLen;i++){
                const unit = cacheUnits[i]
                const idx = Math.floor(Math.random()* VECTORS.length)
                const getOffset = surfaceRef.current[idx].getOffset
                if (unit.movement && getOffset){
                    const offset = getOffset()
                    //unit.movement.setX(offset[0])
                    //unit.movement.setY(offset[1])
                }
                newUnits[Math.floor(Math.random()* VECTORS.length)].push(unit)
            }
            const d = new Date()
            surfaceRef.current.forEach((surface, i)=>{
                surface.setUnits && surface.setUnits(newUnits[i])
            })
            console.log('@@@', new Date().valueOf() - d.valueOf())
        }, 125)
        return ()=>clearInterval(interval)
    }, [])
    // const units = controller.getUnits().map(createUnit)
    return <View style={{...StyleSheet.absoluteFillObject, width:0, height:0}}>
        {surfaceRef.current.map((d, i)=><Surface key={i} data={d}/>)}
    </View>
})

const styles = StyleSheet.create({
    unit: {position: 'absolute'}
  });