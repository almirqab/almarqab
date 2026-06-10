import { createContext } from 'react'
import type { ClientItem, OfficeSettings, PropertyItem, PropertyStatus, RequestItem } from '../types/dashboard'

export interface DashboardContextValue {
  clients: ClientItem[]
  properties: PropertyItem[]
  requests: RequestItem[]
  officeSettings: OfficeSettings
  loading: boolean
  addClient: (client: Omit<ClientItem, 'id'>) => Promise<void>
  deleteClient: (id: number) => Promise<void>
  updateClient: (id: number, data: Partial<Omit<ClientItem, 'id'>>) => Promise<void>
  addProperty: (property: Omit<PropertyItem, 'id'>) => Promise<void>
  updateProperty: (id: number, data: Partial<PropertyItem>) => Promise<void>
  updatePropertyStatus: (id: number, status: PropertyStatus) => Promise<void>
  deleteProperty: (id: number) => Promise<void>
  addRequest: (request: Omit<RequestItem, 'id' | 'status'>) => Promise<void>
  updateRequest: (id: number, data: Partial<Omit<RequestItem, 'id'>>) => Promise<void>
  approveRequest: (id: number) => Promise<void>
  rejectRequest: (id: number) => Promise<void>
  convertRequestToProperty: (id: number) => Promise<void>
  deleteRequest: (id: number) => Promise<void>
  setOfficeSettings: (settings: OfficeSettings) => Promise<void>
  submitRequest: (request: Omit<RequestItem, 'id' | 'status' | 'date'> & { date?: string }) => Promise<void>
  resetAll: () => Promise<void>
  syncFromCloud: () => Promise<{ ok: boolean; count: number }>
  syncToCloud: (data?: { clients?: ClientItem[]; properties?: PropertyItem[]; requests?: RequestItem[] }) => Promise<boolean>
  cloudInfo: { lastSync: string | null; lastResult: string; pushing: boolean }
  forcePushToCloud: () => Promise<boolean>
  forcePullFromCloud: () => Promise<{ ok: boolean; count: number }>
}

export const DashboardContext = createContext<DashboardContextValue | undefined>(undefined)
