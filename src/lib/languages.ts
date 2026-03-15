export interface Language {
  code: string;
  name: string;
  nativeName: string;
  region: string;
}

export const RTL_LANGUAGES = new Set([
  "ar", "he", "iw", "ur", "fa", "ps", "sd", "yi",
]);

export function isRTL(languageCode: string): boolean {
  const base = languageCode.split("-")[0].toLowerCase();
  return RTL_LANGUAGES.has(base);
}

export const LANGUAGE_REGIONS: Record<string, Language[]> = {
  "Popular": [
    { code: "en", name: "English", nativeName: "English", region: "Popular" },
    { code: "es", name: "Spanish", nativeName: "Español", region: "Popular" },
    { code: "fr", name: "French", nativeName: "Français", region: "Popular" },
    { code: "de", name: "German", nativeName: "Deutsch", region: "Popular" },
    { code: "pt", name: "Portuguese", nativeName: "Português", region: "Popular" },
    { code: "pt-BR", name: "Portuguese (Brazil)", nativeName: "Português (Brasil)", region: "Popular" },
    { code: "zh", name: "Chinese (Simplified)", nativeName: "中文简体", region: "Popular" },
    { code: "zh-TW", name: "Chinese (Traditional)", nativeName: "中文繁體", region: "Popular" },
    { code: "ja", name: "Japanese", nativeName: "日本語", region: "Popular" },
    { code: "ko", name: "Korean", nativeName: "한국어", region: "Popular" },
    { code: "hi", name: "Hindi", nativeName: "हिन्दी", region: "Popular" },
    { code: "ar", name: "Arabic", nativeName: "العربية", region: "Popular" },
    { code: "ru", name: "Russian", nativeName: "Русский", region: "Popular" },
    { code: "it", name: "Italian", nativeName: "Italiano", region: "Popular" },
    { code: "tr", name: "Turkish", nativeName: "Türkçe", region: "Popular" },
  ],
  "European": [
    { code: "nl", name: "Dutch", nativeName: "Nederlands", region: "European" },
    { code: "pl", name: "Polish", nativeName: "Polski", region: "European" },
    { code: "ro", name: "Romanian", nativeName: "Română", region: "European" },
    { code: "cs", name: "Czech", nativeName: "Čeština", region: "European" },
    { code: "sk", name: "Slovak", nativeName: "Slovenčina", region: "European" },
    { code: "hu", name: "Hungarian", nativeName: "Magyar", region: "European" },
    { code: "bg", name: "Bulgarian", nativeName: "Български", region: "European" },
    { code: "hr", name: "Croatian", nativeName: "Hrvatski", region: "European" },
    { code: "sr", name: "Serbian", nativeName: "Srpski", region: "European" },
    { code: "bs", name: "Bosnian", nativeName: "Bosanski", region: "European" },
    { code: "sl", name: "Slovenian", nativeName: "Slovenščina", region: "European" },
    { code: "mk", name: "Macedonian", nativeName: "Македонски", region: "European" },
    { code: "uk", name: "Ukrainian", nativeName: "Українська", region: "European" },
    { code: "be", name: "Belarusian", nativeName: "Беларуская", region: "European" },
    { code: "el", name: "Greek", nativeName: "Ελληνικά", region: "European" },
    { code: "da", name: "Danish", nativeName: "Dansk", region: "European" },
    { code: "sv", name: "Swedish", nativeName: "Svenska", region: "European" },
    { code: "no", name: "Norwegian", nativeName: "Norsk", region: "European" },
    { code: "nb", name: "Norwegian Bokmål", nativeName: "Norsk Bokmål", region: "European" },
    { code: "nn", name: "Norwegian Nynorsk", nativeName: "Norsk Nynorsk", region: "European" },
    { code: "fi", name: "Finnish", nativeName: "Suomi", region: "European" },
    { code: "et", name: "Estonian", nativeName: "Eesti", region: "European" },
    { code: "lv", name: "Latvian", nativeName: "Latviešu", region: "European" },
    { code: "lt", name: "Lithuanian", nativeName: "Lietuvių", region: "European" },
    { code: "is", name: "Icelandic", nativeName: "Íslenska", region: "European" },
    { code: "fo", name: "Faroese", nativeName: "Føroyskt", region: "European" },
    { code: "ca", name: "Catalan", nativeName: "Català", region: "European" },
    { code: "eu", name: "Basque", nativeName: "Euskara", region: "European" },
    { code: "gl", name: "Galician", nativeName: "Galego", region: "European" },
    { code: "cy", name: "Welsh", nativeName: "Cymraeg", region: "European" },
    { code: "ga", name: "Irish", nativeName: "Gaeilge", region: "European" },
    { code: "gd", name: "Scottish Gaelic", nativeName: "Gàidhlig", region: "European" },
    { code: "mt", name: "Maltese", nativeName: "Malti", region: "European" },
    { code: "sq", name: "Albanian", nativeName: "Shqip", region: "European" },
    { code: "lb", name: "Luxembourgish", nativeName: "Lëtzebuergesch", region: "European" },
    { code: "fy", name: "Western Frisian", nativeName: "Frysk", region: "European" },
    { code: "br", name: "Breton", nativeName: "Brezhoneg", region: "European" },
    { code: "oc", name: "Occitan", nativeName: "Occitan", region: "European" },
    { code: "co", name: "Corsican", nativeName: "Corsu", region: "European" },
    { code: "rm", name: "Romansh", nativeName: "Rumantsch", region: "European" },
    { code: "hy", name: "Armenian", nativeName: "Հայերեն", region: "European" },
    { code: "ka", name: "Georgian", nativeName: "ქართული", region: "European" },
  ],
  "South Asian": [
    { code: "bn", name: "Bengali", nativeName: "বাংলা", region: "South Asian" },
    { code: "ta", name: "Tamil", nativeName: "தமிழ்", region: "South Asian" },
    { code: "te", name: "Telugu", nativeName: "తెలుగు", region: "South Asian" },
    { code: "mr", name: "Marathi", nativeName: "मराठी", region: "South Asian" },
    { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", region: "South Asian" },
    { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", region: "South Asian" },
    { code: "ml", name: "Malayalam", nativeName: "മലയാളം", region: "South Asian" },
    { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", region: "South Asian" },
    { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", region: "South Asian" },
    { code: "as", name: "Assamese", nativeName: "অসমীয়া", region: "South Asian" },
    { code: "si", name: "Sinhala", nativeName: "සිංහල", region: "South Asian" },
    { code: "ne", name: "Nepali", nativeName: "नेपाली", region: "South Asian" },
    { code: "sd", name: "Sindhi", nativeName: "سنڌي", region: "South Asian" },
    { code: "ks", name: "Kashmiri", nativeName: "कॉशुर", region: "South Asian" },
    { code: "dv", name: "Dhivehi", nativeName: "ދިވެހި", region: "South Asian" },
  ],
  "East & Southeast Asian": [
    { code: "th", name: "Thai", nativeName: "ไทย", region: "East & Southeast Asian" },
    { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", region: "East & Southeast Asian" },
    { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", region: "East & Southeast Asian" },
    { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", region: "East & Southeast Asian" },
    { code: "tl", name: "Filipino (Tagalog)", nativeName: "Filipino", region: "East & Southeast Asian" },
    { code: "km", name: "Khmer", nativeName: "ភាសាខ្មែរ", region: "East & Southeast Asian" },
    { code: "lo", name: "Lao", nativeName: "ລາວ", region: "East & Southeast Asian" },
    { code: "my", name: "Burmese", nativeName: "မြန်မာ", region: "East & Southeast Asian" },
    { code: "mn", name: "Mongolian", nativeName: "Монгол", region: "East & Southeast Asian" },
    { code: "bo", name: "Tibetan", nativeName: "བོད་སྐད", region: "East & Southeast Asian" },
    { code: "jv", name: "Javanese", nativeName: "Basa Jawa", region: "East & Southeast Asian" },
    { code: "su", name: "Sundanese", nativeName: "Basa Sunda", region: "East & Southeast Asian" },
  ],
  "Central Asian & Turkic": [
    { code: "kk", name: "Kazakh", nativeName: "Қазақша", region: "Central Asian & Turkic" },
    { code: "uz", name: "Uzbek", nativeName: "Oʻzbek", region: "Central Asian & Turkic" },
    { code: "ky", name: "Kyrgyz", nativeName: "Кыргызча", region: "Central Asian & Turkic" },
    { code: "tk", name: "Turkmen", nativeName: "Türkmen", region: "Central Asian & Turkic" },
    { code: "tg", name: "Tajik", nativeName: "Тоҷикӣ", region: "Central Asian & Turkic" },
    { code: "tt", name: "Tatar", nativeName: "Татар", region: "Central Asian & Turkic" },
    { code: "ba", name: "Bashkir", nativeName: "Башҡорт", region: "Central Asian & Turkic" },
    { code: "az", name: "Azerbaijani", nativeName: "Azərbaycan", region: "Central Asian & Turkic" },
    { code: "ug", name: "Uyghur", nativeName: "ئۇيغۇرچە", region: "Central Asian & Turkic" },
  ],
  "Middle Eastern": [
    { code: "he", name: "Hebrew", nativeName: "עברית", region: "Middle Eastern" },
    { code: "fa", name: "Persian", nativeName: "فارسی", region: "Middle Eastern" },
    { code: "ur", name: "Urdu", nativeName: "اردو", region: "Middle Eastern" },
    { code: "ps", name: "Pashto", nativeName: "پښتو", region: "Middle Eastern" },
    { code: "ku", name: "Kurdish", nativeName: "Kurdî", region: "Middle Eastern" },
    { code: "yi", name: "Yiddish", nativeName: "ייִדיש", region: "Middle Eastern" },
  ],
  "African": [
    { code: "sw", name: "Swahili", nativeName: "Kiswahili", region: "African" },
    { code: "am", name: "Amharic", nativeName: "አማርኛ", region: "African" },
    { code: "ha", name: "Hausa", nativeName: "Hausa", region: "African" },
    { code: "yo", name: "Yoruba", nativeName: "Yorùbá", region: "African" },
    { code: "ig", name: "Igbo", nativeName: "Igbo", region: "African" },
    { code: "zu", name: "Zulu", nativeName: "isiZulu", region: "African" },
    { code: "xh", name: "Xhosa", nativeName: "isiXhosa", region: "African" },
    { code: "af", name: "Afrikaans", nativeName: "Afrikaans", region: "African" },
    { code: "so", name: "Somali", nativeName: "Soomaali", region: "African" },
    { code: "mg", name: "Malagasy", nativeName: "Malagasy", region: "African" },
    { code: "rw", name: "Kinyarwanda", nativeName: "Ikinyarwanda", region: "African" },
    { code: "sn", name: "Shona", nativeName: "chiShona", region: "African" },
    { code: "ny", name: "Chichewa", nativeName: "Chichewa", region: "African" },
    { code: "st", name: "Sesotho", nativeName: "Sesotho", region: "African" },
    { code: "tn", name: "Tswana", nativeName: "Setswana", region: "African" },
    { code: "ti", name: "Tigrinya", nativeName: "ትግርኛ", region: "African" },
    { code: "om", name: "Oromo", nativeName: "Afaan Oromoo", region: "African" },
    { code: "lg", name: "Luganda", nativeName: "Luganda", region: "African" },
    { code: "wo", name: "Wolof", nativeName: "Wolof", region: "African" },
    { code: "ln", name: "Lingala", nativeName: "Lingála", region: "African" },
  ],
  "Americas & Pacific": [
    { code: "en-US", name: "English (US)", nativeName: "English (US)", region: "Americas & Pacific" },
    { code: "en-GB", name: "English (UK)", nativeName: "English (UK)", region: "Americas & Pacific" },
    { code: "en-AU", name: "English (Australia)", nativeName: "English (Australia)", region: "Americas & Pacific" },
    { code: "es-MX", name: "Spanish (Mexico)", nativeName: "Español (México)", region: "Americas & Pacific" },
    { code: "es-AR", name: "Spanish (Argentina)", nativeName: "Español (Argentina)", region: "Americas & Pacific" },
    { code: "fr-CA", name: "French (Canada)", nativeName: "Français (Canada)", region: "Americas & Pacific" },
    { code: "qu", name: "Quechua", nativeName: "Runasimi", region: "Americas & Pacific" },
    { code: "gn", name: "Guarani", nativeName: "Avañeʼẽ", region: "Americas & Pacific" },
    { code: "ay", name: "Aymara", nativeName: "Aymar", region: "Americas & Pacific" },
    { code: "ht", name: "Haitian Creole", nativeName: "Kreyòl Ayisyen", region: "Americas & Pacific" },
    { code: "mi", name: "Māori", nativeName: "Te Reo Māori", region: "Americas & Pacific" },
    { code: "sm", name: "Samoan", nativeName: "Gagana Sāmoa", region: "Americas & Pacific" },
    { code: "to", name: "Tongan", nativeName: "Lea Fakatonga", region: "Americas & Pacific" },
    { code: "fj", name: "Fijian", nativeName: "Na Vosa Vakaviti", region: "Americas & Pacific" },
    { code: "haw", name: "Hawaiian", nativeName: "ʻŌlelo Hawaiʻi", region: "Americas & Pacific" },
  ],
  "Constructed": [
    { code: "eo", name: "Esperanto", nativeName: "Esperanto", region: "Constructed" },
    { code: "la", name: "Latin", nativeName: "Latina", region: "Constructed" },
    { code: "sa", name: "Sanskrit", nativeName: "संस्कृतम्", region: "Constructed" },
  ],
};

export function getAllLanguages(): Language[] {
  return Object.values(LANGUAGE_REGIONS).flat();
}

export function searchLanguages(query: string): Language[] {
  const q = query.toLowerCase();
  return getAllLanguages().filter(
    (l) =>
      l.name.toLowerCase().includes(q) ||
      l.nativeName.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q)
  );
}

export function getLanguageName(code: string): string {
  const lang = getAllLanguages().find((l) => l.code === code);
  return lang?.name || code;
}
