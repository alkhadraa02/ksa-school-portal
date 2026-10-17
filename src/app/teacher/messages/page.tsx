import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { first, type OneOrMany } from "@/lib/portal";
import { MessageCenter } from "@/components/message-center";
import { Flash } from "@/components/portal-shell";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "الرسائل" };

export default async function TeacherMessages({
  searchParams,
}: {
  searchParams: Promise<{ to?: OneOrMany; ok?: OneOrMany; error?: OneOrMany }>;
}) {
  const user = await requireRole("TEACHER");
  const sp = await searchParams;
  return (
    <>
      <PageHeader title="الرسائل" lead="تواصل مع أولياء أمور طلاب فصولك." />
      <Flash ok={first(sp.ok)} error={first(sp.error)} />
      <MessageCenter user={user} to={first(sp.to)} />
    </>
  );
}
