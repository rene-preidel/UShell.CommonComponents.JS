import {
  EntitySchema,
  SchemaRoot,
  RelationSchema,
  FieldSchema,
  IndexSchema,
} from 'fusefx-modeldescription'
import { IDataSource } from 'ushell-modulebase'
import { capitalizeFirstLetter, getValue, lowerFirstLetter } from '../utils/StringUtils'
import { LogicalExpression } from 'fusefx-repositorycontract'
import { KnownValueRange } from 'fusefx-modeldescription/lib/KnownValueRange'

export class EntitySchemaService {
  static getIndexSchema(indexName: string, entitySchema: EntitySchema): IndexSchema | null {
    const index: IndexSchema | undefined = entitySchema.indices.find((i) => i.name == indexName)
    if (!index) {
      console.error(`Index with name ${indexName} not found in entity schema.`)
      return null
    }
    return index
  }

  static getFields(indexName: string, entitySchema: EntitySchema): FieldSchema[] {
    const index: IndexSchema | null = this.getIndexSchema(indexName, entitySchema)
    if (!index) return []
    const result: FieldSchema[] = []
    index.memberFieldNames.forEach((fn) => {
      const field: FieldSchema | undefined = entitySchema.fields.find((f) => f.name == fn)
      if (field) {
        result.push(field)
      } else {
        console.warn(`Field with name ${fn} not found in entity schema.`)
      }
    })
    return result
  }

  static getKnownValues(
    f: FieldSchema,
    schemaRoot: SchemaRoot,
  ): { value: any; label: string }[] | undefined {
    if (!f.knownValueRangeName) return undefined

    const result: { value: any; label: string }[] = []
    const knownValueRange: KnownValueRange | undefined = schemaRoot.knownValueRanges.find(
      (k) => k.name == f.knownValueRangeName,
    )
    if (!knownValueRange) return undefined
    knownValueRange.knownValues.forEach((v) => {
      let value: any = JSON.parse(v.valueSerialized)

      if (EntitySchemaService.isNumber(f.type)) {
        if (typeof value == 'string') {
          const parsedValue: number = Number.parseFloat(value)

          if (!Number.isNaN(parsedValue)) {
            value = parsedValue
          }
        }
      }
      const label: string = v.label
      result.push({ value, label })
    })
    return result
  }
  static getKey(er: RelationSchema): import('react').Key | null | undefined {
    return er.primaryEntityName + er.foreignEntityName + er.foreignKeyIndexName
  }

  static areRelationsEqual(r1: RelationSchema | null, r2: RelationSchema | null): boolean {
    if (!r1 && !r2) return true
    if (!r1 || !r2) return false
    return this.getKey(r1) == this.getKey(r2)
  }

  static isNumber(fieldType: string) {
    return this.getHtmlInputType(fieldType) == 'number'
  }

  static getUniversalSearchExpression(
    entitySchema: EntitySchema,
    universalSearchText: string,
  ): LogicalExpression | null {
    const fieldNames: string[] = []
    const indices: IndexSchema[] = entitySchema.indices
    indices.forEach((i) => {
      i.memberFieldNames.forEach((fn) => {
        if (!fieldNames.includes(fn)) {
          const fs: FieldSchema | undefined = entitySchema.fields.find((f) => f.name == fn)
          if (fs && fs.type.toLocaleLowerCase() == 'string') {
            fieldNames.push(fn)
          }
        }
      })
    })
    if (fieldNames.length == 0) return null
    const result: LogicalExpression = new LogicalExpression()
    result.matchAll = false
    result.subTree = []
    result.predicates = []
    fieldNames.forEach((fn) => {
      result.predicates.push({
        fieldName: fn,
        operator: '>=',
        valueSerialized: universalSearchText,
      })
    })
    return result
  }

