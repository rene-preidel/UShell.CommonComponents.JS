import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Option } from './MultiSelect'
import Dropdown from './Dropdown'
import FunnelIcon from '../_Icons/FunnelIcon'
import ArrowUpDownIcon from '../_Icons/ArrowUpDownIcon'
import ChevrodnDownIcon from '../_Icons/ChevrodnDownIcon'
import XMarkIcon from '../_Icons/XMarkIcon'
import { getInputStyleClassName } from '../components/guifad/_Atoms/InputField'
import MagnifyingGlassIcon from '../_Icons/MagnifyingGlassIcon'
import { useStateLogger } from '../_Utilities/UtilityFunctions'
import DocumentDuplicateIcon from '../_Icons/DocumentDuplicateIcon'
import { AnchoredToast } from './AnchoredToast';
import { Tooltip } from './Tooltip2';
// ToDo_Rep: wie mit invaliden werten und escaping umgehen?
// .. invalide werte vielleicht im dropdown anzeigen?
// .. enclosed tuples?
export type DropdownMultiSelectHandle = {
  setCurrentOptions: (options: Option[]) => void;
  focus: () => void;
}

const DropdownMultiSelect: React.FC<{
  options: Option[]
  initialOptions?: Option[]
  onOptionsSet?: (o: Option[]) => void
  handle?: (handle: DropdownMultiSelectHandle) => void // ToDo_Rep: property name anpassen?
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
  minWidth?: number,
  required?: boolean,
  closeOnScroll?: boolean
  showSelectAllButton?: boolean
  showOnlySelectedToggle?: boolean
  valueSeparator?: string
}> = ({
  options,
  initialOptions = [],
  onOptionsSet,
  handle,
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
  minWidth,
  required = false,
  closeOnScroll = false,
  showSelectAllButton = true,
  showOnlySelectedToggle = true,
  valueSeparator = ","
}) => {

  const [open, setOpen] = useState(false);
  const [currentOptions, setCurrentOptions] = useState<Option[]>(() => {
    if (initialOptions) {
      return initialOptions.map(io => {
        const matchingOption = options.find(o => o.value === io.value);
        return matchingOption ? matchingOption : { ...io, label: io.label };
      });
    }
    return [];
  });
  const [currentMatchingOptions, setcurrentMatchingOptions] = useState<Option[]>([]);
  const [currentMatchingOptionIndex, setCurrentMatchingOptionIndex] = useStateLogger<number | null>(null, "currentMatchingOptionIndex");
  const [searchBoxAutoFocus, setSearchBoxAutoFocus] = useState<boolean>(true);
  const [previousSearchText, setPreviousSearchText] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [onlyShowSelected, setOnlyShowSelected] = useState<boolean>(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [copyToastEntriesCount, setCopyToastEntriesCount] = useState(0);
  const [showPasteToast, setShowPasteToast] = useState(false);
  const [pasteToastEntriesCount, setPasteToastEntriesCount] = useState(0);

  /**
   * If this is true, the onBlur event of the whole control will not try to close the dropdown.
   * This is a workaround to be able to close the dropdown when clicking the dropdown button.
  */
  const [ignoreNextDropdownCloseOnBlur, setIgnoreNextDropdownCloseOnBlur] = useState(false);
 
  const ref: any = useRef();
  const refId: string = useMemo(() => {
    return 'UShell_DropdownMultiSelect_' + crypto.randomUUID();
  }, []);
  const copyButtonRef = useRef(null);
  const [dropDownRef, setDropDownRef] = useState<any>(null);
  const [searchBoxRef, setSearchBoxRef] = useState<any>(null);

  // expose handle methods
  React.useEffect(() => {
    handle?.({
      setCurrentOptions,
      focus: () => dropDownRef?.focus()
    });
  }, [handle, dropDownRef]);

  useEffect(() => {
    notifyOptionsSet();
  }, [currentOptions]);

  useEffect(() => {

    const filteredOptions = (onlyShowSelected ? currentOptions : options).filter(o => o.label.toLowerCase().includes(searchText.toLowerCase()));

    setcurrentMatchingOptions(filteredOptions);
    if (searchText !== '' && searchText !== previousSearchText) {
      setCurrentMatchingOptionIndex(0);
      setPreviousSearchText(searchText);
    }
  }, [options, searchText, previousSearchText, onlyShowSelected])

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

  function notifyOptionsSet() {
    if (onOptionsSet) {
      onOptionsSet(currentOptions)
    }
  }

  function onSelectOption(o: Option) {
    const currentIndex: number = currentOptions.findIndex((co) => co.value == o.value)
    if (currentIndex >= 0) {
      // option is already selected, so remove it
      setCurrentOptions((cos) => {
        const newOptions = [...cos]
        newOptions.splice(currentIndex, 1)
        return newOptions
      });
    } else {
      setCurrentOptions((cos) => {
        const newOptions = [...cos, o]
        newOptions.sort((a, b) => a.label.localeCompare(b.label))
      return newOptions
      })
    }
  }

  function addOptionInOrderOfTotalOptions(o: Option) {
    const newOptions = [...currentOptions, o]
    newOptions.sort((a, b) => a.value.localeCompare(b.value))
    setCurrentOptions(newOptions)
  }

  function isOptionSelected(o: Option): boolean {
    return currentOptions.findIndex((co) => co.value == o.value) >= 0
  }

  function openDropdown() {

    if (open) return;

    setOpen(true);

    setCurrentMatchingOptionIndex(null);

    setSearchText('');

    // set current highlight to the nearest value
    if (currentOptions?.length > 0) {
      const index = options.findIndex(o => o.value === currentOptions[0].value);
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

  function getLabel(): string {
    if (currentOptions.length == 0) return ''
    return currentOptions.map((co) => co.label).reduce((a, b) => a + ', ' + b)
  }

  return (
    <div
      className='w-full'
      onBlur={(e) => {
        if (ignoreNextDropdownCloseOnBlur) {
          setIgnoreNextDropdownCloseOnBlur(false);
          return;
        }

        // Check if focus is still in any element inside this div
        const currentTarget = e.currentTarget;
        const relatedTarget = e.relatedTarget as HTMLElement | null;
        if (currentTarget.contains(relatedTarget)) {
          return;
        }

        setOpen(false);
      }}
    >
      <div
        id={refId}
        ref={ref}
        className='p-0 w-full rounded-sm relative flex
         bg-bg1 dark:bg-bg2dark border-0 border-red-400'
      >
        <AnchoredToast
          show={showPasteToast}
          onHide={() => setShowPasteToast(false)}
          message={
            <span className="inline-flex items-center gap-1">
              <span className="text-emerald-300">✓</span> {`${pasteToastEntriesCount === 1 ? `1 Eintrag` : `${pasteToastEntriesCount} Einträge`} eingefügt`}
            </span>
          }
          placement="top"
          gapPx={4}
          autoHideMs={900}
        >
          <input
            ref={setDropDownRef}
            autoFocus={forceFocus}
            disabled={disabled}
            style={{ minWidth: minWidth ? `${minWidth}rem` : undefined }}
            className={`w-full relative outline-none text-ellipsis pl-11 pr-20 ${classNameInput || getInputStyleClassName(
                styleType,
                classNameBg,
                disabled,
                classNameHoverBg,
                classNameHoverBgDark,
                false,
              )}`
            }
            onMouseDown={() => setIgnoreNextDropdownCloseOnBlur(true)}
            onClick={() => {
              if (open) {
                setOpen(false);
                return;
              }

              const selection = window.getSelection();
              if (selection && selection.toString().length > 0) {
                // there is a text selection, so do not open the dropdown
                // user will probably want to copy the text
                setSearchBoxAutoFocus(false);
              } else {
                setSearchBoxAutoFocus(true);
                openDropdown();
              }
            }}
            onKeyDown={(e) => {

              if (e.key === 'Tab') return;

              if (e.key === 'Escape') {
                if (open) {
                  setOpen(false);
                } else {
                  openDropdown();
                }
                return;
              }

              // if e is ArrowDown or ArrowUp or any character key, open the dropdown
              if (!(e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key.length === 1 || e.key === 'Enter' || e.key === 'Backspace') || e.ctrlKey) {
                return;
              }

              openDropdown();
              setSearchBoxAutoFocus(true);
            }}
            onPaste={(e) => {
              const pasteText = e.clipboardData.getData('text');
              const pasteValues = pasteText.split(valueSeparator).map(v => v.trim()).filter(v => v !== '');
              const foundOptions: Option[] = [];
              pasteValues.forEach(pv => {
                const matchingOption = options.find(o => o.value === pv);
                if (matchingOption) {
                  foundOptions.push(matchingOption);
                }
              });
              if (foundOptions.length > 0) {
                setCurrentOptions(foundOptions);
              }
              setPasteToastEntriesCount(foundOptions.length);
              setShowPasteToast(true);
            }}
            value={getLabel()}
            onChange={() => { /** dummy so the framework wont throw any errors in case the control is not readonly */ }}
            type='text'
            placeholder={placeholder || 'enter valid value'}
          >
          </input>
        </AnchoredToast>
        
        <Tooltip content={`${currentOptions.length} items selected`}>
          <div
            className="select-none absolute left-2 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-200 text-xs"
            style={{paddingBottom: '2px'}}
            >
            {currentOptions.length}
          </div>
        </Tooltip>
        {((currentOptions?.length ?? 0) > 0) && (
          <>
            <AnchoredToast
              show={showCopyToast}
              onHide={() => setShowCopyToast(false)}
              message={
                <span className="inline-flex items-center gap-1">
                  <span className="text-emerald-300">✓</span> {`${copyToastEntriesCount === 1 ? `1 Eintrag` : `${copyToastEntriesCount} Einträge`} kopiert`}
                </span>
              }
              placement="top"
              gapPx={4}
              autoHideMs={900}
            >
                <button
                  ref={copyButtonRef}
                  aria-label="Copy values to clipboard"
                  type="button"
                  className="absolute right-14 top-1/2 transform -translate-y-1/2 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-contentHover dark:hover:bg-contentHoverDark rounded-md size-6"
                  onClick={async () => {
                    const clipboardText = currentOptions.map(co => co.value).join(valueSeparator);
                    await navigator.clipboard.writeText(clipboardText);
                    setCopyToastEntriesCount(currentOptions ? currentOptions.length : 0);
                    setShowCopyToast(true);
                  }}
                  >
                    <DocumentDuplicateIcon size={1} />
                </button>
            </AnchoredToast>
            <Tooltip reference={copyButtonRef} content="Copy values to clipboard" disabled={showCopyToast} />
          </>
        )}
        {!required && ((currentOptions?.length ?? 0) > 0) && (
          <Tooltip content="Clear selection">
            <button
              type="button"
              aria-label="Clear selection"
              className="absolute right-8 top-1/2 transform -translate-y-1/2 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-contentHover dark:hover:bg-contentHoverDark rounded-md size-6"
              onClick={() => {
                setCurrentOptions([]);
                
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
          className={
            `absolute select-none right-2 top-1/2 transform -translate-y-1/2 flex ` 
            + `items-center justify-center text-gray-600 dark:text-gray-400 `
            + `hover:bg-contentHover dark:hover:bg-contentHoverDark rounded-md size-6`
          }
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
            setSearchBoxAutoFocus(true);
          }}
        >
          <ChevrodnDownIcon />
        </div>
      </div>
      {open && (
        <div className={`text-sm`}>
          <Dropdown
            refId={refId}
            leftOffset={0}
            bottomOffset={bottomOffset ? bottomOffset : undefined}
            topOffset={topOffset ? topOffset : undefined}
            minWidth={true}
            maxHeight={400}
          >
            <div
              className={`w-full h-full flex flex-col p-0 border-2 font-normal dark:border-bg6dark overflow-hidden ${
                classNameBg || 'bg-content dark:bg-contentDark'
              }`}
              style={{ maxHeight: '400px', minWidth: '450px' }}
            >
              <div
                className="flex flex-none items-center justify-center w-full border-b border-bg6 dark:border-bg6dark p-2"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  searchBoxRef?.focus();
                }}
              >
                <MagnifyingGlassIcon className="mr-2 text-gray-600 dark:text-gray-400" size={4} />
                <input
                  ref={setSearchBoxRef}
                  type="text"
                  disabled={!open}
                  className={`w-full outline-none ${classNameBg || 'bg-content dark:bg-contentDark'} text-sm h-8`}
                  placeholder="Search... (Press [Esc] to close, [↑↓] to navigate, [Enter] to select)"
                  onChange={(e) => {
                    setSearchText(e.target.value);
                  }}
                  onFocus={() => {
                    setOpen(true);
                  }}
                  autoFocus={searchBoxAutoFocus}
                  onMouseDown={(e) => {
                    setOpen(true);
                    e.stopPropagation();
                  }}
                  value={searchText}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      if (searchText !== '') {
                        setSearchText('');
                        return;
                      }
                      dropDownRef?.focus();
                      setOpen(false);
                      return;
                    }
                    if (e.key === 'Tab' && e.shiftKey) {
                      e.preventDefault();
                      dropDownRef?.focus();
                      setOpen(false);
                      return;
                    }
                    if (e.key === 'ArrowDown') {
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
                      return;
                    }
                    if (e.key === 'ArrowUp') {
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
                      return;
                    }
                    if (e.key == 'Enter') {
                      if (currentMatchingOptionIndex == null) {
                        return
                      }
                      e.preventDefault()
                      e.stopPropagation()
                      const selectedOption = currentMatchingOptions[currentMatchingOptionIndex]
                      if (selectedOption) onSelectOption(selectedOption);
                      return;
                    }      
                  }}
                />
                {searchText !== '' &&
                  <Tooltip content="Clear search text">
                    <button
                      type='button'
                      aria-label="Clear search text"
                      className='flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-contentHover dark:hover:bg-contentHoverDark rounded-md size-6'
                      onClick={() => {
                        setSearchText('');
                        searchBoxRef?.focus();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          dropDownRef?.focus();
                          setOpen(false);
                          return;
                        }
                      }}
                    >
                      <XMarkIcon></XMarkIcon>
                    </button>
                  </Tooltip>
                }
              </div>
              {((showSelectAllButton && ((options?.length ?? 0) > 0)) || (showOnlySelectedToggle)) && (
                <div className="flex-none flex flex-row border-b border-bg6 dark:border-bg6dark" >
                  {showSelectAllButton && ((options?.length ?? 0) > 0) && (
                    <button
                      type="button"
                      className="flex items-center justify-center w-full p-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300"
                      onClick={() => {
                        const allOptionsSelected = currentMatchingOptions.every(isOptionSelected);
                        if (allOptionsSelected) {
                          // Deselect all options
                          const newOptions = [...currentOptions];
                          currentMatchingOptions.forEach((o) => {
                            if (isOptionSelected(o)) {
                              const index = newOptions.findIndex(no => no.value === o.value);
                              if (index >= 0) {
                                newOptions.splice(index, 1);
                              }
                            }
                          });
                          setCurrentOptions(newOptions);
                        } else {
                          // Select all options
                          const newOptions = [...currentOptions];
                          currentMatchingOptions.forEach((o) => {
                            if (!isOptionSelected(o)) {
                              newOptions.push(o);
                            }
                          });
                          setCurrentOptions(newOptions);
                        }
                      }}                     
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          dropDownRef?.focus();
                          setOpen(false);
                          return;
                        }
                      }}
                    >
                      {currentMatchingOptions.every(isOptionSelected) ? `Deselect All (${currentMatchingOptions.length})` : `Select All (${currentMatchingOptions.length})`}
                    </button>
                  )}
                  {showOnlySelectedToggle && (
                    <div
                      className="flex items-center justify-center w-full bg-gray-100 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300"
                    >
                      <label
                        className="flex items-center justify-center w-full h-full p-2 cursor-pointer"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                      >
                        <input
                          type="checkbox"
                          className="mr-2 accent-prim11 dark:accent-prim11Dark"
                          checked={onlyShowSelected}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                          }}
                          onChange={(e) => setOnlyShowSelected(e.target.checked)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              dropDownRef?.focus();
                              setOpen(false);
                              return;
                            }
                          }}
                        />
                        Show Only Selected
                      </label>
                    </div>
                  )}
                </div>
              )}
              <div 
                className='flex-grow overflow-x-hidden overflow-y-scroll'
                tabIndex={-1}
              >
                {currentMatchingOptions.map((o, i) => (
                  <div
                    id={`${refId}_option_${i}`}
                    className={`cursor-pointer p-2 text-ellipsis ${
                      currentMatchingOptionIndex === i
                        ? 'bg-prim5 dark:bg-prim5Dark'
                        : isOptionSelected(o)
                          ? 'bg-prim2 dark:bg-prim2Dark'
                          : ''
                    }`}
                    key={o.value}
                    onMouseMove={() => {
                      setCurrentMatchingOptionIndex(i)
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onSelectOption(o)
                    }}
                  >
                    <span className='inline-block w-4 mr-2 text-center text-sm'>{isOptionSelected(o) ? "✓" : ''}</span><span>{o.label || '\u00A0'}</span>
                  </div>
                ))}
                {currentMatchingOptions.length === 0 && (
                  <div className="cursor-default p-2 text-gray-500 dark:text-gray-400">
                    {noElementFoundText}
                  </div>
                )}
              </div>
            </div>
          </Dropdown>
        </div>
      )}
    </div>
  )
}

export default DropdownMultiSelect
