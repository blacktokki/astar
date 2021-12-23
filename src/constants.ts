import { Dimensions } from 'react-native'
import { Position }from './types'

export const TILESIZE = 32
export const SPEED_PER_STEP = 8
export const INIT_POSITION:Position = [4 * TILESIZE, 4 * TILESIZE]
export const MS_PER_STEP = 16

export const window = Dimensions.get('window')