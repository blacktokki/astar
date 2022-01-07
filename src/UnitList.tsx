import { useState, useEffect, forwardRef, useImperativeHandle, useRef, memo } from 'react'
import { View, Text, StyleSheet } from 'react-native';
import { Position, UnitListRef, Controller, Unit as UnitProps }from './types'
import { TILESIZE, SPEED_PER_STEP, MS_PER_STEP } from './constants'
import useInnerWindow from './useInnerWindow'
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue, withTiming, Easing, useAnimatedReaction, withSequence } from 'react-native-reanimated';

const DURATION = TILESIZE/SPEED_PER_STEP * MS_PER_STEP
type SerfaceData = {
    vec:Position
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

const UUnit = memo(({model}:{model:any})=>{
    const ipos = useRef([Math.random()*_SIZE, Math.random()*_SIZE])
    const [xx, setXx] = useState(ipos.current[0])
    const [yy, setYy] = useState(ipos.current[1])
    useEffect(()=>{
        model.setXx = setXx
        model.setYy = setYy
    })
    useEffect(()=>{
        model.xx = xx
        model.yy = yy
    }, [xx, yy])
    return <View style={[styles.unit, {left:xx, top:yy}]}>{fish}</View>
})
const Surface = ({controller, data}:{controller:Controller, data:SerfaceData}) =>{
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
    const _models = useRef([...Array(_CNT).keys()].map(v=>({id:v} as any)))
    const getOffset = ()=>[pp.value*data.vec[0], pp.value*data.vec[1]]
    const fishs = useRef(_models.current.map((v, i)=><UUnit key={i} model={v}/>))
    useEffect(()=>{
        pp.value = withSequence(withTiming(distance,  { duration: distance * MS_PER_STEP/SPEED_PER_STEP,  easing:Easing.linear }), withTiming(0, { duration: 1 }))
        const interval = setInterval(()=>{
            'worklet'
            _models.current.forEach((m)=>{
                const tx = m.xx + pp.value*data.vec[0]
                const ty = m.yy + pp.value*data.vec[1]
                if (m.xx !=undefined){
                    if(tx<0){
                        m.setXx(_SIZE  - Math.random() * 25 - pp.value * data.vec[0])
                        m.xx = undefined
                    }
                    else if(tx > _SIZE){
                        m.setXx(0 + Math.random() * 25 - pp.value * data.vec[0])
                        m.xx = undefined
                    }
                }
                if (m.yy !=undefined){
                    if(ty<0){
                        m.setYy(_SIZE  - Math.random() * 25 - pp.value * data.vec[1])
                        m.yy = undefined
                    }
                    else if(ty > _SIZE){
                        m.setYy(0  + Math.random() * 25 - pp.value * data.vec[1])
                        m.yy = undefined
                    }
                }
            })
        }, 125)
        return ()=>clearInterval(interval)
    }, [])
    return <Animated.View style={[styles.unit, _style]}>
        {fishs.current}
    </Animated.View>

}

export default forwardRef<UnitListRef, {controller:Controller}>(({controller}, ref)=>{
    const serfaceRef = useRef<SerfaceData[]>([
        {vec:[1, 0]},
        {vec:[-1, 0]},
        {vec:[0, 1]},
        {vec:[0, -1]},
        {vec:[1, 1]},
        {vec:[-1, -1]},
        {vec:[-1, 1]},
        {vec:[1, -1]}
    ])
    useImperativeHandle(ref, ()=>({
        setTargetPos: controller.getUnits()[0].setTargetPos,
        serfaceRef: serfaceRef
    }))
    // const units = controller.getUnits().map(createUnit)
    return <View style={{...StyleSheet.absoluteFillObject, width:0, height:0}}>
        {serfaceRef.current.map((d, i)=><Surface key={i} controller={controller} data={d}/>)}
        {/*units*/}
    </View>
})

const styles = StyleSheet.create({
    unit: {position: 'absolute'}
  });