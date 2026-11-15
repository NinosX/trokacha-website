// lib/pro/shared/wilayas.ts
// =============================================================================
// Les 69 wilayas (code → nom français, nom arabe), recopiées du référentiel de
// l'application (`constants/wilayas.ts`, copie serveur `functions/src/data/wilayas.json` ;
// mêmes noms que l'écran de vente de l'app, `wilayaName`). Le carnet garde le CODE (« 16 ») ; le bureau
// affiche le nom (« Alger », « الجزائر »). Module PUR.
// =============================================================================

const WILAYAS: Readonly<Record<string, readonly [string, string]>> = {
  '01': ['Adrar', 'أدرار'],
  '02': ['Chlef', 'الشلف'],
  '03': ['Laghouat', 'الأغواط'],
  '04': ['Oum El Bouaghi', 'أم البواقي'],
  '05': ['Batna', 'باتنة'],
  '06': ['Béjaïa', 'بجاية'],
  '07': ['Biskra', 'بسكرة'],
  '08': ['Béchar', 'بشار'],
  '09': ['Blida', 'البليدة'],
  '10': ['Bouira', 'البويرة'],
  '11': ['Tamanrasset', 'تمنراست'],
  '12': ['Tébessa', 'تبسة'],
  '13': ['Tlemcen', 'تلمسان'],
  '14': ['Tiaret', 'تيارت'],
  '15': ['Tizi Ouzou', 'تيزي وزو'],
  '16': ['Alger', 'الجزائر'],
  '17': ['Djelfa', 'الجلفة'],
  '18': ['Jijel', 'جيجل'],
  '19': ['Sétif', 'سطيف'],
  '20': ['Saïda', 'سعيدة'],
  '21': ['Skikda', 'سكيكدة'],
  '22': ['Sidi Bel Abbès', 'سيدي بلعباس'],
  '23': ['Annaba', 'عنابة'],
  '24': ['Guelma', 'قالمة'],
  '25': ['Constantine', 'قسنطينة'],
  '26': ['Médéa', 'المدية'],
  '27': ['Mostaganem', 'مستغانم'],
  '28': ['M’Sila', 'المسيلة'],
  '29': ['Mascara', 'معسكر'],
  '30': ['Ouargla', 'ورقلة'],
  '31': ['Oran', 'وهران'],
  '32': ['El Bayadh', 'البيض'],
  '33': ['Illizi', 'إليزي'],
  '34': ['Bordj Bou Arreridj', 'برج بوعريريج'],
  '35': ['Boumerdès', 'بومرداس'],
  '36': ['El Tarf', 'الطارف'],
  '37': ['Tindouf', 'تندوف'],
  '38': ['Tissemsilt', 'تيسمسيلت'],
  '39': ['El Oued', 'الوادي'],
  '40': ['Khenchela', 'خنشلة'],
  '41': ['Souk Ahras', 'سوق أهراس'],
  '42': ['Tipaza', 'تيبازة'],
  '43': ['Mila', 'ميلة'],
  '44': ['Aïn Defla', 'عين الدفلى'],
  '45': ['Naâma', 'النعامة'],
  '46': ['Aïn Témouchent', 'عين تموشنت'],
  '47': ['Ghardaïa', 'غرداية'],
  '48': ['Relizane', 'غليزان'],
  '49': ['Timimoun', 'تيميمون'],
  '50': ['Bordj Badji Mokhtar', 'برج باجي مختار'],
  '51': ['Ouled Djellal', 'أولاد جلال'],
  '52': ['Béni Abbès', 'بني عباس'],
  '53': ['In Salah', 'عين صالح'],
  '54': ['In Guezzam', 'عين قزام'],
  '55': ['Touggourt', 'تقرت'],
  '56': ['Djanet', 'جانت'],
  '57': ['El Meghaier', 'المغير'],
  '58': ['El Menia', 'المنيعة'],
  '59': ['Aflou', 'أفلو'],
  '60': ['Barika', 'بريكة'],
  '61': ['El Kantara', 'القنطرة'],
  '62': ['Bir El Ater', 'بئر العاتر'],
  '63': ['El Aricha', 'العريشة'],
  '64': ['Ksar Chellala', 'قصر الشلالة'],
  '65': ['Aïn Ouessara', 'عين وسارة'],
  '66': ['Messaad', 'مسعد'],
  '67': ['Ksar El Boukhari', 'قصر البخاري'],
  '68': ['Bou Saâda', 'بوسعادة'],
  '69': ['El Abiodh Sidi Cheikh', 'الأبيض سيدي الشيخ'],
};

/** « 16 » → « Alger » (ou « الجزائر » en arabe) ; le texte tel quel s'il n'est pas un code connu. */
export function wilayaName(code: string | null | undefined, locale: string | null | undefined): string {
  const raw = (code ?? '').trim();
  if (!raw) return '';
  const entry = WILAYAS[raw.padStart(2, '0')] ?? WILAYAS[raw];
  if (!entry) return raw;
  return locale === 'ar' ? entry[1] : entry[0];
}