  static getLabelForRelationToForeign(schemaRoot: SchemaRoot, relation: RelationSchema): string {
    if (relation.primaryNavigationName && relation.primaryNavigationName != '') {
      return relation.primaryNavigationName
    }
    if (!relation.foreignEntityIsMultiple) {
      return relation.foreignEntityName
    }
    const entitySchema: EntitySchema | undefined = schemaRoot.entities.find(
      (e) => e.name == relation.foreignEntityName,
    )
    if (!entitySchema) return relation.foreignEntityName

    return entitySchema.namePlural
  }

  static getLabel(schemaRoot: SchemaRoot, primaryEntityName: string, entity: any): string {
    if (!entity) return 'No Entity'

    if (entity.label) return entity.label
    if (entity.Label) return entity.Label
    const entitySchema: EntitySchema | undefined = schemaRoot.entities.find(
      (e) => e.name == primaryEntityName,
    )
    if (!entitySchema) return '???'
    const labelField: FieldSchema | undefined = entitySchema.fields.find(
      (f: FieldSchema) => f.identityLabel,
    )
    if (labelField) return getValue(entity, labelField.name)
    if (entity.name) return entity.name
    if (entity.Name) return entity.Name
    if (entity.id) return entity.id
    if (entity.Id) return entity.Id

    return '???'
  }

  static getLabelByEntitySchema(entitySchema: EntitySchema, entity: any): string {
    if (!entity) return 'Nope'
    if (entity.label) return entity.label
    if (entity.Label) return entity.Label
    const labelField: FieldSchema | undefined = entitySchema.fields.find(
      (f: FieldSchema) => f.identityLabel,
    )
    if (labelField) return getValue(entity, labelField.name)

    if (entity.id) return entity.id.toLocaleString()
    if (entity.Id) return entity.Id.toLocaleString()

    return '???'
  }

  static getPrimaryKeyProps(entitySchema: EntitySchema): string[] {
    const primaryIndex: IndexSchema | undefined = entitySchema.indices.find(
      (i) => i.name == entitySchema.primaryKeyIndexName,
    )
    if (!primaryIndex) {
      return [entitySchema.primaryKeyIndexName]
    }
    return primaryIndex.memberFieldNames
  }

  static getPrimaryKey(entitySchema: EntitySchema, entity: any): any {
    const props: string[] = this.getPrimaryKeyProps(entitySchema)
    if (props.length == 0) return undefined
    if (props.length == 1) {
      const id: string = props[0]
      if (id in entity) return entity[id]
      if (capitalizeFirstLetter(id) in entity) return entity[capitalizeFirstLetter(id)]
      if (lowerFirstLetter(id) in entity) return entity[lowerFirstLetter(id)]
      return undefined
    }
    const result: any = {}
    props.forEach((p, i) => {
      let v: any = undefined
      if (p in entity) {
        v = entity[p]
      } else if (capitalizeFirstLetter(p) in entity) {
        v = entity(capitalizeFirstLetter(p))
      } else if (lowerFirstLetter(p) in entity) {
        v = entity(lowerFirstLetter(p))
      }
      result['key' + i + 1] = v
    })
    return result
  }

  static getPrimaryKeyExpression(entitySchema: EntitySchema, primaryKey: any): LogicalExpression {
    const primaryKeyProps: string[] = this.getPrimaryKeyProps(entitySchema)
    const result: LogicalExpression = new LogicalExpression()
    result.matchAll = true
    result.negate = false
    result.subTree = []
    result.predicates = []

    if (primaryKeyProps.length == 1) {
      const value: any = primaryKey
      result.predicates.push({
        fieldName: primaryKeyProps[0],
        operator: '=',
        valueSerialized: JSON.stringify(value),
      })
      return result
    }
    primaryKeyProps.forEach((pk, i) => {
      const value: any = primaryKey[`key_${i + 1}`]
      result.predicates.push({
        fieldName: pk,
        operator: '=',
        valueSerialized: JSON.stringify(value),
      })
    })
    return result
  }

