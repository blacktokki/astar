import { useMemo } from 'react';
import useResizeWindow from './useResizeWindow';

const CAM_RATIO = 0.97

export default function useInnerWindow() {
  const window = useResizeWindow()
  const innerWindow = useMemo(()=>({width:CAM_RATIO * window.width, height: CAM_RATIO * window.height}) ,[window])
  return innerWindow;
}