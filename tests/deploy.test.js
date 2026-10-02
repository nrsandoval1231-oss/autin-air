import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { deployEnvError } from "../scripts/require-deploy-env.mjs";

const root = resolve(import.meta.dirname, "..");

test("dev headers keep the pages site out of search indexes", () => {
  const headers = readFileSync(resolve(root, "_headers"), "utf8");
  assert.match(headers, /^\/\*/m);
  assert.match(headers, /X-Robots-Tag:\s*noindex,\s*nofollow/);
  assert.match(readFileSync(resolve(root, "README.md"), "utf8"), /remove it, or exclude it from the deploy, at production cutover/i);
});

test("build:dev copies only the dev site files into dist", () => {
  const dist = resolve(root, "dist");
  rmSync(dist, { recursive: true, force: true });
  const result = spawnSync(process.execPath, ["scripts/build-dist.mjs"], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(readdirSync(dist).sort(), ["_headers", "assets", "credits.html", "index.html", "src"]);
  assert.ok(existsSync(resolve(dist, "src/site.js")));
  assert.ok(existsSync(resolve(dist, "src/styles.css")));
  assert.ok(existsSync(resolve(dist, "src/form.js")));
  assert.ok(existsSync(resolve(dist, "assets/austin-air-logo.png")));
  assert.ok(existsSync(resolve(dist, "assets/austin-air-fleet.jpeg")));
  assert.match(readFileSync(resolve(dist, "_headers"), "utf8"), /noindex,\s*nofollow/);
  for (const absent of ["tests", "node_modules", "README.md", "package.json", "scripts", ".git"]) {
    assert.equal(existsSync(resolve(dist, absent)), false, `dist should not include ${absent}`);
  }
});

test("deploy:dev refuses Node below 22 and a missing token", () => {
  assert.match(deployEnvError({ CLOUDFLARE_API_TOKEN: "present" }, "20.18.0"), /Node 22 or newer/);
  assert.match(deployEnvError({}, "22.14.0"), /CLOUDFLARE_API_TOKEN is not set/);
  assert.equal(deployEnvError({ CLOUDFLARE_API_TOKEN: "present" }, "22.14.0"), "");
  const missing = spawnSync(process.execPath, ["scripts/require-deploy-env.mjs"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, CLOUDFLARE_API_TOKEN: "" },
  });
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /CLOUDFLARE_API_TOKEN is not set/);
});