  static getRelations(schemaRoot: SchemaRoot, entitySchema: EntitySchema, includeLookups: boolean) {
    return schemaRoot.relations.filter(
      (r) => r.primaryEntityName == entitySchema.name && (includeLookups || !r.isLookupRelation),
    )
  }
  static getRelationsByFilter(
    schemaRoot: SchemaRoot,
    filter: (r: RelationSchema) => boolean,
  ): RelationSchema[] {
    return schemaRoot.relations.filter((r) => filter(r))
  }

  static getAllLookUps(
    schemaRoot: SchemaRoot,
    getDatasource: (en: string) => IDataSource | null,
    entitySchema: EntitySchema,
  ) {
    const lookUpRelations: RelationSchema[] = EntitySchemaService.getRelationsByFilter(
      schemaRoot,
      (r: RelationSchema) => r.foreignEntityName == entitySchema.name && r.isLookupRelation,
    )
    const result: { [lookUpName: string]: { label: string; value: any }[] } = {}
    lookUpRelations.forEach((l) => {
      const ds: IDataSource | null = getDatasource(l.foreignEntityName)
      if (!ds) {
        throw 'No DataSource'
      }
      ds.getEntityRefs().then((r) => {
        result[l.foreignEntityName] = r.page
      })
    })
  }

