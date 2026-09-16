export type Status = "online" | "syncing" | "failed" | "offline";
export type ScreenType = "Menu Board" | "Promo" | "Queue (QMS)";

export type Brand = {
  id: string;
  name: string;
  screens: number;
  /** Brand identity color (hex). Drives that workspace's accent, focus rings and primary buttons app-wide. */
  color: string;
};

export const brands: Brand[] = [
  { id: "kilimanjaro", name: "Kilimanjaro", screens: 62, color: "#E4002B" },
  { id: "pizza-jungle", name: "Pizza Jungle", screens: 48, color: "#1F6B3B" },
  { id: "killi-grill", name: "Killi Grill", screens: 41, color: "#E4002B" },
  { id: "nibbles-creamy", name: "Nibbles Creamy", screens: 34, color: "#6B3E26" },
  { id: "nibbles-bakery", name: "Nibbles Bakery", screens: 29, color: "#1D3F72" },
];

export type Screen = {
  id: string;
  brandId: string;
  /** Screen ID per the naming legend: BRAND-LOC-STORE#-ZONE-SCREENTYPE-## */
  code: string;
  /** Official brand location code of the store, e.g. "PHC12Q/BRD003". */
  storeCode?: string;
  /** Zone code where the screen sits, e.g. "CTR". */
  zone?: string;
  location: string;
  city: string;
  region: string;
  type: ScreenType;
  lastSync: string;
  status: Status;
  firmware: string;
  playing: string;
};

export const screens: Screen[] = [
  {
    id: "s1",
    brandId: "kilimanjaro",
    code: "KLM-LAG-01-CTR-MNU-01",
    storeCode: "LAG01Q/BRD003",
    zone: "CTR",
    location: "Ozumba Mbadiwe Street",
    city: "Lagos",
    region: "Lagos I",
    type: "Menu Board",
    lastSync: "14:31:02",
    status: "online",
    firmware: "v3.4.1",
    playing: "Jollof Season Promo",
  },
  {
    id: "s2",
    brandId: "kilimanjaro",
    code: "KLM-ABU-03-DIN-PRO-01",
    storeCode: "ABU03Q/BRD003",
    zone: "DIN",
    location: "Aminu Kano Wuse",
    city: "Abuja",
    region: "Abuja II",
    type: "Promo",
    lastSync: "14:29:48",
    status: "syncing",
    firmware: "v3.4.1",
    playing: "Weekend Combo",
  },
  {
    id: "s3",
    brandId: "kilimanjaro",
    code: "KLM-KAD-01-CTR-QMS-01",
    storeCode: "KAD01Q/BRD003",
    zone: "CTR",
    location: "Galaxy Mall",
    city: "Kaduna",
    region: "Abuja II",
    type: "Queue (QMS)",
    lastSync: "13:58:11",
    status: "failed",
    firmware: "v3.4.1",
    playing: "Live wait times",
  },
  {
    id: "s4",
    brandId: "kilimanjaro",
    code: "KLM-LAG-03-CTR-MNU-01",
    storeCode: "LAG03Q/BRD003",
    zone: "CTR",
    location: "Novare Mall",
    city: "Lagos",
    region: "Lagos I",
    type: "Menu Board",
    lastSync: "14:30:15",
    status: "online",
    firmware: "v3.4.1",
    playing: "Core Menu Loop",
  },
  {
    id: "s5",
    brandId: "kilimanjaro",
    code: "KLM-ABU-10-ENT-PRO-01",
    storeCode: "ABU10Q/BRD003",
    zone: "ENT",
    location: "Kuje",
    city: "Abuja",
    region: "Abuja I",
    type: "Promo",
    lastSync: "12:14:00",
    status: "offline",
    firmware: "v3.3.9",
    playing: "—",
  },
  {
    id: "s6",
    brandId: "kilimanjaro",
    code: "KLM-PHC-12-CTR-MNU-01",
    storeCode: "PHC12Q/BRD003",
    zone: "CTR",
    location: "Elelenwo Road",
    city: "Port Harcourt",
    region: "Port Harcourt I",
    type: "Menu Board",
    lastSync: "14:31:40",
    status: "online",
    firmware: "v3.4.1",
    playing: "Core Menu Loop",
  },
  {
    id: "s7",
    brandId: "pizza-jungle",
    code: "PZJ-LAG-11-DIN-PRO-01",
    storeCode: "LAG11Q/BRD004",
    zone: "DIN",
    location: "Ikeja City Mall",
    city: "Lagos",
    region: "Lagos II",
    type: "Promo",
    lastSync: "14:28:02",
    status: "online",
    firmware: "v3.4.1",
    playing: "Two-For-Tuesday",
  },
  {
    id: "s8",
    brandId: "pizza-jungle",
    code: "PZJ-IBA-06-CTR-MNU-01",
    storeCode: "IBA06Q/BRD004",
    zone: "CTR",
    location: "Ring Road",
    city: "Ibadan",
    region: "South West",
    type: "Menu Board",
    lastSync: "14:12:33",
    status: "syncing",
    firmware: "v3.4.0",
    playing: "Pizza Menu Board",
  },
  {
    id: "s9",
    brandId: "pizza-jungle",
    code: "PZJ-ABU-12-CTR-QMS-01",
    storeCode: "ABU12Q/BRD004",
    zone: "CTR",
    location: "Wuse 2",
    city: "Abuja",
    region: "Abuja II",
    type: "Queue (QMS)",
    lastSync: "11:40:19",
    status: "offline",
    firmware: "v3.3.9",
    playing: "—",
  },
  {
    id: "s10",
    brandId: "killi-grill",
    code: "KGL-LAG-12-DIN-PRO-01",
    storeCode: "LAG12Q/BRD005",
    zone: "DIN",
    location: "Yaba",
    city: "Lagos",
    region: "Lagos I",
    type: "Promo",
    lastSync: "14:30:55",
    status: "online",
    firmware: "v3.4.1",
    playing: "Suya Nights",
  },
  {
    id: "s11",
    brandId: "killi-grill",
    code: "KGL-ENU-05-CTR-MNU-01",
    storeCode: "ENU05Q/BRD005",
    zone: "CTR",
    location: "Ogui Road",
    city: "Enugu",
    region: "South East 1",
    type: "Menu Board",
    lastSync: "14:02:10",
    status: "failed",
    firmware: "v3.4.1",
    playing: "Grill Menu Board",
  },
  {
    id: "s12",
    brandId: "nibbles-creamy",
    code: "NBC-LAG-13-DIN-PRO-01",
    storeCode: "LAG13Q/BRD006",
    zone: "DIN",
    location: "Surulere",
    city: "Lagos",
    region: "Lagos I",
    type: "Promo",
    lastSync: "14:31:11",
    status: "online",
    firmware: "v3.4.1",
    playing: "Creamy Sundae",
  },
  {
    id: "s13",
    brandId: "nibbles-creamy",
    code: "NBC-PHC-22-CTR-MNU-01",
    storeCode: "PHC22Q/BRD006",
    zone: "CTR",
    location: "Peter Odili Road",
    city: "Port Harcourt",
    region: "Port Harcourt I",
    type: "Menu Board",
    lastSync: "14:26:44",
    status: "syncing",
    firmware: "v3.4.1",
    playing: "Dessert Loop",
  },
  {
    id: "s14",
    brandId: "nibbles-bakery",
    code: "NBB-ABU-13-CTR-MNU-01",
    storeCode: "ABU13Q/BRD007",
    zone: "CTR",
    location: "Garki",
    city: "Abuja",
    region: "Abuja I",
    type: "Menu Board",
    lastSync: "14:29:02",
    status: "online",
    firmware: "v3.4.1",
    playing: "Fresh Bread Daily",
  },
  {
    id: "s15",
    brandId: "nibbles-bakery",
    code: "NBB-KAD-04-ENT-PRO-01",
    storeCode: "KAD04Q/BRD007",
    zone: "ENT",
    location: "Kachia Road",
    city: "Kaduna",
    region: "Abuja II",
    type: "Promo",
    lastSync: "10:52:37",
    status: "offline",
    firmware: "v3.3.9",
    playing: "—",
  },
];

