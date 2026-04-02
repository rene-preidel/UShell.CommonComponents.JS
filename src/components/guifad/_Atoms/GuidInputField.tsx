import React, { useState } from 'react'
import InputStyle from './InputStyle'

const GuidInputField: React.FC<{
  className?: string
  initialValue: any
  currentValue: any
  setCurrentValue: (cv: any) => void
  onValueChange: (newValue: any) => void
  disabled: boolean
  classNameBg?: string
  classNameHoverBg?: string
  classNameHoverBgDark?: string
  styleType?: number
  hasErrors: boolean,
  placeholder?: string
}> = ({
  initialValue,
  currentValue,
  setCurrentValue,
  onValueChange,
  disabled,
  classNameBg,
  classNameHoverBg,
  classNameHoverBgDark,
  styleType = 0,
  hasErrors,
  placeholder,
}) => {
  function generateGuid() {
    const guid = crypto.randomUUID()
    onValueChange(guid)
    setCurrentValue(guid)
  }

  return (
    <div className='flex gap-1'>
      <InputStyle
        htmlType='text'
        currentValue={currentValue}
        disabled={disabled}
        initialValue={initialValue}
        onValueChange={onValueChange}
        setCurrentValue={setCurrentValue}
        classNameBg={classNameBg}
        classNameHoverBg={classNameHoverBg}
        classNameHoverBgDark={classNameHoverBgDark}
        styleType={styleType}
        hasErrors={hasErrors}
        placeholder={placeholder}
      ></InputStyle>
      {!disabled && (
        <button
          disabled={disabled}
          className={`bg-toolbar dark:bg-toolbarDark p-1 rounded-md
            hover:bg-toolbarHover dark:hover:bg-toolbarHoverDark`}
          onClick={() => generateGuid()}
        >
          Generate
        </button>
      )}
    </div>
  )
}

export default GuidInputField
