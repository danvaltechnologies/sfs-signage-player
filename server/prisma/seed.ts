/**
 * Seeds the brands, outlets, roles, an organisation admin and the queue prep
 * timings so a fresh self-hosted install matches the console prototype.
 *
 * Run with: npm run seed
 */
import { PrismaClient, type RoleTier } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const MODULES = [
  "overview",
  "dashboard",
  "screens",
  "media",
  "playlists",
  "schedules",
  "announcements",
  "approvals",
  "queue",
  "users",
  "audit",
];

const brands = [
  { id: "kilimanjaro", name: "Kilimanjaro", code: "KLM", brandCode: "BRD003", accent: "accent" },
  { id: "pizza-jungle", name: "Pizza Jungle", code: "PZJ", brandCode: "BRD004", accent: "accent" },
  { id: "killi-grill", name: "Killi Grill", code: "KGL", brandCode: "BRD005", accent: "accent" },
  { id: "nibbles-creamy", name: "Nibbles Creamy", code: "NBC", brandCode: "BRD006", accent: "accent" },
  { id: "nibbles-bakery", name: "Nibbles Bakery", code: "NBB", brandCode: "BRD007", accent: "accent" },
];

/**
 * Real store list: official brand location codes, e.g. "PHC16Q/BRD003".
 */
