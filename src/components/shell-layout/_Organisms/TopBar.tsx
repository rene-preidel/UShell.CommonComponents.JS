import React from 'react'
import SettingsDropdown from '../_Molecules/SettingsDropdown'
import { LayoutMode, ColorMode, ShellSettings } from '../ShellSettings'
import { TopBarItem } from '../ShellMenu'
import TabControl from '../../../_Organisms/TabControl'
import TopBarTabs from '../_Molecules/TopBarTabs'
import { Logger } from '../../../[Move2Logging]/Logger'
import ArrowUpDownIcon from '../../../_Icons/ArrowUpDownIcon'
import DataBaseIcon from '../../../_Icons/DataBaseIcon'
import CogWheelIcon from '../_Icons/CogWheelIcon'
import Dropdown from '../../../_Atoms/Dropdown'

export class TopBarTab {
  label: string = ''
  action: () => void = () => {}
}

const TopBar: React.FC<{
  layoutMode: LayoutMode
  setLayoutMode: (layoutMode: LayoutMode) => void
  setColorMode: (colorMode: ColorMode) => void
  shellSettings: ShellSettings
  toggleSidebarOpen: () => void
  title: JSX.Element | string
  topBarElements?: TopBarItem[]
  tabItems?: TopBarTab[]
  initialActiveTabIndex: number
}> = ({
  layoutMode,
  setLayoutMode,
  setColorMode,
  toggleSidebarOpen,
  topBarElements,
  title,
  shellSettings,
  tabItems,
  initialActiveTabIndex,
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(
    topBarElements ? topBarElements.map(() => false) : [],
  )
  const [settingsOpen, setSettingsOpen] = React.useState(false)

  return (
    <header
      style={{ borderBottomWidth: shellSettings.colorMode == ColorMode.Dark ? '1px' : '1px' }}
      className='bg-topbar dark:bg-topbarDark static top-0 flex flex-col z-30 px-6 
        text-textone dark:text-textonedark shadow-topbarshadow1 border-topbarBorder dark:border-topbarBorderDark '
    >
      <div className='flex justify-between items-center py-1'>
        <div className='flex gap-1 items-center content-center py-2'>
          {layoutMode == LayoutMode.Vertical && (
            <button className='ml-4' onClick={() => toggleSidebarOpen()}>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth={1.5}
                stroke='currentColor'
                className='w-6 h-6'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'
                />
              </svg>
            </button>
          )}
          <h1>{title}</h1>
          {tabItems && (
            <div className='-my-3 px-4 pl-8'>
              <TopBarTabs
                tabItems={tabItems}
                initialActiveTabIndex={initialActiveTabIndex}
              ></TopBarTabs>
            </div>
          )}
        </div>

        <div className='Search'></div>

        <div className='flex items-center gap-1 justify-between py-1'>
          {topBarElements &&
            topBarElements!.map((e: TopBarItem, index: number) => (
              <div className='items-center flex flex-row' key={index} id={e.id}>
                <button
                  className='p-2 font-normal h-auto rounded-sm 
                hover:bg-topbarHover dark:hover:bg-topbarHoverDark'
                  onClick={
                    e.dropdown
                      ? () => {
                          const newDropdownOpen = [...dropdownOpen]
                          newDropdownOpen[index] = !dropdownOpen[index]
                          setDropdownOpen(newDropdownOpen)
                        }
                      : e.command
                  }
                >
                  <div className='flex items-center'>
                    {e.icon}
                    {e.dropdown && dropdownOpen[index] && (
                      <Dropdown
                        refId={e.id}
                        setIsOpen={() => {
                          const newDropdownOpen = [...dropdownOpen]
                          newDropdownOpen[index] = false
                          setDropdownOpen(newDropdownOpen)
                        }}
                      >
                        {e.dropdown}
                      </Dropdown>
                      // <div className='relative'>
                      //   <div
                      //     className='absolute top-full right-0 mt-2 bg-bg1 shadow-lg dark:bg-bg2dark p-3 rounded-md border-2 border-bg5 dark:border-bg7dark'
                      //     onClick={(event) => {
                      //       event.stopPropagation()
                      //       const newDropdownOpen = [...dropdownOpen]
                      //       newDropdownOpen[index] = false
                      //       setDropdownOpen(newDropdownOpen)
                      //     }}
                      //   >
                      //     {e.dropdown}
                      //   </div>
                      // </div>
                    )}
                  </div>
                </button>
              </div>
            ))}
          <div className='items-center flex flex-row'>
            <button
              className='p-2 font-normal h-auto rounded-sm 
                hover:bg-topbarHover dark:hover:bg-topbarHoverDark'
              onClick={() => setSettingsOpen(true)}
            >
              <div className='flex items-center'>
                <SettingsDropdown
                  shellSettings={shellSettings}
                  setLayoutMode={setLayoutMode}
                  setColorMode={setColorMode}
                  setIsOpen={(o) => setSettingsOpen(false)}
                  isOpen={settingsOpen}
                ></SettingsDropdown>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default TopBar