export const statusLabel: Record<Status, string> = {
  online: "Online",
  syncing: "Syncing",
  failed: "Sync failed",
  offline: "Offline",
};

export type MediaAsset = {
  id: string;
  name: string;
  brandId: string;
  kind: "Image" | "Video";
  approval: "Approved" | "Pending" | "Rejected";
  duration: string;
  image: string;
  /** Who uploaded and submitted the creative for review. */
  submittedBy?: string;
  /** Line manager who approved or rejected it. */
  reviewer?: string;
  reviewNote?: string;
  reviewedAt?: string;
};

/** Review state every campaign item passes through before it can go live. */
export type ApprovalState = "Draft" | "Pending" | "Approved" | "Rejected";

/** Items that need a line manager's sign-off. */
export type ApprovalKind = "media" | "playlist" | "schedule" | "announcement";

export type Reviewable = {
  approval: ApprovalState;
  /** Who built and submitted the item. */
  submittedBy?: string;
  /** Line manager who approved or rejected it. */
  reviewer?: string;
  reviewNote?: string;
  reviewedAt?: string;
};

export type Playlist = Reviewable & {
  id: string;
  name: string;
  brandId: string;
  total: string;
  items: { label: string; duration: string; active?: boolean }[];
};

export const playlists: Playlist[] = [
  {
    id: "p1",
    name: "Jollof Season",
    brandId: "kilimanjaro",
    total: "00:52",
    approval: "Approved",
    submittedBy: "Bisi Fashola",
    reviewer: "Ngozi Kalu",
    reviewNote: "Pricing panels match the approved menu.",
    reviewedAt: "2026-09-12T16:40:00Z",
    items: [
      { label: "Season Intro Loop", duration: "00:15" },
      { label: "Jollof Special Offer", duration: "00:15", active: true },
      { label: "New Menu Items", duration: "00:12" },
      { label: "Store Hours + QR", duration: "00:10" },
    ],
  },
  {
    id: "p2",
    name: "Evening Menu Rotation",
    brandId: "kilimanjaro",
    total: "00:40",
    approval: "Approved",
    submittedBy: "Bisi Fashola",
    reviewer: "Ngozi Kalu",
    reviewedAt: "2026-09-11T10:05:00Z",
    items: [
      { label: "Core Menu Board", duration: "00:20" },
      { label: "Drinks Add-on", duration: "00:10" },
      { label: "Loyalty Card", duration: "00:10" },
    ],
  },
  {
    id: "p3",
    name: "Two-For-Tuesday",
    brandId: "pizza-jungle",
    total: "00:35",
    approval: "Pending",
    submittedBy: "Chidi Eze",
    items: [
      { label: "Tuesday Offer Sting", duration: "00:10" },
      { label: "Pizza Hero Video", duration: "00:15", active: true },
      { label: "Delivery Numbers", duration: "00:10" },
    ],
  },
];

