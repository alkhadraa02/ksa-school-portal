const SITE = process.env.SITE_URL ?? "http://localhost:3114";

export function GET() {
  const body = `# مدارس النخبة الأهلية

> مدرسة أهلية في الرياض تضم رياض الأطفال والمرحلة الابتدائية والمتوسطة والثانوية، مع موقع تعريفي وبوابة لأولياء الأمور والمعلمين والإدارة. (بيانات تجريبية وهمية)

## صفحات عامة
- [الرئيسية](${SITE}/)
- [عن المدرسة](${SITE}/about)
- [المراحل الدراسية](${SITE}/stages)
- [القبول والتسجيل](${SITE}/admissions)
- [الأخبار](${SITE}/news)
- [تقويم الفعاليات](${SITE}/events)
- [معرض الصور](${SITE}/gallery)
- [تواصل معنا](${SITE}/contact)
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
