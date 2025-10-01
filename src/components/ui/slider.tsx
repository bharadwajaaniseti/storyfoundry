"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number[]
  onValueChange: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  className?: string
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value = [0], onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value)
      onValueChange([newValue])
    }

    return (
      <div className={cn("relative flex items-center w-full", className)}>
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={handleChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-pink-500"
          style={{
            background: `linear-gradient(to right, rgb(236, 72, 153) 0%, rgb(236, 72, 153) ${((value[0] - min) / (max - min)) * 100}%, rgb(229, 231, 235) ${((value[0] - min) / (max - min)) * 100}%, rgb(229, 231, 235) 100%)`
          }}
          {...props}
        />
      </div>
    )
  }
)

Slider.displayName = "Slider"

export { Slider }