export type Schedule = Reviewable & {
  id: string;
  name: string;
  brandId: string;
  window: string;
  regions: string;
  types: string;
  affected: number;
  state: "Live" | "Scheduled" | "Expired";
};

export const schedules: Schedule[] = [
  {
    id: "sc1",
    name: "Jollof Season",
    brandId: "kilimanjaro",
    window: "16:00 – 21:00 daily",
    regions: "Lagos, Abuja, Kano",
    types: "Menu + Promo",
    affected: 146,
    state: "Live",
    approval: "Approved",
    submittedBy: "Bisi Fashola",
    reviewer: "Ngozi Kalu",
    reviewedAt: "2026-09-12T17:02:00Z",
  },
  {
    id: "sc2",
    name: "Breakfast Board",
    brandId: "kilimanjaro",
    window: "07:00 – 11:00 daily",
    regions: "All regions",
    types: "Menu",
    affected: 62,
    state: "Live",
    approval: "Approved",
    submittedBy: "Bisi Fashola",
    reviewer: "Tunde Adeyemi",
    reviewedAt: "2026-09-10T08:15:00Z",
  },
  {
    id: "sc3",
    name: "Independence Day Push",
    brandId: "kilimanjaro",
    window: "Oct 1, 00:00 – 23:59",
    regions: "All regions",
    types: "Promo",
    affected: 41,
    state: "Scheduled",
    approval: "Pending",
    submittedBy: "Bisi Fashola",
  },
  {
    id: "sc4",
    name: "Two-For-Tuesday",
    brandId: "pizza-jungle",
    window: "Tue 12:00 – 22:00",
    regions: "Lagos, Ibadan",
    types: "Promo",
    affected: 33,
    state: "Live",
    approval: "Approved",
    submittedBy: "Chidi Eze",
    reviewer: "Tunde Adeyemi",
    reviewedAt: "2026-09-08T12:00:00Z",
  },
  {
    id: "sc5",
    name: "Cold Rush",
    brandId: "nibbles-creamy",
    window: "Ended Aug 30",
    regions: "Lagos",
    types: "Promo",
    affected: 18,
    state: "Expired",
    approval: "Approved",
    submittedBy: "Halima Sule",
    reviewer: "Tunde Adeyemi",
    reviewedAt: "2026-08-01T09:00:00Z",
  },
];

export type Announcement = Reviewable & {
  id: string;
  text: string;
  brandId: string;
  position: "Top ticker" | "Bottom ticker" | "Full banner";
  expires: string;
  state: "Live" | "Scheduled" | "Expired";
};

export const announcements: Announcement[] = [
  {
    id: "a1",
    text: "Card payments temporarily unavailable — cash and transfer accepted.",
    brandId: "kilimanjaro",
    position: "Bottom ticker",
    expires: "Today 18:00",
    state: "Live",
    approval: "Approved",
    submittedBy: "Emeka Uche",
    reviewer: "Ngozi Kalu",
    reviewedAt: "2026-09-13T09:40:00Z",
  },
  {
    id: "a2",
    text: "New Jollof Bowl now available. Ask at the counter.",
    brandId: "kilimanjaro",
    position: "Top ticker",
    expires: "Sep 30",
    state: "Live",
    approval: "Approved",
    submittedBy: "Bisi Fashola",
    reviewer: "Ngozi Kalu",
    reviewedAt: "2026-09-11T11:20:00Z",
  },
  {
    id: "a3",
    text: "Store closes early at 20:00 for maintenance.",
    brandId: "pizza-jungle",
    position: "Full banner",
    expires: "Sep 14",
    state: "Scheduled",
    approval: "Pending",
    submittedBy: "Grace Nwosu",
  },
  {
    id: "a4",
    text: "Free scoop with every bakery combo.",
    brandId: "nibbles-creamy",
    position: "Bottom ticker",
    expires: "Ended Sep 2",
    state: "Expired",
    approval: "Approved",
    submittedBy: "Halima Sule",
    reviewer: "Tunde Adeyemi",
    reviewedAt: "2026-08-20T14:00:00Z",
  },
];

// ---- Queue Management System (POS-linked order queue) ----

export type QueueStage = "Placed" | "Preparing" | "Ready" | "Collected";

export type QueueOrder = {
  id: string;
  ticket: string;
  brandId: string;
  outletId: string;
  channel: "Counter" | "Kiosk" | "Drive-thru" | "Delivery";
  customer: string;
  items: string;
  stage: QueueStage;
  /** Minutes elapsed since the order hit the POS. */
  elapsed: number;
  /** Promised prep time in minutes, from the POS item mix. */
  promised: number;
};

