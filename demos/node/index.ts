import { pathToFileURL } from "node:url";
import {
  DuolingoAuthError,
  DuolingoClient,
  DuolingoHttpError,
  DuolingoRateLimitError,
  type DuolingoUser
} from "@duohacker/duolingo";

interface CliClient {
  users: {
    getCurrent(): Promise<DuolingoUser>;
  };
}

interface RunCliOptions {
  argv?: string[];
  env?: NodeJS.ProcessEnv;
  stdout?: (text: string) => void;
  stderr?: (text: string) => void;
  clientFactory?: (token: string) => CliClient;
}

interface PublicProfile {
  username: string;
  displayName: string | null;
  pictureUrl: string | null;
  streak: number | null;
  totalXp: number | null;
  gems: number | null;
  fromLanguage: string | null;
  learningLanguage: string | null;
}

function publicProfile(user: DuolingoUser): PublicProfile {
  return {
    username: user.username,
    displayName: user.displayName,
    pictureUrl: user.pictureUrl,
    streak: user.streak,
    totalXp: user.totalXp,
    gems: user.gems,
    fromLanguage: user.fromLanguage,
    learningLanguage: user.learningLanguage
  };
}

function textValue(value: string | number | null): string {
  return value === null || value === "" ? "Not available" : String(value);
}

export function formatProfileText(user: DuolingoUser): string {
  return [
    "Connected successfully",
    "",
    `Username: ${textValue(user.username)}`,
    `Display name: ${textValue(user.displayName)}`,
    `Streak: ${user.streak === null ? "Not available" : `${user.streak} days`}`,
    `Total XP: ${textValue(user.totalXp)}`,
    `Gems: ${textValue(user.gems)}`,
    `From language: ${textValue(user.fromLanguage)}`,
    `Learning language: ${textValue(user.learningLanguage)}`
  ].join("\n");
}

function safeErrorMessage(error: unknown): string {
  if (error instanceof DuolingoAuthError) return "Authentication failed. Check DUOLINGO_TOKEN.";
  if (error instanceof DuolingoRateLimitError) return "Duolingo rate-limited the request. Try again later.";
  if (error instanceof DuolingoHttpError) return "Duolingo returned an upstream HTTP error.";
  if (error instanceof Error && error.message === "Network request failed") return "Network request failed.";
  return "Unable to load the Duolingo profile.";
}

export async function runCli(options: RunCliOptions = {}): Promise<number> {
  const argv = options.argv ?? process.argv.slice(2);
  const env = options.env ?? process.env;
  const stdout = options.stdout ?? ((text) => console.log(text));
  const stderr = options.stderr ?? ((text) => console.error(text));
  const json = argv.includes("--json");
  const token = env.DUOLINGO_TOKEN;

  if (!token) {
    const message = "Missing DUOLINGO_TOKEN. Set it in your shell environment before running this demo.";
    if (json) stdout(JSON.stringify({ ok: false, error: { code: "MISSING_TOKEN", message } }, null, 2));
    else stderr(message);
    return 1;
  }

  try {
    const client = options.clientFactory?.(token) ?? new DuolingoClient({ token });
    const user = await client.users.getCurrent();
    if (json) stdout(JSON.stringify(publicProfile(user), null, 2));
    else stdout(formatProfileText(user));
    return 0;
  } catch (error) {
    const message = safeErrorMessage(error);
    if (json) stdout(JSON.stringify({ ok: false, error: { code: "PROFILE_LOAD_FAILED", message } }, null, 2));
    else stderr(message);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const code = await runCli();
  process.exitCode = code;
}
