import type { PrismaClient, Teacher } from "@prisma/client";
import { generateTimetable } from "../src/lib/timetable";
import { splitInstallments, invoiceNumber } from "../src/lib/fees";
import { generateReference } from "../src/lib/admissions";
import { ACADEMIC_YEAR, className } from "../src/lib/constants";

let state = 20261017;
function rnd() {
  state = (state * 1664525 + 1013904223) % 4294967296;
  return state / 4294967296;
}
const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)];
const iso = (d: Date) => d.toISOString().slice(0, 10);
const phone = () => `05${Math.floor(10000000 + rnd() * 89999999)}`;
const DAY = 86400000;

const SUBJECTS = [
  ["القرآن الكريم", "QRN"], ["التربية الإسلامية", "ISL"], ["اللغة العربية", "ARB"],
  ["اللغة الإنجليزية", "ENG"], ["الرياضيات", "MTH"], ["العلوم", "SCI"],
  ["الاجتماعيات", "SOC"], ["الحاسب", "CMP"], ["التربية البدنية", "PHE"], ["التربية الفنية", "ART"],
] as const;

const TEACHERS: readonly [string, string, string][] = [
  ["أحمد بن سعيد القحطاني", "ahmed.qahtani", "ISL"],
  ["فاطمة بنت خالد الشهري", "fatimah.shehri", "ARB"],
  ["نورة بنت عبدالله الدوسري", "noura.dosari", "ENG"],
  ["محمد بن علي الغامدي", "mohammed.ghamdi", "MTH"],
  ["سارة بنت ناصر العتيبي", "sarah.otaibi", "SCI"],
  ["خالد بن فهد الزهراني", "khalid.zahrani", "SOC"],
  ["ريم بنت سلطان المطيري", "reem.mutairi", "CMP"],
  ["عبدالرحمن بن صالح الحربي", "abdulrahman.harbi", "PHE"],
  ["هند بنت إبراهيم السبيعي", "hind.subaie", "ART"],
  ["يوسف بن عمر الشمري", "yousef.shamri", "QRN"],
];

const CLASSES: readonly [string, number][] = [
  ["KINDERGARTEN", 1], ["PRIMARY", 1], ["PRIMARY", 3], ["PRIMARY", 6],
  ["INTERMEDIATE", 1], ["INTERMEDIATE", 3], ["SECONDARY", 1], ["SECONDARY", 3],
];

const PERIODS: Record<string, number> = { QRN: 3, ISL: 3, ARB: 5, ENG: 4, MTH: 5, SCI: 3, SOC: 2, CMP: 1, PHE: 1, ART: 1 };
const BOYS = ["عبدالعزيز", "فهد", "سلمان", "تركي", "ناصر", "بندر", "مشعل", "راكان", "ريان", "زياد", "عمر", "يزن"];
const GIRLS = ["لينا", "جود", "ريماس", "العنود", "غلا", "سديم", "رهف", "لمى", "أروى", "مها", "دانة", "شهد"];
const FAMILIES = ["العتيبي", "القحطاني", "الدوسري", "الشهري", "الغامدي", "الحربي", "المطيري", "السبيعي", "الزهراني", "الشمري"];
const FATHERS = ["سعد", "عبدالله", "محمد", "فيصل", "ماجد", "سطام", "حمد", "طلال"];

