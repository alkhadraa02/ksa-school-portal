# مدارس الأمل الأهلية — School Portal

موقع مدرسة أهلية متكامل مع بوابة لأولياء الأمور والمعلمين ولوحة إدارة، مبني بـ Next.js وواجهة عربية من اليمين إلى اليسار.

A complete private-school platform: public website, parent and teacher portal, and an admin dashboard. Arabic-first (RTL), no paid services or API keys required.

## المزايا — Features

**الموقع العام / Public site**
- عن المدرسة، المراحل (رياض الأطفال، الابتدائية، المتوسطة، الثانوية)، الأخبار، الفعاليات، المعرض، التواصل.
- التقديم الإلكتروني للالتحاق مع رقم مرجعي، والاستعلام عن حالة الطلب.
- SEO: metadata وsitemap وrobots وllms.txt وJSON-LD.

**ولي الأمر / Parent**: الأبناء، الحضور، الدرجات، الجدول، الرسوم والفواتير، المراسلة مع المعلمين.

**المعلم / Teacher**: الفصول، تسجيل الحضور، رصد الدرجات، الواجبات، المراسلة.

**الإدارة / Admin**: الطلاب، الفصول والشعب، المواد، المعلمون، منشئ الجدول الدراسي بلا تعارض (فصل أو معلم)، مراجعة طلبات الالتحاق، خطط الرسوم، الإعلانات، التقارير.

## لقطات الشاشة — Screenshots

أضف لقطاتك في `docs/screenshots/` ثم اربطها هنا. / Add your own captures under `docs/screenshots/` and link them here.

## التقنيات — Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Prisma + SQLite · zod · Vitest · خط IBM Plex Sans Arabic.

## التشغيل في 5 أوامر — Setup in 5 commands

```bash
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run db:push
npm run db:seed
npm run dev                 # http://localhost:3114
```

أوامر أخرى / Other scripts: `npm run build` · `npm start` · `npm test` · `npm run typecheck` · `npm run db:reset`.

## حسابات الدخول — Default logins

بيانات محلية للتجربة فقط، غيّرها في `.env` قبل أي استخدام حقيقي. / Local placeholders only; change them in `.env`.

| الدور / Role | البريد / Email | كلمة المرور / Password |
| --- | --- | --- |
| الإدارة / Admin | `admin@school.example` (`ADMIN_EMAIL`) | `ChangeMe-Admin-2026` (`ADMIN_PASSWORD`) |
| معلم / Teacher | `ahmed.qahtani@school.example` | `DEMO_PASSWORD` |
| ولي أمر / Parent | `parent1@school.example` | `DEMO_PASSWORD` |

البيانات التجريبية خيالية بالكامل. اضبط `SEED_DEMO="false"` لتخطي الحسابات التجريبية. / All demo data is fictional; set `SEED_DEMO="false"` to skip it.

## هيكل المشروع — Structure

```
prisma/            schema.prisma, seed.ts (admin), seed-demo.ts (fictional data)
src/app/           الصفحات: (site) عامة، parent، teacher، admin، api
src/components/    مكونات الواجهة والنماذج
src/lib/           auth, password, timetable, grades, attendance, fees, validation, rate-limit
tests/             Vitest: منطق الجدول والدرجات والرسوم، ومسار API
```

## الأمان — Security

كلمات المرور مُجزّأة بملح (scrypt)، والجلسة في كعكة httpOnly، والمدخلات تُتحقق بـ zod، والنماذج العامة محدودة المعدّل، ورؤوس الأمان مضبوطة في `next.config.ts`.

## الرخصة — License

MIT © TechnologyKSA