export type QueueOutlet = {
  id: string;
  brandId: string;
  /** Official brand location code, e.g. "LAG01Q/BRD003". */
  storeCode?: string;
  name: string;
  city: string;
  region?: string;
  posTerminals: number;
  queueScreens: number;
  posLink: "connected" | "degraded" | "offline";
  avgWait: string;
};

export const queueOutlets: QueueOutlet[] = [
  {
    id: "o1",
    brandId: "kilimanjaro",
    storeCode: "LAG01Q/BRD003",
    name: "Ozumba Mbadiwe Street",
    city: "Lagos",
    region: "Lagos I",
    posTerminals: 4,
    queueScreens: 2,
    posLink: "connected",
    avgWait: "6m 20s",
  },
  {
    id: "o2",
    brandId: "kilimanjaro",
    storeCode: "LAG03Q/BRD003",
    name: "Novare Mall",
    city: "Lagos",
    region: "Lagos I",
    posTerminals: 3,
    queueScreens: 1,
    posLink: "connected",
    avgWait: "5m 05s",
  },
  {
    id: "o3",
    brandId: "kilimanjaro",
    storeCode: "PHC12Q/BRD003",
    name: "Elelenwo Road",
    city: "Port Harcourt",
    region: "Port Harcourt I",
    posTerminals: 2,
    queueScreens: 1,
    posLink: "degraded",
    avgWait: "9m 40s",
  },
  {
    id: "o4",
    brandId: "pizza-jungle",
    storeCode: "LAG11Q/BRD004",
    name: "Ikeja City Mall",
    city: "Lagos",
    region: "Lagos II",
    posTerminals: 3,
    queueScreens: 2,
    posLink: "connected",
    avgWait: "11m 15s",
  },
  {
    id: "o5",
    brandId: "pizza-jungle",
    storeCode: "ABU12Q/BRD004",
    name: "Wuse 2",
    city: "Abuja",
    region: "Abuja II",
    posTerminals: 2,
    queueScreens: 1,
    posLink: "offline",
    avgWait: "—",
  },
  {
    id: "o6",
    brandId: "killi-grill",
    storeCode: "LAG12Q/BRD005",
    name: "Yaba",
    city: "Lagos",
    region: "Lagos I",
    posTerminals: 2,
    queueScreens: 1,
    posLink: "connected",
    avgWait: "8m 02s",
  },
  {
    id: "o7",
    brandId: "nibbles-creamy",
    storeCode: "LAG13Q/BRD006",
    name: "Surulere",
    city: "Lagos",
    region: "Lagos I",
    posTerminals: 2,
    queueScreens: 1,
    posLink: "connected",
    avgWait: "3m 30s",
  },
  {
    id: "o8",
    brandId: "nibbles-bakery",
    storeCode: "ABU13Q/BRD007",
    name: "Garki",
    city: "Abuja",
    region: "Abuja I",
    posTerminals: 2,
    queueScreens: 1,
    posLink: "connected",
    avgWait: "4m 10s",
  },
];