export async function seedDemo(db: PrismaClient, demoHash: string) {
  const today = new Date();

  const subjects = [];
  for (const [name, code] of SUBJECTS) subjects.push(await db.subject.create({ data: { name, code } }));
  const subjectByCode = new Map(subjects.map((s) => [s.code, s]));

  const teachers: Teacher[] = [];
  for (const [name, handle, code] of TEACHERS) {
    const user = await db.user.create({
      data: { email: `${handle}@school.example`, name, role: "TEACHER", phone: phone(), passwordHash: demoHash },
    });
    teachers.push(await db.teacher.create({ data: { userId: user.id, specialty: subjectByCode.get(code)!.name } }));
  }
  const teacherByCode = new Map(TEACHERS.map((t, i) => [t[2], teachers[i]]));

  const classes = [];
  for (const [stage, level] of CLASSES) {
    classes.push(
      await db.classGroup.create({
        data: { name: className(stage, level, "أ"), stage, level, section: "أ", year: ACADEMIC_YEAR, capacity: 28 },
      }),
    );
  }

  const lessons: { classId: string; subjectId: string; teacherId: string; periods: number }[] = [];
  for (const c of classes) {
    const codes = c.stage === "KINDERGARTEN" ? ["QRN", "ARB", "ENG", "MTH", "ART", "PHE"] : SUBJECTS.map((s) => s[1]);
    for (const code of codes) {
      const subject = subjectByCode.get(code)!;
      const teacher = teacherByCode.get(code)!;
      await db.teachingAssignment.create({
        data: { classId: c.id, subjectId: subject.id, teacherId: teacher.id, periodsPerWeek: PERIODS[code] },
      });
      lessons.push({ classId: c.id, subjectId: subject.id, teacherId: teacher.id, periods: PERIODS[code] });
    }
  }
  const timetable = generateTimetable(lessons);
  await db.timetableSlot.createMany({
    data: timetable.slots.map((s) => ({
      classId: s.classId, day: s.day, period: s.period, subjectId: s.subjectId, teacherId: s.teacherId,
    })),
  });

  const students = [];
  let studentSeq = 1;
  let parentSeq = 1;
  for (const c of classes) {
    const count = c.stage === "KINDERGARTEN" ? 6 : 8;
    for (let i = 0; i < count; i++) {
      const family = pick(FAMILIES);
      const father = pick(FATHERS);
      const female = rnd() > 0.5;
      const first = pick(female ? GIRLS : BOYS);
      let parentId: string | null = null;
      if (i % 2 === 0) {
        const parent = await db.user.create({
          data: {
            email: `parent${parentSeq}@school.example`,
            name: `${father} ${family}`,
            role: "PARENT",
            phone: phone(),
            passwordHash: demoHash,
          },
        });
        parentId = parent.id;
        parentSeq += 1;
      }
      const age =
        c.stage === "KINDERGARTEN" ? 4 : c.stage === "PRIMARY" ? 5 + c.level : c.stage === "INTERMEDIATE" ? 11 + c.level : 14 + c.level;
      students.push(
        await db.student.create({
          data: {
            studentNo: `S2026${String(studentSeq).padStart(4, "0")}`,
            name: `${first} ${father} ${family}`,
            gender: female ? "F" : "M",
            birthDate: new Date(Date.UTC(2026 - age, Math.floor(rnd() * 12), 1 + Math.floor(rnd() * 27))),
            classId: c.id,
            parentId,
          },
        }),
      );
      studentSeq += 1;
    }
  }
  // Parents of the first six families get a second child.
  const parents = await db.user.findMany({ where: { role: "PARENT" }, orderBy: { email: "asc" } });
  for (const p of parents.slice(0, 6)) {
    const orphan = students.find((s) => !s.parentId);
    if (!orphan) break;
    await db.student.update({ where: { id: orphan.id }, data: { parentId: p.id } });
    orphan.parentId = p.id;
  }

  const days: string[] = [];
  for (let back = 1; days.length < 15; back++) {
    const d = new Date(today.getTime() - back * DAY);
    if (d.getUTCDay() <= 4) days.push(iso(d));
  }
  const attendance = [];
  for (const s of students) {
    for (const date of days) {
      const r = rnd();
      attendance.push({ studentId: s.id, date, status: r < 0.88 ? "PRESENT" : r < 0.93 ? "LATE" : r < 0.97 ? "ABSENT" : "EXCUSED" });
    }
  }
  await db.attendance.createMany({ data: attendance });

  for (const c of classes) {
    const classStudents = students.filter((s) => s.classId === c.id);
    const assigns = await db.teachingAssignment.findMany({ where: { classId: c.id } });
    for (const a of assigns) {
      for (const [title, max, ago] of [["اختبار قصير 1", 20, 40], ["اختبار منتصف الفصل", 40, 14]] as const) {
        const assessment = await db.assessment.create({
          data: {
            classId: c.id, subjectId: a.subjectId, teacherId: a.teacherId, title, term: 1,
            maxScore: max, date: new Date(today.getTime() - ago * DAY),
          },
        });
        await db.grade.createMany({
          data: classStudents.map((s) => ({
            assessmentId: assessment.id,
            studentId: s.id,
            score: Math.round(max * (0.55 + rnd() * 0.45) * 2) / 2,
          })),
        });
      }
      if (rnd() > 0.5) {
        await db.homework.create({
          data: {
            classId: c.id, subjectId: a.subjectId, teacherId: a.teacherId,
            title: "مراجعة الدرس الأخير",
            body: "حل التمارين الموجودة في نهاية الوحدة ومراجعة الملخص قبل الحصة القادمة.",
            dueDate: iso(new Date(today.getTime() + 3 * DAY)),
          },
        });
      }
    }
  }

  const plans = [
    ["رسوم رياض الأطفال", "KINDERGARTEN", 14000, 4],
    ["رسوم المرحلة الابتدائية", "PRIMARY", 18000, 4],
    ["رسوم المرحلة المتوسطة", "INTERMEDIATE", 21000, 4],
    ["رسوم المرحلة الثانوية", "SECONDARY", 24000, 4],
  ] as const;
  const planId = new Map<string, string>();
  for (const [name, stage, amount, installments] of plans) {
    const p = await db.feePlan.create({
      data: { name, stage, amount, installments, year: ACADEMIC_YEAR, description: "تشمل الرسوم الدراسية والأنشطة الصفية." },
    });
    planId.set(stage, p.id);
  }
  const stageOf = new Map(classes.map((c) => [c.id, c.stage]));
  let invSeq = 1;
  for (const s of students) {
    const stage = stageOf.get(s.classId!)!;
    const plan = plans.find((p) => p[1] === stage)!;
    const parts = splitInstallments(plan[2], plan[3]);
    for (let i = 0; i < parts.length; i++) {
      const due = new Date(Date.UTC(2026, 8 + i * 2, 15));
      const invoice = await db.invoice.create({
        data: {
          number: invoiceNumber(2026, invSeq++),
          studentId: s.id,
          feePlanId: planId.get(stage),
          title: `${plan[0]} - الدفعة ${i + 1} من ${parts.length}`,
          amount: parts[i],
          dueDate: due,
        },
      });
      if (due.getTime() < today.getTime() && rnd() > 0.2) {
        const full = rnd() > 0.2;
        await db.payment.create({
          data: {
            invoiceId: invoice.id,
            amount: full ? parts[i] : Math.floor(parts[i] / 2),
            method: pick(["TRANSFER", "CARD_POS", "CASH"] as const),
            reference: full ? `REF-${Math.floor(100000 + rnd() * 899999)}` : null,
            receivedAt: new Date(due.getTime() - 3 * DAY),
          },
        });
      }
    }
  }

  const firstParent = parents[0];
  const firstTeacher = await db.user.findFirst({ where: { role: "TEACHER" }, orderBy: { email: "asc" } });
  if (firstParent && firstTeacher) {
    const child = students.find((s) => s.parentId === firstParent.id);
    await db.message.create({
      data: {
        fromId: firstParent.id, toId: firstTeacher.id, studentId: child?.id,
        subject: "استفسار عن الواجب",
        body: "السلام عليكم ورحمة الله، هل يمكن توضيح المطلوب في واجب هذا الأسبوع؟ جزاكم الله خيراً.",
      },
    });
    await db.message.create({
      data: {
        fromId: firstTeacher.id, toId: firstParent.id, studentId: child?.id,
        subject: "رد: استفسار عن الواجب",
        body: "وعليكم السلام ورحمة الله، المطلوب حل التمارين من الصفحة ١٢ إلى ١٤ وتسليمها يوم الأحد.",
      },
    });
  }

  const applicants = [
    ["جوري سلطان العمري", "F", "PRIMARY", 1, "PENDING", "منى العمري", 6],
    ["عبدالله مازن الخالدي", "M", "INTERMEDIATE", 2, "REVIEW", "مازن الخالدي", 13],
    ["سلمى وليد البقمي", "F", "KINDERGARTEN", 2, "ACCEPTED", "وليد البقمي", 5],
    ["معاذ حسن اليامي", "M", "SECONDARY", 1, "WAITLIST", "حسن اليامي", 15],
  ] as const;
  for (const [studentName, gender, stage, level, status, guardianName, age] of applicants) {
    await db.application.create({
      data: {
        reference: generateReference(2026), studentName, gender, stage, level, status, guardianName,
        birthDate: new Date(Date.UTC(2026 - age, 2, 10)), phone: phone(),
      },
    });
  }

  await db.announcement.createMany({
    data: [
      { title: "بدء التسجيل للعام الدراسي القادم", body: "يسرّنا إعلان فتح باب التسجيل المبكر للعام القادم، والمقاعد محدودة في جميع المراحل.", audience: "ALL" },
      { title: "اجتماع أولياء الأمور", body: "ندعوكم لحضور اللقاء الدوري مع المعلمين لمناقشة مستوى الطلاب في الفصل الأول.", audience: "PARENTS" },
      { title: "رصد درجات الاختبارات", body: "يرجى رصد درجات الاختبارات القصيرة في النظام قبل نهاية الأسبوع.", audience: "TEACHERS" },
    ],
  });

  const news = [
    ["اليوم الوطني: احتفال مدرسي بهيج", "national-day", "فعاليات", "احتفل طلابنا باليوم الوطني بعروض وطنية وأناشيد ومعرض تراثي حضره أولياء الأمور."],
    ["تكريم الطلاب المتفوقين في الفصل الأول", "honor-roll", "إنجازات", "كرّمت إدارة المدرسة نخبة من الطلاب المتفوقين دراسياً وسلوكياً في حفل أقيم بالمسرح المدرسي."],
    ["مشاركة المدرسة في أولمبياد الرياضيات", "math-olympiad", "مسابقات", "شارك فريق من طلاب المرحلة المتوسطة في أولمبياد الرياضيات وحقق مراكز متقدمة."],
    ["إطلاق مختبر العلوم الجديد", "science-lab", "مرافق", "افتُتح مختبر العلوم المطوّر بتجهيزات حديثة تتيح تنفيذ تجارب عملية آمنة."],
  ] as const;
  for (let i = 0; i < news.length; i++) {
    const [title, slug, category, excerpt] = news[i];
    await db.newsPost.create({
      data: {
        title, slug, category, excerpt,
        body: `${excerpt}\n\nتحرص المدرسة على ربط التعلم بالتطبيق العملي وإشراك الأسرة في كل خطوة، ونرحب بملاحظاتكم ومقترحاتكم دائماً.`,
        publishedAt: new Date(today.getTime() - (i + 1) * 9 * DAY),
      },
    });
  }

  const events = [
    ["اليوم المفتوح للتعريف بالمدرسة", "زيارة الفصول والمرافق ولقاء الإدارة والمعلمين.", 12, "ساحة المدرسة", "فعاليات"],
    ["اجتماع أولياء الأمور - الفصل الأول", "مناقشة نتائج الطلاب مع المعلمين.", 25, "القاعة الكبرى", "اجتماعات"],
    ["معرض العلوم السنوي", "عرض مشاريع الطلاب العلمية أمام الزوار.", 40, "مختبر العلوم", "أنشطة"],
    ["بطولة كرة القدم المدرسية", "منافسات بين فرق المراحل المختلفة.", 55, "الملعب الرياضي", "رياضة"],
    ["حفل ختام الفصل الدراسي", "تكريم المتفوقين وعروض فنية من الطلاب.", 80, "المسرح المدرسي", "فعاليات"],
  ] as const;
  for (const [title, description, offset, location, category] of events) {
    const startsAt = new Date(today.getTime() + offset * DAY);
    startsAt.setUTCHours(4, 0, 0, 0);
    await db.schoolEvent.create({ data: { title, description, location, category, startsAt } });
  }

  const gallery = [
    ["الطابور الصباحي", "الحياة المدرسية", "بداية يوم دراسي منظم ومفعم بالنشاط", 160],
    ["مختبر العلوم", "المرافق", "تجارب عملية بإشراف معلمي العلوم", 200],
    ["المكتبة", "المرافق", "ركن هادئ للقراءة والبحث", 30],
    ["الملعب", "الأنشطة", "حصص التربية البدنية والبطولات", 120],
    ["معرض الفنون", "الأنشطة", "أعمال الطلاب في التربية الفنية", 330],
    ["حلقة القرآن", "الحياة المدرسية", "حفظ وتلاوة القرآن الكريم", 90],
  ] as const;
  for (const [title, category, caption, hue] of gallery) {
    await db.galleryItem.create({ data: { title, category, caption, hue } });
  }

  console.log(
    `Seeded demo: ${teachers.length} teachers, ${classes.length} classes, ${students.length} students, ${timetable.slots.length} timetable slots.`,
  );
  console.log("Demo accounts: teacher ahmed.qahtani@school.example, parent parent1@school.example (password = DEMO_PASSWORD).");
  if (timetable.unplaced.length) console.log(`Warning: ${timetable.unplaced.length} lessons could not be fully placed.`);
}
