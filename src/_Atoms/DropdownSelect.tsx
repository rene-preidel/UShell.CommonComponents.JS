import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Option } from './MultiSelect'
import Dropdown from './Dropdown'
import FunnelIcon from '../_Icons/FunnelIcon'
import ArrowUpDownIcon from '../_Icons/ArrowUpDownIcon'
import ChevrodnDownIcon from '../_Icons/ChevrodnDownIcon'
import XMarkIcon from '../_Icons/XMarkIcon'
import { getInputStyleClassName } from '../components/guifad/_Atoms/InputField'
import { Tooltip } from './Tooltip2'

const DropdownSelect: React.FC<{
  options: Option[]
  initialOption?: Option | null
  onOptionSet?: (o: Option | null) => void
  value?: any
  isControlled?: boolean
  required?: boolean
  placeholder?: string
  noElementFoundText?: string
  forceFocus?: boolean
  disabled?: boolean
  topOffset?: number
  bottomOffset?: number
  styleType?: number
  classNameInput?: string
  classNameBg?: string
  classNameHoverBg?: string
  classNameHoverBgDark?: string
  classNameDropdownBg?: string
  classNameDropdownHoverBg?: string
  additionalElements?: JSX.Element[]
  minWidth?: number,
  closeOnScroll?: boolean
}> = ({
  options,
  initialOption,
  onOptionSet,
  value,
  isControlled = false,
  required = true,
  placeholder,
  noElementFoundText = 'No elements found',
  forceFocus,
  disabled = false,
  topOffset,
  bottomOffset,
  styleType = 0,
  classNameInput,
  classNameBg,
  classNameHoverBg,
  classNameHoverBgDark,
  classNameDropdownBg,
  classNameDropdownHoverBg,
  additionalElements,
  minWidth,
  closeOnScroll = false
}) => {
  
  const [open, setOpen] = useState(false);
  const [currentOption, setCurrentOption] = useState<Option | null | undefined>(isControlled ? options.find(o => o.value === value) : initialOption);
  const [currentText, setCurrentText] = useState<string>(isControlled ? currentOption?.label : initialOption?.value ?? '');
  const [currentMatchingOptions, setcurrentMatchingOptions] = useState<Option[]>([]);
  const [currentMatchingOptionIndex, setCurrentMatchingOptionIndex] = useState<number | null>(null);
  
  /**
   * If this is true, the onBlur event of the whole control will not try to close the dropdown.
   * This is a workaround to be able to close the dropdown when clicking the dropdown button.
   */
  const [ignoreNextDropdownCloseOnBlur, setIgnoreNextDropdownCloseOnBlur] = useState(false);

  const ref: any = useRef();
  const refId: string = useMemo(() => {
    return 'UShell_DropdownSelect_' + crypto.randomUUID();
  }, []);
  const [dropDownRef, setDropDownRef] = useState<any>(null);

  useEffect(() => {
    if (isControlled) {
      let controlledOption = options.find(o => o.value === value);
      if (!controlledOption) {
        controlledOption = options.find(o => o.value?.toString() === value?.toString());
      }
      if (initialOption !== null && !controlledOption && value === initialOption?.value) {
        controlledOption = initialOption;
      }
      setCurrentOption(controlledOption || null);
      setCurrentText(controlledOption?.label || '');
    }
  }, [isControlled, value, options, initialOption]);

  useEffect(() => {
    setcurrentMatchingOptions(options)
  }, [options])

  function onChange(fn: string) {
    setCurrentText(fn);
    setCurrentMatchingOptionIndex(null);
    if (!fn || fn == '') {
      setcurrentMatchingOptions(options);
      // setCurrentOption(null)
      // notifyOptionSet(null)
      return
    }

    const matchingOptions: Option[] = options.filter((o) =>
      o.label.toLocaleLowerCase().startsWith(fn.toLocaleLowerCase()),
    );
    setcurrentMatchingOptions(matchingOptions);
    if (matchingOptions.length !== 0) {
      setCurrentMatchingOptionIndex(0)
      return;
    }

    // return;

    // const singleMatchingOption: Option | undefined = options.find((o) => o.label == fn)
    // if (singleMatchingOption) {
    //   setCurrentOption(singleMatchingOption)
    //   notifyOptionSet(singleMatchingOption)
    // }
    // setCurrentMatchingOptionIndex(0)
  }

  function isMatchingOption(text: string) {
    if (currentMatchingOptions.length === 0) {
      return false
    }
    const matchingOption: Option | undefined = currentMatchingOptions.find(
      (o) => o.label?.toLocaleLowerCase().includes(text?.toLocaleLowerCase() ?? ''),
    )

    console.log("matching: ", matchingOption, text);

    return matchingOption
  }

  function isCurrentMatchingOption(option: Option) {
    if (currentMatchingOptionIndex == null || currentMatchingOptions.length == 0) {
      return false
    }
    return (
      option.label.toLocaleLowerCase() ==
      currentMatchingOptions[currentMatchingOptionIndex].label.toLocaleLowerCase()
    )
  }

  function notifyOptionSet(option: Option | null) {
    if (onOptionSet) {
      onOptionSet(option)
    }
  }

  function openDropdown() {

    if (open) return;

    setOpen(true);

    setCurrentMatchingOptionIndex(null);

    // always show all options on initial open,
    // if the current text is not manipulated by the user
    if (currentText === currentOption?.label) {
      setcurrentMatchingOptions(options);
    }

    // set current highlight to the current value
    if (currentOption) {
      const index = options.findIndex(o => o.value === currentOption.value);
      if (index >= 0) {
        setCurrentMatchingOptionIndex(index);
        scrollOptionIndexIntoView(index);
      }
    }
  }

  function scrollOptionIndexIntoView(index: number, scrollToCenter: boolean = false) {
    
    setTimeout(() => {
      const el = document.getElementById(`${refId}_option_${index}`);
      if (el) {
        // scroll to center of parent
        if (scrollToCenter) {
          const parent = el.parentElement;
          if (parent) {
            const parentRect = parent.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();
            const offset = elRect.top - parentRect.top - parentRect.height / 2 + elRect.height / 2;
            parent.scrollBy({ top: offset, behavior: 'auto' });
          }
          return;
        }
        
        // default scroll
        el.scrollIntoView({ block: 'nearest' });
      }
    }, 0);
  }

  function onInputKeyDown(e: any) {
    
    const wasOpen = open;

    // make sure the dropdown stays open while typing
    setOpen(true);

    if (e.key == 'ArrowDown') {
      
      // don't move selection on first open
      if (!wasOpen) {
        openDropdown();
        return;
      }

      e.preventDefault()
      const nextIndex: number = (
        currentMatchingOptionIndex !== null
          ? currentMatchingOptionIndex < currentMatchingOptions.length - 1
            ? currentMatchingOptionIndex + 1
            : currentMatchingOptionIndex
          : 0
      );
      setCurrentMatchingOptionIndex(nextIndex);
      scrollOptionIndexIntoView(nextIndex);
    }
    if (e.key == 'ArrowUp') {

      // don't move selection on first open
      if (!wasOpen) {
        openDropdown();
        return;
      }

      e.preventDefault()
      const previousIndex: number = (
        currentMatchingOptionIndex !== null
          ? currentMatchingOptionIndex > 0
            ? currentMatchingOptionIndex - 1
            : currentMatchingOptionIndex
          : currentMatchingOptions.length - 1
      );
      setCurrentMatchingOptionIndex(previousIndex);
      scrollOptionIndexIntoView(previousIndex);
    }
    
    if (e.key == 'Enter') {
      
      if (!wasOpen) {
        openDropdown();
        return;
      }

      if (!open) {
        return
      }
      if (currentMatchingOptionIndex == null) {
        return
      }
      e.preventDefault()
      e.stopPropagation()

      const selectedOption = currentMatchingOptions[currentMatchingOptionIndex]
      setCurrentOption(selectedOption)
      setCurrentText(selectedOption?.label ?? '')
      notifyOptionSet(selectedOption)
      setOpen(false)
    }

    
    if (e.key == 'Escape') {
      
      e.preventDefault();
      e.stopPropagation();
      
      if (open) {
        setOpen(false);
        return;
      }

      if (!required && currentOption) {
        setCurrentText('');
        setCurrentOption(null);
        setcurrentMatchingOptions(options);
        notifyOptionSet(null);
      }
    }   
  }

  function onSelectOption(o: Option) {
    setCurrentOption(o)
    setCurrentText(o.label)
    notifyOptionSet(o)
    setOpen(false)
  }

  // close dropdown on scroll of any parent container
  useEffect(() => {
    if (!closeOnScroll) return;

    function handleScroll() {
      setOpen((prev) => {
        if (!prev) return prev; // Avoid updating if already false
        return false;
      });
    }

    const parentScrollContainers: any[] = [];
    let currentElement = ref.current?.parentElement;

    while (currentElement) {
      parentScrollContainers.push(currentElement);
      currentElement = currentElement.parentElement;
    }

    parentScrollContainers.forEach((container) =>
      container.addEventListener('scroll', handleScroll)
    );

    return () => {
      parentScrollContainers.forEach((container) =>
        container.removeEventListener('scroll', handleScroll)
      );
    };
  }, [ref, closeOnScroll]);

  const filteredOptions = currentMatchingOptions;

  return (
    <div
      className='UShell_DropdownSelect w-full'
      onBlur={(e) => {
        if (ignoreNextDropdownCloseOnBlur) {
          setIgnoreNextDropdownCloseOnBlur(false);
          return;
        }
        setOpen(false);
        setCurrentText(currentOption?.label || '');
      }}
    >
      <div
        id={refId}
        ref={ref}
        className='p-0 w-full rounded-sm relative flex
         bg-bg1 dark:bg-bg2dark border-0 border-red-400'
      >
        <input
          ref={setDropDownRef}
          autoFocus={forceFocus}
          disabled={disabled}
          style={{ minWidth: minWidth ? `${minWidth}rem` : undefined }}
          className={`w-full relative outline-none text-ellipsis pr-16 ${classNameInput || getInputStyleClassName(
              styleType,
              classNameBg,
              disabled,
              classNameHoverBg,
              classNameHoverBgDark,
              false,
            )}`
          }
          onClick={(e) => openDropdown()}
          value={currentText || ''}
          type='text'
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => onInputKeyDown(e)}
          placeholder={placeholder || 'enter valid value'}
        ></input>
        {!required && ((currentOption?.value ?? null) !== null) && (
          <Tooltip content="Clear selection">
            <button
              aria-label="Clear selection"
              type="button"
              className="absolute right-8 top-1/2 transform -translate-y-1/2 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-contentHover dark:hover:bg-contentHoverDark rounded-md size-6"
              onClick={() => {
                // ToDo_Rep: noch nötig? setIgnoreDropdownCloseOnBlur(true);
                setCurrentText('');
                setCurrentOption(null);
                setcurrentMatchingOptions(options);
                notifyOptionSet(null);

                // refocus the input after clearing
                // use setTimeout so we do not interfere with
                // onBlur of the containing control
                setTimeout(() => {
                  dropDownRef?.focus();
                });
              }}
              >
              <XMarkIcon size={1.5} />
            </button>
          </Tooltip>
        )}
        <div
          className="absolute select-none right-2 top-1/2 transform -translate-y-1/2 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-contentHover dark:hover:bg-contentHoverDark rounded-md size-6"
          onMouseDown={() => {
            // in case the users focus was inside this control prior
            // to clicking the dropdown button, ignore the onBlur event
            // which otherwise leads to the following issue:
            // > field is focused and dropdown is open
            // > user clicks the dropdown button
            // > onBlur closes the dropdown
            // > onClick opens it again
            // but the actual intention of the user was to close
            // the currently open dropdown
            if (open) setIgnoreNextDropdownCloseOnBlur(true);
          }}
          onClick={() => {
            dropDownRef?.focus();
            open ? setOpen(false) : openDropdown();
          }}
        >
          <ChevrodnDownIcon />
        </div>
      </div>
      {open && (
        <div className={`${open ? '' : ''}`}>
          <Dropdown
            refId={refId}
            leftOffset={0}
            bottomOffset={bottomOffset ? bottomOffset : undefined}
            topOffset={topOffset ? topOffset : undefined}
            minWidth={true}
            maxWidth={true}
            maxHeight={400}
          >
            <div
              className={`w-full h-full flex flex-col overflow-x-hidden overflow-y-auto p-0 border-2 font-normal text-sm dark:border-contentBorderDark  ${
                classNameDropdownBg || 'bg-content dark:bg-contentDark'
              }`}
            >
              {additionalElements?.map((ae, i) => ae)}
              {filteredOptions.map((o, i) => (
                <div
                  id={`${refId}_option_${i}`}
                  className={`cursor-default p-2 ${
                    isCurrentMatchingOption(o) && 'bg1-backgroundtwo dark:bg1-backgroundtwodark'
                  } ${
                    currentMatchingOptionIndex === i
                      ? 'bg-prim5 dark:bg-prim5Dark' + (classNameDropdownHoverBg ? ` ${classNameDropdownHoverBg}` : '') 
                      : currentOption?.value == o.value
                        ? 'bg-prim2 dark:bg-prim2Dark'
                        : ''
                  }`}
                  key={o.value || i}
                  onMouseMove={() => setCurrentMatchingOptionIndex(i)}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onSelectOption(o)
                  }}
                >
                  {o.label || '\u00A0'}
                </div>
              ))}
              {filteredOptions.length === 0 && (
                <div className="cursor-default p-2 text-gray-500 dark:text-gray-400">
                  {noElementFoundText}
                </div>
              )}
            </div>
          </Dropdown>
        </div>
      )}
    </div>
  )
}

export default DropdownSelect