export const queueOrders: QueueOrder[] = [
  {
    id: "q1",
    ticket: "A-214",
    brandId: "kilimanjaro",
    outletId: "o1",
    channel: "Counter",
    customer: "Ada O.",
    items: "Jollof Bowl ×2, Chapman",
    stage: "Ready",
    elapsed: 7,
    promised: 6,
  },
  {
    id: "q2",
    ticket: "A-215",
    brandId: "kilimanjaro",
    outletId: "o1",
    channel: "Kiosk",
    customer: "Tunde A.",
    items: "Grilled Chicken, Fries",
    stage: "Preparing",
    elapsed: 4,
    promised: 8,
  },
  {
    id: "q3",
    ticket: "A-216",
    brandId: "kilimanjaro",
    outletId: "o1",
    channel: "Drive-thru",
    customer: "Ngozi K.",
    items: "Family Pack",
    stage: "Preparing",
    elapsed: 2,
    promised: 12,
  },
  {
    id: "q4",
    ticket: "A-217",
    brandId: "kilimanjaro",
    outletId: "o1",
    channel: "Counter",
    customer: "Emeka U.",
    items: "Meat Pie ×3",
    stage: "Placed",
    elapsed: 0,
    promised: 4,
  },
  {
    id: "q5",
    ticket: "V-088",
    brandId: "kilimanjaro",
    outletId: "o2",
    channel: "Counter",
    customer: "Bisi F.",
    items: "Fried Rice, Moi Moi",
    stage: "Ready",
    elapsed: 6,
    promised: 5,
  },
  {
    id: "q6",
    ticket: "V-089",
    brandId: "kilimanjaro",
    outletId: "o2",
    channel: "Delivery",
    customer: "Rider #4",
    items: "Combo ×2",
    stage: "Preparing",
    elapsed: 3,
    promised: 7,
  },
  {
    id: "q7",
    ticket: "K-031",
    brandId: "kilimanjaro",
    outletId: "o3",
    channel: "Counter",
    customer: "Sadiq M.",
    items: "Suya Wrap",
    stage: "Preparing",
    elapsed: 9,
    promised: 6,
  },
  {
    id: "q8",
    ticket: "P-402",
    brandId: "pizza-jungle",
    outletId: "o4",
    channel: "Kiosk",
    customer: "Ifeoma D.",
    items: "Large Pepperoni",
    stage: "Preparing",
    elapsed: 8,
    promised: 14,
  },
  {
    id: "q9",
    ticket: "P-403",
    brandId: "pizza-jungle",
    outletId: "o4",
    channel: "Counter",
    customer: "Grace N.",
    items: "BBQ Chicken, Wings",
    stage: "Placed",
    elapsed: 1,
    promised: 15,
  },
  {
    id: "q10",
    ticket: "P-404",
    brandId: "pizza-jungle",
    outletId: "o4",
    channel: "Delivery",
    customer: "Rider #9",
    items: "2× Medium Veggie",
    stage: "Ready",
    elapsed: 15,
    promised: 14,
  },
  {
    id: "q11",
    ticket: "G-117",
    brandId: "killi-grill",
    outletId: "o6",
    channel: "Counter",
    customer: "Femi B.",
    items: "Grill Platter",
    stage: "Preparing",
    elapsed: 5,
    promised: 10,
  },
  {
    id: "q12",
    ticket: "G-118",
    brandId: "killi-grill",
    outletId: "o6",
    channel: "Drive-thru",
    customer: "Halima S.",
    items: "Beef Skewers ×4",
    stage: "Ready",
    elapsed: 9,
    promised: 8,
  },
  {
    id: "q13",
    ticket: "C-076",
    brandId: "nibbles-creamy",
    outletId: "o7",
    channel: "Counter",
    customer: "Zainab T.",
    items: "Sundae, Waffle",
    stage: "Ready",
    elapsed: 4,
    promised: 3,
  },
  {
    id: "q14",
    ticket: "C-077",
    brandId: "nibbles-creamy",
    outletId: "o7",
    channel: "Kiosk",
    customer: "Chidi E.",
    items: "Milkshake ×2",
    stage: "Preparing",
    elapsed: 1,
    promised: 4,
  },
  {
    id: "q15",
    ticket: "B-055",
    brandId: "nibbles-bakery",
    outletId: "o8",
    channel: "Counter",
    customer: "Yemi A.",
    items: "Bread ×2, Croissant",
    stage: "Collected",
    elapsed: 5,
    promised: 4,
  },
  {
    id: "q16",
    ticket: "B-056",
    brandId: "nibbles-bakery",
    outletId: "o8",
    channel: "Counter",
    customer: "Musa I.",
    items: "Doughnut Box",
    stage: "Preparing",
    elapsed: 2,
    promised: 5,
  },
];

export const auditTrail = [
  {
    at: "14:28",
    actor: "Ada Obi",
    action: "Published schedule",
    target: "Jollof Season → 146 screens",
  },
  {
    at: "13:59",
    actor: "System",
    action: "Alert raised",
    target: "KLM-KAD-01-CTR-QMS-01 sync failed",
  },
  { at: "13:12", actor: "Tunde A.", action: "Approved asset", target: "Jollof Special Offer v2" },
  { at: "11:47", actor: "Chidi E.", action: "Uploaded asset", target: "Suya Nights 15s" },
  {
    at: "09:03",
    actor: "IT Field",
    action: "Paired device",
    target: "NBB-KAD-04-ENT-PRO-01 · PIN 418 902",
  },
];

// ---- User management: roles, brand scope, module permissions ----

export type ModuleKey =
  | "overview"
  | "dashboard"
  | "screens"
  | "media"
  | "playlists"
  | "schedules"
  | "approvals"
  | "queue"
  | "announcements"
  | "users"
  | "audit";

export const modules: { key: ModuleKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "dashboard", label: "Dashboard" },
  { key: "screens", label: "Screens" },
  { key: "media", label: "Media" },
  { key: "playlists", label: "Playlists" },
  { key: "schedules", label: "Schedules" },
  { key: "approvals", label: "Approvals" },
  { key: "queue", label: "Queue (QMS)" },
  { key: "announcements", label: "Announcements" },
  { key: "users", label: "Users & Roles" },
  { key: "audit", label: "Audit Log" },
];

// ---- Audit log: every consequential action across the app ----

export type AuditCategory =
  "Content" | "Publishing" | "Approval" | "Screens" | "Queue" | "Users" | "Security" | "System";

export type AuditSeverity = "info" | "notice" | "critical";

export type AuditEvent = {
  id: string;
  /** ISO timestamp of the event. */
  at: string;
  actor: string;
  actorRole: string;
  /** null = organization-wide / system event. */
  brandId: string | null;
  module: ModuleKey;
  category: AuditCategory;
  action: string;
  target: string;
  detail: string;
  severity: AuditSeverity;
  source: "Console" | "POS Webhook" | "Player" | "System";
  ip: string;
};

