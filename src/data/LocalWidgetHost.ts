import { SchemaRoot } from 'fusefx-modeldescription'
import {
  IDataSource,
  IDataSourceManager,
  IDataSourceManagerWidget,
  IWidgetHost,
  UsecaseState,
} from 'ushell-modulebase'

export class LocalWidgetHost implements IWidgetHost {
  private dataSourceManager: IDataSourceManagerWidget
  constructor(dataSourceManager: IDataSourceManagerWidget) {
    this.dataSourceManager = dataSourceManager
  }

  getServiceByName<TService extends object>(serviceName: string, tokenSourceUid?: string): TService {
    throw new Error('Method not implemented.')
  }
  
  createServiceProxy<TService extends object>(serviceUrl: string, tokenSourceUid?: string): TService {
    throw new Error('Method not implemented.')
  }

  private getLocalStorageIdentifier(usecaseInstanceUid: string): string {
    return `UShell_CommonComponents_${usecaseInstanceUid}`
  }
  populateChangedState(changedState: UsecaseState): void {
    localStorage.setItem(
      this.getLocalStorageIdentifier(changedState.usecaseInstanceUid),
      JSON.stringify(changedState),
    )
  }
  public getUsecaseState(usecaseInstanceUid: string): any {
    const stateJson: string | null = localStorage.getItem(
      this.getLocalStorageIdentifier(usecaseInstanceUid),
    )
    if (!stateJson) return null
    return JSON.parse(stateJson)
  }

  subscribeEvent(name: string, subscriber: (args: object) => void): void {}
  fireEvent(name: string, args: object): void {}
  getAccessToken(tokenSourceUid: string): Promise<{ token: string; content: object } | null> {
    return new Promise((res) => res(null))
  }
  getDataSource(dataSourceUid: string): Promise<IDataSource> {
    throw new Error('Method not implemented.')
  }
  getDataSourceForEntity(entityName: string, storeName?: string): IDataSource {
    return this.dataSourceManager.tryGetDataSource(entityName, storeName)!
  }
  get allignWidgetNavPanelLeft(): boolean {
    return true
  }
  tryGetDataSource(entityName: string, storeName?: string): IDataSource | null {
    return this.dataSourceManager.tryGetDataSource(entityName, storeName)
  }
  getSchemaRoot(): SchemaRoot {
    return this.dataSourceManager.getSchemaRoot()
  }
}
