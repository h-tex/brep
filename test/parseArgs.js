import { parseArgs } from "../src/util.js";

export default {
	name: "parseArgs()",
	run (args) {
		if (typeof args === "string") {
			args = args.split(/\s+/);
		}
		args.unshift(null, null);
		return parseArgs(args, this.data.options);
	},
	tests: [
		{
			arg: "foo",
			expect: {
				positional: ["foo"],
			},
		},
		{
			arg: "--version",
			expect: {
				positional: [],
				version: true,
			},
		},
		{
			arg: "-v",
			expect: {
				positional: [],
				version: true,
			},
		},
		{
			arg: "-v foo",
			expect: {
				positional: ["foo"],
				version: true,
			},
		},
		{
			arg: "--dry-run",
			expect: {
				positional: [],
				dryRun: true,
			},
		},
		{
			arg: "--file=foo",
			expect: {
				positional: [],
				file: "foo",
			},
		},
	],
};
