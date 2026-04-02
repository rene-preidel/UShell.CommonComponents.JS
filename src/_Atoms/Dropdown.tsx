import React, { createRef, useEffect, useId, useMemo, useState } from 'react'

const Dropdown: React.FC<{
  setIsOpen?: (o: boolean) => void
  topOffset?: number
  bottomOffset?: number
  rightOffset?: number
  leftOffset?: number
  children: any
  refId: string
  className?: string

  /** Attempt to set the minimum width of the dropdown to match the width of the element identified by refId */
  minWidth?: boolean
  /** Attempt to set the maximum width of the dropdown to match the width of the element identified by refId */
  maxWidth?: boolean

  /** Specifies the maximum height of the dropdown in pixels. If not provided, the dropdown will expand 
   * to fit the available space up to the bottom of the screen.
   */
  maxHeight?: number
  /** Specifies the minimum height of the dropdown in pixels. */
  minHeight?: number
  direction?: 'x' | 'y'
}> = ({
  setIsOpen,
  children,
  topOffset,
  bottomOffset,
  rightOffset,
  leftOffset,
  refId,
  className,
  minWidth,
  maxWidth = false,
  maxHeight = null,
  minHeight,
  direction = 'y',
}) => {
  const [render, setRender] = useState(0)

  useEffect(() => {
    setRender((r) => r + 1)
  }, [minWidth])

  useEffect(() => {
    if (!setIsOpen) {
      return
    }
    const handleEscape = (e: any) => {
      if (e.key == 'Esc' || e.key == 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [setIsOpen])

  useEffect(() => {
    const el = document.getElementById(refId)
    if (!el) return

    const handleResizeOrScroll = () => setRender((r) => r + 1)
    const resizeObserver = new ResizeObserver(handleResizeOrScroll)

    resizeObserver.observe(el)
    window.addEventListener('resize', handleResizeOrScroll)

    let parent: HTMLElement | null = el.parentElement
    const scrollListeners: HTMLElement[] = []

    while (parent) {
      parent.addEventListener('scroll', handleResizeOrScroll)
      scrollListeners.push(parent)
      parent = parent.parentElement
    }

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleResizeOrScroll)
      scrollListeners.forEach((scrollEl) => scrollEl.removeEventListener('scroll', handleResizeOrScroll))
    }
  }, [refId])

  function tryFindFixedParent(el: HTMLElement): HTMLElement | null {
    let parentElement: HTMLElement | null = el.parentElement
    while (parentElement) {
      if (parentElement.style.position == 'fixed') {
        return parentElement
      }
      if (parentElement.className.includes('UShell_Modal_Inner')) {
        return parentElement
      }
      parentElement = parentElement.parentElement
    }
    return null
  }

  function getTop(): number | undefined {
    const el = document.getElementById(refId)
    if (!el) return undefined
    const tCheck = el.getBoundingClientRect().top + el.getBoundingClientRect().height
    const t = el.getBoundingClientRect().top + (direction == 'y' ? el.getBoundingClientRect().height : 0)

    const hThreshold = minHeight ? window.innerHeight - minHeight : window.innerHeight * 0.8;
    if (tCheck <= hThreshold) {
      const fixedParent: HTMLElement | null = tryFindFixedParent(el)
      if (fixedParent) {
        return t - fixedParent.getBoundingClientRect().top
      }
      return t
    } else {
      return undefined
    }
  }

  function getBottom(): number | undefined {
    const el = document.getElementById(refId)
    if (!el) return undefined

    const tCheck = el.getBoundingClientRect().top + el.getBoundingClientRect().height
    const t = el.getBoundingClientRect().top + el.getBoundingClientRect().height
    const hThreshold = minHeight ? window.innerHeight - minHeight : window.innerHeight * 0.8;
    if (tCheck > hThreshold) {
      const fixedParent: HTMLElement | null = tryFindFixedParent(el)
      if (fixedParent) {
        return (
          window.innerHeight -
          el.getBoundingClientRect().top -
          fixedParent.getBoundingClientRect().top * 0
        )
      }
      return (
        window.innerHeight -
        el.getBoundingClientRect().top -
        (direction == 'x' ? el.getBoundingClientRect().height : 0)
      )
    } else {
      return undefined
    }
  }
  function getLeft(): number | undefined {
    const el = document.getElementById(refId)
    if (!el) return 100
    const l =
      el.getBoundingClientRect().left + (direction == 'x' ? el.getBoundingClientRect().width : 0)
    const wHalf = window.innerWidth / 2
    if (l <= wHalf) {
      const fixedParent: HTMLElement | null = tryFindFixedParent(el)
      if (fixedParent) {
        return l - fixedParent.getBoundingClientRect().left
      }
      return l
    } else {
      return undefined
    }
  }
  function getRight(): number | undefined {
    const el = document.getElementById(refId)
    if (!el) return 100
    const r =
      window.innerWidth -
      el.getBoundingClientRect().right +
      (direction == 'x' ? el.getBoundingClientRect().width : 0)
    const wHalf = window.innerWidth / 2
    if (r < wHalf) {
      const fixedParent: HTMLElement | null = tryFindFixedParent(el)
      if (fixedParent) {
        return (
          window.innerWidth -
          (el.getBoundingClientRect().left + el.getBoundingClientRect().width) -
          fixedParent.getBoundingClientRect().left
        )
        // return (
        //   r + (fixedParent.getBoundingClientRect().left - fixedParent.getBoundingClientRect().width)
        // )
      }
      return r
    } else {
      return undefined
    }
  }

  function getHeight(): number {
    const el = document.getElementById(refId)
    if (!el) return 100
    const t = getTop()
    if (t) {
      const calculatedHeight = window.innerHeight - t
      return maxHeight ? Math.min(calculatedHeight, maxHeight) : calculatedHeight
    } else {
      return el.getBoundingClientRect().y
    }
  }

  function getWidth(): number {
    const el = document.getElementById(refId)
    if (!el) return 100
    return el.getBoundingClientRect().width
  }

  return (
    <>
      {setIsOpen && (
        <button
          id='button1'
          className='fixed z-0 cursor-default inset-0 bg-black bg-opacity-0'
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            setIsOpen(false)
          }}
          aria-label="Close dropdown"
        ></button>
      )}
      <div className=''>
        <div
          style={{
            height: undefined,
            maxHeight: getHeight(),
            minHeight: minHeight,
            minWidth: minWidth ? getWidth() : undefined,
            maxWidth: maxWidth ? getWidth() : undefined,
            bottom: getBottom(),
            top: getTop(),
            left: getLeft(),
            right: getRight(),
          }}
          className={`fixed z-50 shadow-lg shadow-bg14 dark:shadow-bg10dark overflow-hidden 
             flex flex-col justify-center items-center w-max ${className} border-0 bg-transparent border-pink-400`}
        >
          {children}
        </div>
      </div>
    </>
  )
}

export default Dropdown
