import { Alert } from "./ui";
import { first, type OneOrMany } from "@/lib/portal";

/** Result banner for server actions that redirect back with ?ok= or ?error=. */
export function Flash({ params }: { params: { ok?: OneOrMany; error?: OneOrMany } }) {
  const ok = first(params.ok);
  const error = first(params.error);
  if (!ok && !error) return null;
  return (
    <div className="mb-4">
      {error ? <Alert tone="danger">{error}</Alert> : <Alert tone="success">{ok}</Alert>}
    </div>
  );
}
