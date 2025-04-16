import Brep from "./brep.js";
import * as util from "./util.js";

export default async function cli (script, options) {
	let start = performance.now();

	if (arguments.length === 1) {
		// CLI process.argv
		if (Array.isArray(script)) {
			options = util.parseArgs(script);

			let files;
			[script, ...files] = options.positional;
			if (files.length > 0) {
				options.files ??= files;
			}
		}
	}

	if (options?.version) {
		let version = (await import("../package.json", { with: { type: "json" } })).default.version;
		console.info(`Brep v${version}`);
		return;
	}

	if (!script) {
		throw new Error("Please provide a path to a script file as the first argument.");
	}

	let brep = await Brep.fromPath(script, options);
	let outcome = await brep.glob();

	if (!outcome) {
		return;
	}

	outcome.timeTaken = await outcome.timeTaken;

	let message = util.serializeOutcome(outcome);
	outcome.totalTimeTaken = performance.now() - start;

	if (!brep.options.quiet) {
		console.info(message, `(total time: ${util.formatTimeTaken(outcome.totalTimeTaken)})`);
	}

	return outcome;
}
