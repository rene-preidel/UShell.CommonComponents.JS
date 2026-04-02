import React from 'react'
import DropdownSelect from '../../../_Atoms/DropdownSelect'

const BoolInputField: React.FC<{
  initialValue: any
  currentValue: any
  isControlled?: boolean
  setCurrentValue: (cv: any) => void
  onValueChange: (newValue: any) => void
  disabled: boolean
  styleType?: number
  classNameBg?: string
  classNameHoverBg?: string
  classNameHoverBgDark?: string
  classNameDropdownBg?: string
  classNameDropdownHoverBg?: string
  required: boolean
  minWidth?: number
  placeholder?: string
}> = ({
  initialValue,
  currentValue,
  isControlled = false,
  setCurrentValue,
  onValueChange,
  disabled,
  styleType = 0,
  classNameBg,
  classNameHoverBg,
  classNameHoverBgDark,
  classNameDropdownBg,
  classNameDropdownHoverBg,
  required = false,
  minWidth,
  placeholder,
}) => {
  const options: { label: string; value: any }[] = [
    { label: 'Yes', value: isControlled ? true : 1 },
    { label: 'No', value: isControlled ? false : -1 },
  ]
  return (
    <DropdownSelect
      minWidth={minWidth}
      options={options}
      value={currentValue}
      isControlled={isControlled}
      onOptionSet={(o) => {
        // !isControlled && setCurrentValue(o?.value == undefined ? undefined : o?.value == 1 ? true : false)      
        setCurrentValue(o?.value == undefined ? undefined : o?.value == 1 ? true : false)
        onValueChange(o?.value == undefined ? undefined : o?.value == 1 ? true : false)
      }}
      initialOption={{
        label: initialValue == undefined ? 'Unset' : initialValue == true ? 'Yes' : 'No',
        value: initialValue == undefined ? undefined : initialValue == true ? 1 : -1,
      }}
      topOffset={0}
      classNameBg={classNameBg}
      classNameHoverBg={classNameHoverBg}
      classNameHoverBgDark={classNameHoverBgDark}
      classNameDropdownBg={classNameDropdownBg}
      classNameDropdownHoverBg={classNameDropdownHoverBg}
      styleType={styleType}
      required={required}
      placeholder={placeholder}
    ></DropdownSelect>
  )
}

export default BoolInputField
