export const TILESIZE = 32
export const SPEED_PER_STEP = 1
export const MS_PER_STEP = 16

export const VECTORS:[number, number, number][] = [
    [-1, -1, 0], [0, -1, 0], [1, -1, 0],
    [-1, 0, 0], [0, 0, 0], [1, 0, 0], 
    [-1, 1, 0], [0, 1, 0], [1, 1, 0],/*
    [-1, -1, 1], [0, -1, 1], [1, -1, 1],
    [-1, 0, 1], [0, 0, 1], [1, 0, 1], 
    [-1, 1, 1], [0, 1, 1], [1, 1, 1]*/
]