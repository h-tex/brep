import Replacer from "./replacer.js";
import fs from "fs";
import path from "path";
import parse from "./parse.js";

export async function replacerFromFile (inputPath, options = {}) {
	let script;
	let format = options.format ?? inputPath.match(/\.([^.]+)$/)[1]; // default to get by extension

	if (/\.m?js$/.test(inputPath) || format === "js") {
		// Get import path relative to CWD
		let importPath = path.isAbsolute(inputPath) ? inputPath : path.resolve(process.cwd(), inputPath);
		script = await import(importPath).then(module => module.default ?? module);
	}
	else {
		try {
			script = fs.readFileSync(inputPath, "utf-8");
		}
		catch (error) {
			throw new Error(`Failed to read script file: ${ error.message }`);
		}

		script = parse(script, format);
	}

	return new Replacer(script);

}

export { Replacer };
