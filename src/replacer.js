import { resolveReplacementArgs, emulateStringReplacement, escapeRegExp, partialRegexp } from "./util.js";

export const fromRegexp = Symbol("from regexp");
const nonword = "[^_\\p{L}\\p{N}]";

export default class Replacer {
	constructor (script, parent) {
		this.parent = parent;
		this.source = script;

		if (Array.isArray(script)) {
			// Convert [from, to] shorthand syntax to object
			let [from, to] = script;
			script = { from, to };

			if (parent) {
				// Inherit settings from parent
				for (let prop in ["regexp", "ignore_case", "whole_word"]) {
					script[prop] = parent[prop];
				}
			}
		}

		Object.assign(this, script);

		this.compile();

		if (this.replace) {
			this.replace = this.replace.map(replacement => new Replacer(replacement, this));
		}
	}

	/**
	 * Create a regex for this replacement, if needed
	 */
	compile () {
		let { from, before, after, regexp, ignore_case, whole_word } = this;
		let createRegexp =
			regexp || before || after || ignore_case || whole_word || Array.isArray(from);
		let isReplacement = Boolean(from || before || after);

		if (createRegexp && isReplacement) {
			let flags = "gmvs" + (ignore_case ? "i" : "");
			let pattern = [
				after ? partialRegexp(after, { regexp, group: "?<=" }) : "",
				whole_word ? `(?:^|(?=${nonword})|(?<=${nonword}))` : "",
				from ? partialRegexp(from, { regexp, group: Array.isArray(from) }) : "",
				whole_word ? `(?:$|(?=${nonword})|(?<=${nonword}))` : "",
				before ? partialRegexp(before, { regexp, group: "?=" }) : "",
			].join("");

			if (pattern) {
				try {
					this[fromRegexp] = RegExp(pattern, flags);
				}
				catch (e) {
					console.error(`Failed to compile regular expression /${pattern}/${flags}. Original error was:`, e.message);
				}
			}
		}
	}

	/**
	 * Apply the script to a string of text
	 * @param {string} content
	 * @returns {boolean}
	 */
	transform (content, options) {
		if (!content || (options?.filter && !options.filter(this))) {
			// Skip
			return content;
		}

		// if (this.parent?.parent) console.log(content);

		let from = this[fromRegexp] ?? this.from;
		let to = this.to ?? this.insert;

		if (from) {
			let prevContent;
			do {
				prevContent = content;
				if (from) {
					let simpleTo = typeof to !== "function" && !this.literal && !this.replace;
					if (to !== undefined || this.replace) {
						content = content.replaceAll(
							from,
							simpleTo
								? to
								: (...args) => {
										let resolvedArgs = resolveReplacementArgs(args);
										let ret = resolvedArgs.match; // no change if no to
										to = this.to ?? this.insert;

										if (to !== undefined) {
											if (typeof to === "function") {
												ret = to.call(this, ret, resolvedArgs);
											}
											else {
												// Replace special replacement patterns
												ret = this.literal
													? to
													: emulateStringReplacement(resolvedArgs, to);
											}
										}

										if (this.replace) {
											// Child replacements
											for (let replacement of this.replace) {
												ret = replacement.transform(ret, options);
											}
										}

										return ret;
									},
						);
					}
				}
			} while (this.recursive && prevContent !== content && content);
		}
		else if (this.replace) {
			for (let replacement of this.replace) {
				content = replacement.transform(content, options);
			}
		}

		return content;
	}
}
