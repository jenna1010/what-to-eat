// Bundle the small album and its original photos in one dependency-free Worker.
import { readFile, readdir, mkdir, writeFile, cp } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (file) => readFile(path.join(root, file), "utf8");
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".jpg": "image/jpeg" };
const files = ["index.html", "new-meal.html"];
for (const folder of ["assets", "src", "styles"]) {
  for (const file of await readdir(path.join(root, folder))) {
    if (types[path.extname(file)]) files.push(folder + "/" + file);
  }
}
const resources = {};
for (const file of files) {
  const type = types[path.extname(file)];
  const data = await readFile(path.join(root, file));
  resources["/" + file] = [type, type.startsWith("image/") ? data.toString("base64") : data.toString("utf8")];
}
const worker = [
  await read("src/album-data.js"),
  (await read("server/api.mjs")).replace("export async function handleApi", "async function handleApi"),
  "const resources = " + JSON.stringify(resources) + ";",
  await read("server/worker.mjs")
].join("\n");
await mkdir(path.join(root, "dist/server"), { recursive: true });
await mkdir(path.join(root, "dist/.openai"), { recursive: true });
await writeFile(path.join(root, "dist/server/index.js"), worker);
await cp(path.join(root, ".openai/hosting.json"), path.join(root, "dist/.openai/hosting.json"));
console.log("Prepared album Worker with " + files.length + " public files.");
