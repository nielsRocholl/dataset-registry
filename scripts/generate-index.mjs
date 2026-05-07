import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const datasetsDir = path.join(root, "datasets");
const outDir = path.join(root, "generated");
const outFile = path.join(outDir, "index.json");

fs.mkdirSync(outDir, { recursive: true });
const files = fs.readdirSync(datasetsDir).filter((f) => f.endsWith(".json"));
const datasets = [];
for (const f of files) {
  const p = path.join(datasetsDir, f);
  datasets.push(JSON.parse(fs.readFileSync(p, "utf8")));
}
datasets.sort((a, b) => a.id.localeCompare(b.id));
const payload = { generated_at: new Date().toISOString(), datasets };
fs.writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
