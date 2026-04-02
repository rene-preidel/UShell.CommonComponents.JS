import React, { useEffect, useState } from 'react'
import ArrowUpIcon from '../_Icons/ArrowUpIcon'
import ArrowLeftStartOnRectangle from '../_Icons/ArrowLeftStartOnRectangle'
import ChevrodnDownIcon from '../_Icons/ChevrodnDownIcon'

const Accordion: React.FC<{
  items: { id: string; label: string | JSX.Element; content: JSX.Element }[]
  onItemToggled?: (itemId: string, open: boolean) => void
  initialOpenIndex?: number
  multipleOpenAllowed?: boolean
  classNameBgHeader?: string
  classNameBgHeaderActive?: string
  classNameBgItems?: string
  classNameBgItemHover?: string
  classNameBgItemSelected?: string
}> = ({
  items,
  onItemToggled,
  multipleOpenAllowed = false,
  classNameBgHeader = '',
  classNameBgHeaderActive = '',
  classNameBgItems = '',
  initialOpenIndex,
}) => {
  const [openIndices, setOpenIndices] = useState<number[]>(
    initialOpenIndex
    ? [initialOpenIndex]
    : (multipleOpenAllowed
      ? items.map((_, i) => i)
      : [0]
    )
  )

  function toggleOpen(i: number) {
    if (!multipleOpenAllowed) {
      if (openIndices.includes(i)) {
        const nextI: number = i == items.length - 1 ? 0 : i + 1
        setOpenIndices([nextI])
        onItemToggled && onItemToggled(items[nextI].id, true)
        onItemToggled && onItemToggled(items[i].id, false)
      } else {
        setOpenIndices([i])
        onItemToggled && onItemToggled(items[i].id, true)
      }
    } else {
      if (openIndices.includes(i)) {
        setOpenIndices([...openIndices].filter((ix) => ix != i))
        onItemToggled && onItemToggled(items[i].id, false)
      } else {
        setOpenIndices([...openIndices, i])
        onItemToggled && onItemToggled(items[i].id, true)
      }
    }
  }

  function isOpen(i: number): boolean {
    return openIndices.includes(i)
  }

  if (items.length == 0) return <div>Empty Drawer</div>
  return (
    <div className='rounded-t-md border p-0 border-menuBorder dark:border-menuBorderDark'>
      {items.map((item, i) => (
        <div className='w-full border-0 border-red-400' key={i}>
          <div
            className={`flex items-center gap-2 w-full cursor-pointer select-none
            border-menuBorder dark:border-menuBorderDark
            ${classNameBgHeader}
            ${isOpen(i) ? classNameBgHeaderActive : ''}
            ${i === 0
              ? (isOpen(i) ? ' border-b' : ' border-0')
              : (isOpen(i) ? ' border-y' : ' border-t')
            }
            `}
            onClick={(e) => {
              e.preventDefault();
              toggleOpen(i);
            }}
          >
            <div
              className={`p-3  ${
                isOpen(i) ? 'transform rotate-0 transition-all' : 'transform  -rotate-90'
              }`}
            >
              <ChevrodnDownIcon></ChevrodnDownIcon>
            </div>
            <button type="button" className=' p-3 '>{item.label}</button>
          </div>
          {openIndices.includes(i) && <div className={`${classNameBgItems}`}>{item.content}</div>}
        </div>
      ))}
    </div>
  )
}

export default Accordion
