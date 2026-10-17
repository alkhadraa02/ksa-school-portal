import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { Card, PageHeader } from "@/components/ui";
import { SCHOOL_ADDRESS, SCHOOL_EMAIL, SCHOOL_NAME, SCHOOL_PHONE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "تواصل معنا",
  description: "تواصلوا مع مدارس النخبة الأهلية في الرياض: الهاتف والبريد والعنوان ونموذج رسالة مباشرة نرد عليه خلال يوم عمل.",
  alternates: { canonical: "/contact" },
  openGraph: { title: "تواصل معنا", url: "/contact" },
};

export default function ContactPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "School",
    name: SCHOOL_NAME,
    telephone: SCHOOL_PHONE,
    email: SCHOOL_EMAIL,
    address: { "@type": "PostalAddress", streetAddress: SCHOOL_ADDRESS, addressCountry: "SA" },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHeader title="تواصل معنا" lead="يسعدنا استقبال استفساراتكم وملاحظاتكم." />
      <div className="grid gap-6 md:grid-cols-[1fr_20rem]">
        <Card>
          <h2 className="mb-4 text-xl font-bold">أرسل لنا رسالة</h2>
          <ContactForm />
        </Card>
        <Card className="h-fit">
          <h2 className="mb-3 text-xl font-bold">بيانات المدرسة</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted">الهاتف</dt>
              <dd dir="ltr" className="text-start font-medium">{SCHOOL_PHONE}</dd>
            </div>
            <div>
              <dt className="text-muted">البريد الإلكتروني</dt>
              <dd dir="ltr" className="break-all text-start font-medium">{SCHOOL_EMAIL}</dd>
            </div>
            <div>
              <dt className="text-muted">العنوان</dt>
              <dd className="font-medium">{SCHOOL_ADDRESS}</dd>
            </div>
            <div>
              <dt className="text-muted">ساعات الدوام</dt>
              <dd className="font-medium">الأحد – الخميس، 7:00 ص – 3:00 م</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
