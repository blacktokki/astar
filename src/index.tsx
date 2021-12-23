import { useRef } from 'react'
import { View, Text } from 'react-native';
import { UpperRef } from './types'
import Map from './Map'

export default ()=>{
    const upperRef = useRef<UpperRef>({})
    const mapRef = useRef<{}>({})
    return (
        <View>
            <Map ref={mapRef} upperRef={upperRef}/>
            <Text>Open up App.tsx to start working on your app!</Text>
        </View>
    )
}