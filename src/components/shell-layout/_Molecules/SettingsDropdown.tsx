import React, { useState } from 'react'
import Dropdown from '../../../_Atoms/Dropdown'
import RadioGroup from '../_Atoms/RadioGroup'
import { ColorMode, LayoutMode, ShellSettings } from '../ShellSettings'
import CogWheelIcon from '../_Icons/CogWheelIcon'

const SettingsDropdown: React.FC<{
  setLayoutMode: (layoutMode: LayoutMode) => void
  setColorMode: (colorMode: ColorMode) => void
  shellSettings: ShellSettings
  isOpen: boolean
  setIsOpen?: (o: boolean) => void
}> = ({ setLayoutMode, setColorMode, shellSettings, isOpen, setIsOpen }) => {
  return (
    <>
      <button
        id='UShell_Settings_Button'
        className='align-middle'
        onClick={() => setIsOpen && setIsOpen(!isOpen)}
      >
        <CogWheelIcon size={1.2}></CogWheelIcon>
      </button>
      {isOpen && (
        <Dropdown refId='UShell_Settings_Button' setIsOpen={setIsOpen} rightOffset={1}>
          <div className='bg-bg1 shadow-lg dark:bg-bg2dark p-3 rounded-md border-2 border-bg5 dark:border-bg7dark mt-2'>
            <div className='mb-4'>
              <RadioGroup
                value={shellSettings.layoutMode}
                key={0}
                labelText='Layout Mode'
                options={[<div key={1}>Vertical</div>, <div key={2}>Horizontal</div>]}
                onChange={(index) => {
                  switch (index) {
                    case 0:
                      setLayoutMode(LayoutMode.Vertical)
                      break
                    case 1:
                      setLayoutMode(LayoutMode.Horizontal)
                      break
                  }
                }}
              ></RadioGroup>
            </div>
            <div className='mb-4'>
              <RadioGroup
                labelText='Color Mode'
                value={shellSettings.colorMode}
                key={0}
                options={[<div key={1}>Light</div>, <div key={2}>Dark</div>]}
                onChange={(index) => {
                  switch (index) {
                    case 0:
                      setColorMode(ColorMode.Light)
                      break
                    case 1:
                      setColorMode(ColorMode.Dark)
                      break
                  }
                }}
              ></RadioGroup>
            </div>
          </div>
        </Dropdown>
      )}
    </>
  )
}

export default SettingsDropdown