const outlets = [
  { brandId: "kilimanjaro", storeCode: "ABA01Q/BRD003", cityCode: "ABA", storeNo: "01", name: "Factory Road", city: "Aba", region: "South East 2" },
  { brandId: "kilimanjaro", storeCode: "ABA02Q/BRD003", cityCode: "ABA", storeNo: "02", name: "Ogbor Hill Road", city: "Aba", region: "South East 2" },
  { brandId: "kilimanjaro", storeCode: "ABA03Q/BRD003", cityCode: "ABA", storeNo: "03", name: "Ariaria Road", city: "Aba", region: "South East 2" },
  { brandId: "kilimanjaro", storeCode: "ABA04Q/BRD003", cityCode: "ABA", storeNo: "04", name: "Ngwa Road", city: "Aba", region: "South East 2" },
  { brandId: "kilimanjaro", storeCode: "ABK01Q/BRD003", cityCode: "ABK", storeNo: "01", name: "Ogoja Road", city: "Abakaliki", region: "South East 1" },
  { brandId: "kilimanjaro", storeCode: "ABE01Q/BRD003", cityCode: "ABE", storeNo: "01", name: "Idiroko Road", city: "Abeokuta", region: "South WEST" },
  { brandId: "kilimanjaro", storeCode: "ABU01Q/BRD003", cityCode: "ABU", storeNo: "01", name: "911 Mall Maitaima", city: "Abuja", region: "Abuja I" },
  { brandId: "kilimanjaro", storeCode: "ABU02Q/BRD003", cityCode: "ABU", storeNo: "02", name: "3rd Avenue Gwarinpa", city: "Abuja", region: "Abuja I" },
  { brandId: "kilimanjaro", storeCode: "ABU03Q/BRD003", cityCode: "ABU", storeNo: "03", name: "Aminu Kano Wuse", city: "Abuja", region: "Abuja II" },
  { brandId: "kilimanjaro", storeCode: "ABU04Q/BRD003", cityCode: "ABU", storeNo: "04", name: "Novare Mall", city: "Abuja", region: "Abuja II" },
  { brandId: "kilimanjaro", storeCode: "ABU05Q/BRD003", cityCode: "ABU", storeNo: "05", name: "Gado Nasko Kubwa", city: "Abuja", region: "Abuja II" },
  { brandId: "kilimanjaro", storeCode: "ABU06Q/BRD003", cityCode: "ABU", storeNo: "06", name: "Kookies Mall", city: "Abuja", region: "Abuja I" },
  { brandId: "kilimanjaro", storeCode: "ABU07Q/BRD003", cityCode: "ABU", storeNo: "07", name: "Fha Lugbe", city: "Abuja", region: "Abuja II" },
  { brandId: "kilimanjaro", storeCode: "ABU08Q/BRD003", cityCode: "ABU", storeNo: "08", name: "Primus Mall Gwarinpa", city: "Abuja", region: "Abuja I" },
  { brandId: "kilimanjaro", storeCode: "ABU09Q/BRD003", cityCode: "ABU", storeNo: "09", name: "Rock Base Mall", city: "Abuja", region: "Abuja I" },
  { brandId: "kilimanjaro", storeCode: "ABU10Q/BRD003", cityCode: "ABU", storeNo: "10", name: "Kuje", city: "Abuja", region: "Abuja I" },
  { brandId: "kilimanjaro", storeCode: "ABU11Q/BRD003", cityCode: "ABU", storeNo: "11", name: "Deidei", city: "Abuja", region: "Abuja II" },
  { brandId: "kilimanjaro", storeCode: "AKU01Q/BRD003", cityCode: "AKU", storeNo: "01", name: "Alagbaka Road", city: "Akure", region: "South WEST" },
  { brandId: "kilimanjaro", storeCode: "AKU01Q/BRD003", cityCode: "AKU", storeNo: "01", name: "Alapere Road", city: "Akure", region: "Lagos II" },
  { brandId: "kilimanjaro", storeCode: "ASA01Q/BRD003", cityCode: "ASA", storeNo: "01", name: "Asaba Mall", city: "Asaba", region: "South South 3" },
  { brandId: "kilimanjaro", storeCode: "ASA02Q/BRD003", cityCode: "ASA", storeNo: "02", name: "Nnebisi Road", city: "Asaba", region: "South South 3" },
  { brandId: "kilimanjaro", storeCode: "ASA03Q/BRD003", cityCode: "ASA", storeNo: "03", name: "Koka Mall", city: "Asaba", region: "South South 3" },
  { brandId: "kilimanjaro", storeCode: "AWK01Q/BRD003", cityCode: "AWK", storeNo: "01", name: "Ikenga Mall", city: "Awka", region: "South East 1" },
  { brandId: "kilimanjaro", storeCode: "BEN01Q/BRD003", cityCode: "BEN", storeNo: "01", name: "Sapele Road", city: "Benin", region: "South South 1" },
  { brandId: "kilimanjaro", storeCode: "BEN02Q/BRD003", cityCode: "BEN", storeNo: "02", name: "Aduwawa", city: "Benin", region: "South South 1" },
  { brandId: "kilimanjaro", storeCode: "BEN03Q/BRD003", cityCode: "BEN", storeNo: "03", name: "Akpakpava", city: "Benin", region: "South South 1" },
  { brandId: "kilimanjaro", storeCode: "BEN04Q/BRD003", cityCode: "BEN", storeNo: "04", name: "Ekenwan Road", city: "Benin", region: "South South 1" },
  { brandId: "kilimanjaro", storeCode: "BEN05Q/BRD003", cityCode: "BEN", storeNo: "05", name: "Benin Mall", city: "Benin", region: "South South 1" },
  { brandId: "kilimanjaro", storeCode: "BEN06Q/BRD003", cityCode: "BEN", storeNo: "06", name: "Iyekogba", city: "Benin", region: "South South 1" },
  { brandId: "kilimanjaro", storeCode: "EKE01Q/BRD003", cityCode: "EKE", storeNo: "01", name: "Oron Road", city: "Eket", region: "South South 2" },
  { brandId: "kilimanjaro", storeCode: "ENU01Q/BRD003", cityCode: "ENU", storeNo: "01", name: "Polo Park Mall", city: "Enugu", region: "South East 1" },
  { brandId: "kilimanjaro", storeCode: "ENU02Q/BRD003", cityCode: "ENU", storeNo: "02", name: "Enugu Mall", city: "Enugu", region: "South East 1" },
  { brandId: "kilimanjaro", storeCode: "ENU03Q/BRD003", cityCode: "ENU", storeNo: "03", name: "Otigba Junction", city: "Enugu", region: "South East 1" },
  { brandId: "kilimanjaro", storeCode: "ENU04Q/BRD003", cityCode: "ENU", storeNo: "04", name: "Agbani Road", city: "Enugu", region: "South East 1" },
  { brandId: "kilimanjaro", storeCode: "IBA01Q/BRD003", cityCode: "IBA", storeNo: "01", name: "Sango Ojoo Road", city: "Ibadan", region: "South WEST" },
  { brandId: "kilimanjaro", storeCode: "IBA03Q/BRD003", cityCode: "IBA", storeNo: "03", name: "Ojoo Roundabout", city: "Ibadan", region: "South WEST" },
  { brandId: "kilimanjaro", storeCode: "IBA04Q/BRD003", cityCode: "IBA", storeNo: "04", name: "Challenge Bus-stop", city: "Ibadan", region: "South WEST" },
  { brandId: "kilimanjaro", storeCode: "IBA05Q/BRD003", cityCode: "IBA", storeNo: "05", name: "Bond Mall MKO Abiola", city: "Ibadan", region: "South WEST" },
  { brandId: "kilimanjaro", storeCode: "IKO01Q/BRD003", cityCode: "IKO", storeNo: "01", name: "New Umuahia Road", city: "Ikot Ekpene", region: "South South 2" },
  { brandId: "kilimanjaro", storeCode: "ILO01Q/BRD003", cityCode: "ILO", storeNo: "01", name: "Post-office Junction", city: "Ilorin", region: "South WEST" },
  { brandId: "kilimanjaro", storeCode: "ILO02Q/BRD003", cityCode: "ILO", storeNo: "02", name: "Asadam Road", city: "Ilorin", region: "South WEST" },
  { brandId: "kilimanjaro", storeCode: "JOS01Q/BRD003", cityCode: "JOS", storeNo: "01", name: "Old Airport Road", city: "Jos", region: "Abuja I" },
  { brandId: "kilimanjaro", storeCode: "KAD01Q/BRD003", cityCode: "KAD", storeNo: "01", name: "Galaxy Mall", city: "Kaduna", region: "Abuja II" },
  { brandId: "kilimanjaro", storeCode: "KAD02Q/BRD003", cityCode: "KAD", storeNo: "02", name: "Yoruba Rd Doka", city: "Kaduna", region: "Abuja II" },
  { brandId: "kilimanjaro", storeCode: "KAD03Q/BRD003", cityCode: "KAD", storeNo: "03", name: "Barnawa Uptown Mall", city: "Kaduna", region: "Abuja II" },
  { brandId: "kilimanjaro", storeCode: "LAG01Q/BRD003", cityCode: "LAG", storeNo: "01", name: "Ozumba Mbadiwe Street", city: "Lagos", region: "Lagos I" },
  { brandId: "kilimanjaro", storeCode: "LAG02Q/BRD003", cityCode: "LAG", storeNo: "02", name: "Gbagada", city: "Lagos", region: "Lagos I" },
  { brandId: "kilimanjaro", storeCode: "LAG02Q/BRD003", cityCode: "LAG", storeNo: "02", name: "MMIA", city: "Lagos", region: "Lagos II" },
  { brandId: "kilimanjaro", storeCode: "LAG03Q/BRD003", cityCode: "LAG", storeNo: "03", name: "Novare Mall", city: "Lagos", region: "Lagos I" },
  { brandId: "kilimanjaro", storeCode: "LAG04Q/BRD003", cityCode: "LAG", storeNo: "04", name: "Okota", city: "Lagos", region: "Lagos I" },
  { brandId: "kilimanjaro", storeCode: "LAG05Q/BRD003", cityCode: "LAG", storeNo: "05", name: "Jara Mall", city: "Lagos", region: "Lagos II" },
  { brandId: "kilimanjaro", storeCode: "LAG06Q/BRD003", cityCode: "LAG", storeNo: "06", name: "Abraham Adesanya", city: "Lagos", region: "Lagos I" },
  { brandId: "kilimanjaro", storeCode: "LAG07Q/BRD003", cityCode: "LAG", storeNo: "07", name: "Sangotedo", city: "Lagos", region: "Lagos I" },
  { brandId: "kilimanjaro", storeCode: "LAG08Q/BRD003", cityCode: "LAG", storeNo: "08", name: "Idimu Road Egbeda", city: "Lagos", region: "Lagos II" },
  { brandId: "kilimanjaro", storeCode: "LAG09Q/BRD003", cityCode: "LAG", storeNo: "09", name: "Ipaja Road", city: "Lagos", region: "Lagos II" },
  { brandId: "kilimanjaro", storeCode: "LAG10Q/BRD003", cityCode: "LAG", storeNo: "10", name: "Ikosi Road", city: "Lagos", region: "Lagos II" },
  { brandId: "kilimanjaro", storeCode: "MAK01Q/BRD003", cityCode: "MAK", storeNo: "01", name: "Iyorchia Ayu Road", city: "Makurdi", region: "Abuja I" },
  { brandId: "kilimanjaro", storeCode: "OGU01Q/BRD003", cityCode: "OGU", storeNo: "01", name: "Idiroko Road", city: "Ogun", region: "Lagos II" },
  { brandId: "kilimanjaro", storeCode: "OGU02Q/BRD003", cityCode: "OGU", storeNo: "02", name: "Benja Ota", city: "Ogun", region: "Lagos II" },
  { brandId: "kilimanjaro", storeCode: "OGU03Q/BRD003", cityCode: "OGU", storeNo: "03", name: "Ofada Road", city: "Ogun", region: "Lagos II" },
  { brandId: "kilimanjaro", storeCode: "ONI01Q/BRD003", cityCode: "ONI", storeNo: "01", name: "Onitsha Mall", city: "Onitsha", region: "South East 1" },
  { brandId: "kilimanjaro", storeCode: "ONI02Q/BRD003", cityCode: "ONI", storeNo: "02", name: "Ogbommanu", city: "Onitsha", region: "South East 1" },
  { brandId: "kilimanjaro", storeCode: "OWE01Q/BRD003", cityCode: "OWE", storeNo: "01", name: "Ikenegbu Layout", city: "Owerri", region: "South East 2" },
  { brandId: "kilimanjaro", storeCode: "OWE02Q/BRD003", cityCode: "OWE", storeNo: "02", name: "Owerri Mall", city: "Owerri", region: "South East 2" },
  { brandId: "kilimanjaro", storeCode: "OWE03Q/BRD003", cityCode: "OWE", storeNo: "03", name: "Orlu Road", city: "Owerri", region: "South East 2" },
  { brandId: "kilimanjaro", storeCode: "OWE04Q/BRD003", cityCode: "OWE", storeNo: "04", name: "Imsu Junction", city: "Owerri", region: "South East 2" },
  { brandId: "kilimanjaro", storeCode: "PHC02Q/BRD003", cityCode: "PHC", storeNo: "02", name: "Agip Road", city: "Port Harcourt", region: "Port Harcourt II" },
  { brandId: "kilimanjaro", storeCode: "PHC02Q/BRD003", cityCode: "PHC", storeNo: "02", name: "Transamadi Road", city: "Port Harcourt", region: "Port Harcourt I" },
  { brandId: "kilimanjaro", storeCode: "PHC03Q/BRD003", cityCode: "PHC", storeNo: "03", name: "Sfl Gra Junction", city: "Port Harcourt", region: "Port Harcourt I" },
  { brandId: "kilimanjaro", storeCode: "PHC04Q/BRD003", cityCode: "PHC", storeNo: "04", name: "Ykc Junction", city: "Port Harcourt", region: "Port Harcourt I" },
  { brandId: "kilimanjaro", storeCode: "PHC05Q/BRD003", cityCode: "PHC", storeNo: "05", name: "Uniport Junction Choba", city: "Port Harcourt", region: "Port Harcourt II" },
  { brandId: "kilimanjaro", storeCode: "PHC06Q/BRD003", cityCode: "PHC", storeNo: "06", name: "Fot Onne", city: "Port Harcourt", region: "Port Harcourt I" },
  { brandId: "kilimanjaro", storeCode: "PHC07Q/BRD003", cityCode: "PHC", storeNo: "07", name: "Rumuibekwe Junction", city: "Port Harcourt", region: "Port Harcourt I" },
  { brandId: "kilimanjaro", storeCode: "PHC08Q/BRD003", cityCode: "PHC", storeNo: "08", name: "Rumuokwuta Roundabout", city: "Port Harcourt", region: "Port Harcourt II" },
  { brandId: "kilimanjaro", storeCode: "PHC09Q/BRD003", cityCode: "PHC", storeNo: "09", name: "Okporo Road", city: "Port Harcourt", region: "Port Harcourt I" },
  { brandId: "kilimanjaro", storeCode: "PHC10Q/BRD003", cityCode: "PHC", storeNo: "10", name: "New Road Rukpokwu", city: "Port Harcourt", region: "Port Harcourt II" },
  { brandId: "kilimanjaro", storeCode: "PHC11Q/BRD003", cityCode: "PHC", storeNo: "11", name: "International Airport", city: "Port Harcourt", region: "Port Harcourt II" },
  { brandId: "kilimanjaro", storeCode: "PHC12Q/BRD003", cityCode: "PHC", storeNo: "12", name: "Elelenwo Road", city: "Port Harcourt", region: "Port Harcourt I" },
  { brandId: "kilimanjaro", storeCode: "PHC13Q/BRD003", cityCode: "PHC", storeNo: "13", name: "Eleme Refinery Junction", city: "Port Harcourt", region: "Port Harcourt I" },
  { brandId: "kilimanjaro", storeCode: "PHC14Q/BRD003", cityCode: "PHC", storeNo: "14", name: "Ibeanu Oyigbo", city: "Port Harcourt", region: "Port Harcourt I" },
  { brandId: "kilimanjaro", storeCode: "PHC15Q/BRD003", cityCode: "PHC", storeNo: "15", name: "Iwofe Portharcourt", city: "Port Harcourt", region: "Port Harcourt II" },
  { brandId: "kilimanjaro", storeCode: "PHC16Q/BRD003", cityCode: "PHC", storeNo: "16", name: "Peter Odili Road", city: "Port Harcourt", region: "Port Harcourt I" },
  { brandId: "kilimanjaro", storeCode: "PHC17Q/BRD003", cityCode: "PHC", storeNo: "17", name: "Akpajo Road", city: "Port Harcourt", region: "Port Harcourt I" },
  { brandId: "kilimanjaro", storeCode: "PHC18Q/BRD003", cityCode: "PHC", storeNo: "18", name: "Stadium Road", city: "Port Harcourt", region: "Port Harcourt I" },
  { brandId: "kilimanjaro", storeCode: "PHC19Q/BRD003", cityCode: "PHC", storeNo: "19", name: "Mile3 Market", city: "Port Harcourt", region: "Port Harcourt I" },
  { brandId: "kilimanjaro", storeCode: "PHC20Q/BRD003", cityCode: "PHC", storeNo: "20", name: "Nta Road", city: "Port Harcourt", region: "Port Harcourt II" },
  { brandId: "kilimanjaro", storeCode: "SAP01Q/BRD003", cityCode: "SAP", storeNo: "01", name: "Ajogodo Road", city: "Sapele", region: "South South 1" },
  { brandId: "kilimanjaro", storeCode: "UGH01Q/BRD003", cityCode: "UGH", storeNo: "01", name: "Patani Road", city: "Ughelli", region: "South South 3" },
  { brandId: "kilimanjaro", storeCode: "UMU01Q/BRD003", cityCode: "UMU", storeNo: "01", name: "Azikiwe Road", city: "Umuahia", region: "South East 2" },
  { brandId: "kilimanjaro", storeCode: "UYO01Q/BRD003", cityCode: "UYO", storeNo: "01", name: "Oron Road", city: "Uyo", region: "South South 2" },
  { brandId: "kilimanjaro", storeCode: "UYO02Q/BRD003", cityCode: "UYO", storeNo: "02", name: "Ikot Ekpene Road", city: "Uyo", region: "South South 2" },
  { brandId: "kilimanjaro", storeCode: "WAR01Q/BRD003", cityCode: "WAR", storeNo: "01", name: "Delta Mall", city: "Warri", region: "South South 3" },
  { brandId: "kilimanjaro", storeCode: "WAR02Q/BRD003", cityCode: "WAR", storeNo: "02", name: "Effurun Sapele Road", city: "Warri", region: "South South 3" },
  { brandId: "kilimanjaro", storeCode: "YEN01Q/BRD003", cityCode: "YEN", storeNo: "01", name: "Mbiama Road", city: "Yenagoa", region: "South South 3" },
  { brandId: "pizza-jungle", storeCode: "LAG11Q/BRD004", cityCode: "LAG", storeNo: "11", name: "Ikeja City Mall", city: "Lagos", region: "Lagos II" },
  { brandId: "pizza-jungle", storeCode: "IBA06Q/BRD004", cityCode: "IBA", storeNo: "06", name: "Ring Road", city: "Ibadan", region: "South West" },
  { brandId: "pizza-jungle", storeCode: "ABU12Q/BRD004", cityCode: "ABU", storeNo: "12", name: "Wuse 2", city: "Abuja", region: "Abuja II" },
  { brandId: "killi-grill", storeCode: "LAG12Q/BRD005", cityCode: "LAG", storeNo: "12", name: "Yaba", city: "Lagos", region: "Lagos I" },
  { brandId: "killi-grill", storeCode: "ENU05Q/BRD005", cityCode: "ENU", storeNo: "05", name: "Ogui Road", city: "Enugu", region: "South East 1" },
  { brandId: "killi-grill", storeCode: "PHC21Q/BRD005", cityCode: "PHC", storeNo: "21", name: "Aba Road", city: "Port Harcourt", region: "Port Harcourt I" },
  { brandId: "nibbles-creamy", storeCode: "LAG13Q/BRD006", cityCode: "LAG", storeNo: "13", name: "Surulere", city: "Lagos", region: "Lagos I" },
  { brandId: "nibbles-creamy", storeCode: "PHC22Q/BRD006", cityCode: "PHC", storeNo: "22", name: "Peter Odili Road", city: "Port Harcourt", region: "Port Harcourt I" },
  { brandId: "nibbles-bakery", storeCode: "ABU13Q/BRD007", cityCode: "ABU", storeNo: "13", name: "Garki", city: "Abuja", region: "Abuja I" },
  { brandId: "nibbles-bakery", storeCode: "PHC23Q/BRD007", cityCode: "PHC", storeNo: "23", name: "Trans Amadi", city: "Port Harcourt", region: "Port Harcourt I" },
  { brandId: "nibbles-bakery", storeCode: "KAD04Q/BRD007", cityCode: "KAD", storeNo: "04", name: "Kachia Road", city: "Kaduna", region: "Abuja II" },
];

