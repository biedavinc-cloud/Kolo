// Codes pays téléphoniques internationaux (ISO, indicatif, nom) — app à usage mondial
const RAW = [
  ["AF", "+93", "Afghanistan"], ["ZA", "+27", "Afrique du Sud"], ["AL", "+355", "Albanie"],
  ["DZ", "+213", "Algérie"], ["DE", "+49", "Allemagne"], ["AD", "+376", "Andorre"],
  ["AO", "+244", "Angola"], ["AI", "+1", "Anguilla"], ["AG", "+1", "Antigua-et-Barbuda"],
  ["SA", "+966", "Arabie saoudite"], ["AR", "+54", "Argentine"], ["AM", "+374", "Arménie"],
  ["AU", "+61", "Australie"], ["AT", "+43", "Autriche"], ["AZ", "+994", "Azerbaïdjan"],
  ["BS", "+1", "Bahamas"], ["BH", "+973", "Bahreïn"], ["BD", "+880", "Bangladesh"],
  ["BB", "+1", "Barbade"], ["BE", "+32", "Belgique"], ["BZ", "+501", "Belize"],
  ["BJ", "+229", "Bénin"], ["BT", "+975", "Bhoutan"], ["BY", "+375", "Biélorussie"],
  ["BO", "+591", "Bolivie"], ["BA", "+387", "Bosnie-Herzégovine"], ["BW", "+267", "Botswana"],
  ["BR", "+55", "Brésil"], ["BN", "+673", "Brunei"], ["BG", "+359", "Bulgarie"],
  ["BF", "+226", "Burkina Faso"], ["BI", "+257", "Burundi"], ["KH", "+855", "Cambodge"],
  ["CM", "+237", "Cameroun"], ["CA", "+1", "Canada"], ["CV", "+238", "Cap-Vert"],
  ["CL", "+56", "Chili"], ["CN", "+86", "Chine"], ["CO", "+57", "Colombie"],
  ["KM", "+269", "Comores"], ["CG", "+242", "Congo"], ["CD", "+243", "Congo (RDC)"],
  ["KR", "+82", "Corée du Sud"], ["CR", "+506", "Costa Rica"], ["CI", "+225", "Côte d'Ivoire"],
  ["HR", "+385", "Croatie"], ["CU", "+53", "Cuba"], ["DK", "+45", "Danemark"],
  ["DJ", "+253", "Djibouti"], ["DM", "+1", "Dominique"], ["EG", "+20", "Égypte"],
  ["AE", "+971", "Émirats arabes unis"], ["EC", "+593", "Équateur"], ["ER", "+291", "Érythrée"],
  ["ES", "+34", "Espagne"], ["EE", "+372", "Estonie"], ["SZ", "+268", "Eswatini"],
  ["US", "+1", "États-Unis"], ["ET", "+251", "Éthiopie"], ["FJ", "+679", "Fidji"],
  ["FI", "+358", "Finlande"], ["FR", "+33", "France"], ["GA", "+241", "Gabon"],
  ["GM", "+220", "Gambie"], ["GE", "+995", "Géorgie"], ["GH", "+233", "Ghana"],
  ["GI", "+350", "Gibraltar"], ["GR", "+30", "Grèce"], ["GD", "+1", "Grenade"],
  ["GL", "+299", "Groenland"], ["GP", "+590", "Guadeloupe"], ["GU", "+1", "Guam"],
  ["GT", "+502", "Guatemala"], ["GG", "+44", "Guernesey"], ["GN", "+224", "Guinée"],
  ["GQ", "+240", "Guinée équatoriale"], ["GW", "+245", "Guinée-Bissau"],
  ["GY", "+592", "Guyana"], ["HT", "+509", "Haïti"], ["HN", "+504", "Honduras"],
  ["HK", "+852", "Hong Kong"], ["HU", "+36", "Hongrie"], ["MU", "+230", "Maurice"],
  ["IN", "+91", "Inde"], ["ID", "+62", "Indonésie"], ["IQ", "+964", "Irak"],
  ["IE", "+353", "Irlande"], ["IS", "+354", "Islande"], ["IL", "+972", "Israël"],
  ["IT", "+39", "Italie"], ["JM", "+1", "Jamaïque"], ["JP", "+81", "Japon"],
  ["JO", "+962", "Jordanie"], ["KZ", "+7", "Kazakhstan"], ["KE", "+254", "Kenya"],
  ["KG", "+996", "Kirghizistan"], ["KI", "+686", "Kiribati"], ["KW", "+965", "Koweït"],
  ["RE", "+262", "La Réunion"], ["LA", "+856", "Laos"], ["LS", "+266", "Lesotho"],
  ["LV", "+371", "Lettonie"], ["LB", "+961", "Liban"], ["LR", "+231", "Libéria"],
  ["LY", "+218", "Libye"], ["LI", "+423", "Liechtenstein"], ["LT", "+370", "Lituanie"],
  ["LU", "+352", "Luxembourg"], ["MK", "+389", "Macédoine du Nord"], ["MG", "+261", "Madagascar"],
  ["MY", "+60", "Malaisie"], ["MW", "+265", "Malawi"], ["MV", "+960", "Maldives"],
  ["ML", "+223", "Mali"], ["MT", "+356", "Malte"], ["MA", "+212", "Maroc"],
  ["MQ", "+596", "Martinique"], ["MR", "+222", "Mauritanie"], ["MX", "+52", "Mexique"],
  ["FM", "+691", "Micronésie"], ["MD", "+373", "Moldavie"], ["MC", "+377", "Monaco"],
  ["MN", "+976", "Mongolie"], ["ME", "+382", "Monténégro"], ["MS", "+1", "Montserrat"],
  ["MZ", "+258", "Mozambique"], ["MM", "+95", "Myanmar"], ["NA", "+264", "Namibie"],
  ["NR", "+674", "Nauru"], ["NP", "+977", "Népal"], ["NI", "+505", "Nicaragua"],
  ["NE", "+227", "Niger"], ["NG", "+234", "Nigeria"], ["NO", "+47", "Norvège"],
  ["NZ", "+64", "Nouvelle-Zélande"], ["OM", "+968", "Oman"], ["UG", "+256", "Ouganda"],
  ["UZ", "+998", "Ouzbékistan"], ["PK", "+92", "Pakistan"], ["PA", "+507", "Panama"],
  ["PG", "+675", "Papouasie-Nouvelle-Guinée"], ["PY", "+595", "Paraguay"],
  ["NL", "+31", "Pays-Bas"], ["PE", "+51", "Pérou"], ["PH", "+63", "Philippines"],
  ["PL", "+48", "Pologne"], ["PF", "+689", "Polynésie française"], ["PT", "+351", "Portugal"],
  ["QA", "+974", "Qatar"], ["CF", "+236", "République centrafricaine"],
  ["DO", "+1", "République dominicaine"], ["CZ", "+420", "République tchèque"],
  ["RO", "+40", "Roumanie"], ["GB", "+44", "Royaume-Uni"], ["RU", "+7", "Russie"],
  ["RW", "+250", "Rwanda"], ["KN", "+1", "Saint-Kitts-et-Nevis"], ["LC", "+1", "Sainte-Lucie"],
  ["VC", "+1", "Saint-Vincent-et-les-Grenadines"], ["WS", "+685", "Samoa"],
  ["AS", "+1", "Samoa américaines"], ["ST", "+239", "Sao Tomé-et-Principe"],
  ["SN", "+221", "Sénégal"], ["RS", "+381", "Serbie"], ["SC", "+248", "Seychelles"],
  ["SL", "+232", "Sierra Leone"], ["SG", "+65", "Singapour"], ["SK", "+421", "Slovaquie"],
  ["SI", "+386", "Slovénie"], ["SO", "+252", "Somalie"], ["SD", "+249", "Soudan"],
  ["SS", "+211", "Soudan du Sud"], ["LK", "+94", "Sri Lanka"], ["SE", "+46", "Suède"],
  ["CH", "+41", "Suisse"], ["SR", "+597", "Suriname"], ["SJ", "+47", "Svalbard"],
  ["SY", "+963", "Syrie"], ["TJ", "+992", "Tadjikistan"], ["TW", "+886", "Taïwan"],
  ["TZ", "+255", "Tanzanie"], ["TD", "+235", "Tchad"], ["CZ", "+420", "Tchéquie"],
  ["TH", "+66", "Thaïlande"], ["TL", "+670", "Timor oriental"], ["TG", "+228", "Togo"],
  ["TO", "+676", "Tonga"], ["TT", "+1", "Trinité-et-Tobago"], ["TN", "+216", "Tunisie"],
  ["TM", "+993", "Turkménistan"], ["TR", "+90", "Turquie"], ["TV", "+688", "Tuvalu"],
  ["UA", "+380", "Ukraine"], ["UY", "+598", "Uruguay"], ["VU", "+678", "Vanuatu"],
  ["VE", "+58", "Venezuela"], ["VN", "+84", "Vietnam"], ["WF", "+681", "Wallis-et-Futuna"],
  ["YE", "+967", "Yémen"], ["ZM", "+260", "Zambie"], ["ZW", "+263", "Zimbabwe"],
];

export const PHONE_COUNTRIES = RAW.map(([iso, dial, name]) => ({ iso, dial, name })).sort((a, b) =>
  a.name.localeCompare(b.name, "fr")
);

// Devine l'indicatif via la langue du navigateur (ex. "fr-FR" -> France)
export function detectDialCode() {
  try {
    const region = (navigator.language || "").split("-")[1]?.toUpperCase();
    const found = PHONE_COUNTRIES.find((c) => c.iso === region);
    if (found) return found.dial;
  } catch (e) {
    /* valeur par défaut */
  }
  return "+33";
}