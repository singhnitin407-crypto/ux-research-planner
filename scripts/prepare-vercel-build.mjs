#!/usr/bin/env node
import { cpSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist", "vercel");

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
cpSync(path.join(root, "index.html"), path.join(output, "index.html"));
cpSync(path.join(root, "src"), path.join(output, "src"), { recursive: true });
cpSync(path.join(root, "public", "assets"), path.join(output, "assets"), { recursive: true });

console.log("Prepared Vercel static output in dist/vercel");
