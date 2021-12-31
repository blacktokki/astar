import { MutableRefObject, forwardRef, useRef, useImperativeHandle, ReactNode, useMemo, useEffect} from 'react'
import {  ScrollView } from 'react-native';
import { CameraRef, MapRef, Controller } from './types'
import { TILESIZE } from './constants'
import useInnerWindow from './useInnerWindow'

type Props = {
    mapRef:MutableRefObject<MapRef>,
    controller:Controller,
    children: ReactNode
}

export default forwardRef<CameraRef, Props>(({mapRef, controller, children}, ref)=>{
    const scrollRef = useRef<ScrollView>(null)
    const subScrollRef = useRef<ScrollView>(null)
    const window = useInnerWindow()
    const setFocusX = (x:number) => {
        const v = Math.min(Math.max(0, x - window.width * 0.5), TILESIZE * controller.getTiles().width - window.width)
        mapRef.current.setScrollX && mapRef.current?.setScrollX(v/32)
        subScrollRef.current?.scrollTo({animated:false, x:v})
    }
    const setFocusY = (y:number) => {
        const v = Math.min(Math.max(0, y - window.height * 0.5), TILESIZE * controller.getTiles().height - window.height)
        mapRef.current.setScrollY && mapRef.current?.setScrollY(v/32)
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