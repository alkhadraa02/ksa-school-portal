"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClass } from "./ui";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button type="button" onClick={logout} disabled={busy} className={buttonClass("secondary")}>
      {busy ? "جارٍ الخروج…" : "تسجيل الخروج"}
    </button>
  );
}
