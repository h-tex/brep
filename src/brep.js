import fs from "fs";
import {globby} from "globby";
import {Replacer, replacerFromFile} from "./replacer-from-file.js";
import { applyDefaults, toArray } from "./util.js";
import { resolvePath } from "./util-node.js";

/**
 * @typedef {Object} BrepOutcome
 * @property {string[]} paths? - Array of file paths that were processed
 * @property {Promise<Brep(boolean | undefined)[]} changed - Resolves to an array of booleans indicating whether each file was changed, or undefined if reading the file failed.
 * @property {Set<string>} changed - Set of files that were changed, updates as each file is processed.
 * @property {Set<string>} intact - Set of files that were not changed, updates as each file is processed.
 * @property {number} start - Time when the processing started
 * @property {Promise<number>} timeTaken - Promise that resolves to the time taken in milliseconds, once all files have been processed
 */

export default class Brep {
	constructor (script, options = {}) {
		this.script = new Replacer(script);
		this.options = applyDefaults(options, this.constructor.defaultOptions);

		for (let property of ["paths", "path", "suffix", "extension"]) {
			this[property] = this.options[property] ?? this.script[property];
		}

		if (this.extension && !this.extension.startsWith(".")) {
			this.extension = "." + this.extension;
		}
	}

	getFiles () {
		// options have priority over script
		// then paths have priority over files
		if (this.options.paths) {
			return Object.keys(this.options.paths);
		}
		if (this.options.files) {
			return this.options.files;
		}
		if (this.script.paths) {
			return Object.keys(this.script.paths);
		}
		return this.script.files;
	}

	/**
	 * Apply the script to a string of text
	 * @param {string} content
	 * @returns {string} The transformed content
	 */
	text (content, options) {
		return this.script.transform(content, options);
	}

	getOutputPath (inputPath) {
		if (this.paths?.[inputPath]) {
			return this.paths[inputPath];
		}

		// Generate from input path
		let outputPath = inputPath;

		if (this.suffix) {
			outputPath = outputPath.replace(/(?=\.[^\/]+$)/, this.suffix);
		}

		if (this.extension) {
			outputPath = outputPath.replace(/\.[^.]+$/, this.extension);
		}

		if (this.path) {
			outputPath = resolvePath(outputPath, this.path);
		}

		return outputPath;
	}

	/**
	 * Apply the script to a file
	 * @param {string} inputPath
	 * @returns {Promise<boolean>} Whether the file was changed
	 */
	async file (inputPath, outputPath = this.getOutputPath(inputPath), options) {
		let originalContent = await fs.promises.readFile(inputPath, "utf-8");
		let content = this.text(originalContent, {
			filter: replacement => {
				if (replacement.files && replacement !== this.script) {
					// Test path against files criteria
					return toArray(replacement.files).some(file => inputPath.includes(file));
				}

				return true;
			},
		});

		let changed = content !== originalContent;

		if (changed) {
			if (this.options.dryRun) {
				console.info(`Would have written this to ${outputPath}:\n`, content);
			}
			else {
				await fs.promises.writeFile(outputPath, content, "utf-8");

				if (this.options.verbose) {
					console.info(`Written ${outputPath} successfully`);
				}
			}
		}

		return changed;
	}

	/**
	 * Apply the script to multiple files
	 * @param {string[]} paths
	 * @returns {BrepOutcome}
	 */
	files (paths) {
		let changed = new Set();
		let intact = new Set();
		let start = performance.now();
		let ret =  {
			paths,
			start,
			timeTaken: pathsChanged.then(() => performance.now() - start),
			changed,
			intact,
		};
		let pathsChanged = paths.map(path => this.file(path).then(fileChanged => {
			if (fileChanged) {
				changed.add(path);
			}
			else {
				intact.add(path);
			}

			return fileChanged;
		}));

		ret.changed = Promise.allSettled(pathsChanged).then(arr => arr.map(r => r.value));

		return ret;
	}

	/**
	 * Apply the script to multiple files determined by a glob
	 * @param {string} [glob] - Glob pattern to match files
	 * @returns {BrepOutcome}
	 *
	 */
	async glob (glob = this.getFiles()) {
		if (!glob) {
			console.warn(
				`[brep] No paths specified. Please specify a file path or glob either in the replacement script or as a second argument`,
			);
			return;
		}

		let paths = await globby(glob);

		if (paths.length === 0) {
			console.warn(
				`${glob} matched no files. The current working directory (CWD) was: ${process.cwd()}`,
			);
			return;
		}

		if (this.options.verbose) {
			console.info(
				`Found ${paths.length} files: ${paths.slice(0, 10).join(", ") + (paths.length > 10 ? "..." : "")}`,
			);
		}

		return this.files(paths);
	}

	toJSON () {
		return this.script;
	}

	static defaultOptions = {
		verbose: false,
		dryRun: false,
	};

	static async fromPath (inputPath, options = {}) {
		let script = replacerFromFile(inputPath, options);
		return new this(script, options);
	}
}

export {Brep, Replacer};
