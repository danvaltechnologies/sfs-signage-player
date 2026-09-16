/**
 * Sundry Foods store registry and screen naming convention.
 *
 * Store codes come from the official brand location list, e.g.
 *   PHC16Q/BRD003 = "Kilimanjaro-Peter Odili Road, Portharcourt"
 *
 * Screen IDs follow the naming legend:
 *   BRAND-LOC-STORE#-ZONE-SCREENTYPE-##
 *   e.g. SFL-PH-01-CTR-MNU-01
 */

export type Store = {
  /** Official brand location code, e.g. "PHC16Q/BRD003". */
  code: string;
  /** Location half of the code, e.g. "PHC16Q". */
  locationCode: string;
  /** 3-letter city code used in screen IDs. */
  cityCode: string;
  /** Store number within the city (2 digits). */
  storeNo: string;
  brandId: string;
  name: string;
  city: string;
  region: string;
};

/** Brand codes used as the BRAND segment of a screen ID. */
export const brandCodes: Record<string, { code: string; brandCode: string }> = {
  kilimanjaro: { code: "KLM", brandCode: "BRD003" },
  "pizza-jungle": { code: "PZJ", brandCode: "BRD004" },
  "killi-grill": { code: "KGL", brandCode: "BRD005" },
  "nibbles-creamy": { code: "NBC", brandCode: "BRD006" },
  "nibbles-bakery": { code: "NBB", brandCode: "BRD007" },
};

/** Where in the store a screen physically sits. */
export const zoneCodes = [
  { code: "CTR", label: "Counter" },
  { code: "DIN", label: "Dining area" },
  { code: "DRV", label: "Drive-thru" },
  { code: "ENT", label: "Entrance / window" },
  { code: "KIT", label: "Kitchen pass" },
  { code: "TKA", label: "Takeaway point" },
] as const;

/** What kind of content the screen pushes. */
export const screenTypeCodes = [
  { code: "MNU", label: "Menu Board" },
  { code: "PRO", label: "Promo" },
  { code: "QMS", label: "Queue (QMS)" },
  { code: "WAY", label: "Wayfinding" },
] as const;

export type ZoneCode = (typeof zoneCodes)[number]["code"];
export type ScreenTypeCode = (typeof screenTypeCodes)[number]["code"];

/** Builds a screen ID: BRAND-LOC-STORE#-ZONE-SCREENTYPE-## */
export function buildScreenId(parts: {
  brandId: string;
  cityCode: string;
  storeNo: string;
  zone: string;
  screenType: string;
  seq: number | string;
}): string {
  const brand = brandCodes[parts.brandId]?.code ?? parts.brandId.slice(0, 3).toUpperCase();
  const pad = (v: number | string) => String(v).padStart(2, "0");
  return [brand, parts.cityCode, pad(parts.storeNo), parts.zone, parts.screenType, pad(parts.seq)].join("-");
}

/** Human label for a store, e.g. "Peter Odili Road, Port Harcourt". */
export const storeLabel = (s: Store) => `${s.name}, ${s.city}`;

