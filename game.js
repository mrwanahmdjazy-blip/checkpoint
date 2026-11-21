'use strict';

/* ================= أدوات مساعدة ================= */
const $ = (s, r = document) => r.querySelector(s);
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const fmt = (n) => Math.round(n).toLocaleString('en-US');

function shadeHex(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = clamp(((n >> 16) & 255) + amt, 0, 255);
  const g = clamp(((n >> 8) & 255) + amt, 0, 255);
  const b = clamp((n & 255) + amt, 0, 255);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/* ================= البيانات ================= */

const FIELDS = {
  identity: { label: 'الهوية', hint: 'هناك شيء غير طبيعي في أوراق هوية السائق.',
    damning: ['الهوية مزورة والاسم غير موجود في السجل الوطني.', 'جواز السفر باسم شخص متوفى منذ سنوات.', 'الهوية تعود لشخص مطلوب للعدالة.'],
    minor: ['رخصة الهوية منتهية الصلاحية منذ أسبوع.', 'اسم الأب مكتوب بشكل مختلف عن السجل.'] },
  plate: { label: 'اللوحة', hint: 'رقم اللوحة يبدو مألوفاً بشكل مريب.',
    damning: ['اللوحة مسروقة من سيارة أخرى مسجلة.', 'رقم اللوحة على قائمة السيارات المطلوبة.', 'لوحة مزدوجة: الرقم الأمامي لا يطابق الخلفي.'],
    minor: ['اللوحة متسخة جداً وغير واضحة.', 'ملصق انتهت صلاحيته على الزجاج الأمامي.'] },
  trunk: { label: 'الصندوق', hint: 'مؤخرة السيارة منخفضة أكثر من المعتاد.',
    damning: ['أسلحة غير مرخصة داخل الصندوق.', 'شحنة نقود غير مصرح بها.', 'بضائع مهربة تملأ الصندوق بالكامل.'],
    minor: ['الصندوق مزدحم بأغراض شخصية.', 'رائحة عطر قوية جداً داخل الصندوق.'] },
  prints: { label: 'البصمات', hint: 'مقود السيارة يلمع بشكل غريب، كأنه نُظّف للتو.',
    damning: ['بصمات تعود لشخص مطلوب في قضايا سرقة.', 'بصمة مطابقة لسجل مطلوب أمنياً على الزجاج.', 'بصمات تعود لمطلوب في قضية تهريب أسلحة.'],
    minor: ['بصمات غير مسجلة في السجل.', 'آثار تنظيف حديث للمقود.'] },
  chassis: { label: 'الهيكل', hint: 'صوت السيارة ثقيل عند المرور من البوابة.',
    damning: ['مواد ممنوعة ملحومة داخل الهيكل.', 'تجويف سري في الشاسيه لا يظهر في الأوراق.', 'قطع مهربة مخبأة داخل الهيكل.'],
    minor: ['الهيكل مرمم بشكل غير قانوني.', 'عدد الشاسيه غير مطابق للأوراق.'] },
  docs: { label: 'الوثائق', hint: 'الملفات في درج السيارة مرتبة بشكل مريب.',
    damning: ['وثائق رسمية مزورة بختم مقلد.', 'تصاريح نقل بضائع منتهية ومزورة.', 'أوراق تثبت صلة بعصابة منظمة.'],
    minor: ['تأمين السيارة منتهي.', 'فاتورة قديمة لا تطابق الحمولة.'] },
  face: { label: 'الوجه', hint: 'السائق يتجنب النظر إليك تماماً.',
    damning: ['ملامح السائق مطابقة لمطلوب أمني.', 'السائق متنكر بلحية مستعارة.', 'وشم على الرقبة مطابق لسجل عصابة.'],
    minor: ['السائق متوتر ويتصبب عرقاً.', 'نظراته تتبع الحاجز باستمرار.'] },
  smell: { label: 'الرائحة', hint: 'الكلب البوليسي يشدّ نحوك.',
    damning: ['الكلب يشم مواد مخدرة داخل السيارة.', 'آثار متفجرات على المقاعد.', 'رائحة وقود مخصص لتهريب البشر.'],
    minor: ['رائحة طعام قديم.', 'رائحة دخان في المقصورة.'] },
  heat: { label: 'الحرارة', hint: 'بصمة حرارية غريبة في الجزء الخلفي.',
    damning: ['شخص مختبئ في صندوق السيارة.', 'حرارة أجسام متعددة داخل سيارة صغيرة.', 'تسرب حراري من مخبأ أسفل المقاعد.'],
    minor: ['حرارة المحرك مرتفعة جداً.', 'التكييف معطل تماماً.'] },
  phone: { label: 'الهاتف', hint: 'الهاتف يهتز باستمرار.',
    damning: ['رسائل تنسيق لعملية تهريب.', 'صور لموقع التفتيش من الداخل.', 'اتصالات متكررة بأسماء مطلوبة أمنياً.'],
    minor: ['تطبيق غير قانوني لبيع أشياء مسروقة.', 'مكالمات كثيرة من أرقام مجهولة.'] },
  cash: { label: 'الأموال', hint: 'محفظة السائق سميكة بشكل غير طبيعي.',
    damning: ['حزمة نقود مزيفة عالية الجودة.', 'نقود مغسولة من عملية سرقة.', 'أموال مخبأة داخل وسادة المقعد.'],
    minor: ['نقود من فئات كبيرة بلا تفسير.', 'إيصالات صرافة كثيرة.'] },
  weight: { label: 'الوزن', hint: 'السيارة أثقل من وزنها المسجل بكثير.',
    damning: ['وزن زائد 200 كجم مخبأ في الأبواب.', 'حمولة بشرية مخفية.', 'شحنة معادن غير مصرحة.'],
    minor: ['وزن زائد قليلاً بسبب العفش.', 'توزيع الوزن غير متوازن.'] },
  voice: { label: 'الصوت', hint: 'نبرة صوته تتغير عند كل سؤال.',
    damning: ['تسجيل صوتي يفضح خطة تهريب.', 'صوته مطابق لتسجيل مطلوب أمني.', 'يقول اسماً مستعاراً ثم يصحح نفسه.'],
    minor: ['صوت مرتجف.', 'يتهرب من الإجابة المباشرة.'] },
  route: { label: 'مسار الرحلة', hint: 'كاميرات الطرق تلاحق هذه السيارة.',
    damning: ['السيارة مرت بمنطقة عسكرية ممنوعة.', 'مسارها يتطابق مع سيارة هروب.', 'توقفت عند مستودع مشبوه لساعات.'],
    minor: ['مخالفات سرعة متكررة.', 'مسار غير منطقي للرحلة.'] },
  behavior: { label: 'السلوك', hint: 'جهاز كشف الكذب قد يقول الكثير.',
    damning: ['الجهاز يرصد كذباً صريحاً في كل الأسئلة.', 'الجهاز يرصد كذباً عند سؤاله عن الشحنة.', 'ارتفاع حاد في المؤشر عند ذكر اسم مدينة.'],
    minor: ['اضطراب بسيط عند سؤال عادي.', 'ارتفاع طفيف في مؤشر التوتر.'] },
  undercarriage: { label: 'أسفل السيارة', hint: 'أسفل السيارة نظيف بشكل غير طبيعي.',
    damning: ['صندوق معدني مخفي أسفل السيارة.', 'أنابيب تهريب ملحومة تحت المقعد.', 'مواد ممنوعة ملتصقة بالشاسيه.'],
    minor: ['تسريب زيت بسيط.', 'أسلاك مكشوفة غير مرخصة.'] },
  cargo: { label: 'الحمولة', hint: 'الحمولة أكبر من تصريح الشاحنة.',
    damning: ['شحنة أسلحة داخل صناديق معلبة.', 'بضائع مقلدة بكميات كبيرة.', 'حمولة بشرية داخل صندوق مبرد.'],
    minor: ['حمولة غير مرتبة.', 'تصريح الحمولة ناقص.'] },
  bugs: { label: 'التجسس', hint: 'إشارات إلكترونية غريبة في المقصورة.',
    damning: ['جهاز تنصت متصل بترددات مشبوهة.', 'كاميرا مراقبة مخفية داخل المرآة.', 'معدات تشويش على أجهزة التفتيش.'],
    minor: ['جهاز لاسلكي غير مرخص.', 'هوائي إضافي مجهول.'] },
  dna: { label: 'الحمض النووي', hint: 'آثار غريبة في المقعد الخلفي.',
    damning: ['حمض نووي مطابق لمطلوب في قضية قتل.', 'آثار دم حديثة داخل الصندوق.', 'DNA مطابق لسجل عصابة مسلحة.'],
    minor: ['آثار شعر غير مسجلة.', 'بقايا جلدية غير معروفة.'] },
  drugs: { label: 'المخدرات', hint: 'رائحة كيميائية خفيفة حول السيارة.',
    damning: ['أكياس مواد مخدرة داخل الإطار الاحتياطي.', 'حبوب مخدرة داخل علبة أدوية.', 'بلورات مخدرة مخفية في لوحة القيادة.'],
    minor: ['بقايا رماد مجهول.', 'أدوية بدون وصفة طبية.'] },
  explosives: { label: 'المتفجرات', hint: 'آثار نيترات في الهواء.',
    damning: ['آثار متفجرات على مقبض الباب.', 'حزام ناسف مفكك داخل الشنطة.', 'مواد مفرقعة بكمية غير مرخصة.'],
    minor: ['ألعاب نارية صغيرة.', 'رائحة بارود قديمة.'] },
  network: { label: 'الشبكة', hint: 'جهاز لاسلكي يبث من داخل السيارة.',
    damning: ['اتصال مشفر بمكان مطلوب أمنياً.', 'جهاز اتصال مرتبط بعصابة تهريب.', 'رسائل مشفرة تحتوي أرقام لوحات.'],
    minor: ['شبكة واي فاي مفتوحة.', 'بلوتوث مجهول.'] },
  radiation: { label: 'الإشعاع', hint: 'عداد جيجر يصدر طقطقة خفيفة.',
    damning: ['مواد مشعة غير مرخصة داخل حاوية.', 'نظائر طبية مهربة.', 'مصدر إشعاعي مخفي في الصندوق.'],
    minor: ['إشعاع خلفية مرتفع قليلاً.', 'ملصق مواد خطرة قديم.'] },
  tires: { label: 'الإطارات', hint: 'الإطارات تبدو أحدث من السيارة نفسها.',
    damning: ['أكياس مخدرة مخبأة داخل الإطار.', 'إطارات مسروقة مسجلة في قضية.', 'سلاح مخفي داخل الإطار الاحتياطي.'],
    minor: ['إطارات غير مطابقة للمواصفات.', 'ضغط هواء منخفض.'] },
};

const FIELD_KEYS = Object.keys(FIELDS);

const DEVICES = [
  { id: 'id', name: 'ماسح الهوية', icon: '🆔', field: 'identity', time: 12, price: 0, desc: 'يقرأ شريحة الهوية ويقارنها بالسجل الوطني.' },
  { id: 'plate', name: 'ماسح اللوحات', icon: '🔎', field: 'plate', time: 10, price: 0, desc: 'يقارن اللوحة بقوائم السيارات المسروقة.' },
  { id: 'xray', name: 'أشعة إكس', icon: '🩻', field: 'trunk', time: 20, price: 0, desc: 'يصوّر محتويات الصندوق دون فتحه.' },
  { id: 'finger', name: 'بصمة الأصابع', icon: '🖐️', field: 'prints', time: 15, price: 0, desc: 'يرفع البصمات ويطابقها مع السجل.' },
  { id: 'metal', name: 'كاشف المعادن', icon: '🧲', field: 'chassis', time: 14, price: 450, desc: 'يحدد المعادن المخبأة في الهيكل.' },
  { id: 'doc', name: 'ماسح الوثائق', icon: '📄', field: 'docs', time: 12, price: 500, desc: 'يكشف الأختام والوثائق المزورة.' },
  { id: 'face', name: 'ماسح الوجه', icon: '🧿', field: 'face', time: 14, price: 600, desc: 'يطابق ملامح السائق مع قوائم المطلوبين.' },
  { id: 'k9', name: 'الكلب البوليسي', icon: '🐕', field: 'smell', time: 22, price: 700, desc: 'يشم المخدرات والمتفجرات عن بعد.' },
  { id: 'thermal', name: 'كاميرا حرارية', icon: '🌡️', field: 'heat', time: 18, price: 800, desc: 'تكشف الأجسام الحية المختبئة.' },
  { id: 'phone', name: 'ماسح الهاتف', icon: '📱', field: 'phone', time: 16, price: 900, desc: 'يفحص الرسائل والمكالمات الأخيرة.' },
  { id: 'cash', name: 'ماسح العملات', icon: '💵', field: 'cash', time: 12, price: 950, desc: 'يكشف النقود المزيفة والمغسولة.' },
  { id: 'weight', name: 'ميزان الحمولة', icon: '⚖️', field: 'weight', time: 18, price: 1000, desc: 'يقارن الوزن الفعلي بالوزن المسجل.' },
  { id: 'voice', name: 'محلل الصوت', icon: '🎙️', field: 'voice', time: 15, price: 1100, desc: 'يحلل نبرة الصوت ويطابق التسجيلات.' },
  { id: 'tire', name: 'ماسح الإطارات', icon: '🛞', field: 'tires', time: 13, price: 1200, desc: 'يفحص داخل الإطارات بحثاً عن مخابئ.' },
  { id: 'satellite', name: 'كاميرا الأقمار', icon: '🛰️', field: 'route', time: 16, price: 1200, desc: 'تسترجع مسار السيارة خلال 24 ساعة.' },
  { id: 'poly', name: 'كشف الكذب', icon: '📈', field: 'behavior', time: 25, price: 1400, desc: 'يقيس التوتر أثناء الاستجواب.' },
  { id: 'undercar', name: 'رادار أسفل السيارة', icon: '📡', field: 'undercarriage', time: 22, price: 1500, desc: 'يمسح أسفل المركبة بالكامل.' },
  { id: 'cargo', name: 'ماسح الحمولة', icon: '📦', field: 'cargo', time: 28, price: 1700, desc: 'يحلل الحمولة ويطابقها مع التصريح.' },
  { id: 'bug', name: 'كاشف التجسس', icon: '🎧', field: 'bugs', time: 20, price: 1800, desc: 'يرصد أجهزة التنصت والتشويش.' },
  { id: 'dna', name: 'الحمض النووي', icon: '🧬', field: 'dna', time: 30, price: 2000, desc: 'مطابقة DNA مع قاعدة بيانات الجرائم.' },
  { id: 'drugs', name: 'كاشف المخدرات', icon: '🧪', field: 'drugs', time: 24, price: 2200, desc: 'يحلل الآثار الكيميائية للمواد المخدرة.' },
  { id: 'explosive', name: 'كاشف المتفجرات', icon: '💥', field: 'explosives', time: 26, price: 2400, desc: 'يرصد أدنى آثار للمواد المتفجرة.' },
  { id: 'network', name: 'ماسح الشبكة', icon: '🛜', field: 'network', time: 17, price: 2500, desc: 'يحلل الاتصالات المشفرة القريبة.' },
  { id: 'geiger', name: 'عداد جيجر', icon: '☢️', field: 'radiation', time: 20, price: 2600, desc: 'يكشف المواد المشعة المهربة.' },
];
const DEVICE_MAP = {};
DEVICES.forEach((d) => { DEVICE_MAP[d.id] = d; });
const START_DEVICES = ['id', 'plate', 'xray', 'finger'];

const BUNDLES = [
  { id: 'b1', name: 'بكت المبتدئ', devices: ['metal', 'doc', 'face'], price: 1100, note: 'ثلاثة أجهزة أساسية بسعر مخفّض.' },
  { id: 'b2', name: 'بكت المحقق', devices: ['phone', 'cash', 'poly'], price: 2400, note: 'للتحقيق في الأموال والاتصالات والسلوك.' },
  { id: 'b3', name: 'بكت مكافحة التهريب', devices: ['cargo', 'drugs', 'k9'], price: 3600, note: 'حمولات، مخدرات وكلب بوليسي.' },
  { id: 'b4', name: 'بكت مكافحة الإرهاب', devices: ['explosive', 'geiger', 'undercar'], price: 4200, note: 'متفجرات، إشعاع وأسفل المركبة.' },
  { id: 'b5', name: 'بكت الشبح', devices: ['bug', 'network', 'satellite', 'thermal'], price: 4600, note: 'تجسس، شبكة، أقمار وكاميرا حرارية.' },
  { id: 'b6', name: 'بكت النخبة', devices: ['dna', 'voice', 'weight', 'tire'], price: 4200, note: 'أدق أربعة أجهزة في النقطة.' },
];

const SKINS = [
  { id: 'classic', name: 'كلاسيك', price: 0, colors: ['#3ea6ff', '#7ee0ff', '#0d1727'], desc: 'الأزرق الرسمي للنقطة.' },
  { id: 'neon', name: 'نيون', price: 900, colors: ['#ff4fd8', '#8b5cff', '#1a0f28'], desc: 'أضواء نيون وردية بنفسجية.' },
  { id: 'military', name: 'عسكري', price: 1400, colors: ['#8ad14a', '#d8e07a', '#16200f'], desc: 'أخضر ميداني هادئ.' },
  { id: 'snow', name: 'ثلجي', price: 1600, colors: ['#8fd8ff', '#dff6ff', '#0f1a24'], desc: 'أزرق جليدي بارد.' },
  { id: 'gold', name: 'ذهبي', price: 2000, colors: ['#f5c451', '#ffe9a8', '#241a06'], desc: 'فخامة ذهبية للضباط الكبار.' },
  { id: 'cyber', name: 'سايبر', price: 2600, colors: ['#b06bff', '#4df3ff', '#150b28'], desc: 'بنفسجي مستقبلي مع لمسة سماوية.' },
];

const RANKS = [
  { xp: 0, name: 'شرطي متدرب' },
  { xp: 260, name: 'عريف' },
  { xp: 620, name: 'رقيب' },
  { xp: 1200, name: 'ملازم' },
  { xp: 2000, name: 'نقيب' },
  { xp: 3200, name: 'رائد' },
  { xp: 5000, name: 'عقيد' },
];

const MODELS = [
  { name: 'تويوتا كورولا', color: '#dfe6ee', type: 'sedan' },
  { name: 'هيونداي إلنترا', color: '#9fb3c8', type: 'sedan' },
  { name: 'كيا سبورتاج', color: '#3f4a5a', type: 'suv' },
  { name: 'نيسان صني', color: '#e8c46a', type: 'sedan' },
  { name: 'تويوتا هايلكس', color: '#7a4b3a', type: 'truck' },
  { name: 'هوندا سيفيك', color: '#b53a3a', type: 'sedan' },
  { name: 'ميتسوبيشي باجيرو', color: '#2f5d50', type: 'suv' },
  { name: 'فورد رينجر', color: '#2b3f66', type: 'truck' },
  { name: 'شفروليه تاهو', color: '#1f2328', type: 'suv' },
  { name: 'لكزس LX', color: '#d8dde3', type: 'suv' },
];

const FIRST = ['أحمد', 'سامي', 'ليلى', 'حسين', 'مروان', 'نور', 'كرار', 'زينب', 'علي', 'هدى', 'يوسف', 'رنا', 'باسل', 'سيف', 'مريم', 'عادل', 'ليث', 'شهد', 'غيث', 'رهف'];
const LAST = ['الجابري', 'العزاوي', 'الشمري', 'الزيدي', 'الجبوري', 'الحسيني', 'العبيدي', 'الكرعاوي', 'التميمي', 'السعدي', 'الموسوي', 'الخفاجي', 'الدليمي', 'الربيعي'];

const NOTES = [
  'يبتسم كثيراً ويتحدث بسرعة.',
  'يضع يده على المقود دون توقف.',
  'يقول إنه متأخر عن العمل.',
  'يطلب منك الإسراع قليلاً.',
  'يشرب القهوة بهدوء تام.',
  'ينظر إلى هاتفه كل ثانية.',
  'يرتدي ملابس أنيقة جداً لسيارة قديمة.',
  'يقول إنه يعرف ضابطاً في النقطة.',
  'يسأل عن طول إجراءات التفتيش.',
  'يتمتم بكلمات غير مفهومة.',
];

/* ================= الحالة ================= */
const SAVE_KEY = 'checkpoint_inspector_v3d';
const MUTE_KEY = 'checkpoint_muted';
let S = null;
let advanceTimer = null;
let bannerTimer = null;
let sceneCarId = null;
let currentModal = null;
let shopTab = 'devices';
let wheelTimer = null;
let hasProgress = false;

function newGame() {
  S = {
    day: 1, money: 400, xp: 0,
    started: false,
    devices: START_DEVICES.slice(),
    skins: ['classic'], skin: 'classic',
    wheelDay: 0,
    stats: { arrests: 0, wrong: 0, bribes: 0, scans: 0, shifts: 0 },
    dayState: null,
  };
  sceneCarId = null;
}

/* ================= بورتريه السائق ================= */
function buildPortrait() {
  return {
    skin: pick(['#f0c9a8', '#e6b58c', '#c98f63', '#a8724c', '#8a5a3c']),
    hair: pick(['#221a14', '#3a2a1c', '#5a4433', '#101010', '#6b5540', '#7d7d7d']),
    bg: pick(['#16273d', '#1d2c46', '#232338', '#173329', '#331e2b']),
    shirt: pick(['#2f4a6d', '#34343e', '#443628', '#2a5446', '#4f2c3d']),
    style: pick(['short', 'short', 'cap', 'bald', 'long', 'beard', 'glasses']),
    mood: pick(['neutral', 'smile', 'frown', 'tense']),
    /* تفاصيل تظهر على مجسّم السائق داخل السيارة وأمام الكشك */
    build: pick(['normal', 'normal', 'slim', 'heavy']),
    height: pick([0.95, 0.98, 1, 1.02, 1.05]),
    mustache: Math.random() < 0.22 ? 1 : 0,
    eye: pick(['#3a2418', '#241812', '#4a5a34', '#26374f']),
  };
}

function portraitSVG(p, susp) {
  const uid = 'pp' + Math.random().toString(36).slice(2, 8);
  const skinLight = shadeHex(p.skin, 22);
  const skinDark = shadeHex(p.skin, -28);
  const mouth = p.mood === 'smile' ? 'M41 62 q9 7 18 0' : p.mood === 'frown' ? 'M41 64 q9 -6 18 0' : 'M41 63 q9 3 18 0';
  const browY = p.mood === 'frown' ? 40 : p.mood === 'tense' ? 39 : 40;
  const browTilt = p.mood === 'frown' ? 2.5 : p.mood === 'tense' ? 1.2 : 0;
  const sweat = susp >= 45 ? `<path d="M73 53 q3.4 6.4 0 8.6 q-3.4 -2.2 0 -8.6 z" fill="#9de0ff" opacity=".92"/>` : '';

  let hair = '';
  if (p.style === 'short' || p.style === 'beard' || p.style === 'glasses') {
    hair = `<path d="M28 44 a22 22 0 0 1 44 0 q-6 -16 -22 -16 t-22 16 z" fill="${p.hair}"/>
            <path d="M31 41 q10 -12 22 -12 q-9 4 -14 12 z" fill="${shadeHex(p.hair, 28)}" opacity=".55"/>`;
  } else if (p.style === 'long') {
    hair = `<path d="M28 44 a22 22 0 0 1 44 0 q-6 -16 -22 -16 t-22 16 z" fill="${p.hair}"/>
            <path d="M28 44 q-4 15 3 24 l7 -5 q-5 -11 -3 -19 z" fill="${p.hair}"/>
            <path d="M72 44 q4 15 -3 24 l-7 -5 q5 -11 3 -19 z" fill="${p.hair}"/>`;
  } else if (p.style === 'cap') {
    hair = `<path d="M28 43 a22 22 0 0 1 44 0 z" fill="#20395c"/>
            <path d="M28 43 q22 -5 44 0 l7 4 q-29 5 -58 0 z" fill="#162c47"/>
            <circle cx="50" cy="24" r="2.4" fill="#f0c451"/>`;
  } else if (p.style === 'bald') {
    hair = `<ellipse cx="40" cy="33" rx="7" ry="4" fill="#ffffff" opacity=".18"/>`;
  }
  if (p.style === 'beard') {
    hair += `<path d="M32 54 q18 20 36 0 q-1 22 -18 22 t-18 -22 z" fill="${p.hair}" opacity=".9"/>`;
  }
  const glasses = p.style === 'glasses'
    ? `<g fill="none" stroke="#0d131a" stroke-width="2.4"><circle cx="41" cy="46" r="8"/><circle cx="59" cy="46" r="8"/><path d="M49 46 h2"/></g>`
    : '';

  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="${uid}bg" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0" stop-color="${p.bg}"/><stop offset="1" stop-color="#050a12"/>
      </linearGradient>
      <linearGradient id="${uid}sk" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${skinLight}"/><stop offset="1" stop-color="${p.skin}"/>
      </linearGradient>
      <linearGradient id="${uid}sh" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${shadeHex(p.shirt, 18)}"/><stop offset="1" stop-color="${shadeHex(p.shirt, -20)}"/>
      </linearGradient>
    </defs>
    <rect width="100" height="100" fill="url(#${uid}bg)"/>
    <circle cx="50" cy="44" r="36" fill="${skinLight}" opacity=".06"/>
    <path d="M12 100 q7 -24 38 -24 q31 0 38 24 z" fill="url(#${uid}sh)"/>
    <path d="M42 77 q8 7 16 0 l5 9 q-13 8 -26 0 z" fill="#e9f1ff" opacity=".12"/>
    <rect x="44" y="66" width="12" height="15" rx="5" fill="${skinDark}"/>
    <ellipse cx="50" cy="47" rx="21" ry="22" fill="url(#${uid}sk)"/>
    <ellipse cx="29" cy="48" rx="3.4" ry="5" fill="${skinDark}"/>
    <ellipse cx="71" cy="48" rx="3.4" ry="5" fill="${skinDark}"/>
    ${hair}
    <path d="M34 ${browY} l9 ${browTilt}" stroke="${shadeHex(p.hair, -10)}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M66 ${browY} l-9 ${browTilt}" stroke="${shadeHex(p.hair, -10)}" stroke-width="2.4" stroke-linecap="round"/>
    <ellipse cx="41" cy="46" rx="5.4" ry="4.4" fill="#f7fbff"/>
    <ellipse cx="59" cy="46" rx="5.4" ry="4.4" fill="#f7fbff"/>
    <circle cx="41.6" cy="46.4" r="2.5" fill="#3a2a1e"/>
    <circle cx="58.4" cy="46.4" r="2.5" fill="#3a2a1e"/>
    <circle cx="40.6" cy="45.4" r="1" fill="#ffffff"/>
    <circle cx="57.4" cy="45.4" r="1" fill="#ffffff"/>
    <path d="M50 48 q2.4 5 -0.4 7.4" stroke="${skinDark}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="${mouth}" stroke="#6d3b32" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <ellipse cx="50" cy="70" rx="20" ry="5" fill="#000" opacity=".12"/>
    ${glasses}${sweat}
  </svg>`;
}

/* ================= بناء السيارة والسائق ================= */
/* الحقول التي يمكن كشفها دائماً بأجهزة البداية أو بالفحص اليدوي */
const SOLVABLE_FIELDS = ['identity', 'plate', 'trunk', 'prints', 'chassis'];

function buildCar(guilty) {
  const model = pick(MODELS);
  const name = pick(FIRST) + ' ' + pick(LAST);
  const plate = String(rint(10000, 99999));
  const portrait = buildPortrait();
  const signals = [];

  if (guilty) {
    /* دليل إدانة مضمون داخل حقول يمكنك فحصها بالفعل */
    const f = pick(SOLVABLE_FIELDS);
    signals.push({ field: f, level: 'damning', text: pick(FIELDS[f].damning) });
    if (Math.random() < 0.4) {
      const f2 = pick(SOLVABLE_FIELDS.filter((x) => x !== f));
      signals.push({ field: f2, level: 'damning', text: pick(FIELDS[f2].damning) });
    }
  } else {
    const r = Math.random();
    const n = r < 0.42 ? 0 : r < 0.86 ? 1 : 2;
    const pool = shuffle(SOLVABLE_FIELDS);
    for (let i = 0; i < n; i++) {
      signals.push({ field: pool[i], level: 'minor', text: pick(FIELDS[pool[i]].minor) });
    }
  }

  /* أوراق السائق — أحياناً تكون مزيفة */
  let lie = null;
  if (guilty) {
    const r = Math.random();
    if (r < 0.32) lie = 'plate';
    else if (r < 0.58) lie = 'model';
    else if (r < 0.82) lie = 'photo';
  }
  let papersPlate = plate;
  let papersModel = model.name;
  let papersPortrait = Object.assign({}, portrait);
  if (lie === 'plate') {
    do { papersPlate = String(rint(10000, 99999)); } while (papersPlate === plate);
  } else if (lie === 'model') {
    let m2 = pick(MODELS);
    while (m2.name === model.name) m2 = pick(MODELS);
    papersModel = m2.name;
  } else if (lie === 'photo') {
    papersPortrait = buildPortrait();
    papersPortrait.style = portrait.style === 'bald' ? 'long' : 'bald';
    papersPortrait.skin = shadeHex(portrait.skin, -45);
    papersPortrait.hair = '#0e0e0e';
  }

  const hintField = (signals.length && Math.random() < 0.8) ? pick(signals).field : pick(SOLVABLE_FIELDS);
  const hintDocs = lie && Math.random() < 0.45;

  return {
    id: Math.random().toString(36).slice(2),
    name, model, plate, guilty,
    signals, revealed: [], scanned: {},
    hint: hintDocs ? 'أوراقه مرتبة بشكل مريب، كأنها جُهزت على عجل.' : FIELDS[hintField].hint,
    portrait,
    papers: {
      name,
      plate: papersPlate,
      model: papersModel,
      portrait: papersPortrait,
      lie,
      expired: !guilty && Math.random() < 0.2,
    },
    papersLie: !!lie,
    papersChecked: false,
    note: pick(NOTES),
    bribeOffered: false,
    bribeRefused: false,
    resolved: false,
  };
}

/* نقاط اختلاف الأوراق مع السيارة الحقيقية */
function paperMismatches(car) {
  const p = car.papers;
  const out = [];
  if (!p) return out;
  if (p.plate !== car.plate) {
    out.push({ field: 'plate', level: 'damning', text: 'اللوحة في الأوراق ' + p.plate + ' لكن لوحة السيارة ' + car.plate + '.' });
  }
  if (p.model !== car.model.name) {
    out.push({ field: 'docs', level: 'damning', text: 'الأوراق تقول ' + p.model + ' لكن السيارة فعلاً ' + car.model.name + '.' });
  }
  if (p.lie === 'photo') {
    out.push({ field: 'face', level: 'damning', text: 'صورة الهوية لا تشبه السائق إطلاقاً.' });
  }
  if (p.expired) {
    out.push({ field: 'docs', level: 'minor', text: 'تأمين السيارة منتهي الصلاحية.' });
  }
  return out;
}

function buildMissions(day, nCrim) {
  const defs = [
    { type: 'arrests', need: clamp(2 + Math.floor(day / 2), 1, Math.max(1, nCrim)), reward: 240 + day * 60, label: (n) => 'اعتقل ' + n + ' مجرمين' },
    { type: 'scans', need: 10 + day * 2, reward: 200 + day * 50, label: (n) => 'استخدم أجهزة التفتيش ' + n + ' مرة' },
    { type: 'noWrong', need: 1, reward: 320 + day * 80, label: () => 'أنهِ الوردية دون اعتقال خاطئ' },
    { type: 'noBribe', need: 1, reward: 280 + day * 60, label: () => 'ارفض كل الرشاوى اليوم' },
  ];
  return shuffle(defs).slice(0, 3).map((d) => ({
    type: d.type, need: d.need, reward: d.reward, label: d.label(d.need), progress: 0,
  }));
}

/* ================= بدء وردية ================= */
function startShift() {
  const day = S.day;
  const carCount = 4 + day;
  const minutes = 300 + day * 40;
  const chance = clamp(0.22 + day * 0.015, 0.22, 0.40);
  const nCrim = clamp(Math.round(carCount * chance), 1, Math.max(1, carCount - 2));

  const cars = [];
  for (let i = 0; i < carCount; i++) cars.push(buildCar(false));
  const order = shuffle(cars.map((_, i) => i));
  for (let i = 0; i < nCrim; i++) cars[order[i]] = buildCar(true);

  S.dayState = {
    cars, idx: 0,
    minutesLeft: minutes, totalMinutes: minutes,
    arrests: 0, wrong: 0, scans: 0, bribes: 0,
    missions: buildMissions(day, nCrim),
    flags: { noWrong: true, noBribe: true },
    over: false, finished: false, summary: null,
  };
  sceneCarId = null;
  closeModal();
  render();
}

/* ================= الإجراءات ================= */
function carSuspicion(car) {
  let s = 0;
  car.revealed.forEach((r) => { s += r.level === 'damning' ? 55 : 12; });
  return clamp(s, 0, 100);
}

function addClue(car, sig, source, skipAfter) {
  if (!sig) return;
  car.revealed.push({ field: sig.field, level: sig.level, text: sig.text, device: source || 'تفتيش يدوي' });
  if (sig.level === 'damning' && !skipAfter) afterDamning(car);
}

function afterDamning(car) {
  const ds = S.dayState;
  if (!ds || ds.over || car.resolved) return;
  if (!car.bribeOffered && Math.random() < 0.45) {
    setTimeout(() => offerBribe(), 800);
  } else if (Math.random() < 0.42) {
    setTimeout(() => fleeSuspect(car), 1000);
  }
}

function fleeSuspect(car) {
  const ds = S.dayState;
  if (!ds || ds.over || !car.guilty || car.resolved) return;
  closeModal();
  Scene3D.startFlee();
  showBanner('fail', '🏃 السائق يهرب!', 'أخرجه المسدس وأوقفه قبل البوابة');
  closeInspect();
}

function bumpMission(type, amount = 1) {
  const ds = S.dayState;
  if (!ds) return;
  ds.missions.forEach((m) => {
    if (m.type === type) m.progress = Math.min(m.need, m.progress + amount);
  });
}

function scan(deviceId) {
  const ds = S.dayState;
  if (!ds || ds.over) return;
  const car = ds.cars[ds.idx];
  const dev = DEVICE_MAP[deviceId];
  if (!car || car.resolved || !dev || car.scanned[deviceId] || S.devices.indexOf(deviceId) < 0) return;
  if (ds.minutesLeft < dev.time) { toast('⏳ الوقت لا يكفي لهذا الجهاز'); return; }

  ds.minutesLeft -= dev.time;
  car.scanned[deviceId] = true;
  ds.scans++;
  S.stats.scans++;
  bumpMission('scans');
  Sfx.scan();
  Scene3D.pulse();

  const sig = car.signals.find((s) => s.field === dev.field);
  if (sig) {
    car.revealed.push({ field: sig.field, level: sig.level, text: sig.text, device: dev.name });
    if (sig.level === 'damning') {
      showBanner('fail', '🚨 دليل إدانة!', 'هذا الشخص ليس بريئاً');
      Sfx.clue();
      Scene3D.flashSiren(0.9);
      afterDamning(car);
    } else {
      showBanner('warn', '⚠️ ملاحظة مشبوهة', 'لكنها ليست دليلاً كافياً');
      Sfx.tone(700, 0.16, 'triangle', 0.06, 520);
    }
  } else {
    showBanner('ok', '✔️ لا شيء مثير', 'فحصت ' + FIELDS[dev.field].label + ' ولم تجد شيئاً');
    Sfx.clean();
  }

  if (Math.random() < 0.07) findLoot();
  if (ds.minutesLeft < 0) ds.minutesLeft = 0;
  render();
}

function findLoot() {
  const locked = DEVICES.filter((d) => S.devices.indexOf(d.id) < 0);
  if (locked.length && Math.random() < 0.62) {
    const d = pick(locked);
    S.devices.push(d.id);
    toast('🎁 وجدت جهازاً جديداً في السيارة: ' + d.name);
    Sfx.cash();
  } else {
    const amt = rint(150, 420);
    S.money += amt;
    toast('💵 وجدت ' + fmt(amt) + ' دولار مخبأة تحت المقعد');
    Sfx.cash();
  }
}

function arrest() {
  const ds = S.dayState;
  if (!ds || ds.over) return;
  const car = ds.cars[ds.idx];
  if (!car || car.resolved) return;
  closeInspect();
  closeModal();
  car.resolved = true;
  ds.minutesLeft = Math.max(0, ds.minutesLeft - 15);

  if (car.guilty) {
    const reward = 150 + S.day * 25 + (car.bribeRefused ? 60 : 0);
    S.money += reward;
    S.xp += 25;
    ds.arrests++;
    S.stats.arrests++;
    bumpMission('arrests');
    showBanner('success', '✅ أُرسل إلى السجن', '+' + fmt(reward) + ' دولار مكافأة');
    Sfx.arrestOk();
    Scene3D.flashSiren(1.4);
    render();
    setTimeout(() => Scene3D.driveAway(), 450);
    advance(1900);
  } else {
    const fine = 120 + S.day * 15;
    S.money = Math.max(0, S.money - fine);
    ds.wrong++;
    S.stats.wrong++;
    ds.flags.noWrong = false;
    showBanner('fail', '❌ اعتقال خاطئ', 'غرامة ' + fmt(fine) + ' دولار · أخطاء ' + ds.wrong + '/3');
    Sfx.arrestBad();
    render();
    if (ds.wrong >= 3) {
      ds.over = true;
      setTimeout(() => gameOver('اعتقلت ثلاثة أبرياء في وردية واحدة، قررت الإدارة طردك.'), 1100);
    } else {
      advance(1600);
    }
  }
}

function pass() {
  const ds = S.dayState;
  if (!ds || ds.over) return;
  const car = ds.cars[ds.idx];
  if (!car || car.resolved) return;
  closeInspect();
  car.resolved = true;
  ds.minutesLeft = Math.max(0, ds.minutesLeft - 5);

  if (car.guilty) {
    ds.over = true;
    showBanner('fail', '🚨 مجرم عبر البوابة!', 'سمحت له بالمرور...');
    Sfx.arrestBad();
    Scene3D.liftBarrier(1500);
    render();
    setTimeout(() => gameOver('سمحت لمجرم متنكر بالمرور من نقطة التفتيش. الإدارة طردتك فوراً.'), 1300);
    return;
  }

  showBanner('ok', 'تم السماح بالمرور', 'السائق نظيف، السيارة تكمل طريقها');
  Sfx.passBy();
  Scene3D.driveAway();
  render();
  advance(1300);
}

function nextCar() {
  const ds = S.dayState;
  if (!ds || ds.over) return;
  if (ds.minutesLeft <= 0) { timeUp(); return; }
  ds.idx++;
  if (ds.idx >= ds.cars.length) { finishShift('أنهيت جميع السيارات في هذه الوردية.'); return; }
  render();
}

function advance(ms) {
  clearTimeout(advanceTimer);
  advanceTimer = setTimeout(nextCar, ms);
}

function timeUp() {
  const ds = S.dayState;
  if (!ds || ds.over) return;
  ds.over = true;
  const escaped = ds.cars.slice(ds.idx).filter((c) => !c.resolved && c.guilty);
  if (escaped.length) {
    gameOver('انتهى وقت الوردية قبل تفتيش كل السيارات، و' + (escaped.length > 1 ? 'مرّ ' + escaped.length + ' مجرمين' : 'مرّ مجرم') + ' من البوابة.');
  } else {
    finishShift('انتهى وقت الوردية، ومرّت بقية السيارات بسلام.');
  }
}

/* ================= الرشوة ================= */
function offerBribe() {
  const ds = S.dayState;
  if (!ds || ds.over) return;
  const car = ds.cars[ds.idx];
  if (!car || car.bribeOffered || !car.guilty) return;
  car.bribeOffered = true;
  const amount = rint(300, 700) + S.day * 40;
  Sfx.bribe();
  currentModal = 'bribe';
  openModal(`
    <h2>💰 عرض رشوة</h2>
    <p class="muted">السائق أخرج حزمة نقود من جيبه وقال بهدوء: «خذ ${fmt(amount)} دولار واتركني أكمل طريقي… لن يعرف أحد».</p>
    <div class="badge-line"><span class="pill warn">خطر الكشف: 45%</span><span class="pill">الاعتقال يمنحك مكافأة أعلى</span></div>
    <div class="modal-actions">
      <button class="btn" data-act="accept-bribe" data-amount="${amount}">💵 خذ الرشوة (+${fmt(amount)}$)</button>
      <button class="btn primary" data-act="refuse-bribe">🚨 ارفض واعتقل السيارة</button>
    </div>
  `, true);
}

function acceptBribe(amount) {
  const ds = S.dayState;
  closeModal();
  const car = ds.cars[ds.idx];
  if (car) car.resolved = true;
  S.money += amount;
  ds.bribes++;
  ds.flags.noBribe = false;
  S.stats.bribes++;
  Sfx.cash();
  if (Math.random() < 0.45) {
    showBanner('fail', '📸 تم تصويرك!', 'كاميرا المراقبة رصدت الرشوة');
    render();
    setTimeout(() => gameOver('قُبض عليك متلبساً بأخذ رشوة. تم طردك من الخدمة وإحالتك للتحقيق.'), 1500);
    return;
  }
  showBanner('warn', '💵 أخذت الرشوة', 'مرّ المجرم… لكن أحداً لم يرَ شيئاً هذه المرة');
  Scene3D.driveAway();
  render();
  advance(1500);
}

function refuseBribe() {
  const ds = S.dayState;
  closeModal();
  const car = ds.cars[ds.idx];
  if (car) car.bribeRefused = true;
  toast('🚨 رفضت الرشوة — مكافأة إضافية عند اعتقاله');
  Sfx.click();
  render();
}

/* ================= التفاعل في الميدان ================= */
function handleInteract(id) {
  const ds = S.dayState;
  if (!ds || ds.over) return;
  const car = ds.cars[ds.idx];
  if (!car) return;

  if (id === 'driver') talkToDriver(car);
  else if (id === 'trunk') openTrunk(car);
  else if (id === 'hood') checkHood(car);
  else if (id === 'computer') openInspect();
  else if (id === 'chase') tackleCriminal(car);
}

function talkToDriver(car) {
  const ds = S.dayState;
  if (!ds || car.resolved) return;
  if (!car.talked) {
    if (ds.minutesLeft < 10) { toast('⏳ الوقت لا يكفي للتحدث معه'); return; }
    car.talked = true;
    ds.minutesLeft = Math.max(0, ds.minutesLeft - 10);
    Sfx.click();
  }
  openPapers(car);
}

function requestPapers() {
  const ds = S.dayState;
  const car = ds && ds.cars[ds.idx];
  if (!car || car.resolved) return;
  talkToDriver(car);
}

function openPapers(car) {
  const p = car.papers;
  const issues = paperMismatches(car);
  const damning = issues.filter((x) => x.level === 'damning');

  const row = (label, a, b, bad) => '<tr class="' + (bad ? 'bad' : '') + '"><th>' + label + '</th><td>' + a + '</td><td>' + b + '</td></tr>';
  const rows = [
    row('الاسم', p.name, car.name, false),
    row('رقم اللوحة', p.plate, car.plate, p.plate !== car.plate),
    row('الموديل', p.model, car.model.name, p.model !== car.model.name),
    row('الصورة', p.lie === 'photo' ? 'شخص آخر' : 'مطابقة', 'السائق الحالي', p.lie === 'photo'),
    row('التأمين', p.expired ? 'منتهي' : 'ساري', '—', p.expired),
  ].join('');

  const verdict = damning.length
    ? '<div class="verdict bad"><strong>⛔ الأوراق مخالفة — دليل إدانة</strong><span>' + damning.map((d) => d.text).join(' ') + '</span></div>'
    : issues.length
      ? '<div class="verdict warn"><strong>⚠️ ملاحظة صغيرة</strong><span>' + issues.map((d) => d.text).join(' ') + '</span></div>'
      : '<div class="verdict good"><strong>✅ الأوراق مطابقة</strong><span>الاسم واللوحة والموديل والصورة كلها سليمة.</span></div>';

  currentModal = 'papers';
  openModal(`
    <h2>🆔 أوراق السائق</h2>
    <p class="muted">«${car.note}»</p>
    <div class="papers-photos">
      <div><div class="pp">${portraitSVG(p.portrait, 0)}</div><span>صورة الهوية</span></div>
      <div><div class="pp">${portraitSVG(car.portrait, 0)}</div><span>السائق أمامك</span></div>
    </div>
    <table class="cmp">
      <thead><tr><th>الحقل</th><th>في الأوراق</th><th>على السيارة</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${verdict}
    <div class="modal-actions">
      <button class="btn danger" data-act="arrest">🚨 أرسل للسجن</button>
      <button class="btn ghost" data-act="close-modal">إغلاق</button>
    </div>
  `, true);

  if (!car.papersChecked) {
    car.papersChecked = true;
    issues.forEach((i) => addClue(car, i, 'أوراق السائق', true));
    if (damning.length) { Sfx.clue(); Scene3D.flashSiren(0.8); toast('⛔ وجدت تناقضاً في أوراقه'); }
    else if (!issues.length) { toast('✅ أوراقه سليمة'); }
  }
  render();
}

function openTrunk(car) {
  const ds = S.dayState;
  if (car.trunkOpened) { toast('الصندوق مفتوح بالفعل'); return; }
  if (ds.minutesLeft < 8) { toast('⏳ الوقت لا يكفي'); return; }
  car.trunkOpened = true;
  ds.minutesLeft = Math.max(0, ds.minutesLeft - 8);
  Sfx.barrier();
  const sig = car.signals.find((s) => s.field === 'trunk');
  if (sig) addClue(car, sig, 'فتح الصندوق يدوياً');
  else toast('الصندوق فارغ — فقط أغراض شخصية');
  render();
}

function checkHood(car) {
  const ds = S.dayState;
  if (car.hoodChecked) { toast('فتحت المحرك بالفعل'); return; }
  if (ds.minutesLeft < 6) { toast('⏳ الوقت لا يكفي'); return; }
  car.hoodChecked = true;
  ds.minutesLeft = Math.max(0, ds.minutesLeft - 6);
  Sfx.barrier();
  const sig = car.signals.find((s) => s.field === 'chassis') || car.signals.find((s) => s.field === 'weight');
  if (sig) addClue(car, sig, 'فحص المحرك يدوياً');
  else toast('المحرك سليم ولا شيء مخبأ');
  render();
}

function tackleCriminal(car) {
  const ds = S.dayState;
  if (!car || car.resolved) return;
  car.resolved = true;
  Sfx.punch();
  if (car.guilty) {
    const reward = 150 + S.day * 25;
    S.money += reward;
    S.xp += 30;
    ds.arrests++;
    S.stats.arrests++;
    bumpMission('arrests');
    Scene3D.npcAnim.flee = false;
    if (Scene3D.npc) Scene3D.npc.visible = false;
    showBanner('success', '🤝 تم إمساك الهارب', '+' + fmt(reward) + ' دولار');
    Sfx.arrestOk();
    render();
    setTimeout(() => Scene3D.driveAway(), 600);
    advance(1700);
  } else {
    const fine = 90 + S.day * 10;
    S.money = Math.max(0, S.money - fine);
    ds.wrong++;
    ds.flags.noWrong = false;
    showBanner('fail', '❌ أمسكت شخصاً بريئاً', 'غرامة ' + fmt(fine) + ' دولار');
    Sfx.arrestBad();
    render();
    advance(1500);
  }
}

function handleShootNpc() {
  const ds = S.dayState;
  if (!ds || ds.over) return;
  const car = ds.cars[ds.idx];
  if (!car || car.resolved) return;
  car.resolved = true;
  Scene3D.npcAnim.flee = false;

  if (car.guilty) {
    const reward = 120 + S.day * 15;
    S.money += reward;
    S.xp += 20;
    ds.arrests++;
    S.stats.arrests++;
    bumpMission('arrests');
    if (Scene3D.npc) Scene3D.npc.visible = false;
    showBanner('success', '🎯 تم إسقاط المجرم', 'سقط قبل أن يصل البوابة');
    Sfx.arrestOk();
    Scene3D.flashSiren(1.2);
    render();
    setTimeout(() => Scene3D.driveAway(), 700);
    advance(1900);
  } else {
    ds.over = true;
    Sfx.arrestBad();
    gameOver('أطلقت النار على سائق بريء. تم طردك من الخدمة وإحالتك للتحقيق.');
  }
}

function openInspect() {
  const ds = S.dayState;
  if (!ds || ds.over) return;
  const el = $('#inspect');
  if (!el) return;
  el.classList.add('open');
  if (typeof Player !== 'undefined') { Player.setPaused(true); Player.exitLock(); }
  Sfx.click();
  render();
}

function closeInspect() {
  const el = $('#inspect');
  if (el) el.classList.remove('open');
  resumeField();
}

/* هل هناك قائمة/نافذة مفتوحة توقف اللعب؟ */
function fieldBusy() {
  const insp = $('#inspect');
  return $('#modalRoot').classList.contains('open') || !!(insp && insp.classList.contains('open'));
}

/* بعد إغلاق أي قائمة تكمل اللعبة فوراً ويُعاد قفل المؤشر بدون أي وقفة */
function resumeField() {
  if (typeof Player === 'undefined' || !Player.active) return;
  if (fieldBusy()) { Player.setPaused(true); Player.exitLock(); return; }
  Player.setPaused(false);
  if (document.body.classList.contains('menu-mode')) return;
  const overlay = $('#lockOverlay');
  if (overlay) overlay.classList.add('hidden');
  Player.requestLock();
}

/* ================= نهاية الوردية ================= */
function finishShift(reason) {
  const ds = S.dayState;
  if (!ds || ds.finished) return;
  ds.finished = true;
  ds.over = true;

  ds.missions.forEach((m) => {
    if (m.type === 'noWrong') m.progress = ds.flags.noWrong ? 1 : 0;
    if (m.type === 'noBribe') m.progress = ds.flags.noBribe ? 1 : 0;
    m.progress = Math.min(m.progress, m.need);
  });

  const salary = 150 + S.day * 40 + ds.arrests * 70;
  const bonus = ds.missions.filter((m) => m.progress >= m.need).reduce((a, m) => a + m.reward, 0);
  S.money += salary + bonus;
  S.xp += 40 + ds.arrests * 10;
  S.stats.shifts++;
  ds.summary = { reason, salary, bonus };
  save();
  Sfx.fanfare();
  render();
  openSummary();
}

function openSummary() {
  const ds = S.dayState;
  if (!ds || !ds.summary) return;
  const { reason, salary, bonus } = ds.summary;
  const missionsHtml = ds.missions.map((m) => {
    const done = m.progress >= m.need;
    return `<li class="${done ? 'done' : ''}">
      <div><div class="mtext">${m.label}</div><div class="mprog">${done ? 'مكتملة ✔' : 'التقدم ' + m.progress + '/' + m.need}</div></div>
      <div class="mrew">+${fmt(m.reward)}$</div>
    </li>`;
  }).join('');

  currentModal = 'summary';
  openModal(`
    <h2>نهاية الوردية — اليوم ${S.day}</h2>
    <p class="muted">${reason}</p>
    <div class="summary-grid">
      <div><span>مجرمون اعتُقلوا</span><strong>${ds.arrests}</strong></div>
      <div><span>اعتقالات خاطئة</span><strong>${ds.wrong}</strong></div>
      <div><span>أجهزة استُخدمت</span><strong>${ds.scans}</strong></div>
      <div><span>الراتب</span><strong>${fmt(salary)}$</strong></div>
      <div><span>مكافآت المهام</span><strong>${fmt(bonus)}$</strong></div>
      <div><span>رصيدك الآن</span><strong>${fmt(S.money)}$</strong></div>
    </div>
    <h3>📋 مهام اليوم</h3>
    <ul class="mission-list">${missionsHtml}</ul>
    <div class="modal-actions">
      <button class="btn" data-act="wheel">🎡 عجلة الحظ</button>
      <button class="btn primary" data-act="next-day">▶ اليوم التالي</button>
    </div>
  `, true);
}

function nextDay() {
  S.day++;
  startShift();
  if (typeof Player !== 'undefined' && Player.active) Player.reset();
  save();
}

/* ================= الطرد ================= */
function gameOver(reason) {
  const ds = S.dayState;
  if (ds) { ds.over = true; ds.finished = true; }
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
  Sfx.lose();
  Scene3D.flashSiren(3.5);
  currentModal = 'gameover';
  openModal(`
    <div class="gameover-art"></div>
    <h2 style="color:#ff8b98">🚫 تم طردك من الخدمة</h2>
    <p class="muted">${reason}</p>
    <div class="summary-grid">
      <div><span>وصلت إلى</span><strong>اليوم ${S.day}</strong></div>
      <div><span>مجرمون اعتُقلوا</span><strong>${S.stats.arrests}</strong></div>
      <div><span>رشاوى</span><strong>${S.stats.bribes}</strong></div>
      <div><span>أجهزة استُخدمت</span><strong>${S.stats.scans}</strong></div>
    </div>
    <p class="muted" style="margin-top:14px">تبدأ من جديد من اليوم الأول، مع أجهزتك الأساسية فقط.</p>
    <div class="modal-actions">
      <button class="btn danger big" data-act="restart">🔄 ابدأ من جديد</button>
    </div>
  `, true);
}

/* ================= الواجهة ================= */
function clockStr(minutesElapsed) {
  const total = 8 * 60 + Math.max(0, Math.round(minutesElapsed));
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

function rankFor(xp) {
  let r = RANKS[0];
  RANKS.forEach((x) => { if (xp >= x.xp) r = x; });
  return r.name;
}

function render() {
  if (!S) return;
  applySkin();
  renderHUD();
  renderStage();
  renderSide();
  renderDevices();
  save();
}

function renderHUD() {
  $('#rankLabel').textContent = rankFor(S.xp) + ' · اليوم ' + S.day;
  $('#moneyLabel').textContent = fmt(S.money);
  const ds = S.dayState;
  if (!ds) return;
  const elapsed = ds.totalMinutes - ds.minutesLeft;
  $('#clockTime').textContent = clockStr(elapsed);
  $('#clockLeft').textContent = ds.minutesLeft + ' دقيقة متبقية';
  const pct = clamp((ds.minutesLeft / ds.totalMinutes) * 100, 0, 100);
  const fill = $('#timeFill');
  fill.style.width = pct + '%';
  fill.classList.toggle('low', pct <= 25);
}

function renderStage() {
  const ds = S.dayState;
  if (!ds) return;
  const car = ds.cars[ds.idx];
  $('#carCount').textContent = car ? 'سيارة ' + (ds.idx + 1) + ' من ' + ds.cars.length : 'انتهت السيارات';
  $('#strikes').textContent = 'أخطاء: ' + ds.wrong + '/3';

  if (!car) {
    $('#driverCard').innerHTML = '';
    Scene3D.clearCar();
    sceneCarId = null;
    return;
  }

  $('#driverCard').innerHTML = `
    <div class="portrait">${portraitSVG(car.portrait, carSuspicion(car))}</div>
    <div class="driver-info">
      <div class="driver-name">${car.name}</div>
      <div class="driver-meta">${car.model.name} · لوحة ${car.plate}</div>
      <div class="driver-note">«${car.note}»</div>
    </div>`;

  if (car.id !== sceneCarId) {
    sceneCarId = car.id;
    Scene3D.setCar({ type: car.model.type, color: car.model.color, plate: car.plate, look: car.portrait });
  }
}

function renderSide() {
  const ds = S.dayState;
  const car = ds && ds.cars[ds.idx];
  const susp = car ? carSuspicion(car) : 0;

  const fill = $('#meterFill');
  fill.style.width = susp + '%';
  fill.className = 'meter-fill' + (susp >= 55 ? ' hot' : susp > 18 ? ' warm' : '');
  $('#caseId').textContent = car ? 'ملف #' + car.plate : '';

  $('#hintBox').innerHTML = car ? '<span>🔍</span><p><strong>ملاحظة أولية:</strong> ' + car.hint + '</p>' : '';

  const suggestEl = $('#suggestBox');
  if (suggestEl) {
    suggestEl.innerHTML = car && !car.resolved
      ? '<b>الخطوة التالية:</b> ' + suggestAction(car)
      : '';
  }

  const papersLine = $('#papersLine');
  if (papersLine) {
    if (!car) papersLine.innerHTML = '';
    else if (!car.papersChecked) papersLine.innerHTML = '🆔 الأوراق: لم تطلبها بعد';
    else if (car.papersLie) papersLine.innerHTML = '<span class="bad">🆔 الأوراق: مخالفة ⛔</span>';
    else papersLine.innerHTML = '<span class="good">🆔 الأوراق: مطابقة ✓</span>';
  }

  if (!car) {
    $('#clues').innerHTML = '<div class="empty">لا توجد سيارة حالياً.</div>';
  } else if (!car.revealed.length) {
    $('#clues').innerHTML = '<div class="empty">لم تجد أي دليل بعد.<br>اختر جهازاً مناسباً من الأسفل.</div>';
  } else {
    $('#clues').innerHTML = car.revealed.map((r) => `
      <div class="clue ${r.level}">
        <div class="clue-head">
          <span>${r.level === 'damning' ? '⛔ دليل إدانة' : '⚠️ ملاحظة مشبوهة'}</span>
          <span class="clue-field">${FIELDS[r.field].label}</span>
        </div>
        <p>${r.text}</p>
        <small>بواسطة ${r.device}</small>
      </div>`).join('');
  }

  const canAct = !!car && !ds.over && !car.resolved;
  const arrestBtn = $('[data-act="arrest"]');
  const passBtn = $('[data-act="pass"]');
  if (arrestBtn) arrestBtn.disabled = !canAct;
  if (passBtn) passBtn.disabled = !canAct;
}

function suggestAction(car) {
  if (!car.talked) return 'اطلب أوراق السائق (10 د)';
  const owned = DEVICES.filter((d) => S.devices.indexOf(d.id) >= 0);
  const dev = owned.find((d) => !car.scanned[d.id] && car.signals.some((s) => s.field === d.field));
  if (dev) return 'جرّب ' + dev.name + ' (' + dev.time + ' د)';
  if (!car.trunkOpened) return 'افتح الصندوق (8 د)';
  if (!car.hoodChecked) return 'افحص المحرك (6 د)';
  return 'راجع الأدلة وقرّر: سجن أم سماح';
}

function renderDevices() {
  const ds = S.dayState;
  const car = ds && ds.cars[ds.idx];
  const grid = $('#deviceGrid');
  const list = DEVICES.filter((d) => S.devices.indexOf(d.id) >= 0).sort((a, b) => a.price - b.price);
  $('#scanInfo').textContent = list.length + ' جهاز مفعّل';

  grid.innerHTML = list.map((d) => {
    const used = car && car.scanned[d.id];
    const noTime = ds ? ds.minutesLeft < d.time : true;
    const dis = used || noTime || !car || ds.over || (car && car.resolved);
    return `<button class="device${used ? ' used' : ''}" data-act="scan" data-id="${d.id}" ${dis ? 'disabled' : ''}>
      <span class="dev-ico">${d.icon}</span>
      <span class="dev-name">${d.name}</span>
      <span class="dev-meta"><span class="tag">${FIELDS[d.field].label}</span><span class="time">${d.time} د</span></span>
    </button>`;
  }).join('');
}

function applySkin() {
  document.documentElement.dataset.skin = S.skin || 'classic';
}

/* ================= نوافذ ================= */
function openModal(html, blocking) {
  const root = $('#modalRoot');
  root.innerHTML = '<div class="modal-backdrop' + (blocking ? ' blocking' : '') + '"><div class="modal">' + html + '</div></div>';
  root.classList.add('open');
  if (typeof Player !== 'undefined' && Player.active) { Player.setPaused(true); Player.exitLock(); }
}

function closeModal() {
  const root = $('#modalRoot');
  root.classList.remove('open');
  root.innerHTML = '';
  currentModal = null;
  resumeField();
}

function toast(msg) {
  const root = $('#toastRoot');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(() => { el.classList.add('out'); }, 2200);
  setTimeout(() => { el.remove(); }, 2600);
}

function showBanner(kind, title, sub) {
  const b = $('#banner');
  b.className = 'banner show ' + kind;
  b.innerHTML = '<strong>' + title + '</strong><span>' + (sub || '') + '</span>';
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => { b.className = 'banner'; }, 2200);
}

/* ================= المتجر ================= */
function swatches(colors) {
  return '<span class="swatches">' + colors.map((c) => '<span class="swatch" style="background:' + c + '"></span>').join('') + '</span>';
}

function openShop(tab) {
  if (tab) shopTab = tab;
  currentModal = 'shop';
  const tabs = `
    <div class="tabs">
      <button class="tab ${shopTab === 'devices' ? 'active' : ''}" data-act="shop-tab" data-tab="devices">🛠️ الأجهزة (${S.devices.length}/${DEVICES.length})</button>
      <button class="tab ${shopTab === 'bundles' ? 'active' : ''}" data-act="shop-tab" data-tab="bundles">📦 البكات</button>
      <button class="tab ${shopTab === 'skins' ? 'active' : ''}" data-act="shop-tab" data-tab="skins">🎨 السكنات</button>
    </div>`;

  let body = '';
  if (shopTab === 'devices') {
    body = '<div class="shop-grid">' + DEVICES.slice().sort((a, b) => a.price - b.price).map((d) => {
      const owned = S.devices.indexOf(d.id) >= 0;
      const afford = S.money >= d.price;
      return `<div class="shop-item ${owned ? 'owned' : ''}">
        <h4><span>${d.icon}</span>${d.name}</h4>
        <p>${d.desc}</p>
        <p>يفحص: ${FIELDS[d.field].label} · ${d.time} دقيقة</p>
        <div class="row">
          ${owned ? '<span class="price" style="color:#7dffc8">مُفعّل ✓</span>'
            : `<span class="price">${fmt(d.price)}$</span>
               <button class="btn small ${afford ? 'primary' : ''}" data-act="buy-device" data-id="${d.id}" ${afford ? '' : 'disabled'}>شراء</button>`}
        </div>
      </div>`;
    }).join('') + '</div>';
  } else if (shopTab === 'bundles') {
    body = '<div class="shop-grid">' + BUNDLES.map((b) => {
      const total = b.devices.reduce((a, id) => a + DEVICE_MAP[id].price, 0);
      const ownedAll = b.devices.every((id) => S.devices.indexOf(id) >= 0);
      const afford = S.money >= b.price;
      return `<div class="shop-item ${ownedAll ? 'owned' : ''}">
        <h4><span>📦</span>${b.name}</h4>
        <p>${b.note}</p>
        <p>${b.devices.map((id) => DEVICE_MAP[id].icon + ' ' + DEVICE_MAP[id].name).join(' · ')}</p>
        <div class="row">
          ${ownedAll ? '<span class="price" style="color:#7dffc8">مُفعّل ✓</span>'
            : `<span><span class="price">${fmt(b.price)}$</span><span class="price old">${fmt(total)}$</span></span>
               <button class="btn small ${afford ? 'primary' : ''}" data-act="buy-bundle" data-id="${b.id}" ${afford ? '' : 'disabled'}>شراء البكت</button>`}
        </div>
      </div>`;
    }).join('') + '</div>';
  } else {
    body = '<div class="shop-grid">' + SKINS.map((s) => {
      const owned = S.skins.indexOf(s.id) >= 0;
      const active = S.skin === s.id;
      const afford = S.money >= s.price;
      return `<div class="shop-item ${active ? 'owned' : ''}">
        <h4>${swatches(s.colors)} ${s.name}</h4>
        <p>${s.desc}</p>
        <div class="row">
          ${active ? '<span class="price" style="color:#7dffc8">مطبّق ✓</span>'
            : owned ? '<button class="btn small primary" data-act="apply-skin" data-id="' + s.id + '">تطبيق</button>'
            : `<span class="price">${s.price === 0 ? 'مجاني' : fmt(s.price) + '$'}</span>
               <button class="btn small ${afford ? 'primary' : ''}" data-act="buy-skin" data-id="${s.id}" ${afford ? '' : 'disabled'}>شراء</button>`}
        </div>
      </div>`;
    }).join('') + '</div>';
  }

  openModal(`
    <h2>🛒 متجر النقطة</h2>
    <p class="muted">رصيدك: <strong style="color:#ffe08a">${fmt(S.money)}$</strong> — كل جهاز تفتيش يستهلك وقتاً من ورديتك.</p>
    ${tabs}
    ${body}
    <div class="modal-actions"><button class="btn ghost" data-act="close-modal">إغلاق</button></div>
  `);
}

function buyDevice(id) {
  const d = DEVICE_MAP[id];
  if (!d || S.devices.indexOf(id) >= 0) return;
  if (S.money < d.price) { toast('💵 المال لا يكفي'); return; }
  S.money -= d.price;
  S.devices.push(id);
  toast('✅ تم شراء ' + d.name);
  Sfx.cash();
  render();
  openShop('devices');
}

function buyBundle(id) {
  const b = BUNDLES.find((x) => x.id === id);
  if (!b) return;
  if (S.money < b.price) { toast('💵 المال لا يكفي'); return; }
  S.money -= b.price;
  const added = [];
  b.devices.forEach((did) => {
    if (S.devices.indexOf(did) < 0) { S.devices.push(did); added.push(DEVICE_MAP[did].name); }
  });
  toast(added.length ? '📦 حصلت على: ' + added.join(' · ') : 'كل أجهزة البكت مملوكة بالفعل');
  Sfx.cash();
  render();
  openShop('bundles');
}

function buySkin(id) {
  const s = SKINS.find((x) => x.id === id);
  if (!s || S.skins.indexOf(id) >= 0) return;
  if (S.money < s.price) { toast('💵 المال لا يكفي'); return; }
  S.money -= s.price;
  S.skins.push(id);
  S.skin = id;
  toast('🎨 تم شراء وتطبيق سكن ' + s.name);
  Sfx.cash();
  render();
  openShop('skins');
}

function applySkinById(id) {
  if (S.skins.indexOf(id) < 0) return;
  S.skin = id;
  render();
  toast('🎨 السكن مطبّق');
  Sfx.click();
  openShop('skins');
}

/* ================= المهام ================= */
function openMissions() {
  currentModal = 'missions';
  const ds = S.dayState;
  if (!ds) return;
  const html = ds.missions.map((m) => {
    const done = m.progress >= m.need;
    return `<li class="${done ? 'done' : ''}">
      <div><div class="mtext">${m.label}</div><div class="mprog">${done ? 'مكتملة ✔' : 'التقدم ' + m.progress + '/' + m.need}</div></div>
      <div class="mrew">+${fmt(m.reward)}$</div>
    </li>`;
  }).join('');
  openModal(`
    <h2>🎯 مهام اليوم ${S.day}</h2>
    <p class="muted">تُصرف مكافآت المهام في نهاية الوردية.</p>
    <ul class="mission-list">${html}</ul>
    <div class="modal-actions"><button class="btn ghost" data-act="close-modal">إغلاق</button></div>
  `);
}

/* ================= عجلة الحظ ================= */
const WHEEL = [
  { kind: 'money', amount: 400, label: '400$', color: '#2f6fb5' },
  { kind: 'money', amount: 900, label: '900$', color: '#1c4c85' },
  { kind: 'device', label: 'جهاز جديد', color: '#b5543f' },
  { kind: 'money', amount: 1600, label: '1600$', color: '#7d2f24' },
  { kind: 'skin', label: 'سكن', color: '#2f8f77' },
  { kind: 'money', amount: 3000, label: '3000$', color: '#1c6252' },
  { kind: 'device', label: 'جهاز جديد', color: '#a3823a' },
  { kind: 'nothing', label: 'حظ أوفر', color: '#6b5426' },
];

function canSpin() { return S.wheelDay !== S.day; }

function openWheel(resultText) {
  currentModal = 'wheel';
  const legend = WHEEL.map((w) => '<span><i style="background:' + w.color + '"></i>' + w.label + '</span>').join('');
  const spun = !canSpin();
  openModal(`
    <h2>🎡 عجلة الحظ</h2>
    <p class="muted">محاولة واحدة كل يوم. قد تربح مالاً، جهازاً جديداً، أو سكناً للأجهزة.</p>
    <div class="wheel-wrap">
      <div class="wheel-pointer">▼</div>
      <div class="wheel" id="wheel" style="transform:rotate(0deg)"></div>
      <div class="wheel-legend">${legend}</div>
      <div class="spin-result" id="spinResult">${resultText || ''}</div>
      <button class="btn primary big" data-act="spin" ${spun ? 'disabled' : ''}>${spun ? 'استخدمت محاولة اليوم' : 'أدر العجلة'}</button>
      <div style="display:flex;gap:8px;width:100%">
        ${S.dayState && S.dayState.finished ? '<button class="btn primary wide" data-act="next-day">▶ اليوم التالي</button>' : ''}
        <button class="btn ghost wide" data-act="close-modal">إغلاق</button>
      </div>
    </div>
  `, true);
}

function spin() {
  if (!canSpin()) return;
  S.wheelDay = S.day;
  const idx = weightedWheelIndex();
  const wheelEl = $('#wheel');
  const btn = $('[data-act="spin"]');
  if (btn) btn.disabled = true;
  const deg = 360 * 6 - (idx * 45 + 22.5);
  if (wheelEl) wheelEl.style.transform = 'rotate(' + deg + 'deg)';

  clearInterval(wheelTimer);
  wheelTimer = setInterval(() => Sfx.wheelTick(), 160);
  setTimeout(() => clearInterval(wheelTimer), 3100);

  setTimeout(() => {
    const prize = WHEEL[idx];
    let text = '';
    if (prize.kind === 'money') {
      S.money += prize.amount;
      text = '💵 ربحت ' + fmt(prize.amount) + ' دولار!';
      Sfx.cash();
    } else if (prize.kind === 'device') {
      const locked = DEVICES.filter((d) => S.devices.indexOf(d.id) < 0);
      if (locked.length) {
        const d = pick(locked);
        S.devices.push(d.id);
        text = '🎁 ربحت جهاز ' + d.name + '!';
      } else {
        S.money += 800;
        text = 'كل الأجهزة مملوكة — ربحت 800 دولار بدلاً منها.';
      }
      Sfx.cash();
    } else if (prize.kind === 'skin') {
      const locked = SKINS.filter((s) => S.skins.indexOf(s.id) < 0);
      if (locked.length) {
        const s = pick(locked);
        S.skins.push(s.id);
        S.skin = s.id;
        text = '🎨 ربحت سكن ' + s.name + ' وتم تطبيقه!';
      } else {
        S.money += 700;
        text = 'كل السكنات مملوكة — ربحت 700 دولار بدلاً منها.';
      }
      Sfx.cash();
    } else {
      text = '😅 لا شيء هذه المرة… حظ أوفر غداً.';
      Sfx.tone(200, 0.4, 'sine', 0.07, 120);
    }
    save();
    render();
    const res = $('#spinResult');
    if (res) res.textContent = text;
    const spinBtn = $('[data-act="spin"]');
    if (spinBtn) { spinBtn.disabled = true; spinBtn.textContent = 'استخدمت محاولة اليوم'; }
  }, 3250);
}

function weightedWheelIndex() {
  const weights = [18, 12, 14, 10, 10, 6, 14, 16];
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

/* ================= المساعدة ================= */
function openHelp(first) {
  currentModal = 'help';
  openModal(`
    <h2>🚧 كيف تلعب</h2>
    <p class="muted">أنت مفتش على بوابة نقطة تفتيش ليلية. تمشي في الميدان بمنظور أول، تتحدث مع السائقين، تفتش السيارات، وتستخدم جهاز الكشك.</p>
    <ul class="mission-list">
      <li><div><div class="mtext">التحكم</div><div class="mprog">WASD للمشي · Shift للجري · الماوس للنظر · E للتفاعل · G لإخراج المسدس · النقر للإطلاق · R للتعبئة.</div></div></li>
      <li><div><div class="mtext">1) اقرأ الملاحظة الأولية</div><div class="mprog">تلميح مجاني قد يدل على مكان الدليل — وقد يكون دليلاً مضللاً.</div></div></li>
      <li><div><div class="mtext">2) اطلب أوراق السائق</div><div class="mprog">قف قرب السائق واضغط E (أو زر «أوراق السائق» في لوحة التفتيش). تقارن الأوراق مع السيارة الحقيقية: رقم اللوحة، الموديل، وصورة الهوية. أي اختلاف = دليل إدانة ⛔.</div></div></li>
      <li><div><div class="mtext">3) استخدم أجهزة التفتيش</div><div class="mprog">اضغط I (أو زر «الفحص» فوق) لفتح اللوحة من أي مكان. كل جهاز يفحص حقلاً معيناً ويستهلك دقائق. المجرم في كل سيارة عنده دليل يقدر أحد أجهزتك أو فحصك اليدوي يلاقيه.</div></div></li>
      <li><div><div class="mtext">4) قرّر: سجن أم سماح</div><div class="mprog">من لوحة التفتيش اضغط «إرسال للسجن» إذا وجدت دليلاً قوياً (⛔). الاعتقال الخاطئ غرامة، وثلاثة أخطاء = طرد.</div></div></li>
      <li><div><div class="mtext">المسدس</div><div class="mprog">أخرجه بـ G. إطلاق النار على بريء = طرد فوري. استخدمه على الهاربين فقط.</div></div></li>
      <li><div><div class="mtext">5) لا تدع مجرماً يمر</div><div class="mprog">إذا سمحت لمجرم بالمرور أو انتهى الوقت قبل تفتيشه، تُطرد وتعيد من اليوم الأول.</div></div></li>
      <li><div><div class="mtext">6) الرشاوى</div><div class="mprog">قد يعرض عليك المجرم مالاً. القبول مربح لكن فيه 45% خطر أن تُكشف وتُطرد.</div></div></li>
      <li><div><div class="mtext">7) المتجر والسكنات والعجلة</div><div class="mprog">اجمع المال لتفتح أجهزة أكثر (24 جهازاً)، اشترِ بكات مخفّضة، وطبّق سكنات على أجهزتك.</div></div></li>
    </ul>
    <div class="modal-actions">
      <button class="btn primary big" data-act="close-modal">${first ? '▶ فهمت، لنبدأ' : 'فهمت'}</button>
    </div>
  `, true);
}

/* ================= الحفظ ================= */
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ }
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || !Array.isArray(obj.devices)) return null;
    return obj;
  } catch (e) { return null; }
}

/* ================= الصوت والشاشات ================= */
function syncSoundBtn() {
  const label = Sfx.muted ? '🔇' : '🔊';
  const btn = $('#soundBtn');
  if (btn) btn.textContent = label;
  document.querySelectorAll('[data-act="toggle-sound"]').forEach((b) => {
    if (b.classList.contains('icon-btn')) return;
    b.textContent = (Sfx.muted ? '🔇' : '🔊') + ' الصوت';
  });
}

function toggleSound() {
  Sfx.init();
  const m = Sfx.toggle();
  try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (e) { /* ignore */ }
  syncSoundBtn();
  if (!m) Sfx.click();
}

function showMenu() {
  document.body.classList.add('menu-mode');
  const sc = $('#startScreen');
  if (sc) sc.classList.remove('closed');
  Scene3D.setMode('menu');
  if (typeof Player !== 'undefined') { Player.disable(); Player.setDrawn(false); }
  closeInspect();
  const hasSave = hasProgress && !!(S && S.started && S.dayState && S.dayState.cars && S.dayState.cars.length);
  const resume = $('#resumeBtn');
  if (resume) resume.classList.toggle('hidden', !hasSave);
  const rd = $('#resumeDay');
  if (rd) rd.textContent = S ? S.day : 1;
  const prog = $('#startProgress');
  if (prog) {
    prog.textContent = hasSave
      ? 'اليوم ' + S.day + ' · ' + rankFor(S.xp) + ' · ' + fmt(S.money) + '$ · ' + S.devices.length + ' جهاز'
      : 'وردية جديدة · 4 أجهزة أساسية · 400$';
  }
  setTimeout(() => Scene3D.resize(), 80);
}

function hideMenu() {
  document.body.classList.remove('menu-mode');
  const sc = $('#startScreen');
  if (sc) sc.classList.add('closed');
  Scene3D.setMode('play');
  Scene3D.resize();
  setTimeout(() => Scene3D.resize(), 90);
}

function startNewGame() {
  Sfx.init();
  Sfx.click();
  newGame();
  startShift();
  hasProgress = true;
  S.started = true;
  hideMenu();
  if (typeof Player !== 'undefined') Player.enable();
  save();
}

function resumeGame() {
  Sfx.init();
  Sfx.click();
  hasProgress = true;
  if (S) S.started = true;
  hideMenu();
  if (typeof Player !== 'undefined') Player.enable();
  if (S.dayState && S.dayState.finished && S.dayState.summary) {
    render();
    openSummary();
  } else {
    render();
  }
}

/* ================= الأحداث ================= */
document.addEventListener('keydown', (e) => {
  if (e.code === 'Escape') {
    const el = $('#inspect');
    if (el && el.classList.contains('open')) {
      e.stopPropagation();
      closeInspect();
    }
    return;
  }
  if (e.code === 'KeyI' || e.code === 'Tab') {
    if (document.body.classList.contains('menu-mode')) return;
    if ($('#modalRoot').classList.contains('open')) return;
    const el = $('#inspect');
    if (!el) return;
    e.preventDefault();
    if (el.classList.contains('open')) closeInspect();
    else openInspect();
  }
});

document.addEventListener('click', (e) => {
  if (!Sfx.ready) Sfx.init();

  const backdrop = e.target.classList && e.target.classList.contains('modal-backdrop');
  if (backdrop) {
    if (!e.target.classList.contains('blocking')) closeModal();
    return;
  }

  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;

  switch (act) {
    case 'scan': scan(el.dataset.id); break;
    case 'papers': Sfx.click(); requestPapers(); break;
    case 'inspect': openInspect(); break;
    case 'arrest': arrest(); break;
    case 'pass': pass(); break;
    case 'shop': Sfx.click(); openShop(); break;
    case 'shop-tab': Sfx.click(); openShop(el.dataset.tab); break;
    case 'buy-device': buyDevice(el.dataset.id); break;
    case 'buy-bundle': buyBundle(el.dataset.id); break;
    case 'buy-skin': buySkin(el.dataset.id); break;
    case 'apply-skin': applySkinById(el.dataset.id); break;
    case 'missions': Sfx.click(); openMissions(); break;
    case 'wheel': Sfx.click(); openWheel(); break;
    case 'spin': spin(); break;
    case 'help': Sfx.click(); openHelp(false); break;
    case 'how-to': Sfx.click(); openHelp(true); break;
    case 'toggle-sound': toggleSound(); break;
    case 'close-modal': Sfx.click(); closeModal(); break;
    case 'accept-bribe': acceptBribe(parseInt(el.dataset.amount, 10) || 0); break;
    case 'refuse-bribe': refuseBribe(); break;
    case 'next-day': Sfx.click(); nextDay(); break;
    case 'restart':
      Sfx.click(); newGame(); startShift(); hasProgress = true; S.started = true;
      if (typeof Player !== 'undefined') Player.reset();
      save();
      break;
    case 'start-new': startNewGame(); break;
    case 'resume': resumeGame(); break;
    case 'menu': Sfx.click(); showMenu(); break;
    case 'close-inspect': closeInspect(); break;
    default: break;
  }
});

/* ================= الإقلاع ================= */
function init() {
  try { Sfx.setMuted(localStorage.getItem(MUTE_KEY) === '1'); } catch (e) { /* ignore */ }

  const ok = Scene3D.init($('#scene'), $('#stage'));
  if (ok && typeof Player !== 'undefined') {
    Player.init(Scene3D.camera, Scene3D.renderer.domElement, Scene3D.scene);
    Scene3D.onInteract = handleInteract;
    Scene3D.onShootNpc = handleShootNpc;
    Scene3D.onNpcEscape = function () { gameOver('هرب المجرم من البوابة وضاعت القضية.'); };
  }
  const loading = $('#stageLoading');
  if (!ok) {
    if (loading) loading.textContent = 'تعذّر تشغيل العالم ثلاثي الأبعاد (WebGL) على هذا الجهاز.';
  } else {
    setTimeout(() => { if (loading) loading.classList.add('done'); }, 400);
  }

  const saved = load();
  hasProgress = !!(saved && saved.dayState && Array.isArray(saved.dayState.cars) && saved.dayState.cars.length);
  if (saved && saved.dayState && Array.isArray(saved.dayState.cars) && saved.dayState.cars.length) {
    S = saved;
    sceneCarId = null;
    if (S.dayState.idx >= S.dayState.cars.length && !S.dayState.finished) startShift();
    else render();
  } else {
    newGame();
    startShift();
  }

  syncSoundBtn();
  showMenu();
}

init();
