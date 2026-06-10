/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { defaultOfficeSettings, initialClients, initialProperties, initialRequests, MOCK_VERSION } from '../lib/mock-data'
import * as DB from '../lib/db'
import * as Cloud from '../lib/cloud'
import { DashboardContext } from './dashboard-context'
import type { ClientItem, OfficeSettings, PropertyItem, PropertyStatus, PropertyType, RequestItem } from '../types/dashboard'

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<ClientItem[]>([])
  const [properties, setProperties] = useState<PropertyItem[]>([])
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [officeSettings, setOfficeSettings] = useState<OfficeSettings>(defaultOfficeSettings)
  const [loading, setLoading] = useState(true)
  const clientsRef = useRef(clients)
  const propertiesRef = useRef(properties)
  const requestsRef = useRef(requests)
  const lastNewCount = useRef(0)
  clientsRef.current = clients // eslint-disable-line react-hooks/refs
  propertiesRef.current = properties // eslint-disable-line react-hooks/refs
  requestsRef.current = requests // eslint-disable-line react-hooks/refs

  const refresh = useCallback(async () => {
    try {
      const [c, p, r, s] = await Promise.all([DB.getAllClients(), DB.getAllProperties(), DB.getAllRequests(), DB.getSettings()])
      setClients(c); setProperties(p); setRequests(r); setOfficeSettings(s ?? defaultOfficeSettings)
    } catch (err) { console.error('refresh failed', err) }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        // Migrate old localStorage data to IndexedDB
        const storedRaw = localStorage.getItem('dashboard_requests')
        const hasLocalStorage = storedRaw ? JSON.parse(storedRaw).length > 0 : false
        if (hasLocalStorage) {
          const lsClients: ClientItem[] = JSON.parse(localStorage.getItem('dashboard_clients') || '[]')
          const lsProperties: PropertyItem[] = JSON.parse(localStorage.getItem('dashboard_properties') || '[]')
          const lsRequests: RequestItem[] = JSON.parse(storedRaw!)
          const lsSettings: OfficeSettings = JSON.parse(localStorage.getItem('dashboard_officeSettings') || 'null') || defaultOfficeSettings
          await DB.clearAll()
          if (lsRequests.length > 0) await DB.populateAll(lsClients, lsProperties, lsRequests, lsSettings)
          if (!cancelled) { setClients(lsClients); setProperties(lsProperties); setRequests(lsRequests); setOfficeSettings(lsSettings) }
          localStorage.removeItem('dashboard_clients'); localStorage.removeItem('dashboard_properties'); localStorage.removeItem('dashboard_requests'); localStorage.removeItem('dashboard_officeSettings')
          localStorage.setItem('dashboard_mock_version', String(MOCK_VERSION))
        } else {
          const resetDone = localStorage.getItem('dashboard_reset_done') === 'true'
          if (resetDone) {
            localStorage.removeItem('dashboard_reset_done')
          } else {
            // Pull from cloud and MERGE (not replace)
            let cloudData = null
            try { cloudData = await Cloud.pullFromCloud() } catch (err) { console.error('init pull', err) }
            // Seed initial data only if both local DB and cloud are empty
            if (await DB.isDBEmpty()) {
              const cloudEmpty = !cloudData || (!cloudData.clients?.length && !cloudData.properties?.length && !cloudData.requests?.length)
              if (cloudEmpty) {
                await DB.populateAll(initialClients, initialProperties, initialRequests, defaultOfficeSettings)
              } else if (cloudData) {
                await DB.clearAll()
                if (cloudData.clients) { for (const c of cloudData.clients) { await DB.addClient(c as ClientItem) }; setClients(cloudData.clients as ClientItem[]) }
                if (cloudData.properties) { for (const p of cloudData.properties) { await DB.addProperty(p as PropertyItem) }; setProperties(cloudData.properties as PropertyItem[]) }
                if (cloudData.requests) { for (const r of cloudData.requests) { await DB.addRequest(r as RequestItem) }; setRequests(cloudData.requests as RequestItem[]) }
                if (cloudData.settings) { await DB.saveSettings(cloudData.settings as OfficeSettings); setOfficeSettings(cloudData.settings as OfficeSettings) }
              }
            } else if (cloudData) {
              // Merge cloud items into local: add cloud-only, keep local-only
              const merge = async (cloud: unknown[] | undefined, local: any[], setter: (v: any) => void, add: (v: any) => Promise<void>) => {
                const cloudItems = (cloud || []) as any[]
                const localIds = new Set(local.map(x => x.id))
                for (const item of cloudItems) { if (!localIds.has(item.id)) await add(item) }
                const merged = [...local]
                for (const item of cloudItems) { if (!localIds.has(item.id)) merged.push(item) }
                if (merged.length !== local.length) setter(merged)
              }
              const [cCur, pCur, rCur] = await Promise.all([DB.getAllClients(), DB.getAllProperties(), DB.getAllRequests()])
              await merge(cloudData.clients, cCur, setClients, DB.addClient)
              await merge(cloudData.properties, pCur, setProperties, DB.addProperty)
              await merge(cloudData.requests, rCur, setRequests, DB.addRequest)
            }
            localStorage.setItem('dashboard_mock_version', String(MOCK_VERSION))
          }
          if (!cancelled) await refresh()
        }
      } catch (err) { console.error('init failed', err) }
      if (!cancelled) setLoading(false)
    }
    init()
    return () => { cancelled = true }
  }, [refresh])
  // Request notification permission on first user click
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'default') return
    const handler = () => Notification.requestPermission().catch(() => {})
    document.addEventListener('click', handler, { once: true })
  }, [])

  // Periodic auto-pull from cloud every 15s (full state sync + notification)
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const data = await Cloud.pullFromCloud()
        if (!data) return
        const [curC, curP, curR] = await Promise.all([DB.getAllClients(), DB.getAllProperties(), DB.getAllRequests()])

        const syncType = async (cloud: unknown[] | undefined, local: { id: number }[], setter: (v: any) => void, add: (v: any) => Promise<void>) => {
          const cloudItems = (cloud || []) as any[]
          const localIds = new Set(local.map(x => x.id))
          let changed = false
          for (const item of cloudItems) {
            if (!localIds.has(item.id)) { await add(item); changed = true }
            else {
              const idx = local.findIndex(x => x.id === item.id)
              if (idx >= 0 && JSON.stringify(item) !== JSON.stringify(local[idx] as any)) { await add(item); changed = true }
            }
          }
          if (changed) {
            const merged = [...local]
            const mergedIds = new Set(local.map(x => x.id))
            for (const item of cloudItems) {
              if (!mergedIds.has(item.id)) merged.push(item)
              else {
                const idx = local.findIndex(x => x.id === item.id)
                if (idx >= 0 && JSON.stringify(item) !== JSON.stringify(local[idx] as any)) merged[idx] = item
              }
            }
            setter(merged)
          }
        }

        const oldNewCount = lastNewCount.current
        await syncType(data.clients, curC, setClients, DB.addClient)
        await syncType(data.properties, curP, setProperties, DB.addProperty)
        await syncType(data.requests, curR, setRequests, DB.addRequest)

        // Check for new requests and notify
        const newReqs = (data.requests || []) as RequestItem[]
        const newCount = newReqs.filter(r => r.status === 'جديد').length
        if (newCount > oldNewCount && (data.clients || data.properties || data.requests)) {
          const diff = newCount - oldNewCount
          if (Notification.permission === 'granted') new Notification(`📩 ${diff} طلب جديد`, { body: `لديك ${diff} طلب/طلبات جديدة في قسم الإعلانات` })
          try { (navigator as any).setAppBadge?.(newCount) } catch { void 0 }
        }
        lastNewCount.current = newCount
        // Update title with unread count
        document.title = newCount > 0 ? `(${newCount}) المرقاب الذهبي` : 'المرقاب الذهبي'
      } catch (err) { console.error('auto-pull', err) }
    }, 60000)
    return () => clearInterval(id)
  }, [])

  const push = useCallback(async (data?: { clients?: ClientItem[]; properties?: PropertyItem[]; requests?: RequestItem[] }): Promise<boolean> => {
    try {
      let c: ClientItem[] | undefined, p: PropertyItem[] | undefined, r: RequestItem[] | undefined
      let s: OfficeSettings | undefined
      if (data) {
        if (data.clients) c = data.clients; else { const fromDB = await DB.getAllClients(); if (fromDB.length) c = fromDB }
        if (data.properties) p = data.properties; else { const fromDB = await DB.getAllProperties(); if (fromDB.length) p = fromDB }
        if (data.requests) r = data.requests; else { const fromDB = await DB.getAllRequests(); if (fromDB.length) r = fromDB }
      } else {
        const [dc, dp, dr, ds] = await Promise.all([DB.getAllClients(), DB.getAllProperties(), DB.getAllRequests(), DB.getSettings()])
        if (dc.length) c = dc; if (dp.length) p = dp; if (dr.length) r = dr; s = ds ?? defaultOfficeSettings
      }
      return await Cloud.pushToCloud({ clients: c, properties: p, requests: r, settings: s, version: 0 })
    } catch (err) { console.error('push failed', err); return false }
  }, [])

  const nextId = () => Number(crypto.randomUUID().replace(/\D/g, '').slice(0, 15)) || Date.now()

  const addClient = useCallback(async (client: Omit<ClientItem, 'id'>) => {
    const item: ClientItem = { id: nextId(), ...client }
    if (!await push({ clients: [item, ...clientsRef.current] })) throw new Error('فشلت مزامنة البيانات مع السحابة')
    await DB.addClient(item)
    setClients((c) => [item, ...c])
  }, [push])

  const deleteClient = useCallback(async (id: number) => {
    if (!await push({ clients: clientsRef.current.filter((x) => x.id !== id) })) throw new Error('فشلت مزامنة البيانات مع السحابة')
    await DB.deleteClient(id)
    setClients((c) => c.filter((x) => x.id !== id))
  }, [push])

  const updateClient = useCallback(async (id: number, data: Partial<Omit<ClientItem, 'id'>>) => {
    const existing = clientsRef.current.find((x) => x.id === id)
    if (!existing) return
    if (!await push({ clients: clientsRef.current.map((x) => (x.id === id ? { ...x, ...data } : x)) })) throw new Error('فشلت مزامنة البيانات مع السحابة')
    await DB.updateClient(id, data)
    setClients((c) => c.map((x) => (x.id === id ? { ...x, ...data } : x)))
  }, [push])

  const addProperty = useCallback(async (property: Omit<PropertyItem, 'id'>) => {
    const item: PropertyItem = { id: nextId(), ...property }
    const exists = propertiesRef.current.some((x) => x.title === property.title && x.district === property.district && x.city === property.city)
    if (exists) return
    if (!await push({ properties: [item, ...propertiesRef.current] })) throw new Error('فشلت مزامنة البيانات مع السحابة')
    await DB.addProperty(item)
    setProperties((p) => [item, ...p])
  }, [push])

  const updateProperty = useCallback(async (id: number, data: Partial<PropertyItem>) => {
    const existing = propertiesRef.current.find((x) => x.id === id)
    if (!existing) return
    if (!await push({ properties: propertiesRef.current.map((x) => (x.id === id ? { ...x, ...data } : x)) })) throw new Error('فشلت مزامنة البيانات مع السحابة')
    await DB.updateProperty(id, data)
    setProperties((p) => p.map((x) => (x.id === id ? { ...x, ...data } : x)))
  }, [push])

  const updatePropertyStatus = useCallback(async (id: number, status: PropertyStatus) => {
    if (!await push({ properties: propertiesRef.current.map((x) => (x.id === id ? { ...x, status } : x)) })) throw new Error('فشلت مزامنة البيانات مع السحابة')
    await DB.updateProperty(id, { status })
    setProperties((p) => p.map((x) => (x.id === id ? { ...x, status } : x)))
  }, [push])

  const deleteProperty = useCallback(async (id: number) => {
    if (!await push({ properties: propertiesRef.current.filter((x) => x.id !== id) })) throw new Error('فشلت مزامنة البيانات مع السحابة')
    await DB.deleteProperty(id)
    setProperties((p) => p.filter((x) => x.id !== id))
  }, [push])

  const addRequest = useCallback(async (request: Omit<RequestItem, 'id' | 'status'>) => {
    const item: RequestItem = { id: nextId(), status: 'جديد', ...request }
    if (!await push({ requests: [item, ...requestsRef.current] })) throw new Error('فشلت مزامنة البيانات مع السحابة')
    await DB.addRequest(item)
    setRequests((r) => [item, ...r])
  }, [push])

  const updateRequest = useCallback(async (id: number, data: Partial<Omit<RequestItem, 'id'>>) => {
    const existing = requestsRef.current.find((x) => x.id === id)
    if (!existing) return
    if (!await push({ requests: requestsRef.current.map((x) => (x.id === id ? { ...x, ...data } : x)) })) throw new Error('فشلت مزامنة البيانات مع السحابة')
    await DB.updateRequest(id, data)
    setRequests((r) => r.map((x) => (x.id === id ? { ...x, ...data } : x)))
  }, [push])

  const submitRequest = useCallback(async (request: Omit<RequestItem, 'id' | 'status' | 'date'> & { date?: string }) => {
    const key = import.meta.env.VITE_SYNC_API_KEY || 'almrqab-sync-key-2026'
    const res = await fetch('/api/submit-ad', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': key }, body: JSON.stringify(request) })
    if (!res.ok) throw new Error('فشلت مزامنة البيانات مع السحابة')
    // Also add to local state immediately so it appears in dashboard without waiting for auto-pull
    const item: RequestItem = { id: nextId(), status: 'جديد', ...request, date: request.date || new Date().toISOString().slice(0, 10) }
    await DB.addRequest(item)
    setRequests((r) => [item, ...r])
  }, [])

  const approveRequest = useCallback(async (id: number) => {
    const found = requestsRef.current.find((r) => r.id === id)
    if (!found) throw new Error('لم يتم العثور على الطلب')
    if (!await push({ requests: requestsRef.current.map((x) => (x.id === id ? { ...x, status: 'مقبول' } : x)) })) throw new Error('فشلت مزامنة البيانات مع السحابة')
    await DB.updateRequest(id, { status: 'مقبول' })
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'مقبول' } : r)))
  }, [push])

  const convertRequestToProperty = useCallback(async (id: number) => {
    const found = requestsRef.current.find((r) => r.id === id)
    if (!found) throw new Error('لم يتم العثور على الطلب')
    if (!found.propertyTitle || !found.propertyCity || !found.propertyPrice || !found.propertyArea) {
      throw new Error('الطلب لا يحتوي على بيانات العقار المطلوبة للقبول')
    }
    const item: PropertyItem = { id: nextId(), title: found.propertyTitle ?? '', district: found.propertyDistrict ?? '', city: found.propertyCity ?? '', price: found.propertyPrice ?? '', type: (found.propertyType ?? found.type) as PropertyType, status: 'متاح', area: found.propertyArea ?? '', rooms: found.propertyRooms ?? '', locationUrl: found.propertyLocationUrl ?? '', orientation: found.propertyOrientation as any, streetWidth: found.propertyStreetWidth ?? '', floor: found.propertyFloor ?? '', floors: found.propertyFloors ?? '', pool: found.propertyPool ?? '', finishing: found.propertyFinishing ?? '', parking: found.propertyParking ?? '', description: found.propertyDescription ?? '', ownerName: found.clientName, ownerPhone: found.clientPhone ?? '', ownerType: found.clientType ?? 'مالك', photos: found.propertyPhotos }
    const exists = propertiesRef.current.some((p) => p.title === item.title && p.district === item.district && p.city === item.city)
    if (exists) throw new Error('العقار موجود مسبقاً في قائمة العقارات')
    if (!await push({ properties: [item, ...propertiesRef.current], requests: requestsRef.current.filter((r) => r.id !== id) })) throw new Error('فشلت مزامنة البيانات مع السحابة')
    await DB.addProperty(item)
    setProperties((prev) => [item, ...prev])
    await DB.deleteRequest(id)
    setRequests((prev) => prev.filter((r) => r.id !== id))
  }, [push])

  const rejectRequest = useCallback(async (id: number) => {
    const found = requestsRef.current.find((r) => r.id === id)
    if (!found) throw new Error('لم يتم العثور على الطلب')
    if (!await push({ requests: requestsRef.current.map((x) => (x.id === id ? { ...x, status: 'مرفوض' } : x)) })) throw new Error('فشلت مزامنة البيانات مع السحابة')
    await DB.updateRequest(id, { status: 'مرفوض' })
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'مرفوض' } : r)))
  }, [push])

  const deleteRequest = useCallback(async (id: number) => {
    if (!await push({ requests: requestsRef.current.filter((r) => r.id !== id) })) throw new Error('فشلت مزامنة البيانات مع السحابة')
    await DB.deleteRequest(id)
    setRequests((prev) => prev.filter((r) => r.id !== id))
  }, [push])

  const setOfficeSettingsWrapper = useCallback(async (settings: OfficeSettings) => {
    if (!await push()) throw new Error('فشلت مزامنة البيانات مع السحابة')
    await DB.saveSettings(settings)
    setOfficeSettings(settings)
  }, [push])

  const resetAll = useCallback(async () => {
    await DB.clearAll()
    setClients([])
    setProperties([])
    setRequests([])
    setOfficeSettings(defaultOfficeSettings)
    localStorage.setItem('dashboard_reset_done', 'true')
    try { await push({ clients: [], properties: [], requests: [] }) } catch { void 0 }
  }, [push])

  const syncFromCloud = useCallback(async () => {
    try {
      const data = await Cloud.pullFromCloud()
      if (!data) return { ok: false, count: 0 }
      const cArr = (data.clients || []) as ClientItem[]
      const pArr = (data.properties || []) as PropertyItem[]
      const rArr = (data.requests || []) as RequestItem[]
      // Merge cloud items into local (preserve local-only items)
      const merge = async (cloud: ClientItem[] | PropertyItem[] | RequestItem[], local: any[], setter: (v: any) => void, add: (v: any) => Promise<void>) => {
        const localIds = new Set(local.map(x => x.id))
        let changed = false
        for (const item of cloud) {
          if (!localIds.has(item.id)) { await add(item); changed = true }
          else {
            const idx = local.findIndex(x => x.id === item.id)
            if (idx >= 0 && JSON.stringify(item) !== JSON.stringify(local[idx])) { await add(item); changed = true }
          }
        }
        if (changed) {
          const merged = [...local]
          const mergedIds = new Set(local.map(x => x.id))
          for (const item of cloud) {
            if (!mergedIds.has(item.id)) merged.push(item)
            else {
              const idx = local.findIndex(x => x.id === item.id)
              if (idx >= 0 && JSON.stringify(item) !== JSON.stringify(local[idx])) merged[idx] = item
            }
          }
          setter(merged as any)
        }
      }
      const [cCur, pCur, rCur] = await Promise.all([DB.getAllClients(), DB.getAllProperties(), DB.getAllRequests()])
      await merge(cArr, cCur, setClients, DB.addClient)
      await merge(pArr, pCur, setProperties, DB.addProperty)
      await merge(rArr, rCur, setRequests, DB.addRequest)
      if (data.settings) { await DB.saveSettings(data.settings as OfficeSettings); setOfficeSettings(data.settings as OfficeSettings) }
      return { ok: true, count: cArr.length + pArr.length + rArr.length }
    } catch (err) { console.error('syncFromCloud', err); return { ok: false, count: 0 } }
  }, [])

  const value = useMemo(() => ({
    clients, properties, requests, officeSettings, loading,
    addClient, deleteClient, updateClient,
    addProperty, updateProperty, updatePropertyStatus, deleteProperty,
    addRequest, updateRequest, approveRequest, convertRequestToProperty, rejectRequest, deleteRequest,
    setOfficeSettings: setOfficeSettingsWrapper, submitRequest, resetAll,
    syncFromCloud, syncToCloud: push,
  }), [clients, properties, requests, officeSettings, loading, syncFromCloud, push])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#1E3326', color: '#C5A059', fontFamily: 'Almarai, sans-serif', fontSize: '1.2rem' }}>
        جاري التحميل...
      </div>
    )
  }

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}
