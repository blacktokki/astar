import { useEffect, forwardRef, useImperativeHandle, useRef, memo, useMemo, useState } from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Position, UnitListRef, Controller, Unit as UnitProps, Vector }from './types'
import { TILESIZE, SPEED_PER_MS, VECTORS } from './constants'
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue, withTiming, Easing, withSequence } from 'react-native-reanimated';
import Heap from 'heap';
import Canvas from 'react-native-canvas';

type ShareState = {
    x:number,
    y:number,
    visible:boolean
}

type MoveableData = {
    shareState?:Animated.SharedValue<ShareState>
    initShareState:ShareState
}

type SurfaceData = {
    vec:Vector
    getPos?:(index:number)=>Position
    setHide?:(index:number|undefined)=>void,
    popEmptyIdx?:()=>(number|undefined)
    setPos?:(index:number, pos:Position, distance:number, unit:UnitProps)=>void,
    popPos?:()=>(UnitProps|undefined)
    resize?:()=>void
}

const fish = <Text style={{paddingLeft:6, color:'rgba(0,0,0, 0.2)'}}>🐡</Text>//🧍

const MAX_DISTANCE = 100000000
const INIT_POSITION:Position = [-MAX_DISTANCE, -MAX_DISTANCE]
const BATCH_ELEMENT = 200
const MAX_CACHE = 200

const Moveable = memo(({data}:{data:MoveableData})=>{
    const shareState = useSharedValue(data.initShareState)
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
})

const Surface = ({data}:{data:SurfaceData}) =>{
    const timing = useSharedValue(0)
    const _style = useAnimatedStyle(() => {
        return {
            transform: [
                {translateX: timing.value * data.vec[0]},
                {translateY: timing.value * data.vec[1]}
            ],
        };
    });
    const moveableData = useRef([...Array(BATCH_ELEMENT)].map((v)=>({initShareState:{x:INIT_POSITION[0], y:INIT_POSITION[1], visible:false}} as MoveableData)))
    const [moveable, setMoveable] = useState(moveableData.current.map((v, k)=><Moveable key={k} data={v}/>))
    const heap = useRef(new Heap<{pr:number, unit:UnitProps}>((a, b)=>(a.pr - b.pr)))
    useEffect(()=>{
        let emptyStack:(number|undefined)[] = [...Array(BATCH_ELEMENT).keys()]
        let emptyIdx = 0
        data.popEmptyIdx = ()=>{
            if (emptyIdx == moveableData.current.length){
                const prevLen = moveableData.current.length
                moveableData.current = moveableData.current.concat([...Array(BATCH_ELEMENT)].map((v)=>({initShareState:{x:INIT_POSITION[0], y:INIT_POSITION[1], visible:false}})))
                emptyStack = emptyStack.concat([...Array(BATCH_ELEMENT).keys()].map((v)=>prevLen + v))
            }
            return emptyStack[emptyIdx++]
        },
        data.getPos = (index)=>{
            'worklet'
            const _state = moveableData.current[index].shareState
            if(_state){
                return [timing.value*data.vec[0] + _state.value.x, timing.value*data.vec[1] + _state.value.y]
            }
            else{
                const _init_state = moveableData.current[index].initShareState
                return [timing.value*data.vec[0] + _init_state.x, timing.value *data.vec[1] + _init_state.y]
            }
        },
        data.setPos = (index, pos, distance, unit)=>{
            'worklet'
            const _state = moveableData.current[index].shareState
            if(_state){
                _state.value = {
                    x:pos[0] - timing.value*data.vec[0],
                    y:pos[1] - timing.value*data.vec[1],
                    visible:true
                }
            }
            else{
                moveableData.current[index].initShareState = {
                    x:pos[0] - timing.value*data.vec[0],
                    y:pos[1] - timing.value*data.vec[1],
                    visible:true
                }
            }
            heap.current.push({pr:timing.value + distance, unit})
        }
        data.setHide = (index)=>{
            'worklet'
            if (index==undefined)
                return
            const _state = moveableData.current[index].shareState
            if(_state){
                _state.value = {
                    x:INIT_POSITION[0],
                    y:INIT_POSITION[1],
                    visible:false
                }
            }
            else{
                moveableData.current[index].initShareState = {
                    x:INIT_POSITION[0],
                    y:INIT_POSITION[1],
                    visible:false
                }
            }
            emptyStack[--emptyIdx] = index
        },
        data.popPos = ()=>{
            if (heap.current.size() && heap.current.peek().pr <= timing.value)
                return heap.current.pop().unit
            return undefined
        }
        timing.value = withSequence(withTiming(MAX_DISTANCE,  { duration: MAX_DISTANCE/SPEED_PER_MS,  easing:Easing.linear }), withTiming(0, { duration: 1 }))
        // const it = setInterval(()=>{
        //     console.log(data.vec, emptyIdx, moveableData.current.length)
        // }, 1000)
        // return ()=>clearInterval(it )
    }, [])
    useEffect(()=>{
        let lock = true
        data.resize = async()=>{
            if(lock && moveable.length < moveableData.current.length){
                lock = false
                // console.log(data.vec, moveable.length, moveableData.current.length)
                setMoveable(moveable.concat([...Array(BATCH_ELEMENT).keys()].map((v)=>{
                    return <Moveable key={moveable.length + v} data={moveableData.current[moveable.length + v]}/>})))
                lock = true
            }
        }
    },[moveable])
    return <Animated.View style={[styles.unit, _style]}>
        {moveable}
    </Animated.View>

}

