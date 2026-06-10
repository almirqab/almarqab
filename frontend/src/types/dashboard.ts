export type NavKey =
  | 'home'
  | 'requests'
  | 'properties'
  | 'clients'
  | 'messages'
  | 'settings'

export type RequestStatus = 'جديد' | 'مقبول' | 'مرفوض' | 'مكتمل'

export type RequestType = 'شراء' | 'بيع' | 'إيجار' | 'استثمار' | 'إضافة عقار'

export type PropertyType = 'شقة' | 'فيلا' | 'أرض' | 'عمارة' | 'مكتب' | 'مستودع'

export type Orientation = 'شمالي' | 'جنوبي' | 'شرقي' | 'غربي' | 'شمالي شرقي' | 'شمالي غربي' | 'جنوبي شرقي' | 'جنوبي غربي' | 'واجهة'

export type PropertyStatus = 'متاح' | 'تم البيع' | 'تم التأجير' | 'ملغي'

export interface DashboardStat {
  id: string
  title: string
  value: string
  change: string
  icon: 'building' | 'clipboard' | 'check' | 'message'
}

export interface RequestItem {
  id: number
  clientName: string
  clientPhone?: string
  clientType?: 'مالك' | 'وكيل'
  type: RequestType
  status: RequestStatus
  date: string
  propertyTitle?: string
  propertyDistrict?: string
  propertyCity?: string
  propertyPrice?: string
  propertyArea?: string
  propertyRooms?: string
  propertyDescription?: string
  propertyType?: string
  propertyLocationUrl?: string
  propertyOrientation?: string
  propertyStreetWidth?: string
  propertyFloor?: string
  propertyFloors?: string
  propertyPool?: string
  propertyFinishing?: string
  propertyParking?: string
  propertyPhotos?: string[]
}

export interface PropertyItem {
  id: number
  title: string
  district: string
  city: string
  price: string
  type: string
  status: PropertyStatus
  area: string
  rooms: string
  description: string
  ownerName: string
  ownerPhone: string
  ownerType: 'مالك' | 'وكيل'
  locationUrl?: string
  orientation?: Orientation
  streetWidth?: string
  floor?: string
  floors?: string
  pool?: string
  finishing?: string
  parking?: string
  photos?: string[]
}

export interface ClientItem {
  id: number
  name: string
  phone: string
  type: string
  notes: string
  reminder?: string
}

export interface OfficeSettings {
  name: string
  phone: string
  commercial: string
  tax: string
  falLicense: string
  crNumber: string
  whatsapp: string
  address: string
}
