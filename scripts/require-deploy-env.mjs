import { pathToFileURL } from "node:url";

export function deployEnvError(env = process.env, version = process.versions.node) {
  const major = Number.parseInt(String(version), 10);
  if (!Number.isFinite(major) || major < 22) {
    return `Dev deploys need Node 22 or newer. Wrangler fails on Node 20. Current version is ${version}.`;
  }
  if (!env.CLOUDFLARE_API_TOKEN) {
    return "CLOUDFLARE_API_TOKEN is not set. Export it in the environment. Do not commit it.";
  }
  return "";
}

const entry = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === entry) {
  const message = deployEnvError();
  if (message) {
    console.error(message);
    process.exit(1);
  }
}
