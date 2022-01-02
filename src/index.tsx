import { useRef } from 'react'
import { View, Text} from 'react-native';
import { UnitListRef, MapRef} from './types'
import Map from './Map'
import UnitList from './UnitList'
import Camera from './Camera'
import useController from './useController';


export default ()=>{
    const unitListRef = useRef<UnitListRef>({})
    const mapRef = useRef<MapRef>({})
    const cameraRef = useRef({})
    const controller = useController(cameraRef)
    return (
        <View onLayout={(e)=>{mapRef.current.setMargin && mapRef.current.setMargin([e.nativeEvent.layout.x, e.nativeEvent.layout.y])}}>
            <Camera ref={cameraRef} mapRef={mapRef} controller={controller}>
                <Map ref={mapRef} unitListRef={unitListRef} controller={controller}/>
                <UnitList ref={unitListRef} controller={controller}/>
            </Camera>
            <Text>Open up App.tsx to start working on your app!</Text>
        </View>
    )
}