const roles: Array<{
  key: string;
  name: string;
  tier: RoleTier;
  allBrands: boolean;
  modules: string[];
  canPublish: boolean;
  canApprove: boolean;
  canManageUsers: boolean;
  description: string;
}> = [
  {
    key: "super-admin",
    name: "Super Admin",
    tier: "ORGANIZATION",
    allBrands: true,
    modules: MODULES,
    canPublish: true,
    canApprove: true,
    canManageUsers: true,
    description: "Full access across every brand, including user management and audit.",
  },
  {
    key: "org-admin",
    name: "Organisation Admin",
    tier: "ORGANIZATION",
    allBrands: true,
    modules: MODULES.filter((m) => m !== "users"),
    canPublish: true,
    canApprove: true,
    canManageUsers: false,
    description: "Organisation-wide operations without user administration.",
  },
  {
    key: "brand-admin",
    name: "Brand Admin",
    tier: "BRAND",
    allBrands: false,
    modules: MODULES.filter((m) => m !== "overview" && m !== "audit"),
    canPublish: true,
    canApprove: true,
    canManageUsers: true,
    description: "Runs one or more brands and approves their content.",
  },
  {
    key: "line-manager",
    name: "Line Manager",
    tier: "BRAND",
    allBrands: false,
    modules: ["dashboard", "screens", "media", "playlists", "schedules", "announcements", "approvals", "queue"],
    canPublish: true,
    canApprove: true,
    canManageUsers: false,
    description: "Approves content submitted by content managers before it goes live.",
  },
  {
    key: "content-manager",
    name: "Content Manager",
    tier: "BRAND",
    allBrands: false,
    modules: ["dashboard", "media", "playlists", "schedules", "announcements", "approvals"],
    canPublish: false,
    canApprove: false,
    canManageUsers: false,
    description: "Creates creatives, playlists and campaigns and submits them for approval.",
  },
  {
    key: "outlet-manager",
    name: "Outlet Manager",
    tier: "OUTLET",
    allBrands: false,
    modules: ["dashboard", "screens", "queue"],
    canPublish: false,
    canApprove: false,
    canManageUsers: false,
    description: "Watches the screens and the order queue for a single outlet.",
  },
];

