const cities = ['الرياض', 'جدة', 'مكة', 'المدينة', 'الدمام', 'الخبر', 'الطائف', 'تبوك', 'أبها', 'بريدة', 'حائل', 'نجران', 'جازان', 'الأحساء', 'الخرج', 'القطيف', 'الظهران', 'ينبع', 'الجبيل', 'حفر الباطن']

const cityAliases: Record<string, string> = {
  'منطقة الرياض': 'الرياض', 'Riyadh': 'الرياض', 'Riyadh Province': 'الرياض',
  'محافظة جدة': 'جدة', 'Jeddah': 'جدة',
  'محافظة مكة المكرمة': 'مكة', 'منطقة مكة المكرمة': 'مكة', 'مكة المكرمة': 'مكة', 'Mecca': 'مكة', 'Makkah': 'مكة', 'Makkah Province': 'مكة',
  'محافظة المدينة المنورة': 'المدينة', 'منطقة المدينة المنورة': 'المدينة', 'المدينة المنورة': 'المدينة', 'Medina': 'المدينة', 'Madinah': 'المدينة',
  'محافظة الدمام': 'الدمام', 'Dammam': 'الدمام',
  'محافظة الخبر': 'الخبر', 'Khobar': 'الخبر', 'Al Khobar': 'الخبر',
  'محافظة الطائف': 'الطائف', 'Taif': 'الطائف', 'At Taif': 'الطائف',
  'منطقة تبوك': 'تبوك', 'محافظة تبوك': 'تبوك', 'Tabuk': 'تبوك',
  'محافظة أبها': 'أبها', 'Abha': 'أبها',
  'محافظة بريدة': 'بريدة', 'Buraydah': 'بريدة',
  'منطقة حائل': 'حائل', 'محافظة حائل': 'حائل', 'Hail': 'حائل',
  'منطقة نجران': 'نجران', 'محافظة نجران': 'نجران', 'Najran': 'نجران',
  'منطقة جازان': 'جازان', 'محافظة جازان': 'جازان', 'Jazan': 'جازان', 'Jizan': 'جازان',
  'محافظة الأحساء': 'الأحساء', 'Al Ahsa': 'الأحساء', 'Hofuf': 'الأحساء', 'الهفوف': 'الأحساء', 'Al Hofuf': 'الأحساء',
  'محافظة الخرج': 'الخرج', 'Al Kharj': 'الخرج',
  'محافظة القطيف': 'القطيف', 'Al Qatif': 'القطيف', 'Qatif': 'القطيف',
  'محافظة الظهران': 'الظهران', 'Dhahran': 'الظهران', 'Ad Dammam': 'الدمام',
  'محافظة ينبع': 'ينبع', 'Yanbu': 'ينبع', 'Yanbu al Bahr': 'ينبع',
  'محافظة الجبيل': 'الجبيل', 'Jubail': 'الجبيل', 'Al Jubail': 'الجبيل',
  'محافظة حفر الباطن': 'حفر الباطن', 'Hafar Al Batin': 'حفر الباطن', 'Hafr al Batin': 'حفر الباطن',
}

function matchCity(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (cityAliases[trimmed]) return cityAliases[trimmed]
  for (const c of cities) { if (trimmed.includes(c)) return c }
  for (const [alias, target] of Object.entries(cityAliases)) { if (trimmed.includes(alias)) return target }
  return trimmed
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    if (!lat || !lng) return Response.json({ error: 'lat and lng required' }, { status: 400 })

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`,
      { headers: { 'User-Agent': 'almarqab-aldhahabi/1.0' } }
    )
    if (!res.ok) return Response.json({ city: '', district: '' })
    const data = await res.json()
    if (!data.address) return Response.json({ city: '', district: '' })

    const a = data.address
    const rawCity = a.city || a.town || a.village || a.county || a.state || ''
    const city = matchCity(rawCity)
    let district = a.suburb || a.neighbourhood || a.neighborhood || a.quarter || a.hamlet || a.locality || a.road || ''
    if (district === rawCity || district === city) district = a.suburb || a.neighbourhood || a.road || ''

    return Response.json({ city, district })
  } catch {
    return Response.json({ city: '', district: '' })
  }
}
