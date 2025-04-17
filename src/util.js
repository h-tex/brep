export function applyDefaults (options, defaults) {
	return Object.assign({}, defaults, options);
}

/**
 * Generic function to parse Node.js CLI args
 * @param {*} argv
 * @param {*} defaults
 * @returns {object}
 */
export function parseArgs (
	argv = process.argv,
	{ short = { v: "version" }, boolean = new Set(["version"]) } = {},
) {
	argv = argv.slice(2);
	let ret = { positional: [] };
	let openFlag = false;

	for (let arg of argv) {
		if (arg.startsWith("--")) {
			// Lengthy flag, e.g. --dry-run
			let [key, ...value] = arg.slice(2).split("=");
			value = value.join("="); // value may contain =, so we need to rejoin it
			// Convert kebab-case to camelCase
			key = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
			ret[key] = value || true;
		}
		else if (/^\-[a-z]$/.test(arg)) {
			// Short flag, e.g. -v or -D
			let name = arg.slice(1);
			name = short[name] ?? name;
			ret[name] = true;

			if (!boolean.has(name)) {
				openFlag = name;
			}
		}
		else {
			if (openFlag) {
				ret[openFlag] = arg;
				openFlag = false;
			}
			else {
				ret.positional.push(arg);
			}
		}
	}

	return ret;
}

export function serializeOutcome ({ paths, changed, intact, timeTaken }) {
	let one = paths.length === 1;
	let files = `${paths.length} file${one ? "" : "s"}`;
	let changedFiles = `${intact.size === 0 ? (one ? "it" : "all of them ") : changed.size || "none"}`;

	return `Processed ${files} and changed ${changedFiles} in ${formatTimeTaken(timeTaken)}.`;
}

export function formatTimeTaken (ms) {
	let n = ms,
		unit = "ms";
	if (n >= 1000) {
		n /= 1000;
		unit = "s";

		if (n >= 60) {
			n /= 60;
			unit = "min";
		}
	}

	return `${n.toPrecision(3)} ${unit}`;
}

/**
 * Resolve what the args of a function replacer in string.replace() mean
 * @param {Array} args
 * @returns {object}
 */
export function resolveReplacementArgs (args) {
	let ret = {
		match: args.shift(),
	};

	if (typeof args.at(-1) === "object") {
		ret.groups = args.pop();
	}

	ret.string = args.pop();
	ret.index = args.pop();
	ret.cgroups = args;

	return ret;
}

/**
 * Emulate the special replacements of a string replacemement in string.replace()
 * with code that can be used in a function replacement
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_string_as_the_replacement
 * @param {object} args - Resolved args
 * @param {string} to
 * @returns {string}
 */
export function emulateStringReplacement (args, to) {
	if (!to || !to.includes("$")) {
		// Short-circuit
		return to;
	}

	let { match, groups, string, index, cgroups } = args;

	return to.replaceAll(/\$(\$|\d+|&|`|'|<(.+?)>)/g, (m, type, groupName) => {
		switch (type) {
			case "&":
				return match;
			case "$":
				return "$";
			case "`":
				return string.slice(0, index);
			case "'":
				return string.slice(index + match.length);
		}

		if (type > 0 && cgroups.length >= type) {
			// Indexed catpuring group
			return cgroups[type - 1];
		}
		if (groupName && groupName in groups) {
			return groups[groupName];
		}
		return m; // failsafe
	});
}

export function toArray (val) {
	return Array.isArray(val) ? val : [val];
}

export function escapeRegExp (str) {
	return str?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function partialRegexp (text, o = {}) {
	let { regexp, group } = o;

	if (Array.isArray(text)) {
		text = text.map(t => partialRegexp(t, o)).join("|");
	}
	else if (!regexp) {
		text = escapeRegExp(text);
	}

	if (group) {
		let groupType = group === true ? "?:" : group;
		text = `(${groupType}${text})`;
	}

	return text;
}
