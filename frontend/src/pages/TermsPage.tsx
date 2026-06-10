import { Home } from 'lucide-react'

export function TermsPage() {
  return <div className="min-h-screen" style={{background:'#F5F0E8'}}>
    <div className="py-10 px-6 text-center" style={{background:'linear-gradient(135deg, #3D6B4F 0%, #2D523D 100%)',color:'white'}}>
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl" style={{background:'#C5A059'}}><Home size={24} style={{color:'#2C2418'}} /></div>
      <h1 className="text-2xl font-bold">الشروط والأحكام</h1>
      <p className="mt-1 text-sm" style={{color:'rgba(197,160,89,0.7)'}}>المرقاب الذهبي للعقارات</p>
    </div>

    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="glass p-6 sm:p-8 flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-bold mb-3" style={{color:'#2C2418'}}>أولاً: الالتزام بأنظمة الهيئة العامة للعقار (REGA)</h2>
          <p className="text-sm leading-relaxed" style={{color:'#5C4F3E'}}>
            يلتزم مكتب المرقاب الذهبي العقاري بجميع الأنظمة واللوائح الصادرة عن الهيئة العامة للعقار (REGA) في المملكة العربية السعودية. 
            نحن ملتزمون بتقديم خدمات عقارية تتوافق مع أعلى معايير الشفافية والنزاهة المهنية وفقاً للتشريعات العقارية السعودية.
          </p>
        </div>

        <div className="h-px" style={{background:'#E0D0B8'}} />

        <div>
          <h2 className="text-lg font-bold mb-3" style={{color:'#2C2418'}}>ثانياً: مسؤولية دقة البيانات العقارية</h2>
          <p className="text-sm leading-relaxed" style={{color:'#5C4F3E'}}>
            يتحمل المستخدم المسؤولية الكاملة عن صحة ودقة جميع البيانات المدخلة في نموذج إضافة الإعلان، بما في ذلك معلومات الملكية 
            والمساحة والسعر والموقع. يجب أن يكون المستخدم مالكاً للعقار أو مفوضاً من المالك، وأن تكون جميع مستندات الملكية 
            (صكوك، عقود، رخص) سارية المفعول. يحتفظ المكتب بالحق في طلب إثباتات إضافية للتحقق من الملكية.
          </p>
        </div>

        <div className="h-px" style={{background:'#E0D0B8'}} />

        <div>
          <h2 className="text-lg font-bold mb-3" style={{color:'#2C2418'}}>ثالثاً: إخلاء المسؤولية</h2>
          <p className="text-sm leading-relaxed" style={{color:'#5C4F3E'}}>
            لا يتحمل مكتب المرقاب الذهبي العقاري أي مسؤولية عن أي خسائر أو أضرار ناتجة عن:
          </p>
          <ul className="text-sm leading-relaxed mr-5 mt-2 space-y-1" style={{color:'#5C4F3E',listStyle:'inside'}}>
            <li>المعاملات التي تتم مباشرة بين الأطراف الثالثة دون وساطة المكتب.</li>
            <li>عدم دقة البيانات المدخلة من قبل المستخدم.</li>
            <li>الاحتيال أو التزوير في مستندات الملكية.</li>
            <li>أي نزاعات تنشأ بعد إتمام الصفقة بين البائع والمشتري.</li>
          </ul>
        </div>

        <div className="h-px" style={{background:'#E0D0B8'}} />

        <div>
          <h2 className="text-lg font-bold mb-3" style={{color:'#2C2418'}}>رابعاً: خصوصية البيانات</h2>
          <p className="text-sm leading-relaxed" style={{color:'#5C4F3E'}}>
            يتم جمع وتخزين البيانات الشخصية بغرض تسهيل الخدمات العقارية فقط. لن يتم مشاركة معلومات المستخدم مع أطراف ثالثة 
            دون موافقته الخطية، إلا في الحالات التي يتطلب فيها القانون ذلك.
          </p>
        </div>

        <div className="h-px" style={{background:'#E0D0B8'}} />

        <div>
          <h2 className="text-lg font-bold mb-3" style={{color:'#2C2418'}}>خامساً: التعديلات على الشروط</h2>
          <p className="text-sm leading-relaxed" style={{color:'#5C4F3E'}}>
            يحتفظ مكتب المرقاب الذهبي العقاري بالحق في تعديل هذه الشروط والأحكام في أي وقت. سيتم إشعار المستخدمين بأي تغييرات 
            جوهرية عبر البريد الإلكتروني أو من خلال الموقع.
          </p>
        </div>

        <div className="flex justify-center mt-4">
          <div className="flex gap-3 flex-wrap justify-center">
        <a href="/" className="btn btn-primary">العودة للرئيسية</a>
        <a href="/properties" className="btn btn-gold">عرض العقارات</a>
      </div>
        </div>
      </div>
    </div>
  </div>
}