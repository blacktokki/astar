import { MutableRefObject, useEffect, useMemo, useRef, forwardRef, RefObject } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Position, UpperRef } from './types'
import { TILESIZE, window } from './constants'
import Upper from './Upper'

type Item = {
    pos: Position,
    upperRef: MutableRefObject<UpperRef>,
}

type Row = {
    items:Item[],
    rowRef:MutableRefObject<FlatList<Item>[]>
}

type MapRef = {}

const renderItem = ({item}:{item:Item})=>{
    return <TouchableOpacity 
        style={{width:TILESIZE, height:TILESIZE, backgroundColor:`rgb(255, ${224 + (item.pos[0]/TILESIZE * 4) % 32}, ${224 + (item.pos[1]/TILESIZE * 4)% 32})`}}
        onPress={()=>item.upperRef.current.setTargetPos && item.upperRef.current.setTargetPos(item.pos)}
    >
        <Text style={{fontSize:7}}>{`${item.pos[0]/TILESIZE}:${item.pos[1]/TILESIZE}`}</Text>
    </TouchableOpacity>
}

const renderSubList = ({item}:{item:Row})=>{
    return <FlatList 
        ref={(ref)=>{ref && item.rowRef.current.push(ref)}}
        data={item.items} 
        renderItem={renderItem} 
        horizontal={true}
        scrollEnabled={false}
        windowSize={5}
        keyExtractor={(item, index)=>`${index}`}
    />
}

export default forwardRef<MapRef, {upperRef:MutableRefObject<UpperRef>}>(({upperRef}, ref)=>{
    const scrollRef = useRef<FlatList<Row>>(null)
    const subScrollRef = useRef<FlatList<Item>[]>([])
    const ListFooter = useMemo(()=>{
        return <Upper ref={upperRef}/>
    }, [])
    const data:Row[] = useMemo(()=>[...Array(100).keys()].map((value)=>{
        return {
            items:[...Array(100).keys()].map((value2)=>{
                return {pos:[value * TILESIZE, value2 * TILESIZE], upperRef:upperRef}
            }),
            rowRef:subScrollRef
        }
    }), [])
    useEffect(()=>{
        let i = 0
        const interval = setInterval(()=>{
            scrollRef.current?.scrollToOffset({animated:false, offset:i - window.height *0.8 * 0})
            i += 1
        }, 16)
        return ()=>clearInterval(interval)
    },[])
    // useEffect(()=>{
    //     let i = 0
    //     const interval = setInterval(()=>{
    //         subScrollRef.current.forEach(value=>{
    //             value.scrollToOffset({animated:false, offset:i})
    //         })
    //         i += 1
    //     }, 16)
    //     return ()=>clearInterval(interval)
    // },[])
    return (<View style={{width:window.width *0.8, height:window.height*0.8}}>
        <FlatList
            ref={scrollRef}
            data={data}
            renderItem={renderSubList}
            scrollEnabled={false}
            // onScroll={(e)=>{console.log('@', e.nativeEvent.contentOffset.y)}}
            keyExtractor={(item, index)=>`${index}`}
            ListFooterComponent={ListFooter}
            ListFooterComponentStyle={{...StyleSheet.absoluteFillObject, width:0, height:0}}
        />
    </View>)
})