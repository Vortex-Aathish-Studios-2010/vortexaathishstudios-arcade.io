import { access, readFile } from "node:fs/promises";
import { isAbsolute } from "node:path";
import { spawnSync } from "node:child_process";

// Use the existing Play upload key. Never generate a replacement key here.
async function release() {
  const required = [
    "ARCADE_VERSION_CODE", "ARCADE_UPLOAD_KEYSTORE", "ARCADE_UPLOAD_KEY_ALIAS",
    "ARCADE_UPLOAD_STORE_PASSWORD", "ARCADE_UPLOAD_KEY_PASSWORD", "VITE_ARCADE_API_URL",
  ];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length) throw new Error("Release configuration is missing: " + missing.join(", "));
  const code = Number(process.env.ARCADE_VERSION_CODE);
  if (!/^[1-9]\d*$/.test(process.env.ARCADE_VERSION_CODE) || !Number.isSafeInteger(code) || code > 2100000000) {
    throw new Error("ARCADE_VERSION_CODE must be a positive integer higher than every version already uploaded to Play Console.");
  }
  if (!isAbsolute(process.env.ARCADE_UPLOAD_KEYSTORE)) {
    throw new Error("ARCADE_UPLOAD_KEYSTORE must be an absolute path to the existing upload key.");
  }
  await access(process.env.ARCADE_UPLOAD_KEYSTORE);
  const capacitor = await readFile(new URL("../capacitor.config.ts", import.meta.url), "utf8");
  const gradle = await readFile(new URL("../android/app/build.gradle", import.meta.url), "utf8");
  if (!capacitor.includes("appId: 'com.vortexaathishatudios.arcadeio'") ||
      !gradle.includes('applicationId "com.vortexaathishatudios.arcadeio"')) {
    throw new Error("The release package must match com.vortexaathishatudios.arcadeio.");
  }
  const api = new URL(process.env.VITE_ARCADE_API_URL);
  if (api.protocol !== "https:" || api.username || api.password || api.search || api.hash || api.pathname !== "/") {
    throw new Error("VITE_ARCADE_API_URL must be the public HTTPS origin of the game server.");
  }
  const response = await fetch(new URL("/api/arcade/leaders", api), {
    headers: { origin: "https://localhost" }, signal: AbortSignal.timeout(15000), redirect: "error",
  });
  const leaders = await response.json().catch(() => null);
  if (!response.ok || !Array.isArray(leaders) || response.headers.get("access-control-allow-origin") !== "https://localhost") {
    throw new Error("The server must allow Android connections without a ChatGPT sign-in before a Play release can be built.");
  }
  console.log("Package identity, release configuration and public Android API access verified.");
  if (process.argv.includes("--check")) return;
  const windows = process.platform === "win32";
  const commands = [
    [windows ? "npm.cmd" : "npm", ["run", "build"], "."],
    [windows ? "npx.cmd" : "npx", ["cap", "sync", "android"], "."],
    [windows ? "gradlew.bat" : "./gradlew", ["--no-daemon", "bundleRelease"], "android"],
  ];
  for (const [command, args, cwd] of commands) {
    const result = spawnSync(command, args, { cwd, stdio: "inherit", shell: windows, env: process.env });
    if (result.error || result.status !== 0) throw new Error("Release build failed at " + command + ".");
  }
  console.log("Signed bundle: android/app/build/outputs/bundle/release/app-release.aab");
}

release().catch(error => { console.error(error.message); process.exitCode = 1; });
