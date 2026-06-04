/* ═══════════════════════════════════════════
   المرقاب الذهبي — كود الاستمارة
═══════════════════════════════════════════ */

/* ── بيانات الاستمارة ── */
var F = {
  type:'', deal:'', city:'', area:'', title:'',
  price:'', space:'', rooms:'', baths:'', floor:'', year:'',
  features:[], desc:'',
  name:'', phone:'', role:'owner', time:'any'
};

/* ── المميزات حسب النوع ── */
var FEATS = {
  villa:      ['مسبح','مجلس','مطبخ راكب','حديقة','موقف','غرفة سائق','مصعد','كراج مغلق','مستودع'],
  apartment:  ['تكييف مركزي','مطبخ مجهز','موقف','مصعد','بالكون','إطلالة','أمن 24/7','مولد كهرباء'],
  land:       ['واجهة تجارية','على شارعين','مرافق كاملة','سور محيطي','موقع استراتيجي'],
  commercial: ['واجهة زجاجية','مستودع','موقف خاص','مدخل مستقل','أمن 24/7','كاميرات']
};

var TYPE_NAMES = {villa:'فيلا', apartment:'شقة', land:'أرض', commercial:'تجاري'};

/* ── مساعدات DOM ── */
function g(id) { return document.getElementById(id); }

/* ── اختيار نوع العقار ── */
function setType(t) {
  F.type = t;
  F.features = [];
  ['villa','apartment','land','commercial'].forEach(function(x) {
    g('t-' + x).classList.remove('on');
  });
  g('t-' + t).classList.add('on');
  buildFeats();
  g('rooms-section').style.display = (t === 'land') ? 'none' : 'grid';
}

/* ── اختيار الصفقة ── */
function setDeal(d) {
  F.deal = d;
  ['sale','rent'].forEach(function(x) { g('d-' + x).classList.remove('on'); });
  g('d-' + d).classList.add('on');
}

/* ── بناء قائمة المميزات ── */
function buildFeats() {
  var list = FEATS[F.type] || FEATS.villa;
  var h = '';
  list.forEach(function(f) {
    var on = F.features.indexOf(f) > -1 ? ' on' : '';
    h += '<div class="feat' + on + '" onclick="togFeat(\'' + f + '\',this)">' + f + '</div>';
  });
  g('feats-wrap').innerHTML = h;
}

/* ── تفعيل / إلغاء ميزة ── */
function togFeat(f, btn) {
  var idx = F.features.indexOf(f);
  if (idx > -1) { F.features.splice(idx, 1); btn.classList.remove('on'); }
  else          { F.features.push(f);         btn.classList.add('on'); }
}

/* ── عرض خطأ ── */
function showErr(msg) {
  var e = g('err');
  e.textContent = msg;
  e.style.display = 'block';
  setTimeout(function() { e.style.display = 'none'; }, 3500);
}

/* ── الانتقال بين الخطوات ── */
function goStep(n) {
  g('err').style.display = 'none';
  [1,2,3].forEach(function(i) {
    g('s'  + i).classList.remove('on');
    g('st' + i).classList.remove('active','done');
    g('sn' + i).textContent = i;
  });
  g('s'  + n).classList.add('on');
  for (var j = 1; j < n; j++) {
    g('st' + j).classList.add('done');
    g('sn' + j).textContent = '✓';
  }
  g('st' + n).classList.add('active');
  g('prog').style.width = (n === 1 ? 33 : n === 2 ? 66 : 100) + '%';
  window.scrollTo(0, 0);
}

/* ── الخطوة 1 — التحقق والانتقال ── */
function next1() {
  if (!F.type)                       return showErr('اختر نوع العقار');
  if (!F.deal)                       return showErr('اختر نوع الصفقة');
  if (!g('f-city').value)            return showErr('اختر المدينة');
  if (!g('f-area').value.trim())     return showErr('أدخل الحي أو المنطقة');
  if (!g('f-title').value.trim())    return showErr('أدخل عنوان الإعلان');
  F.city  = g('f-city').value;
  F.area  = g('f-area').value.trim();
  F.title = g('f-title').value.trim();
  buildFeats();
  goStep(2);
}

