import { useState, useEffect, forwardRef, useImperativeHandle, MutableRefObject } from 'react'
import { View, Text, StyleSheet } from 'react-native';
import { Position, UnitListRef, CameraRef, Controller }from './types'
import { TILESIZE, SPEED_PER_STEP, MS_PER_STEP } from './constants'
import useInnerWindow from './useInnerWindow'

type UnitListProps = {cameraRef:MutableRefObject<CameraRef>, controller:Controller}

const INIT_POSITION:Position = [4 * TILESIZE, 4 * TILESIZE]

function useMoveable(postMove:(pos:Position)=>void, finished?:()=>void){
    const [targetPos, setTargetPos] = useState<Position>(INIT_POSITION)
    const [pos, setPos] = useState<Position>(INIT_POSITION)
    const [subtargetPos, setSubtargetPos] = useState<Position>(INIT_POSITION)
    let timeout:any = null
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
            timeout = setTimeout(()=>{
                setPos(nextPos)
                postMove(nextPos)
            }, MS_PER_STEP)
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
        else
            finished && finished()
    }, [pos, subtargetPos, targetPos])
    return [targetPos, pos, (pos)=>{clearTimeout(timeout);setTargetPos(pos)}] as [Position, Position, (pos:Position)=>void]
}


const Player = forwardRef<UnitListRef, UnitListProps>(({cameraRef, controller}, ref)=>{
    const [targetPos, pos, setTargetPos] = useMoveable((nextPos)=>{
        cameraRef.current.setFocusX && cameraRef.current.setFocusX(nextPos[0])
        cameraRef.current.setFocusY && cameraRef.current.setFocusY(nextPos[1])
    })
    const window = useInnerWindow()
    useImperativeHandle(ref, ()=>({
        setTargetPos
    }))
    useEffect(()=>{
        cameraRef.current.setFocusX && cameraRef.current.setFocusX(pos[0])
        cameraRef.current.setFocusY && cameraRef.current.setFocusY(pos[1])
    }, [window])
    return <View>
        {(targetPos[0] != pos[0] || targetPos[1] != pos[1]) && <View style={{
            ...StyleSheet.absoluteFillObject, left:targetPos[0],top:targetPos[1], width:TILESIZE, height:TILESIZE, borderWidth:2, borderColor:'greenyellow'}}/>}
        <View style={{...StyleSheet.absoluteFillObject, left:pos[0],top:pos[1]}}>
            <Text style={{paddingLeft:6}}>🧍</Text>
        </View>
    </View>
})

const Ai = forwardRef<UnitListRef, UnitListProps>(({cameraRef, controller}, ref)=>{
    const [targetPos, pos, setTargetPos] = useMoveable((nextPos)=>{}, ()=>{
        const nextPos:Position = [
            Math.floor(Math.random() * controller.getTiles().width / 4) * TILESIZE, 
            Math.floor(Math.random() * controller.getTiles().height / 4) * TILESIZE
        ]
        setTargetPos(nextPos)
    })
    return <View>
        {(targetPos[0] != pos[0] || targetPos[1] != pos[1]) && <View style={{
            ...StyleSheet.absoluteFillObject, left:targetPos[0],top:targetPos[1], width:TILESIZE, height:TILESIZE, borderWidth:2, borderColor:'greenyellow'}}/>}
        <View style={{...StyleSheet.absoluteFillObject, left:pos[0],top:pos[1]}}>
            <Text style={{paddingLeft:6}}>🧍</Text>
        </View>
    </View>
})

export default forwardRef<UnitListRef, UnitListProps>(({cameraRef, controller}, ref)=>{
    return <View style={{...StyleSheet.absoluteFillObject, width:0, height:0}}>
        <Player ref={ref} cameraRef={cameraRef} controller={controller}/>
        <Ai ref={ref} cameraRef={cameraRef} controller={controller}/>
        <Ai ref={ref} cameraRef={cameraRef} controller={controller}/>
        <Ai ref={ref} cameraRef={cameraRef} controller={controller}/>
        <Ai ref={ref} cameraRef={cameraRef} controller={controller}/>
        <Ai ref={ref} cameraRef={cameraRef} controller={controller}/>
        <Ai ref={ref} cameraRef={cameraRef} controller={controller}/>
        <Ai ref={ref} cameraRef={cameraRef} controller={controller}/>
        <Ai ref={ref} cameraRef={cameraRef} controller={controller}/>
        <Ai ref={ref} cameraRef={cameraRef} controller={controller}/>
        <Ai ref={ref} cameraRef={cameraRef} controller={controller}/>
        <Ai ref={ref} cameraRef={cameraRef} controller={controller}/>
        <Ai ref={ref} cameraRef={cameraRef} controller={controller}/>
        <Ai ref={ref} cameraRef={cameraRef} controller={controller}/>
        <Ai ref={ref} cameraRef={cameraRef} controller={controller}/>
        <Ai ref={ref} cameraRef={cameraRef} controller={controller}/>
        <Ai ref={ref} cameraRef={cameraRef} controller={controller}/>
        <Ai ref={ref} cameraRef={cameraRef} controller={controller}/>
        <Ai ref={ref} cameraRef={cameraRef} controller={controller}/>
        <Ai ref={ref} cameraRef={cameraRef} controller={controller}/>
    </View>
})