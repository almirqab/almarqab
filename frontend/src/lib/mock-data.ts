import type { ClientItem, OfficeSettings, PropertyItem, PropertyType, RequestItem } from '../types/dashboard'

export const MOCK_VERSION = 5

export const initialRequests: RequestItem[] = [
  { id: 2001, clientName: 'خالد الزهراني', clientPhone: '0551112233', clientType: 'مالك', type: 'بيع', status: 'جديد', date: '2026-06-08', propertyTitle: 'فيلا - جدة أبحر', propertyDistrict: 'أبحر', propertyCity: 'جدة', propertyPrice: '3,200,000 ر.س', propertyArea: '500 م²', propertyRooms: '7', propertyDescription: 'فيلا على البحر بإطلالة رائعة، حديقة خاصة ومسبح.', propertyType: 'فيلا', propertyLocationUrl: 'https://maps.google.com/?q=جدة+أبحر' },
  { id: 2002, clientName: 'منى الدوسري', clientPhone: '0564445566', clientType: 'مالك', type: 'إيجار', status: 'جديد', date: '2026-06-07', propertyTitle: 'شقة - الرياض حي النرجس', propertyDistrict: 'النرجس', propertyCity: 'الرياض', propertyPrice: '95,000 ر.س سنوياً', propertyArea: '220 م²', propertyRooms: '5', propertyDescription: 'شقة مؤثثة بالكامل، صالة كبيرة، مطبخ راكب، قريبة من المدارس والمولات.', propertyType: 'شقة', propertyLocationUrl: 'https://maps.google.com/?q=الرياض+حي+النرجس' },
  { id: 2003, clientName: 'عبدالرحمن السبيعي', clientPhone: '0507778899', clientType: 'وكيل', type: 'بيع', status: 'جديد', date: '2026-06-06', propertyTitle: 'أرض - الخبر العزيزية', propertyDistrict: 'العزيزية', propertyCity: 'الخبر', propertyPrice: '1,800,000 ر.س', propertyArea: '750 م²', propertyRooms: '0', propertyDescription: 'أرض تجارية على شارع رئيسي، مناسبة لمشروع استثماري.', propertyType: 'أرض' },
  { id: 2004, clientName: 'هند الغامدي', clientPhone: '0590001122', clientType: 'مالك', type: 'شراء', status: 'مقبول', date: '2026-06-05', propertyTitle: 'دوبلكس - مكة الشوقية', propertyDistrict: 'الشوقية', propertyCity: 'مكة', propertyPrice: '2,100,000 ر.س', propertyArea: '380 م²', propertyRooms: '6', propertyDescription: 'دوبلكس قريب من الحرم، تشطيب فاخر.', propertyType: 'شقة' },
  { id: 2005, clientName: 'سالم الحربي', clientPhone: '0553344556', clientType: 'وكيل', type: 'استثمار', status: 'مرفوض', date: '2026-06-04', propertyTitle: 'عمارة - الدمام البادية', propertyDistrict: 'البادية', propertyCity: 'الدمام', propertyPrice: '7,500,000 ر.س', propertyArea: '1,200 م²', propertyRooms: '24', propertyDescription: 'عمارة استثمارية مكونة من 12 شقة مؤجرة.', propertyType: 'عمارة' },
]

export const initialProperties: PropertyItem[] = [
  {
    id: 10,
    title: 'فيلا - الرياض حي الياسمين',
    district: 'الياسمين',
    city: 'الرياض',
    price: '2,850,000 ر.س',
    type: 'فيلا' as PropertyType,
    status: 'متاح',
    visible: true,
    area: '450 م²',
    rooms: '6',
    orientation: 'جنوبي',
    streetWidth: '20',
    finishing: 'سوبر لوكس',
    pool: 'خاص',
    parking: '2',
    description: 'فيلا درج صالة بتصميم عصري، مجلس كبير، صالة عائلية، حديقة.',
    ownerName: 'ماجد الشهراني',
    ownerPhone: '0559988776',
    ownerType: 'مالك',
    locationUrl: 'https://maps.google.com/?q=الرياض+الياسمين',
  },
  {
    id: 11,
    title: 'شقة - جدة الشاطئ',
    district: 'الشاطئ',
    city: 'جدة',
    price: '1,350,000 ر.س',
    type: 'شقة' as PropertyType,
    status: 'متاح',
    visible: true,
    area: '200 م²',
    rooms: '4',
    floor: 'الثالثة',
    finishing: 'لوكس',
    parking: '1',
    description: 'شقة مطلة على البحر، تشطيب فاخر، مصعد.',
    ownerName: 'نواف الغامدي',
    ownerPhone: '0501234567',
    ownerType: 'مالك',
    locationUrl: 'https://maps.google.com/?q=جدة+الشاطئ',
  },
  {
    id: 12,
    title: 'أرض - الخبر العقربية',
    district: 'العقربية',
    city: 'الخبر',
    price: '2,200,000 ر.س',
    type: 'أرض' as PropertyType,
    status: 'تم البيع',
    area: '600 م²',
    rooms: '0',
    description: 'أرض سكنية على شارع 30، صالحة لبناء فيلا.',
    ownerName: 'فهد العيسى',
    ownerPhone: '0538877665',
    ownerType: 'مالك',
    locationUrl: 'https://maps.google.com/?q=الخبر+العقربية',
  },
]

export const initialClients: ClientItem[] = [
  { id: 20, name: 'خالد الزهراني', phone: '0551112233', type: 'مشتري', notes: 'يبحث عن فيلا في جدة - آخر تواصل اليوم' },
  { id: 21, name: 'منى الدوسري', phone: '0564445566', type: 'مستأجر', notes: 'تريد شقة في الرياض - آخر تواصل أمس' },
  { id: 22, name: 'عبدالرحمن السبيعي', phone: '0507778899', type: 'بائع', notes: 'وكيل لبيع أرض في الخبر - مطلوب عميل' },
  { id: 23, name: 'هند الغامدي', phone: '0590001122', type: 'مشتري', notes: 'تبحث عن دوبلكس في مكة - جاهزة للشراء' },
  { id: 24, name: 'نواف الغامدي', phone: '0501234567', type: 'مالك', notes: 'مالك شقة في جدة - ودود ومتعاون' },
]

export const defaultOfficeSettings: OfficeSettings = {
  name: 'المرقاب الذهبي',
  phone: '0550001122',
  commercial: '',
  tax: '',
  falLicense: '',
  crNumber: '',
  whatsapp: '',
  address: 'الرياض، المملكة العربية السعودية',
  showPublicProperties: true,
}
