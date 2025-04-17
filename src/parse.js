import * as toml from "smol-toml";
import yaml from "yaml";

/** @type {{ [key: string]: { parse: (text: string) => any } }} */
let formats = {
	toml,
	yaml,
	yml: yaml,
	json: JSON,
};

/** @type {{ JSON: typeof JSON, toml: typeof toml, yaml: typeof yaml }} */
export const parsers = { JSON, toml, yaml };

/**
 * Parse a script string into an object.
 * @param {string} script - The script content to parse.
 * @param {string} [format="toml"] - The format to parse as ("toml", "yaml", "yml", or "json").
 * @returns {any} The parsed script object.
 * @throws {Error} If parsing fails.
 */
export default function parse (script, format = "toml") {
	let parser = formats[format.toLowerCase()] ?? toml;

	try {
		script = parser.parse(script);
	}
	catch (e) {
		throw new Error(`Failed to parse script file as ${format}. Original error was:`, e);
	}

	return script;
}
