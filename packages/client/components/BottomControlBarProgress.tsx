import styled from '@emotion/styled'
import React from 'react'
import {PALETTE} from '~/styles/paletteV2'
import {BezierCurve} from '~/types/constEnums'

const RADIUS = 12
const THICKNESS = 2
const DIAMETER = RADIUS * 2
const RADIUS_NORMALIZED = RADIUS - THICKNESS
const CIRCUMFERENCE = 2 * Math.PI * RADIUS_NORMALIZED

const SVG = styled('svg')({
  height: DIAMETER,
  width: DIAMETER,
  position: 'absolute',
  transform: `translateY(-6px)`
})

const Circle = styled('circle')({
  fill: 'transparent',
  stroke: PALETTE.TEXT_BLUE,
  strokeDasharray: CIRCUMFERENCE.toFixed(3),
  strokeWidth: THICKNESS,
  transform: 'rotate(-90deg)',
  transformOrigin: '50% 50%',
  transition: `all 300ms ${BezierCurve.DECELERATE}`
})

interface Props {
  progress: number
}

const BottomControlBarProgress = (props: Props) => {
  const {progress} = props
  return (
    <SVG>
      <Circle
        style={{
          strokeDashoffset: CIRCUMFERENCE - progress * CIRCUMFERENCE
        }}
        strokeWidth={THICKNESS}
        r={RADIUS_NORMALIZED}
        cx={RADIUS}
        cy={RADIUS}
      />
    </SVG>
  )
}

export default BottomControlBarProgress