export const auditEvents: AuditEvent[] = [
  {
    id: "a1",
    at: "2026-09-13T14:31:04Z",
    actor: "System",
    actorRole: "Automation",
    brandId: "kilimanjaro",
    module: "queue",
    category: "Queue",
    action: "Order marked ready",
    target: "Ticket A-118 · Ozumba Mbadiwe Street",
    detail:
      "Prep timer elapsed (6 min) — ticket moved from Preparing to Ready on the counter board.",
    severity: "info",
    source: "System",
    ip: "—",
  },
  {
    id: "a2",
    at: "2026-09-13T14:30:12Z",
    actor: "POS · Ozumba Mbadiwe Street",
    actorRole: "Integration",
    brandId: "kilimanjaro",
    module: "queue",
    category: "Queue",
    action: "Paid order received",
    target: "Ticket A-118 · ₦12,400",
    detail: "Signed webhook accepted from till 03. 3 line items, promised in 6 min.",
    severity: "info",
    source: "POS Webhook",
    ip: "102.89.44.17",
  },
  {
    id: "a3",
    at: "2026-09-13T14:28:47Z",
    actor: "Ada Obi",
    actorRole: "Super Admin",
    brandId: "kilimanjaro",
    module: "schedules",
    category: "Publishing",
    action: "Schedule published",
    target: "Jollof Season → 146 screens",
    detail: "Window 06:00–23:00 daily, South West + North Central, expires 30 Sep 2026.",
    severity: "notice",
    source: "Console",
    ip: "197.210.53.8",
  },
  {
    id: "a4",
    at: "2026-09-13T14:12:33Z",
    actor: "System",
    actorRole: "Automation",
    brandId: "pizza-jungle",
    module: "screens",
    category: "System",
    action: "Sync retry started",
    target: "PZJ-IBA-06-CTR-MNU-01 · Ring Road, Ibadan",
    detail: "Player reported partial cache. Retry 2 of 5 queued.",
    severity: "info",
    source: "Player",
    ip: "—",
  },
  {
    id: "a5",
    at: "2026-09-13T13:59:11Z",
    actor: "System",
    actorRole: "Automation",
    brandId: "kilimanjaro",
    module: "screens",
    category: "Security",
    action: "Alert raised",
    target: "KLM-KAD-01-CTR-QMS-01 · Galaxy Mall, Kaduna",
    detail: "Sync failed 3 consecutive times. Screen fell back to cached menu loop.",
    severity: "critical",
    source: "System",
    ip: "—",
  },
  {
    id: "a6",
    at: "2026-09-13T13:41:20Z",
    actor: "Halima Sule",
    actorRole: "Approver",
    brandId: "nibbles-creamy",
    module: "media",
    category: "Approval",
    action: "Asset rejected",
    target: "Creamy Sundae v3",
    detail: "Reason: price panel does not match approved menu pricing.",
    severity: "notice",
    source: "Console",
    ip: "105.112.9.221",
  },
  {
    id: "a7",
    at: "2026-09-13T13:12:02Z",
    actor: "Tunde Adeyemi",
    actorRole: "Organization Admin",
    brandId: "kilimanjaro",
    module: "media",
    category: "Approval",
    action: "Asset approved",
    target: "Jollof Special Offer v2",
    detail: "Approved for all Kilimanjaro menu boards. Ready to schedule.",
    severity: "notice",
    source: "Console",
    ip: "197.210.53.8",
  },
  {
    id: "a8",
    at: "2026-09-13T12:55:38Z",
    actor: "Ngozi Kalu",
    actorRole: "Brand Admin",
    brandId: "kilimanjaro",
    module: "queue",
    category: "Queue",
    action: "Prep time updated",
    target: "Grilled chicken · 9 → 11 min",
    detail: "Brand prep rule changed; new ready estimates apply to incoming orders.",
    severity: "notice",
    source: "Console",
    ip: "102.89.33.4",
  },
  {
    id: "a9",
    at: "2026-09-13T12:20:15Z",
    actor: "Ada Obi",
    actorRole: "Super Admin",
    brandId: null,
    module: "users",
    category: "Users",
    action: "Role changed",
    target: "Chidi Eze → Brand Admin (Pizza Jungle, Killi Grill)",
    detail: "Brand scope widened from 1 brand to 2. Publishing and approval rights granted.",
    severity: "critical",
    source: "Console",
    ip: "197.210.53.8",
  },
  {
    id: "a10",
    at: "2026-09-13T11:47:09Z",
    actor: "Chidi Eze",
    actorRole: "Brand Admin",
    brandId: "killi-grill",
    module: "media",
    category: "Content",
    action: "Asset uploaded",
    target: "Suya Nights 15s",
    detail: "Video 1920×1080, 15s, 24 MB. Queued for approval.",
    severity: "info",
    source: "Console",
    ip: "41.58.120.66",
  },
  {
    id: "a11",
    at: "2026-09-13T11:05:44Z",
    actor: "Bisi Fashola",
    actorRole: "Content Manager",
    brandId: "nibbles-bakery",
    module: "playlists",
    category: "Content",
    action: "Playlist edited",
    target: "Fresh Bread Daily",
    detail: "Item order changed; Loyalty Card slide duration 10s → 8s.",
    severity: "info",
    source: "Console",
    ip: "154.113.7.90",
  },
  {
    id: "a12",
    at: "2026-09-13T10:52:37Z",
    actor: "System",
    actorRole: "Automation",
    brandId: "nibbles-bakery",
    module: "screens",
    category: "System",
    action: "Screen went offline",
    target: "NBB-KAD-04-ENT-PRO-01 · Kachia Road, Kaduna",
    detail: "No heartbeat for 12 minutes. Offline playback continuing from cache.",
    severity: "critical",
    source: "Player",
    ip: "—",
  },
  {
    id: "a13",
    at: "2026-09-13T10:14:03Z",
    actor: "Ada Obi",
    actorRole: "Super Admin",
    brandId: null,
    module: "announcements",
    category: "Publishing",
    action: "Announcement broadcast",
    target: "Public holiday hours → all brands",
    detail: "Sent to 214 screens across 5 brands. Expires 15 Sep 2026 23:59.",
    severity: "notice",
    source: "Console",
    ip: "197.210.53.8",
  },
  {
    id: "a14",
    at: "2026-09-13T09:31:50Z",
    actor: "Emeka Uche",
    actorRole: "Outlet Supervisor",
    brandId: "kilimanjaro",
    module: "queue",
    category: "Queue",
    action: "Ticket collected",
    target: "Ticket A-112 · Ozumba Mbadiwe Street",
    detail: "Marked collected at the counter after 7 min wait.",
    severity: "info",
    source: "Console",
    ip: "102.89.44.17",
  },
  {
    id: "a15",
    at: "2026-09-13T09:03:22Z",
    actor: "IT Field",
    actorRole: "Outlet Supervisor",
    brandId: "nibbles-bakery",
    module: "screens",
    category: "Screens",
    action: "Device paired",
    target: "NBB-KAD-04-ENT-PRO-01 · PIN 418 902",
    detail: "New player registered to Kachia Road and assigned the bakery menu playlist.",
    severity: "notice",
    source: "Console",
    ip: "41.75.18.203",
  },
  {
    id: "a16",
    at: "2026-09-13T08:44:10Z",
    actor: "Grace Nwosu",
    actorRole: "Outlet Supervisor",
    brandId: "pizza-jungle",
    module: "users",
    category: "Security",
    action: "Invitation accepted",
    target: "grace.n@sundryfoods.com",
    detail: "First sign-in from a new device. Queue module only, Ikeja City Mall.",
    severity: "notice",
    source: "Console",
    ip: "197.242.11.5",
  },
  {
    id: "a17",
    at: "2026-09-13T08:12:00Z",
    actor: "Unknown",
    actorRole: "—",
    brandId: null,
    module: "users",
    category: "Security",
    action: "Sign-in failed",
    target: "musa.i@sundryfoods.com",
    detail: "3 failed attempts on a suspended account. Account remains locked.",
    severity: "critical",
    source: "Console",
    ip: "45.227.98.14",
  },
  {
    id: "a18",
    at: "2026-09-12T22:05:31Z",
    actor: "System",
    actorRole: "Automation",
    brandId: null,
    module: "schedules",
    category: "Publishing",
    action: "Campaign expired",
    target: "Back-to-School Combo",
    detail: "Expiry reached. Screens rolled back to their default menu playlists.",
    severity: "info",
    source: "System",
    ip: "—",
  },
  {
    id: "a19",
    at: "2026-09-12T19:48:12Z",
    actor: "Ngozi Kalu",
    actorRole: "Brand Admin",
    brandId: "kilimanjaro",
    module: "screens",
    category: "Screens",
    action: "Screen reassigned",
    target: "KLM-LAG-03-CTR-MNU-01 → Evening Menu Rotation",
    detail: "Playlist swapped for the Novare Mall, Lagos menu board.",
    severity: "info",
    source: "Console",
    ip: "102.89.33.4",
  },
  {
    id: "a20",
    at: "2026-09-12T17:30:55Z",
    actor: "Tunde Adeyemi",
    actorRole: "Organization Admin",
    brandId: null,
    module: "users",
    category: "Users",
    action: "User suspended",
    target: "Musa Ibrahim",
    detail: "Access revoked across all modules pending HR review.",
    severity: "critical",
    source: "Console",
    ip: "197.210.53.8",
  },
];

