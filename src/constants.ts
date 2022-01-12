export const TILESIZE = 32
export const SPEED_PER_STEP = 0.25
export const MS_PER_STEP = 16
export const SPEED_PER_MS = SPEED_PER_STEP/MS_PER_STEP

export const VECTORS:[number, number, number][] = [
    [-1, -1, 0], [0, -1, 0], [1, -1, 0],
    [-1, 0, 0], [0, 0, 0], [1, 0, 0], 
    [-1, 1, 0], [0, 1, 0], [1, 1, 0],/*
    [-1, -1, 1], [0, -1, 1], [1, -1, 1],
    [-1, 0, 1], [0, 0, 1], [1, 0, 1], 
    [-1, 1, 1], [0, 1, 1], [1, 1, 1]*/
]