const prepConfig = [
  {
    brandId: "kilimanjaro",
    defaultMinutes: 7,
    autoCollectAfter: 6,
    rules: [
      { product: "Rice bowls & jollof", keywords: ["jollof", "rice", "bowl"], minutes: 6 },
      { product: "Grills & chicken", keywords: ["chicken", "grill", "suya"], minutes: 9 },
      { product: "Family packs & combos", keywords: ["family", "combo", "pack"], minutes: 13 },
      { product: "Pies & sides", keywords: ["pie", "fries", "moi", "side"], minutes: 4 },
    ],
  },
  {
    brandId: "pizza-jungle",
    defaultMinutes: 14,
    autoCollectAfter: 8,
    rules: [
      { product: "Medium pizza", keywords: ["medium"], minutes: 12 },
      { product: "Large pizza", keywords: ["large", "pepperoni", "bbq"], minutes: 16 },
      { product: "Wings & sides", keywords: ["wing", "side", "garlic"], minutes: 8 },
    ],
  },
  {
    brandId: "killi-grill",
    defaultMinutes: 10,
    autoCollectAfter: 6,
    rules: [
      { product: "Skewers", keywords: ["skewer", "kebab"], minutes: 8 },
      { product: "Grill platters", keywords: ["platter", "grill"], minutes: 14 },
    ],
  },
  {
    brandId: "nibbles-creamy",
    defaultMinutes: 4,
    autoCollectAfter: 4,
    rules: [
      { product: "Scoops & sundaes", keywords: ["sundae", "scoop", "cone"], minutes: 3 },
      { product: "Milkshakes", keywords: ["shake", "smoothie"], minutes: 5 },
      { product: "Waffles", keywords: ["waffle", "pancake"], minutes: 7 },
    ],
  },
  {
    brandId: "nibbles-bakery",
    defaultMinutes: 5,
    autoCollectAfter: 5,
    rules: [
      { product: "Bread & loaves", keywords: ["bread", "loaf"], minutes: 3 },
      { product: "Pastries", keywords: ["croissant", "doughnut", "pastry"], minutes: 6 },
      { product: "Cakes to order", keywords: ["cake"], minutes: 20 },
    ],
  },
];