const getNextDisVec = (currentPos:Position, targetPos:Position)=>{
    const distanceX = Math.abs(targetPos[0] - currentPos[0])
    const distanceY = Math.abs(targetPos[1] - currentPos[1])
    const distance = distanceX>0 && distanceY>0?Math.min(distanceX, distanceY):Math.max(distanceX, distanceY)
    const vec = currentPos.map((value, index)=>{
        if (value < targetPos[index])
            return 1
        if (value > targetPos[index])
            return -1
        return 0
    })
    return [distance, vec] as [number, Position]
}

const finished = (currentPos:Position, unit:UnitProps)=>{
    if(unit.targetPos && currentPos[0] == unit.targetPos[0] && currentPos[1] == unit.targetPos[1] && unit.moveFinished)
        unit.moveFinished(unit)
}

const Cvs = ({col}:{col:string})=>{
    const ref = useRef<HTMLCanvasElement>(null)
    const ref2 = useRef<Canvas>(null)
    useEffect(()=>{
        const ctx = (Platform.OS=='web'?ref.current:ref2.current)?.getContext('2d')
        if(ctx){
            ctx.fillStyle = col;
            ctx.font = '16px serif'
            ctx.fillRect(0, 0, 100, 100);
            ctx.fillText("🐡", 0, 48)
        }
    })
    const style = {width:8000, height:8000, borderWidth:10, borderColor:'#FF0000'}
    return Platform.OS =='web'?<canvas width={style.width} height={style.height} style={style} ref={ref}/>:<Canvas style={style} ref={ref2}/>
}

export default forwardRef<UnitListRef, {controller:Controller}>(({controller}, ref)=>{
    const surfaceRef = useRef<SurfaceData[]>(VECTORS.map(v=>({vec:v})))
    useImperativeHandle(ref, ()=>({
        setTargetPos: (pos)=>{
            controller.getUnits()[0].targetPos = pos
        },
    }))
    const getPos = (unit:UnitProps)=>{
        const pos = unit.nextPos || unit.initPos
        let hide = ()=>{finished(unit.initPos, unit)}
        if(unit.movement){
            const fromSurface = surfaceRef.current[unit.movement.vecIdx]
            // pos = fromSurface.getPos?fromSurface.getPos(unit.movement.idx):pos
            hide = ()=>{
                fromSurface.setHide && unit.movement && fromSurface.setHide(unit.movement.idx)
                finished(pos, unit)
            }
        }
        return {unit, pos, hide}
    }
    const setPos = ({unit, pos, hide}:{unit:UnitProps, pos:Position, hide:()=>void})=>{
        const [dist, vec] = getNextDisVec(pos, unit.targetPos || pos)
        const idx = 4 + vec[0] + vec[1] * 3
        unit.nextPos = [pos[0] + dist * vec[0], pos[1] + dist * vec[1]]
        const surface = surfaceRef.current[idx]
        if (surface.popEmptyIdx){
            const iidx = surface.popEmptyIdx()
            if (iidx!=undefined){
                hide && hide()
                surface.setPos && surface.setPos(iidx, pos, dist, unit)
                unit.movement = {
                    vecIdx:idx,
                    idx:iidx
                }
            }
        }
    }
    useEffect(()=>{
        controller.getUnits().map((unit)=>{
            if (unit.movement == undefined && unit.moveFinished)
                unit.moveFinished(unit)
            return getPos(unit)
        }).forEach(setPos)
        const cacheUnits:{unit:UnitProps, pos:Position, hide:()=>void}[] = new Array(MAX_CACHE)
        const interval = setInterval(()=>{
            let cacheLen = 0
            surfaceRef.current.forEach((surface)=>{
                if (cacheLen == MAX_CACHE)
                    return
                while(surface.popPos && cacheLen<MAX_CACHE){
                    const unit = surface.popPos()
                    if (unit == undefined)
                        break
                    cacheUnits[cacheLen] = getPos(unit)
                    cacheLen++
                }
            })
            for(let i=0;i<cacheLen;i++){
                setPos(cacheUnits[i])
            }
            surfaceRef.current.forEach((surface)=>{
                surface.resize && surface.resize()
            })
        }, 100)
        return ()=>clearInterval(interval)
    }, [])
    return <View style={{...StyleSheet.absoluteFillObject, width:0, height:0}}>
        {surfaceRef.current.map((d, i)=><Surface key={i} data={d}/>)}
        {/* <View style={styles.unit}>
            <Cvs col={'rgba(0,0,0, 0.5)'}/>
        </View>
        <View style={[styles.unit, {left:50}]}>
            <Cvs col={'rgba(255,0,0, 0.5)'}/>
        </View> */}
    </View>
})

const styles = StyleSheet.create({
    unit: {position: 'absolute'}
  });