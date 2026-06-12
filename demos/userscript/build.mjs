import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";

const root = path.resolve(import.meta.dirname, "../..");
const outfile = path.resolve(import.meta.dirname, "build/duolingo-client-demo.user.js");

const metadata = `// ==UserScript==
// @name         Duolingo Unofficial Client Demo
// @namespace    https://github.com/not2pixel
// @version      0.1.0
// @description  Read-only userscript demo for @duohacker/duolingo
// @match        https://*.duolingo.com/*
// @match        https://*.duolingo.cn/*
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @grant        GM_addStyle
// @grant        GM.addStyle
// @connect      duolingo.com
// @connect      www.duolingo.com
// @connect      duolingo.cn
// @connect      www.duolingo.cn
// ==/UserScript==
`;

await mkdir(path.dirname(outfile), { recursive: true });

const result = await build({
  entryPoints: [path.resolve(import.meta.dirname, "src/demo.user.ts")],
  bundle: true,
  format: "iife",
  target: "es2022",
  platform: "browser",
  write: false,
  sourcemap: false,
  legalComments: "none",
  alias: {
    "@duohacker/duolingo": path.join(root, "src/index.ts")
  }
});

const output = result.outputFiles?.[0]?.text;
if (!output) throw new Error("esbuild did not produce a userscript bundle");

await writeFile(outfile, `${metadata}\n${output}`, "utf8");
console.log(`Built ${path.relative(root, outfile)}`);
