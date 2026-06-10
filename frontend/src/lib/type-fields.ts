import type { PropertyType } from '../types/dashboard'

export type TypeField = 'rooms' | 'floor' | 'floors' | 'orientation' | 'streetWidth' | 'pool' | 'finishing' | 'parking'

export const typeFieldLabels: Record<TypeField, string> = {
  rooms: 'الغرف',
  floor: 'الدور',
  floors: 'عدد الأدوار',
  orientation: 'الواجهة',
  streetWidth: 'عرض الشارع',
  pool: 'المسبح',
  finishing: 'التشطيب',
  parking: 'المواقف',
}

export const finishingOptions = ['عادي', 'لوكس', 'سوبر لوكس', 'ديلوكس']
export const poolOptions = ['لا يوجد', 'خاص', 'مشترك']
export const orientationOptions = ['شمالي','جنوبي','شرقي','غربي','شمالي شرقي','شمالي غربي','جنوبي شرقي','جنوبي غربي','واجهة']

export const typeFieldsMap: Record<PropertyType, TypeField[]> = {
  شقة: ['rooms', 'floor', 'orientation', 'finishing', 'parking'],
  فيلا: ['rooms', 'floors', 'orientation', 'streetWidth', 'pool', 'finishing', 'parking'],
  أرض: ['orientation', 'streetWidth'],
  عمارة: ['floors', 'orientation', 'finishing', 'parking'],
  مكتب: ['rooms', 'floor', 'finishing'],
  مستودع: ['orientation', 'streetWidth'],
}