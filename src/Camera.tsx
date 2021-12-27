import { MutableRefObject, useEffect, useMemo, useRef, forwardRef, RefObject, memo, useState } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Position, UpperRef, CameraRef, MapRef } from './types'
import { TILESIZE, CAMWIDTH, CAMHEIGHT } from './constants'


type Props = {
    mapRef:MutableRefObject<MapRef>,
    scrollRef:RefObject<ScrollView>
    subScrollRef:RefObject<ScrollView>
}

export default forwardRef<CameraRef, Props>(({mapRef, scrollRef, subScrollRef}, ref)=>{
    // useEffect(()=>{
    //     let i = 0
    //     let j = 0
    //     const interval = setInterval(()=>{
    //         mapRef.current.setScrollY && mapRef.current?.setScrollY(i/32)
    //         scrollRef.current?.scrollTo({animated:false, y:i})
    //         // setScrollX(x/32)
    //         // scrollRef.current?.scrollTo({animated:false, x})
    //         i = (i < TILESIZE * 100 - CAMHEIGHT)?i + 1 :0
    //         j = (j < TILESIZE * 100 - CAMWIDTH)?j + 1 :0
    //     }, 16)
    //     return ()=>clearInterval(interval)
    // },[])
    
    return (<></>)
})