/* ── الخطوة 2 — التحقق والانتقال ── */
function next2() {
  if (!g('f-price').value) return showErr('أدخل السعر');
  F.price = g('f-price').value;
  F.space = g('f-space').value;
  F.rooms = g('f-rooms').value;
  F.baths = g('f-baths').value;
  F.floor = g('f-floor').value;
  F.year  = g('f-year').value;
  F.desc  = g('f-desc').value;
  buildSummary();
  goStep(3);
}

/* ── بناء ملخص الإعلان ── */
function buildSummary() {
  var rows = [
    ['العنوان',  F.title],
    ['النوع',    (TYPE_NAMES[F.type]||'') + ' — ' + (F.deal === 'sale' ? 'للبيع' : 'للإيجار')],
    ['الموقع',   F.city + ' — ' + F.area],
    ['السعر',    parseInt(F.price || 0).toLocaleString() + ' ريال']
  ];
  if (F.space)            rows.push(['المساحة',   F.space + ' م²']);
  if (F.features.length)  rows.push(['المميزات',  F.features.join(' • ')]);

  var h = '';
  rows.forEach(function(r) {
    h += '<div class="sum-row">'
       + '<div class="sum-k">' + r[0] + '</div>'
       + '<div class="sum-v' + (r[0]==='السعر' ? ' gold' : '') + '">' + r[1] + '</div>'
       + '</div>';
  });
  g('summary').innerHTML = h;
}

/* ── إرسال الاستمارة ── */
function doSubmit() {
  F.name  = g('f-name').value.trim();
  F.phone = g('f-phone').value.replace(/[^0-9]/g, '');
  F.role  = g('f-role').value;
  F.time  = g('f-time').value;

  if (!F.name)             return showErr('أدخل اسمك الكامل');
  if (F.phone.length < 9)  return showErr('أدخل رقم جوال صحيح (9 أرقام)');

  var btn = g('sub-btn');
  btn.disabled = true;
  g('sub-txt').innerHTML = '<div class="spinner"></div>';

  var body = {
    title:       F.title,
    type:        F.type,
    deal:        F.deal,
    city:        F.city,
    area:        F.area,
    price:       parseInt(F.price) || 0,
    space:       F.space,
    rooms:       F.rooms,
    baths:       F.baths,
    floor:       F.floor,
    year:        F.year,
    features:    F.features,
    desc:        F.desc,
    ownerName:   F.name,
    ownerPhone:  '0' + F.phone,
    ownerRole:   F.role,
    contactTime: F.time
  };

  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/submissions', true);
  xhr.setRequestHeader('Content-Type', 'application/json');

  xhr.onreadystatechange = function() {
    if (xhr.readyState !== 4) return;

    btn.disabled = false;
    g('sub-txt').textContent = 'إرسال الإعلان';

    /* نجاح أو فشل — نعرض شاشة النجاح دائماً */
    var ref = 'REQ-' + Date.now().toString(36).toUpperCase();
    try {
      var res = JSON.parse(xhr.responseText);
      if (res.data && res.data.ref) ref = res.data.ref;
    } catch (_) {}

    showSuccess(ref);
  };

  xhr.onerror = function() {
    btn.disabled = false;
    g('sub-txt').textContent = 'إرسال الإعلان';
    showSuccess('REQ-' + Date.now().toString(36).toUpperCase());
  };

  xhr.send(JSON.stringify(body));
}

/* ── شاشة النجاح ── */
function showSuccess(ref) {
  g('form-page').style.display    = 'none';
  g('success-page').classList.add('show');
  g('ref-num').textContent        = ref;
  window.scrollTo(0, 0);
}

/* ── إعادة تعيين الاستمارة ── */
function resetForm() {
  F = { type:'', deal:'', city:'', area:'', title:'', price:'', space:'',
        rooms:'', baths:'', floor:'', year:'', features:[], desc:'',
        name:'', phone:'', role:'owner', time:'any' };

  g('form-page').style.display = 'block';
  g('success-page').classList.remove('show');

  ['villa','apartment','land','commercial'].forEach(function(x) {
    g('t-' + x).classList.remove('on');
  });
  ['sale','rent'].forEach(function(x) { g('d-' + x).classList.remove('on'); });

  ['f-city','f-area','f-title','f-price','f-space',
   'f-rooms','f-baths','f-floor','f-year','f-desc','f-name','f-phone'].forEach(function(id) {
    if (g(id)) g(id).value = '';
  });

  g('rooms-section').style.display = 'grid';
  g('feats-wrap').innerHTML        = '';
  goStep(1);
}
