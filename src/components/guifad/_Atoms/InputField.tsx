import React, { useEffect, useMemo, useRef, useState } from 'react'
import { EntitySchemaService } from '../../../data/EntitySchemaService'
import GuidInputField from './GuidInputField'
import InputStyle from './InputStyle'
import BoolInputField from './BoolInputField'
import DropdownSelect from '../../../_Atoms/DropdownSelect'
import ExclamationCircleIcon from '../../../_Icons/ExclamationCircleIcon'
import { Tooltip } from '../../../_Atoms/Tooltip2'
import DropdownMultiSelect, { DropdownMultiSelectHandle } from '../../../_Atoms/DropdownMultiSelect'
import type { Option } from '../../../_Atoms/MultiSelect'
import XMarkIcon from '../../../_Icons/XMarkIcon'
import RevertIcon from '../../../_Icons/RevertIcon'
import ArrowUturnLeftIcon from '../../../_Icons/ArrowUturnLeftIcon'

const enum InputFieldType {
  Input = 0,
  MultilineText = 1,
  Guid = 2,
  Boolean = 3,
  Select = 4,
  MultiSelect = 5,
  Unit = 6
}

const InputField: React.FC<{
  label: string | null
  inputType: string
  initialValue: any
  onValueChange: (newValue: any, errors: string | null) => void
  onError?: (errors: string | null) => void
  /** Setting a value will turn this into a controlled component */
  value?: any
  resetValue?: any
  allowedValues?: { [key: string]: any }
  allowedValuesSeparator?: string | null
  setabilityFlags?: number
  classNameBg?: string
  classNameHoverBg?: string
  classNameHoverBgDark?: string
  classNameDropdownBg?: string
  classNameDropdownHoverBg?: string
  multiLine?: boolean
  styleType?: number
  readOnly?: boolean
  isCreation?: boolean
  required?: boolean
  numberDecimals?: number
  unit?: string
  minWidth?: number
  placeholder?: string
  /** Whether to display a label. Default is true. */
  showLabel?: boolean
  /** Whether to display an error indicator next to the input field if internal validation failed */
  showErrorIcon?: boolean
}> = ({
  label,
  inputType,
  initialValue,
  value,
  resetValue = null,
  onValueChange,
  onError,
  allowedValues,
  allowedValuesSeparator = null,
  setabilityFlags = 7,
  classNameBg,
  classNameHoverBg,
  classNameHoverBgDark,
  classNameDropdownBg,
  classNameDropdownHoverBg,
  multiLine = false,
  styleType = 0,
  readOnly = false,
  isCreation = false,
  required = false,
  numberDecimals = 0,
  unit,
  minWidth,
  placeholder,
  showLabel = true,
  showErrorIcon = true,
}) => {
  
  const isControlled = value !== undefined;

  const [currentValue, setCurrentValue] = useState<any>(initialValue)
  const [internalErrors, setInternalErrors] = useState<string | null>(null);
  const [inputStyleClassName, setInputStyleClassName] = useState<string>('');
  const [inputFieldRef, setInputFieldRef] = useState<HTMLTextAreaElement | HTMLInputElement | null>(null);

  const dropdownMultiSelectHandle = useRef<DropdownMultiSelectHandle | null>(null);

  const htmlType: string = EntitySchemaService.getHtmlInputType(inputType);

  const inputFieldType: InputFieldType = useMemo(() => {
    const lowerInputType = inputType.toLocaleLowerCase();

    if (lowerInputType === 'guid') {
      return InputFieldType.Guid;
    }
    if (lowerInputType === 'bool' || lowerInputType === 'boolean') {
      return InputFieldType.Boolean;
    }
    if (allowedValues) {
      return allowedValuesSeparator ? InputFieldType.MultiSelect : InputFieldType.Select;
    }
    if (multiLine) {
      return InputFieldType.MultilineText;
    }
    if (unit) {
      return InputFieldType.Unit;
    }
    return InputFieldType.Input;
  }, [inputType, allowedValues, allowedValuesSeparator, multiLine, unit]);

  // Initialize internal errors for controlled component
  useEffect(() => {
    onError?.(internalErrors);
  }, [internalErrors]);

  // // initial validation
  useEffect(() => {
    const errors = getErrors(initialValue);
    setInternalErrors(errors);
  }, [initialValue]);

  useEffect(() => {
    function getInitialValue(initialValue: any): any {
      if (htmlType == 'date' || htmlType == 'datetime') {
        if (!initialValue) {
          return undefined
          return new Date().toISOString().replace(/T.*/, '')
        }
        return new Date(initialValue).toISOString().replace(/T.*/, '')
      }
      if (initialValue) return initialValue

      // if (htmlType == 'text') return ''
      // if (htmlType == 'number') return 0

      return initialValue
    }
    setCurrentValue(getInitialValue(initialValue))
  }, [initialValue, htmlType]);

  const id: string = useMemo(() => crypto.randomUUID(), []);
  const disabled = readOnly || (isCreation ? (setabilityFlags & 1) == 0 : (setabilityFlags & 2) == 0);

  useEffect(() => {
    const classNameInput: string = getInputStyleClassName(
      styleType,
      classNameBg,
      disabled,
      classNameHoverBg,
      classNameHoverBgDark,
      internalErrors != null,
      multiLine
    );
    setInputStyleClassName(classNameInput);
  }, [styleType, classNameBg, disabled, classNameHoverBg, classNameHoverBgDark, internalErrors, multiLine]);

  function getInitialMultiSelectOptions() {
    const res = initialValue
      ?.toString()
      .split(new RegExp(`(?<!${allowedValuesSeparator})${allowedValuesSeparator}`))
      .map((s: string) => {
      const unescapedValue = s.replace(
        new RegExp(`${allowedValuesSeparator}${allowedValuesSeparator}`, 'g'),
        allowedValuesSeparator!
      );
      return { label: unescapedValue, value: unescapedValue };
      });

    return res;
  }

  function resetValueTo(v: any): any {
    const newValue = v;
    const errors = getErrors(newValue);
    onValueChange(newValue, errors);
    const clearValueAsString = EntitySchemaService.convertToString(inputType, newValue);
    setCurrentValue(clearValueAsString);
    // HACK: for date fields, we need to set the value directly on the input element if we clear the field
    if (newValue === null && inputFieldRef) {
      inputFieldRef.value = '';
    }
    // use multi select setter if applicable
    if (dropdownMultiSelectHandle && dropdownMultiSelectHandle.current) {
      dropdownMultiSelectHandle.current.setCurrentOptions(getInitialMultiSelectOptions());
      dropdownMultiSelectHandle.current.focus();
    }

    setInternalErrors(errors);
  }

  function getErrors(v: any): string | null {
    const result = EntitySchemaService.getErrors(v, required, inputType)
    
    if (result) return result;

    // check if dropdown value is within allowed values
    if (allowedValues) {
      if (!required && (v === null || v === undefined || v === '')) return null;
      if (allowedValuesSeparator) {
        const parts = v?.toString().split(allowedValuesSeparator) || [];
        for (let p of parts) {
          if (!Object.keys(allowedValues).includes(p)) {
            return `Value '${p}' is not allowed.`;
          }
        }
      } else {
        if (!Object.keys(allowedValues).includes(v?.toString())) {
          return `Value '${v}' is not allowed.`;
        }
      }
    }

    return result
  }

  function renderInnerInput(htmlType: string) {
    if (inputFieldType === InputFieldType.Guid) {
      return (
        <GuidInputField
          initialValue={initialValue}
          currentValue={isControlled ? value : currentValue}
          setCurrentValue={setCurrentValue}
          onValueChange={(nv) => onValueChange(nv, getErrors(nv))}
          disabled={disabled}
          classNameBg={classNameBg}
          classNameHoverBg={classNameHoverBg}
          classNameHoverBgDark={classNameHoverBgDark}
          styleType={styleType}
          hasErrors={getErrors(initialValue) != null}
          placeholder={placeholder}
        ></GuidInputField>
      )
    }

    if (inputFieldType === InputFieldType.Boolean) {
      return (
        <BoolInputField
          initialValue={initialValue}
          currentValue={isControlled ? value : currentValue}
          isControlled={true}
          setCurrentValue={setCurrentValue}
          onValueChange={(nv) => {
            onValueChange(nv, getErrors(nv))
          }}
          disabled={disabled}
          classNameBg={classNameBg}
          classNameHoverBg={classNameHoverBg}
          classNameHoverBgDark={classNameHoverBgDark}
          classNameDropdownBg={classNameDropdownBg}
          classNameDropdownHoverBg={classNameDropdownHoverBg}
          styleType={styleType}
          required={required}
          minWidth={minWidth}
          placeholder={placeholder}
        ></BoolInputField>
      )
    }

    if (inputFieldType === InputFieldType.Select) {
      const options: { label: string; value: any }[] = Object.keys(allowedValues!).map((av) => {
        return { label: allowedValues![av], value: av }
      });
      return (
        <DropdownSelect
          minWidth={minWidth}
          disabled={disabled}
          value={isControlled ? value : currentValue}
          isControlled={true}
          required={required}
          classNameInput={inputStyleClassName}
          classNameBg={classNameBg}
          classNameHoverBg={classNameHoverBg}
          classNameHoverBgDark={classNameHoverBgDark}
          classNameDropdownBg={classNameDropdownBg}
          classNameDropdownHoverBg={classNameDropdownHoverBg}
          styleType={styleType}
          options={options}
          onOptionSet={(o) => {
            const errors = getErrors(o?.value);
            setInternalErrors(errors);
            onValueChange(o?.value, errors)
            setCurrentValue(o?.value)
          }}
          initialOption={{ label: allowedValues![initialValue] ?? initialValue, value: initialValue }}
          placeholder={placeholder}
        ></DropdownSelect>
      )
    }

    if (inputFieldType === InputFieldType.MultiSelect) {
      return (
        <DropdownMultiSelect
          handle={(handle) => (dropdownMultiSelectHandle.current = handle)}
          minWidth={minWidth}
          classNameInput={inputStyleClassName}
          classNameBg={classNameBg}
          classNameHoverBg={classNameHoverBg}
          classNameHoverBgDark={classNameHoverBgDark}
          styleType={styleType}
          options={Object.keys(allowedValues!).map((av) => {
            return { label: allowedValues![av], value: av }
          })}
          onOptionsSet={(opts: any[]) => {
            const newValue =
              opts && opts.length > 0
                ? opts.reduce(
                    (o1: any, o2: any, i) =>
                      i > 0 ? o1 + allowedValuesSeparator + o2.value : o2.value,
                    '',
                  )
                : ''
            const errors = getErrors(newValue);
            setInternalErrors(errors);
            onValueChange(newValue, errors)
            setCurrentValue(newValue)
          }}
          initialOptions={getInitialMultiSelectOptions()}
          valueSeparator={allowedValuesSeparator!}
          placeholder={placeholder}
        ></DropdownMultiSelect>
      )
    }

    if (inputFieldType === InputFieldType.MultilineText) {
      return (
        <textarea
          ref={setInputFieldRef}
          aria-label={label || 'textarea'}
          rows={4}
          disabled={disabled}
          className={`${inputStyleClassName} pr-7`}
          value={(isControlled ? value : currentValue) ?? ''}
          placeholder={placeholder}
          onChange={(e) => {
            onValueChange(e.target.value, getErrors(e.target.value))
            setCurrentValue(e.target.value)
          }}       
        ></textarea>
      )
    }

    // ToDo_Rep: Unit Input kann vermutlich durch generisches Input Field mit Suffix ersetzt werden
    if (inputFieldType === InputFieldType.Unit) {
      return (
        // <div className={`before:content-['${unit}'] ` + inputStyleClassName}>
        // <div className={`before:content-['${unit}']`}>
        <div data-content={unit} className={`Unit overflow-hidden w-full ` + inputStyleClassName}>
          <input
            ref={setInputFieldRef}
            aria-label={label || 'input'}
            style={{
              width: currentValue ? 'calc(100% - 25px)' : 'calc(100% - 20px)',
              minWidth: minWidth ? `${minWidth}rem` : undefined,
            }}
            step={numberDecimals}
            value={(isControlled ? value : currentValue)?.toLocaleString('en') ?? ''}
            onChange={(e) => {
              onValueChange(e.target.value, getErrors(e.target.value))
              setCurrentValue(e.target.value)
            }}
            type={htmlType}
            className='px-1 outline-none bg-transparent overflow-hidden'
            placeholder={placeholder}
          ></input>
        </div>
      )
    }

    return (
      <input
        ref={setInputFieldRef}
        aria-label={label || 'input'}
        style={{ minWidth: minWidth ? `${minWidth}rem` : undefined }}
        step={numberDecimals}
        disabled={disabled}
        className={`${inputStyleClassName} ${htmlType === 'text' ? 'pr-14' : ''}`}
        inputMode={
          ['float', 'decimal', 'double'].includes(inputType?.toLocaleLowerCase())
          ? 'decimal' 
          : htmlType === 'number'
            ? 'numeric'
            : 'text'
        }
        type={inputType === 'int64' ? 'text' : htmlType}
        placeholder={placeholder ? placeholder : (currentValue || currentValue == 0 || currentValue == '' ? undefined : 'null')}
        max={
          inputType.toLowerCase() === 'int32' || inputType.toLowerCase() === 'int'
            ? 2147483647
            : inputType.toLowerCase() === 'int16'
            ? 32767
            : undefined
        }
        min={
          inputType.toLowerCase() === 'int32' || inputType.toLowerCase() === 'int'
            ? -2147483648
            : inputType.toLowerCase() === 'int16'
            ? -32768
            : undefined
        }       
        value={
          isControlled
          ? value || value == 0 || value == '' ? value : ''
          : currentValue || currentValue == 0 || currentValue == '' ? currentValue : ''
        }
        onInput={(e) => {
          // ToDo_Rep: Validation Redundanz in onInput und onChange?
          let changedValue: any = e.currentTarget.value;

          if (htmlType === 'number' && changedValue === '') {
            changedValue = null;  
          }

          const inputFieldErrors: string | null = (
            !e.currentTarget.validity.valid && e.currentTarget.validity.badInput
            ? 'Invalid input.'
            : null
          );

          let errors = inputFieldErrors ?? getErrors(e.currentTarget.value);
          setInternalErrors(errors);
        }}
        onChange={(e) => {
          
          let changedValue: any = e.target.value;

          if (htmlType === 'number' && e.target.value === '') {
            changedValue = null;  
          }

          const inputFieldErrors: string | null = (
            !e.target.validity.valid && e.target.validity.badInput
            ? 'Invalid input.'
            : null
          );

          let errors = inputFieldErrors ?? getErrors(e.target.value);


          onValueChange(changedValue, errors);
          setCurrentValue(e.target.value);
        }}
        // prevent changing number input on scroll
        onWheel={htmlType === 'number' ? (e) => {
          if (e.currentTarget.readOnly) return;
          const input = e.currentTarget;
          input.readOnly = true;
          setTimeout(() => (input.readOnly = false), 0);
        } : undefined}
      ></input>
    )
  }

  // Clear Button should be visible when:
  // - the inner input is not of any dropdown type (checkbox / dropdownselect / multi dropdownselect)
  //   as they render their own clear buttons
  // - the input is not disabled
  // - the input is not required (this means we allow null/empty values)
  // - the current value is not already null/empty
  const showClearButton = (
    htmlType !== 'checkbox' 
    && !allowedValues
    && !disabled
    && !required
    && ((isControlled ? value : currentValue) ?? '') !== ''
  );

  // Undo Button should be visible when:
  // - the input is not disabled
  // - the current value is different from the reset value (reset value is usually the initial value)
  // - the reset value is not null/empty
  const showRevertButton = (
    !disabled
    && resetValue != null
    && (
      (!isControlled && !EntitySchemaService.equals(inputType, EntitySchemaService.parseToFieldType(inputType, currentValue), resetValue))
      || (isControlled && value !== resetValue)
    )
  );

  const clearText = resetValue === null || resetValue === undefined || resetValue === '' ? 'Clear' : `Reset to '${resetValue}'`;

  return (
    <div className={`w-full ${false ? 'flex justify-between gap-2 items-baseline ' : ''}`}>
      {showLabel && label && (
        <label className='block mb-2 text-xs font-medium whitespace-nowrap align-baseline'>
          {label}
        </label>
      )}
      <div className='flex items-center'>
        <div className='w-full relative'>
          {renderInnerInput(htmlType)}
          {/* Undo Clear Buttons */}
          {(showRevertButton || showClearButton) && (
            <div
              className={
                `absolute flex items-center pr-1 h-8 top-1.5`
                + ` ${
                  inputType === 'guid'
                  ? 'right-24'
                  : (htmlType === 'checkbox' || allowedValues)
                    ? 'right-14'
                    : htmlType === 'text'
                    ? multiLine 
                      ? 'right-0'
                      : 'right-3' 
                    : 'right-8'}`}
            >
              {showClearButton && (
                <Tooltip content="Clear">
                  <button
                    type='button'
                    className='flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-contentHover dark:hover:bg-contentHoverDark rounded-md size-6'
                    onClick={() => {
                      resetValueTo(null);
                      inputFieldRef?.focus();
                    }}
                    aria-label="Clear input"
                  >
                    <XMarkIcon></XMarkIcon>
                  </button>
                </Tooltip>
              )}
            </div>
          )}
        </div>
        {showErrorIcon && internalErrors != null && (
          <Tooltip className='text-red-500 dark:text-red-400' content={internalErrors} interactive={true}>
            <div tabIndex={0} className='text-red-500 dark:text-red-400 pl-1 w-8 cursor-help'>
              <ExclamationCircleIcon></ExclamationCircleIcon>
            </div>
          </Tooltip>
        )}
        {/* ToDo_Rep: vielleicht irgendwie innerhalb des input fields rendern, ist allerding schwierig wegen tab order */}
        {showRevertButton && (
          <Tooltip content={clearText}>
            <button
              type='button'
              aria-label={clearText}
              className='flex items-center ml-2 justify-center text-gray-600 dark:text-gray-400 hover:bg-contentHover dark:hover:bg-contentHoverDark rounded-md size-6'
              onClick={() => {
                resetValueTo(resetValue);
                inputFieldRef?.focus();
              }}
            >
              <ArrowUturnLeftIcon size={1} ></ArrowUturnLeftIcon>
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  )
}

export default InputField

export function getInputStyleClassName(
  styleType: number,
  classNameBg: string | undefined,
  disabled: boolean,
  classNameHoverBg: string | undefined,
  classNameHoverBgDark: string | undefined,
  hasErrors: boolean,
  multiline: boolean = false
): string {
  return `text-sm rounded-sm p-3 outline-none block w-full transition-all ${multiline ? 'h-24' : 'h-10'}`
    + ` ${classNameBg || 'bg-gray-50 dark:bg-[var(--editor)]'}`
    + ` ${multiline ? 'dark:bg-neutral-800' : ''}` 
    + ` ${styleType === 0 ? 'border-b-2' : 'border-2'}`
    + ` ${hasErrors
          ? 'text-red-500 dark:text-red-400 focus:border-red-500 dark:focus:border-red-400'
            + ` border-red-50 dark:border-red-950 hover:border-red-200 dark:hover:border-red-400`
          : 'focus:border-[var(--primary-400)] focus-within:border-[var(--primary-400)] dark:focus:border-[var(--primary-600)]'
        }`
    + ` ${disabled
        ? 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 opacity-50'
          + ' border-gray-100 dark:border-gray-700'
        : !hasErrors 
          ? `border-gray-100 dark:border-gray-700` 
            + ` hover:${classNameHoverBg || 'border-[var(--primary-200)]'}`
            + ` dark:hover:${classNameHoverBgDark || 'border-[var(--primary-800)]'}`
          : ``
      }`
}
