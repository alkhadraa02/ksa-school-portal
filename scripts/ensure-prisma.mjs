// Generates the Prisma client only when it is missing, so `npm run build`
// works on a fresh clone and does not fail when the engine file is locked.
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const client = new URL("../node_modules/.prisma/client/index.js", import.meta.url);
if (existsSync(client)) {
  console.log("Prisma client already generated - skipping.");
  process.exit(0);
}
const res = spawnSync("npx prisma generate", { stdio: "inherit", shell: true });
process.exit(res.status ?? 1);
