import { MutableRefObject, forwardRef, useRef, useImperativeHandle, ReactNode, useMemo, useEffect} from 'react'
import {  ScrollView } from 'react-native';
import { CameraRef, MapRef, Controller } from './types'
import { TILESIZE } from './constants'
import useInnerWindow from './useInnerWindow'
import Animated, { useAnimatedRef } from 'react-native-reanimated';

type Props = {
    controller:Controller,
    children: ReactNode
}

export default forwardRef<CameraRef, Props>(({controller, children}, ref)=>{
    const scrollRef = useAnimatedRef<ScrollView>()
    const subScrollRef = useAnimatedRef<ScrollView>()
    const window = useInnerWindow()
    const setFocusX = (x:number) => {
        const v = Math.min(Math.max(0, x - window.width * 0.5), TILESIZE * controller.getTiles().width - window.width)
        controller.setScrollX(Math.floor(v/TILESIZE))
        subScrollRef.current?.scrollTo({animated:false, x:v})
    }
    const setFocusY = (y:number) => {
        const v = Math.min(Math.max(0, y - window.height * 0.5), TILESIZE * controller.getTiles().height - window.height)
        controller.setScrollY(Math.floor(v/TILESIZE))
        scrollRef.current?.scrollTo({animated:false, y:v})
    }
    useImperativeHandle(ref, ()=>({
        setFocusX,
        setFocusY
    }))
    // useEffect(()=>{
    //     let i = 0
    //     let j = 0
    //     const interval = setInterval(()=>{
    //         setFocusY(i)
    //         i = (i < TILESIZE * controller.getTiles().height)?i + 1 :0
    //         j = (j < TILESIZE * controller.getTiles().width)?j + 1 :0
    //     }, 16)
    //     return ()=>clearInterval(interval)
    // },[])
    
    return (<ScrollView
                style={{height:window.height}}
                ref={scrollRef}
                scrollEnabled={false}
            >
                <ScrollView
                    style={{width:window.width}}
                    scrollEnabled={false}
                    ref={subScrollRef}
                    horizontal={true}
                >
                {children}
            </ScrollView>
        </ScrollView>
    )
})