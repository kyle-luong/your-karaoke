// scripts/test-lrc-parser.ts
import parseLrcContent from "@/lib/utils/lrc-parser";
import { readFileSync } from "fs";
import { join } from "path";

const lrcPath = join(process.cwd(), "public/demo/lrcs/humble.txt");
const content = readFileSync(lrcPath, "utf-8");
const parsed = parseLrcContent(content);

console.log(JSON.stringify(parsed, null, 2));