import { useRef } from 'react'
import { View, Text, ScrollView } from 'react-native';
import { UpperRef, MapRef } from './types'
import { CAMWIDTH, CAMHEIGHT } from './constants'
import Map from './Map'
import Upper from './Upper'
import Camera from './Camera'


export default ()=>{
    const upperRef = useRef<UpperRef>({})
    const mapRef = useRef<MapRef>({})
    const cameraRef = useRef({})
    const scrollRef = useRef<ScrollView>(null)
    const subScrollRef = useRef<ScrollView>(null)
    return (
        <View>
            <ScrollView
                style={{height:CAMHEIGHT}}
                ref={scrollRef}
                scrollEnabled={false}
            >
                <ScrollView
                    style={{width:CAMWIDTH}}
                    scrollEnabled={false}
                    ref={subScrollRef}
                    horizontal={true}
                >
                    <Map ref={mapRef} upperRef={upperRef}/>
                    <Upper ref={upperRef}/>
                    <Camera ref={cameraRef} mapRef={mapRef} scrollRef={scrollRef} subScrollRef={subScrollRef}/>
                </ScrollView>
            </ScrollView>
            <Text>Open up App.tsx to start working on your app!</Text>
        </View>
    )
}