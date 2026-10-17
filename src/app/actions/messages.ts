"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { allowedRecipients } from "@/lib/messaging";
import { messageSchema, fieldErrors } from "@/lib/validation";
import { ROLE_HOME } from "@/lib/constants";

export async function sendMessageAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "PARENT" && user.role !== "TEACHER")) redirect("/login");
  const back = `${ROLE_HOME[user.role]}/messages`;

  const parsed = messageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const first = Object.values(fieldErrors(parsed.error))[0] ?? "تحقّق من الحقول";
    redirect(`${back}?error=${encodeURIComponent(first)}`);
  }
  const v = parsed.data;

  const recipient = (await allowedRecipients(user)).find((r) => r.id === v.toId);
  if (!recipient) redirect(`${back}?error=${encodeURIComponent("لا يمكنك مراسلة هذا المستلم")}`);
  const studentId = v.studentId && recipient.students.some((s) => s.id === v.studentId) ? v.studentId : undefined;

  await db.message.create({
    data: { fromId: user.id, toId: v.toId, studentId, subject: v.subject, body: v.body },
  });
  revalidatePath(back);
  redirect(`${back}?ok=${encodeURIComponent("تم إرسال الرسالة")}`);
}
