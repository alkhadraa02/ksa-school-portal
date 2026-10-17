import Link from "next/link";
import { buttonClass } from "@/components/ui";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-bold">الصفحة غير موجودة</h1>
      <p className="text-muted">ربما تغيّر الرابط أو حُذفت الصفحة. يمكنك العودة إلى الصفحة الرئيسية.</p>
      <Link href="/" className={buttonClass("primary")}>العودة إلى الرئيسية</Link>
    </main>
  );
}