async function main() {
  for (const brand of brands) {
    await prisma.brand.upsert({ where: { id: brand.id }, create: brand, update: brand });
  }

  for (const outlet of outlets) {
    await prisma.outlet.upsert({
      where: { storeCode: outlet.storeCode },
      create: outlet,
      update: outlet,
    });
  }

  for (const role of roles) {
    await prisma.role.upsert({ where: { key: role.key }, create: role, update: role });
  }

  for (const config of prepConfig) {
    await prisma.brandPrepConfig.upsert({
      where: { brandId: config.brandId },
      create: {
        brandId: config.brandId,
        defaultMinutes: config.defaultMinutes,
        autoCollectAfter: config.autoCollectAfter,
      },
      update: { defaultMinutes: config.defaultMinutes, autoCollectAfter: config.autoCollectAfter },
    });
    for (const rule of config.rules) {
      const existing = await prisma.prepRule.findFirst({
        where: { brandId: config.brandId, product: rule.product },
      });
      if (existing) {
        await prisma.prepRule.update({ where: { id: existing.id }, data: rule });
      } else {
        await prisma.prepRule.create({ data: { ...rule, brandId: config.brandId } });
      }
    }
  }

  const superAdmin = await prisma.role.findUniqueOrThrow({ where: { key: "super-admin" } });
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@sundryfoods.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe!2026";
  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: "Sundry Super Admin",
      roleId: superAdmin.id,
      status: "ACTIVE",
      modules: [],
      passwordHash: await bcrypt.hash(password, 12),
    },
    update: { roleId: superAdmin.id, status: "ACTIVE" },
  });

  // eslint-disable-next-line no-console
  console.log(`Seed complete. Super admin: ${email}`);
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