export type RoleKey =
  | "super_admin"
  | "org_admin"
  | "brand_admin"
  | "content_manager"
  | "approver"
  | "outlet_supervisor"
  | "viewer";

export type RoleDef = {
  key: RoleKey;
  name: string;
  tier: "Organization" | "Brand" | "Outlet";
  summary: string;
  /** Modules this role can reach by default. */
  modules: ModuleKey[];
  /** true = always every brand, regardless of the user's brand list. */
  allBrands: boolean;
  canPublish: boolean;
  canApprove: boolean;
  canManageUsers: boolean;
  /** Deactivated roles can't be assigned to new people. Defaults to "Active". */
  status?: "Active" | "Suspended";
};

export const roleDefs: RoleDef[] = [
  {
    key: "super_admin",
    name: "Super Admin",
    tier: "Organization",
    summary:
      "Full control of the organization, every brand and every module, including user management and audit.",
    modules: modules.map((m) => m.key),
    allBrands: true,
    canPublish: true,
    canApprove: true,
    canManageUsers: true,
  },
  {
    key: "org_admin",
    name: "Organization Admin",
    tier: "Organization",
    summary:
      "Runs the whole estate across all brands. Can create brand admins but cannot remove a Super Admin.",
    modules: modules.map((m) => m.key),
    allBrands: true,
    canPublish: true,
    canApprove: true,
    canManageUsers: true,
  },
  {
    key: "brand_admin",
    name: "Brand Admin",
    tier: "Brand",
    summary:
      "Owns one or more assigned brands end to end — menus, screens, queue and people within those brands only.",
    modules: [
      "dashboard",
      "screens",
      "media",
      "playlists",
      "schedules",
      "approvals",
      "queue",
      "announcements",
      "users",
      "audit",
    ],
    allBrands: false,
    canPublish: true,
    canApprove: true,
    canManageUsers: true,
  },
  {
    key: "content_manager",
    name: "Content Manager",
    tier: "Brand",
    summary:
      "Builds menus, creative and playlists for assigned brands. Everything created goes to a line manager for approval before it can be scheduled or go live.",
    modules: ["dashboard", "media", "playlists", "schedules", "approvals"],
    allBrands: false,
    canPublish: false,
    canApprove: false,
    canManageUsers: false,
  },
  {
    key: "approver",
    name: "Line Manager (Approver)",
    tier: "Brand",
    summary:
      "Reviews everything staff submit — creative, playlists, campaigns and announcements — and approves or rejects it before it reaches screens.",
    modules: ["dashboard", "media", "playlists", "schedules", "approvals", "announcements"],
    allBrands: false,
    canPublish: true,
    canApprove: true,
    canManageUsers: false,
  },
  {
    key: "outlet_supervisor",
    name: "Outlet Supervisor",
    tier: "Outlet",
    summary: "Works the floor: live order queue and screen health for their outlets only.",
    modules: ["queue", "screens"],
    allBrands: false,
    canPublish: false,
    canApprove: false,
    canManageUsers: false,
  },
  {
    key: "viewer",
    name: "Viewer",
    tier: "Brand",
    summary: "Read-only reporting access for assigned brands. No edits, no publishing.",
    modules: ["dashboard", "screens", "queue"],
    allBrands: false,
    canPublish: false,
    canApprove: false,
    canManageUsers: false,
  },
];

