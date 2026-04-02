import React, { useState } from 'react'
import MultiSelect, { Option } from '../_Atoms/MultiSelect'
import { LogicalExpression } from 'fusefx-repositorycontract'
import { TableColumn } from '../components/guifad/_Organisms/Table'
import { FieldPredicate } from 'fusefx-repositorycontract/lib/FieldPredicate'

const MultiSelectFilter: React.FC<{
  column: TableColumn
  options: Option[]
  onFilterChanged: (filter: LogicalExpression | null) => void
  initialValues: any[]
}> = ({ options, onFilterChanged, initialValues, column }) => {
  const [selectedValues, setSelectedValues] = useState<any[]>(initialValues)

  function onSelectionChanged(sv: any[] | null) {
    if (!sv) {
      setSelectedValues([]);
      onFilterChanged(null)
      return
    }
    const relation: FieldPredicate = {
      fieldName: column.fieldName,
      operator: 'in',
      valueSerialized: JSON.stringify(sv),
    }
    const columnFilter: LogicalExpression = {
      subTree: [],
      predicates: [relation],
      matchAll: true,
      negate: false,
    }
    onFilterChanged(columnFilter)
  }

  return (
    <div className='flex flex-col'>
      <MultiSelect
        initialValues={selectedValues}
        options={options}
        onSelectionChange={(sv: any[]) => setSelectedValues(sv)}
      ></MultiSelect>
      <div className='flex justify-end gap-1 text-sm'>
        <button
          className='rounded-md hover:bg-backgroundtwo p-1'
          onClick={(e) => onSelectionChanged(null)}
        >
          Clear
        </button>
        <button
          className='rounded-md hover:bg-backgroundtwo p-1'
          onClick={(e) => onSelectionChanged(selectedValues)}
        >
          Ok
        </button>
      </div>
    </div>
  )
}

export default MultiSelectFilter
