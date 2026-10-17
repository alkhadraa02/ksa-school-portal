export const SCHOOL_NAME = "مدارس النخبة الأهلية";
export const SCHOOL_NAME_EN = "Al-Nokhba Private Schools";
export const ACADEMIC_YEAR = "2026/2027";
export const SCHOOL_PHONE = "011 000 0000";
export const SCHOOL_EMAIL = "info@school.example";
export const SCHOOL_ADDRESS = "حي الياسمين، الرياض، المملكة العربية السعودية";

export type StageKey = "KINDERGARTEN" | "PRIMARY" | "INTERMEDIATE" | "SECONDARY";

export const STAGES: {
  key: StageKey;
  label: string;
  slug: string;
  levels: string[];
  ages: string;
  summary: string;
}[] = [
  {
    key: "KINDERGARTEN",
    label: "رياض الأطفال",
    slug: "kindergarten",
    levels: ["التمهيدي", "الروضة الأولى", "الروضة الثانية"],
    ages: "من 3 إلى 6 سنوات",
    summary: "التعلّم باللعب، وبناء المهارات اللغوية والحركية والاجتماعية في بيئة آمنة ودافئة.",
  },
  {
    key: "PRIMARY",
    label: "المرحلة الابتدائية",
    slug: "primary",
    levels: [
      "الأول الابتدائي",
      "الثاني الابتدائي",
      "الثالث الابتدائي",
      "الرابع الابتدائي",
      "الخامس الابتدائي",
      "السادس الابتدائي",
    ],
    ages: "من 6 إلى 12 سنة",
    summary: "أساس متين في القراءة والكتابة والرياضيات والعلوم مع حفظ القرآن الكريم وتنمية الهوية.",
  },
  {
    key: "INTERMEDIATE",
    label: "المرحلة المتوسطة",
    slug: "intermediate",
    levels: ["الأول المتوسط", "الثاني المتوسط", "الثالث المتوسط"],
    ages: "من 12 إلى 15 سنة",
    summary: "تعميق المفاهيم، وتنمية التفكير الناقد، وإعداد الطالب لمرحلة التخصص.",
  },
  {
    key: "SECONDARY",
    label: "المرحلة الثانوية",
    slug: "secondary",
    levels: ["الأول الثانوي", "الثاني الثانوي", "الثالث الثانوي"],
    ages: "من 15 إلى 18 سنة",
    summary: "مسارات أكاديمية وإرشاد جامعي ومهني يهيّئ الطالب للقبول الجامعي وسوق العمل.",
  },
];

export const STAGE_KEYS = STAGES.map((s) => s.key) as [StageKey, ...StageKey[]];

export function stageInfo(key: string) {
  return STAGES.find((s) => s.key === key);
}

export function stageLabel(key: string) {
  return stageInfo(key)?.label ?? key;
}

export function maxLevel(key: string) {
  return stageInfo(key)?.levels.length ?? 0;
}

export function levelName(stage: string, level: number) {
  return stageInfo(stage)?.levels[level - 1] ?? `المستوى ${level}`;
}

export function className(stage: string, level: number, section: string) {
  return `${levelName(stage, level)} / ${section}`;
}

export const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
export const PERIODS_PER_DAY = 7;
export const PERIOD_TIMES = [
  "07:00 – 07:45",
  "07:50 – 08:35",
  "08:40 – 09:25",
  "09:50 – 10:35",
  "10:40 – 11:25",
  "11:30 – 12:15",
  "12:20 – 13:05",
];

export const ROLES = ["ADMIN", "TEACHER", "PARENT"] as const;
export type Role = (typeof ROLES)[number];
export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "الإدارة",
  TEACHER: "المعلمون",
  PARENT: "أولياء الأمور",
};
export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin",
  TEACHER: "/teacher",
  PARENT: "/parent",
};

export const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];
export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: "حاضر",
  ABSENT: "غائب",
  LATE: "متأخر",
  EXCUSED: "غياب بعذر",
};

export const APPLICATION_STATUSES = ["PENDING", "REVIEW", "ACCEPTED", "WAITLIST", "REJECTED"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export const APPLICATION_LABELS: Record<ApplicationStatus, string> = {
  PENDING: "قيد الاستلام",
  REVIEW: "قيد المراجعة",
  ACCEPTED: "مقبول",
  WAITLIST: "قائمة الانتظار",
  REJECTED: "غير مقبول",
};
export const APPLICATION_HINTS: Record<ApplicationStatus, string> = {
  PENDING: "استلمنا طلبك وسيتم فرزه خلال يومي عمل.",
  REVIEW: "طلبك قيد المراجعة من لجنة القبول، وقد نتواصل معك لتحديد موعد لقاء.",
  ACCEPTED: "يسعدنا قبول ابنكم/ابنتكم. سيتواصل معكم قسم القبول لاستكمال التسجيل.",
  WAITLIST: "الطلب في قائمة الانتظار وسنخبركم فور توفر مقعد.",
  REJECTED: "نعتذر عن عدم توفر مقعد مناسب حالياً، ويمكنكم التواصل مع قسم القبول.",
};

export const PAYMENT_METHODS = ["CASH", "TRANSFER", "CARD_POS"] as const;
export const PAYMENT_LABELS: Record<string, string> = {
  CASH: "نقداً",
  TRANSFER: "حوالة بنكية",
  CARD_POS: "شبكة (نقطة بيع)",
};

export const AUDIENCE_LABELS: Record<string, string> = {
  ALL: "الجميع",
  PARENTS: "أولياء الأمور",
  TEACHERS: "المعلمون",
};