export type ConsoleUser = {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: RoleKey;
  /** Empty when the role covers every brand. */
  brandIds: string[];
  /** Module access, defaults to the role template but editable per user. */
  moduleKeys: ModuleKey[];
  outlets?: string[];
  status: "Active" | "Invited" | "Suspended";
  lastActive: string;
};

export const consoleUsers: ConsoleUser[] = [
  {
    id: "u1",
    name: "Ada Obi",
    email: "ada.obi@sundryfoods.com",
    initials: "AO",
    role: "super_admin",
    brandIds: [],
    moduleKeys: modules.map((m) => m.key),
    status: "Active",
    lastActive: "2 min ago",
  },
  {
    id: "u2",
    name: "Tunde Adeyemi",
    email: "tunde.a@sundryfoods.com",
    initials: "TA",
    role: "org_admin",
    brandIds: [],
    moduleKeys: modules.map((m) => m.key),
    status: "Active",
    lastActive: "18 min ago",
  },
  {
    id: "u3",
    name: "Ngozi Kalu",
    email: "ngozi.k@sundryfoods.com",
    initials: "NK",
    role: "brand_admin",
    brandIds: ["kilimanjaro"],
    moduleKeys: [
      "dashboard",
      "screens",
      "media",
      "playlists",
      "schedules",
      "queue",
      "announcements",
      "users",
    ],
    status: "Active",
    lastActive: "1 hr ago",
  },
  {
    id: "u4",
    name: "Chidi Eze",
    email: "chidi.e@sundryfoods.com",
    initials: "CE",
    role: "brand_admin",
    brandIds: ["pizza-jungle", "killi-grill"],
    moduleKeys: [
      "dashboard",
      "screens",
      "media",
      "playlists",
      "schedules",
      "queue",
      "announcements",
    ],
    status: "Active",
    lastActive: "Yesterday",
  },
  {
    id: "u5",
    name: "Bisi Fashola",
    email: "bisi.f@sundryfoods.com",
    initials: "BF",
    role: "content_manager",
    brandIds: ["kilimanjaro", "nibbles-bakery"],
    moduleKeys: ["dashboard", "media", "playlists"],
    status: "Active",
    lastActive: "3 hrs ago",
  },
  {
    id: "u6",
    name: "Halima Sule",
    email: "halima.s@sundryfoods.com",
    initials: "HS",
    role: "approver",
    brandIds: ["nibbles-creamy", "nibbles-bakery"],
    moduleKeys: ["dashboard", "media", "schedules", "announcements"],
    status: "Active",
    lastActive: "35 min ago",
  },
  {
    id: "u7",
    name: "Emeka Uche",
    email: "emeka.u@sundryfoods.com",
    initials: "EU",
    role: "outlet_supervisor",
    brandIds: ["kilimanjaro"],
    moduleKeys: ["queue", "screens"],
    outlets: ["Ozumba Mbadiwe Street"],
    status: "Active",
    lastActive: "Just now",
  },
  {
    id: "u8",
    name: "Grace Nwosu",
    email: "grace.n@sundryfoods.com",
    initials: "GN",
    role: "outlet_supervisor",
    brandIds: ["pizza-jungle"],
    moduleKeys: ["queue"],
    outlets: ["Ikeja City Mall"],
    status: "Invited",
    lastActive: "—",
  },
  {
    id: "u9",
    name: "Musa Ibrahim",
    email: "musa.i@sundryfoods.com",
    initials: "MI",
    role: "viewer",
    brandIds: ["nibbles-bakery"],
    moduleKeys: ["dashboard", "screens"],
    status: "Suspended",
    lastActive: "12 days ago",
  },
];