  static convertToString(propertyType: string, value: any): string {
    if (value === null || value === undefined) return '';
    if (this.isAnyIntegerType(propertyType)) {
      return value.toString();
    }
    if (propertyType.toLocaleLowerCase() === 'datetime') {
      if (value instanceof Date) {
        return value.toISOString().split('T')[0];
      }
      const parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString().split('T')[0];
      }
      return '';
    }
    return value;
  }

  static isBigIntType(propertyType: string) {
    switch (propertyType.toLocaleLowerCase()) {
      case 'bigint':
      case 'long':
      case 'ulong':
      case 'int64':
      case 'uint64':
        return true
    }
    return false
  }

  static isAnyIntegerType(propertyType: string) {
    if (this.isBigIntType(propertyType)) return true
    switch (propertyType.toLocaleLowerCase()) {
      case 'sbyte':
      case 'byte':
      case 'short':
      case 'int16':
      case 'ushort':
      case 'uint16':
      case 'int':
      case 'int32':
      case 'integer':
      case 'uint':
      case 'uint32':
        return true
    }
    return false
  }
  
  static isAnyFloatingPointType(propertyType: string) {
    switch (propertyType.toLocaleLowerCase()) {
      case 'float':
      case 'single':
      case 'double':
      case 'half':
      case 'decimal':
        return true
    }
    return false
  }

  static isAnyNumericType(propertyType: string) {
    return this.isAnyIntegerType(propertyType) || this.isAnyFloatingPointType(propertyType)
  }

  static getHtmlInputType(propertyType: string) {
    if (this.isAnyNumericType(propertyType)) {
      return 'number';
    }
    switch (propertyType.toLocaleLowerCase()) {
      case 'datetime':
        return 'date'
      case 'bool':
      case 'boolean':
        return 'checkbox'
    }
    return 'text'
  }

  static findEntryWithMatchingIdentity(entities: any[], entity: any, schema: EntitySchema): any {
    return entities.find((e) => this.matchInIdentity(e, entity, schema))
  }

  static findIndexWithMatchingIdentity(entities: any[], entity: any, schema: EntitySchema): number {
    return entities.findIndex((e) => this.matchInIdentity(e, entity, schema))
  }

  static matchInIdentity(e1: any, e2: any, schema: EntitySchema): boolean {
    const key1: any = this.getPrimaryKey(schema, e1)
    const key2: any = this.getPrimaryKey(schema, e2)
    return this.compareDeep(key1, key2)
  }

  static compareDeep(o1: any, o2: any): boolean {
    const o1IsObject: boolean = typeof o1 == 'object'
    const o2IsObject: boolean = typeof o2 == 'object'
    if (o1IsObject !== o2IsObject) return false
    if (!o1IsObject) return o1 == o2
    for (let k1 in o1) {
      const k1ExistsInO2: boolean = k1 in o2
      if (!k1ExistsInO2) return false
      const v1: any = o1[k1]
      const v2: any = o2[k1]
      const innerResult: boolean = this.compareDeep(v1, v2)
      if (!innerResult) return false
    }
    return true
  }

  static clone(o: any, entitySchema: EntitySchema): any {
    const result: any = {}
    const primProps: string[] = this.getPrimaryKeyProps(entitySchema)
    const primPropsLowered: string[] = primProps.map((pp) => pp.toLocaleLowerCase())
    for (let f of entitySchema.fields) {
      if (f.dbGeneratedIdentity) continue
      let valueToSet: any = undefined
      let forceValue: boolean = false
      if (primPropsLowered.includes(f.name.toLocaleLowerCase())) {
        if (f.type.toLocaleLowerCase() == 'guid') {
          valueToSet = crypto.randomUUID()
          forceValue = true
        }
        if (this.isNumber(f.type)) {
          valueToSet = 0
          forceValue = true
        }
      }
      const lowerFieldName: string = lowerFirstLetter(f.name)
      const lowExsists: boolean = lowerFieldName in o
      const capFieldName: string = capitalizeFirstLetter(f.name)
      const capExists: boolean = capFieldName in o
      if (!lowExsists && !capExists) continue
      const finalFieldName: string = lowExsists ? lowerFieldName : capFieldName
      if (forceValue) {
        result[finalFieldName] = valueToSet
      } else {
        let finalValue: any = o[finalFieldName]
        if (f.identityLabel) {
          const copyMarker: string = ' - copy'
          const valueAsString: string = finalValue.toLocaleString()
          const indexOfCopy: number = valueAsString.indexOf(copyMarker)
          if (indexOfCopy >= 0) {
            const numberOfCopiesString = valueAsString
              .substring(indexOfCopy + copyMarker.length + 2)
              .trim()
            const numberOfCopies: number = (Number.parseInt(numberOfCopiesString) || 0) + 1
            finalValue = valueAsString.substring(0, copyMarker.length) + copyMarker
            finalValue += ` (${numberOfCopies}) `
          } else {
            finalValue += copyMarker
          }
        }
        result[finalFieldName] = finalValue
      }
    }
    return result
  }

  static parseToFieldType(fieldType: string, value: any): any {
    if (value === null || value === undefined) return null;
    if (EntitySchemaService.isBigIntType(fieldType)) {
      try {
        return BigInt(value);
      } catch (error) {
        console.error(`Failed to parse value to BigInt: ${value}`, error);
        return null;
      }
    } else if (EntitySchemaService.isAnyIntegerType(fieldType)) {
      return Number.parseInt(value);
    } else if (EntitySchemaService.isAnyFloatingPointType(fieldType)) {
      return Number.parseFloat(value);
    } else {
      switch (fieldType.toLocaleLowerCase()) {
        case 'bool':
        case 'boolean':
          if (typeof value === 'string') {
            return value.toLocaleLowerCase() === 'true' || value === '1';
          } else if (typeof value === 'number') {
            return value === 1;
          } else if (typeof value === 'boolean') {
            return value;
          } else {
            return false;
          }
        // ToDo_Rep: vermutlich bei weitem nicht robust genug
        case 'datetime':
            return new Date(value);
        case 'string':
        default:
          return value;
      }
    }
  }

  static getDefaultValueForType(fieldType: string, required: boolean): any {
    if (!required) return null;

    if (EntitySchemaService.isAnyNumericType(fieldType)) {
      return 0;
    } else {
      switch (fieldType.toLocaleLowerCase()) {
        case 'bool':
        case 'boolean':
          return false;
        case 'datetime':
            return new Date('1900-01-01T00:00:00Z');
        case 'string':
        default:
          return '';
      }
    }
  }

  /**
   * Compares two values based on their field type.
   * The given values are assumed to be already parsed to their correct types.
   * @param fieldType used fieldType for comparison, e.g. 'datetime', 'int', etc.
   * @param v1 first value
   * @param v2 second value
   * @returns true if values are equal, false otherwise
   */
  static equals(fieldType: string, v1: any, v2: any): boolean {
    if (v1 === v2) return true; // early exit if we have two invalid dates
    if (fieldType.toLowerCase() === 'datetime') {
      const d1: Date = new Date(v1)
      const d2: Date = new Date(v2)
      return d1.getTime() === d2.getTime()
    }
    return false;
  }

  static createNewEntity(entitySchema: EntitySchema) {
    const result: any = {}
    const keyProps: string[] = EntitySchemaService.getPrimaryKeyProps(entitySchema)

    for (let fn of entitySchema.fields) {
      const isKey: boolean = keyProps.includes(fn.name)
      if (isKey && EntitySchemaService.isNumber(fn.type)) {
      } else if (isKey && fn.type.toLocaleLowerCase() == 'guid') {
        result[fn.name] = crypto.randomUUID()
      } else {
        if (fn.defaultValue) {
          result[fn.name] = EntitySchemaService.parseToFieldType(fn.type, fn.defaultValue);
        } else {
          // Default Values for non-nullable (required) fields:
          result[fn.name] = EntitySchemaService.getDefaultValueForType(fn.type, fn.required);
        }
      }
    }
    return result
  }

  static getErrors(v: any, required: boolean, inputType: string): string | null {
    if (required && inputType.toLocaleLowerCase().startsWith('bool')) {
      const isTrue = v == true
      const isFalse = v == false
      if (isTrue || isFalse) {
        return null
      } else {
        return 'Field is required'
      }
    }
    if (required && inputType.toLocaleLowerCase().startsWith('string')) {
      if (v == null || v == undefined) {
        return 'Field is required'
      } else {
        return null
      }
    }
    const isNumber = ['int16', 'short', 'int32', 'int64', 'decimal', 'float', 'long', 'int', 'integer'].includes(
      inputType.toLocaleLowerCase(),
    )

    const isFloatingPointNumber = ['decimal', 'float', 'double'].includes(
      inputType.toLocaleLowerCase(),
    )

    if (required && isNumber) {
      if (v == null || v == undefined || Number.isNaN(v)) {
        console.log('v == null', v == null)
        console.log('v == undefined', v == undefined)
        console.log('Number.isNaN(v)', Number.isNaN(v))
        console.log('v == ""', v == '')
        console.log('checking number', v)
        return 'Field is required'
      } else {
        return null
      }
    }

    // integer check
    if (isNumber && !isFloatingPointNumber && v !== null && v !== undefined && v !== '') {
      if (!Number.isInteger(Number.parseFloat(v)) || String(v).includes('.')) {
        return 'Value must be an integer';
      }
    }

    // int16 range
    if (inputType === 'int16' || inputType === 'short') {
      if (Number.parseInt(v) > 32767 || Number.parseInt(v) < -32768) {
        return 'Value must be between -32,768 and 32,767';
      }
    }

    // int32 range
    if (inputType === 'int32' || inputType === 'int' || inputType === 'integer') {
      if (Number.parseInt(v) > 2147483647 || Number.parseInt(v) < -2147483648) {
        return 'Value must be between -2,147,483,648 and 2,147,483,647';
      }
    }

    // int64 range
    if ((inputType === 'int64' || inputType === 'long') && (required || (v !== null && v !== undefined && v !== ''))) {
      try{
        const valAsBigInt = BigInt(v);
        const int64Min = BigInt('-9223372036854775808');
        const int64Max = BigInt('9223372036854775807');
        if (valAsBigInt < int64Min || valAsBigInt > int64Max) {
          return 'Value must be between -9,223,372,036,854,775,808 and 9,223,372,036,854,775,807';
        }
      } catch (error) {
        return 'Value must be a valid integer number';
      }
    }

    if (required && (v == null || v == undefined || v == '')) {
      return 'Field is required'
    }

    return null
  }
}
