import React from 'react'
import { getInputStyleClassName } from './InputField'

const InputStyle: React.FC<{
  initialValue: any
  currentValue: any
  setCurrentValue: (cv: any) => void
  onValueChange: (newValue: any) => void
  disabled: boolean
  htmlType: string
  classNameBg?: string
  classNameHoverBg?: string
  classNameHoverBgDark?: string
  styleType?: number
  hasErrors: boolean,
  placeholder?: string
}> = ({
  currentValue,
  setCurrentValue,
  onValueChange,
  disabled,
  htmlType,
  classNameBg,
  classNameHoverBg,
  classNameHoverBgDark,
  styleType = 0,
  hasErrors,
  placeholder,
}) => {
  const className: string = getInputStyleClassName(
    styleType,
    classNameBg,
    disabled,
    classNameHoverBg,
    classNameHoverBgDark,
    hasErrors,
  )
  return (
    <input
      disabled={disabled}
      className={className}
      type={htmlType}
      value={currentValue}
      onChange={(e) => {
        onValueChange(e.target.value)
        setCurrentValue(e.target.value)
      }}
      placeholder={placeholder}
    ></input>
  )
}

export default InputStyle