export const stores: Store[] = [
  { code: "ABA01Q/BRD003", locationCode: "ABA01Q", cityCode: "ABA", storeNo: "01", brandId: "kilimanjaro", name: "Factory Road", city: "Aba", region: "South East 2" },
  { code: "ABA02Q/BRD003", locationCode: "ABA02Q", cityCode: "ABA", storeNo: "02", brandId: "kilimanjaro", name: "Ogbor Hill Road", city: "Aba", region: "South East 2" },
  { code: "ABA03Q/BRD003", locationCode: "ABA03Q", cityCode: "ABA", storeNo: "03", brandId: "kilimanjaro", name: "Ariaria Road", city: "Aba", region: "South East 2" },
  { code: "ABA04Q/BRD003", locationCode: "ABA04Q", cityCode: "ABA", storeNo: "04", brandId: "kilimanjaro", name: "Ngwa Road", city: "Aba", region: "South East 2" },
  { code: "ABK01Q/BRD003", locationCode: "ABK01Q", cityCode: "ABK", storeNo: "01", brandId: "kilimanjaro", name: "Ogoja Road", city: "Abakaliki", region: "South East 1" },
  { code: "ABE01Q/BRD003", locationCode: "ABE01Q", cityCode: "ABE", storeNo: "01", brandId: "kilimanjaro", name: "Idiroko Road", city: "Abeokuta", region: "South West" },
  { code: "ABU01Q/BRD003", locationCode: "ABU01Q", cityCode: "ABU", storeNo: "01", brandId: "kilimanjaro", name: "911 Mall Maitaima", city: "Abuja", region: "Abuja I" },
  { code: "ABU02Q/BRD003", locationCode: "ABU02Q", cityCode: "ABU", storeNo: "02", brandId: "kilimanjaro", name: "3rd Avenue Gwarinpa", city: "Abuja", region: "Abuja I" },
  { code: "ABU03Q/BRD003", locationCode: "ABU03Q", cityCode: "ABU", storeNo: "03", brandId: "kilimanjaro", name: "Aminu Kano Wuse", city: "Abuja", region: "Abuja II" },
  { code: "ABU04Q/BRD003", locationCode: "ABU04Q", cityCode: "ABU", storeNo: "04", brandId: "kilimanjaro", name: "Novare Mall", city: "Abuja", region: "Abuja II" },
  { code: "ABU05Q/BRD003", locationCode: "ABU05Q", cityCode: "ABU", storeNo: "05", brandId: "kilimanjaro", name: "Gado Nasko Kubwa", city: "Abuja", region: "Abuja II" },
  { code: "ABU06Q/BRD003", locationCode: "ABU06Q", cityCode: "ABU", storeNo: "06", brandId: "kilimanjaro", name: "Kookies Mall", city: "Abuja", region: "Abuja I" },
  { code: "ABU07Q/BRD003", locationCode: "ABU07Q", cityCode: "ABU", storeNo: "07", brandId: "kilimanjaro", name: "Fha Lugbe", city: "Abuja", region: "Abuja II" },
  { code: "ABU08Q/BRD003", locationCode: "ABU08Q", cityCode: "ABU", storeNo: "08", brandId: "kilimanjaro", name: "Primus Mall Gwarinpa", city: "Abuja", region: "Abuja I" },
  { code: "ABU09Q/BRD003", locationCode: "ABU09Q", cityCode: "ABU", storeNo: "09", brandId: "kilimanjaro", name: "Rock Base Mall", city: "Abuja", region: "Abuja I" },
  { code: "ABU10Q/BRD003", locationCode: "ABU10Q", cityCode: "ABU", storeNo: "10", brandId: "kilimanjaro", name: "Kuje", city: "Abuja", region: "Abuja I" },
  { code: "ABU11Q/BRD003", locationCode: "ABU11Q", cityCode: "ABU", storeNo: "11", brandId: "kilimanjaro", name: "Deidei", city: "Abuja", region: "Abuja II" },
  { code: "AKU01Q/BRD003", locationCode: "AKU01Q", cityCode: "AKU", storeNo: "01", brandId: "kilimanjaro", name: "Alagbaka Road", city: "Akure", region: "South West" },
  { code: "AKU01Q/BRD003", locationCode: "AKU01Q", cityCode: "AKU", storeNo: "01", brandId: "kilimanjaro", name: "Alapere Road", city: "Akure", region: "Lagos II" },
  { code: "ASA01Q/BRD003", locationCode: "ASA01Q", cityCode: "ASA", storeNo: "01", brandId: "kilimanjaro", name: "Asaba Mall", city: "Asaba", region: "South South 3" },
  { code: "ASA02Q/BRD003", locationCode: "ASA02Q", cityCode: "ASA", storeNo: "02", brandId: "kilimanjaro", name: "Nnebisi Road", city: "Asaba", region: "South South 3" },
  { code: "ASA03Q/BRD003", locationCode: "ASA03Q", cityCode: "ASA", storeNo: "03", brandId: "kilimanjaro", name: "Koka Mall", city: "Asaba", region: "South South 3" },
  { code: "AWK01Q/BRD003", locationCode: "AWK01Q", cityCode: "AWK", storeNo: "01", brandId: "kilimanjaro", name: "Ikenga Mall", city: "Awka", region: "South East 1" },
  { code: "BEN01Q/BRD003", locationCode: "BEN01Q", cityCode: "BEN", storeNo: "01", brandId: "kilimanjaro", name: "Sapele Road", city: "Benin", region: "South South 1" },
  { code: "BEN02Q/BRD003", locationCode: "BEN02Q", cityCode: "BEN", storeNo: "02", brandId: "kilimanjaro", name: "Aduwawa", city: "Benin", region: "South South 1" },
  { code: "BEN03Q/BRD003", locationCode: "BEN03Q", cityCode: "BEN", storeNo: "03", brandId: "kilimanjaro", name: "Akpakpava", city: "Benin", region: "South South 1" },
  { code: "BEN04Q/BRD003", locationCode: "BEN04Q", cityCode: "BEN", storeNo: "04", brandId: "kilimanjaro", name: "Ekenwan Road", city: "Benin", region: "South South 1" },
  { code: "BEN05Q/BRD003", locationCode: "BEN05Q", cityCode: "BEN", storeNo: "05", brandId: "kilimanjaro", name: "Benin Mall", city: "Benin", region: "South South 1" },
  { code: "BEN06Q/BRD003", locationCode: "BEN06Q", cityCode: "BEN", storeNo: "06", brandId: "kilimanjaro", name: "Iyekogba", city: "Benin", region: "South South 1" },
  { code: "EKE01Q/BRD003", locationCode: "EKE01Q", cityCode: "EKE", storeNo: "01", brandId: "kilimanjaro", name: "Oron Road", city: "Eket", region: "South South 2" },
  { code: "ENU01Q/BRD003", locationCode: "ENU01Q", cityCode: "ENU", storeNo: "01", brandId: "kilimanjaro", name: "Polo Park Mall", city: "Enugu", region: "South East 1" },
  { code: "ENU02Q/BRD003", locationCode: "ENU02Q", cityCode: "ENU", storeNo: "02", brandId: "kilimanjaro", name: "Enugu Mall", city: "Enugu", region: "South East 1" },
  { code: "ENU03Q/BRD003", locationCode: "ENU03Q", cityCode: "ENU", storeNo: "03", brandId: "kilimanjaro", name: "Otigba Junction", city: "Enugu", region: "South East 1" },
  { code: "ENU04Q/BRD003", locationCode: "ENU04Q", cityCode: "ENU", storeNo: "04", brandId: "kilimanjaro", name: "Agbani Road", city: "Enugu", region: "South East 1" },
  { code: "IBA01Q/BRD003", locationCode: "IBA01Q", cityCode: "IBA", storeNo: "01", brandId: "kilimanjaro", name: "Sango Ojoo Road", city: "Ibadan", region: "South West" },
  { code: "IBA03Q/BRD003", locationCode: "IBA03Q", cityCode: "IBA", storeNo: "03", brandId: "kilimanjaro", name: "Ojoo Roundabout", city: "Ibadan", region: "South West" },
  { code: "IBA04Q/BRD003", locationCode: "IBA04Q", cityCode: "IBA", storeNo: "04", brandId: "kilimanjaro", name: "Challenge Bus-stop", city: "Ibadan", region: "South West" },
  { code: "IBA05Q/BRD003", locationCode: "IBA05Q", cityCode: "IBA", storeNo: "05", brandId: "kilimanjaro", name: "Bond Mall MKO Abiola", city: "Ibadan", region: "South West" },
  { code: "IKO01Q/BRD003", locationCode: "IKO01Q", cityCode: "IKO", storeNo: "01", brandId: "kilimanjaro", name: "New Umuahia Road", city: "Ikot Ekpene", region: "South South 2" },
  { code: "ILO01Q/BRD003", locationCode: "ILO01Q", cityCode: "ILO", storeNo: "01", brandId: "kilimanjaro", name: "Post-office Junction", city: "Ilorin", region: "South West" },
  { code: "ILO02Q/BRD003", locationCode: "ILO02Q", cityCode: "ILO", storeNo: "02", brandId: "kilimanjaro", name: "Asadam Road", city: "Ilorin", region: "South West" },
  { code: "JOS01Q/BRD003", locationCode: "JOS01Q", cityCode: "JOS", storeNo: "01", brandId: "kilimanjaro", name: "Old Airport Road", city: "Jos", region: "Abuja I" },
  { code: "KAD01Q/BRD003", locationCode: "KAD01Q", cityCode: "KAD", storeNo: "01", brandId: "kilimanjaro", name: "Galaxy Mall", city: "Kaduna", region: "Abuja II" },
  { code: "KAD02Q/BRD003", locationCode: "KAD02Q", cityCode: "KAD", storeNo: "02", brandId: "kilimanjaro", name: "Yoruba Rd Doka", city: "Kaduna", region: "Abuja II" },
  { code: "KAD03Q/BRD003", locationCode: "KAD03Q", cityCode: "KAD", storeNo: "03", brandId: "kilimanjaro", name: "Barnawa Uptown Mall", city: "Kaduna", region: "Abuja II" },
  { code: "LAG01Q/BRD003", locationCode: "LAG01Q", cityCode: "LAG", storeNo: "01", brandId: "kilimanjaro", name: "Ozumba Mbadiwe Street", city: "Lagos", region: "Lagos I" },
  { code: "LAG02Q/BRD003", locationCode: "LAG02Q", cityCode: "LAG", storeNo: "02", brandId: "kilimanjaro", name: "Gbagada", city: "Lagos", region: "Lagos I" },
  { code: "LAG02Q/BRD003", locationCode: "LAG02Q", cityCode: "LAG", storeNo: "02", brandId: "kilimanjaro", name: "MMIA", city: "Lagos", region: "Lagos II" },
  { code: "LAG03Q/BRD003", locationCode: "LAG03Q", cityCode: "LAG", storeNo: "03", brandId: "kilimanjaro", name: "Novare Mall", city: "Lagos", region: "Lagos I" },
  { code: "LAG04Q/BRD003", locationCode: "LAG04Q", cityCode: "LAG", storeNo: "04", brandId: "kilimanjaro", name: "Okota", city: "Lagos", region: "Lagos I" },
  { code: "LAG05Q/BRD003", locationCode: "LAG05Q", cityCode: "LAG", storeNo: "05", brandId: "kilimanjaro", name: "Jara Mall", city: "Lagos", region: "Lagos II" },
  { code: "LAG06Q/BRD003", locationCode: "LAG06Q", cityCode: "LAG", storeNo: "06", brandId: "kilimanjaro", name: "Abraham Adesanya", city: "Lagos", region: "Lagos I" },
  { code: "LAG07Q/BRD003", locationCode: "LAG07Q", cityCode: "LAG", storeNo: "07", brandId: "kilimanjaro", name: "Sangotedo", city: "Lagos", region: "Lagos I" },
  { code: "LAG08Q/BRD003", locationCode: "LAG08Q", cityCode: "LAG", storeNo: "08", brandId: "kilimanjaro", name: "Idimu Road Egbeda", city: "Lagos", region: "Lagos II" },
  { code: "LAG09Q/BRD003", locationCode: "LAG09Q", cityCode: "LAG", storeNo: "09", brandId: "kilimanjaro", name: "Ipaja Road", city: "Lagos", region: "Lagos II" },
  { code: "LAG10Q/BRD003", locationCode: "LAG10Q", cityCode: "LAG", storeNo: "10", brandId: "kilimanjaro", name: "Ikosi Road", city: "Lagos", region: "Lagos II" },
  { code: "MAK01Q/BRD003", locationCode: "MAK01Q", cityCode: "MAK", storeNo: "01", brandId: "kilimanjaro", name: "Iyorchia Ayu Road", city: "Makurdi", region: "Abuja I" },
  { code: "OGU01Q/BRD003", locationCode: "OGU01Q", cityCode: "OGU", storeNo: "01", brandId: "kilimanjaro", name: "Idiroko Road", city: "Ogun", region: "Lagos II" },
  { code: "OGU02Q/BRD003", locationCode: "OGU02Q", cityCode: "OGU", storeNo: "02", brandId: "kilimanjaro", name: "Benja Ota", city: "Ogun", region: "Lagos II" },
  { code: "OGU03Q/BRD003", locationCode: "OGU03Q", cityCode: "OGU", storeNo: "03", brandId: "kilimanjaro", name: "Ofada Road", city: "Ogun", region: "Lagos II" },
  { code: "ONI01Q/BRD003", locationCode: "ONI01Q", cityCode: "ONI", storeNo: "01", brandId: "kilimanjaro", name: "Onitsha Mall", city: "Onitsha", region: "South East 1" },
  { code: "ONI02Q/BRD003", locationCode: "ONI02Q", cityCode: "ONI", storeNo: "02", brandId: "kilimanjaro", name: "Ogbommanu", city: "Onitsha", region: "South East 1" },
  { code: "OWE01Q/BRD003", locationCode: "OWE01Q", cityCode: "OWE", storeNo: "01", brandId: "kilimanjaro", name: "Ikenegbu Layout", city: "Owerri", region: "South East 2" },
  { code: "OWE02Q/BRD003", locationCode: "OWE02Q", cityCode: "OWE", storeNo: "02", brandId: "kilimanjaro", name: "Owerri Mall", city: "Owerri", region: "South East 2" },
  { code: "OWE03Q/BRD003", locationCode: "OWE03Q", cityCode: "OWE", storeNo: "03", brandId: "kilimanjaro", name: "Orlu Road", city: "Owerri", region: "South East 2" },
  { code: "OWE04Q/BRD003", locationCode: "OWE04Q", cityCode: "OWE", storeNo: "04", brandId: "kilimanjaro", name: "Imsu Junction", city: "Owerri", region: "South East 2" },
  { code: "PHC02Q/BRD003", locationCode: "PHC02Q", cityCode: "PHC", storeNo: "02", brandId: "kilimanjaro", name: "Agip Road", city: "Port Harcourt", region: "Port Harcourt II" },
  { code: "PHC02Q/BRD003", locationCode: "PHC02Q", cityCode: "PHC", storeNo: "02", brandId: "kilimanjaro", name: "Transamadi Road", city: "Port Harcourt", region: "Port Harcourt I" },
  { code: "PHC03Q/BRD003", locationCode: "PHC03Q", cityCode: "PHC", storeNo: "03", brandId: "kilimanjaro", name: "Sfl Gra Junction", city: "Port Harcourt", region: "Port Harcourt I" },
  { code: "PHC04Q/BRD003", locationCode: "PHC04Q", cityCode: "PHC", storeNo: "04", brandId: "kilimanjaro", name: "Ykc Junction", city: "Port Harcourt", region: "Port Harcourt I" },
  { code: "PHC05Q/BRD003", locationCode: "PHC05Q", cityCode: "PHC", storeNo: "05", brandId: "kilimanjaro", name: "Uniport Junction Choba", city: "Port Harcourt", region: "Port Harcourt II" },
  { code: "PHC06Q/BRD003", locationCode: "PHC06Q", cityCode: "PHC", storeNo: "06", brandId: "kilimanjaro", name: "Fot Onne", city: "Port Harcourt", region: "Port Harcourt I" },
  { code: "PHC07Q/BRD003", locationCode: "PHC07Q", cityCode: "PHC", storeNo: "07", brandId: "kilimanjaro", name: "Rumuibekwe Junction", city: "Port Harcourt", region: "Port Harcourt I" },
  { code: "PHC08Q/BRD003", locationCode: "PHC08Q", cityCode: "PHC", storeNo: "08", brandId: "kilimanjaro", name: "Rumuokwuta Roundabout", city: "Port Harcourt", region: "Port Harcourt II" },
  { code: "PHC09Q/BRD003", locationCode: "PHC09Q", cityCode: "PHC", storeNo: "09", brandId: "kilimanjaro", name: "Okporo Road", city: "Port Harcourt", region: "Port Harcourt I" },
  { code: "PHC10Q/BRD003", locationCode: "PHC10Q", cityCode: "PHC", storeNo: "10", brandId: "kilimanjaro", name: "New Road Rukpokwu", city: "Port Harcourt", region: "Port Harcourt II" },
  { code: "PHC11Q/BRD003", locationCode: "PHC11Q", cityCode: "PHC", storeNo: "11", brandId: "kilimanjaro", name: "International Airport", city: "Port Harcourt", region: "Port Harcourt II" },
  { code: "PHC12Q/BRD003", locationCode: "PHC12Q", cityCode: "PHC", storeNo: "12", brandId: "kilimanjaro", name: "Elelenwo Road", city: "Port Harcourt", region: "Port Harcourt I" },
  { code: "PHC13Q/BRD003", locationCode: "PHC13Q", cityCode: "PHC", storeNo: "13", brandId: "kilimanjaro", name: "Eleme Refinery Junction", city: "Port Harcourt", region: "Port Harcourt I" },
  { code: "PHC14Q/BRD003", locationCode: "PHC14Q", cityCode: "PHC", storeNo: "14", brandId: "kilimanjaro", name: "Ibeanu Oyigbo", city: "Port Harcourt", region: "Port Harcourt I" },
  { code: "PHC15Q/BRD003", locationCode: "PHC15Q", cityCode: "PHC", storeNo: "15", brandId: "kilimanjaro", name: "Iwofe Portharcourt", city: "Port Harcourt", region: "Port Harcourt II" },
  { code: "PHC16Q/BRD003", locationCode: "PHC16Q", cityCode: "PHC", storeNo: "16", brandId: "kilimanjaro", name: "Peter Odili Road", city: "Port Harcourt", region: "Port Harcourt I" },
  { code: "PHC17Q/BRD003", locationCode: "PHC17Q", cityCode: "PHC", storeNo: "17", brandId: "kilimanjaro", name: "Akpajo Road", city: "Port Harcourt", region: "Port Harcourt I" },
  { code: "PHC18Q/BRD003", locationCode: "PHC18Q", cityCode: "PHC", storeNo: "18", brandId: "kilimanjaro", name: "Stadium Road", city: "Port Harcourt", region: "Port Harcourt I" },
  { code: "PHC19Q/BRD003", locationCode: "PHC19Q", cityCode: "PHC", storeNo: "19", brandId: "kilimanjaro", name: "Mile3 Market", city: "Port Harcourt", region: "Port Harcourt I" },
  { code: "PHC20Q/BRD003", locationCode: "PHC20Q", cityCode: "PHC", storeNo: "20", brandId: "kilimanjaro", name: "Nta Road", city: "Port Harcourt", region: "Port Harcourt II" },
  { code: "SAP01Q/BRD003", locationCode: "SAP01Q", cityCode: "SAP", storeNo: "01", brandId: "kilimanjaro", name: "Ajogodo Road", city: "Sapele", region: "South South 1" },
  { code: "UGH01Q/BRD003", locationCode: "UGH01Q", cityCode: "UGH", storeNo: "01", brandId: "kilimanjaro", name: "Patani Road", city: "Ughelli", region: "South South 3" },
  { code: "UMU01Q/BRD003", locationCode: "UMU01Q", cityCode: "UMU", storeNo: "01", brandId: "kilimanjaro", name: "Azikiwe Road", city: "Umuahia", region: "South East 2" },
  { code: "UYO01Q/BRD003", locationCode: "UYO01Q", cityCode: "UYO", storeNo: "01", brandId: "kilimanjaro", name: "Oron Road", city: "Uyo", region: "South South 2" },
  { code: "UYO02Q/BRD003", locationCode: "UYO02Q", cityCode: "UYO", storeNo: "02", brandId: "kilimanjaro", name: "Ikot Ekpene Road", city: "Uyo", region: "South South 2" },
  { code: "WAR01Q/BRD003", locationCode: "WAR01Q", cityCode: "WAR", storeNo: "01", brandId: "kilimanjaro", name: "Delta Mall", city: "Warri", region: "South South 3" },
  { code: "WAR02Q/BRD003", locationCode: "WAR02Q", cityCode: "WAR", storeNo: "02", brandId: "kilimanjaro", name: "Effurun Sapele Road", city: "Warri", region: "South South 3" },
  { code: "YEN01Q/BRD003", locationCode: "YEN01Q", cityCode: "YEN", storeNo: "01", brandId: "kilimanjaro", name: "Mbiama Road", city: "Yenagoa", region: "South South 3" },
  { code: "LAG11Q/BRD004", locationCode: "LAG11Q", cityCode: "LAG", storeNo: "11", brandId: "pizza-jungle", name: "Ikeja City Mall", city: "Lagos", region: "Lagos II" },
  { code: "IBA06Q/BRD004", locationCode: "IBA06Q", cityCode: "IBA", storeNo: "06", brandId: "pizza-jungle", name: "Ring Road", city: "Ibadan", region: "South West" },
  { code: "ABU12Q/BRD004", locationCode: "ABU12Q", cityCode: "ABU", storeNo: "12", brandId: "pizza-jungle", name: "Wuse 2", city: "Abuja", region: "Abuja II" },
  { code: "LAG12Q/BRD005", locationCode: "LAG12Q", cityCode: "LAG", storeNo: "12", brandId: "killi-grill", name: "Yaba", city: "Lagos", region: "Lagos I" },
  { code: "ENU05Q/BRD005", locationCode: "ENU05Q", cityCode: "ENU", storeNo: "05", brandId: "killi-grill", name: "Ogui Road", city: "Enugu", region: "South East 1" },
  { code: "PHC21Q/BRD005", locationCode: "PHC21Q", cityCode: "PHC", storeNo: "21", brandId: "killi-grill", name: "Aba Road", city: "Port Harcourt", region: "Port Harcourt I" },
  { code: "LAG13Q/BRD006", locationCode: "LAG13Q", cityCode: "LAG", storeNo: "13", brandId: "nibbles-creamy", name: "Surulere", city: "Lagos", region: "Lagos I" },
  { code: "PHC22Q/BRD006", locationCode: "PHC22Q", cityCode: "PHC", storeNo: "22", brandId: "nibbles-creamy", name: "Peter Odili Road", city: "Port Harcourt", region: "Port Harcourt I" },
  { code: "ABU13Q/BRD007", locationCode: "ABU13Q", cityCode: "ABU", storeNo: "13", brandId: "nibbles-bakery", name: "Garki", city: "Abuja", region: "Abuja I" },
  { code: "PHC23Q/BRD007", locationCode: "PHC23Q", cityCode: "PHC", storeNo: "23", brandId: "nibbles-bakery", name: "Trans Amadi", city: "Port Harcourt", region: "Port Harcourt I" },
  { code: "KAD04Q/BRD007", locationCode: "KAD04Q", cityCode: "KAD", storeNo: "04", brandId: "nibbles-bakery", name: "Kachia Road", city: "Kaduna", region: "Abuja II" },
];

export const storesForBrand = (brandId: string) => stores.filter((s) => s.brandId === brandId);

export const cityCodes = Array.from(
  new Map(stores.map((s) => [s.cityCode, { code: s.cityCode, city: s.city }])).values(),
).sort((a, b) => a.city.localeCompare(b.city));

export const regions = Array.from(new Set(stores.map((s) => s.region))).sort();
