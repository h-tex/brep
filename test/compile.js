import Replacer, { fromRegexp } from "../src/replacer.js";

export default {
	name: "Compile single replacement options",
	run (replacement) {
		replacement = new Replacer({ replace: [replacement] }).replace[0];
		return (replacement[fromRegexp] ?? replacement.from) + "";
	},
	check: {
		deep: true,
		subset: true,
	},
	getName (replace) {
		if (!replace) {
			return replace;
		}

		return `{ ${Object.keys(replace).join(", ")} }`;
	},
	tests: [
		{
			arg: { from: "o" },
			expect: "o",
		},
		{
			arg: { regexp: true, from: "o" },
			expect: "/o/gmsv",
		},
		{
			arg: { regexp: true, from: "o", ignore_case: true },
			expect: "/o/gimsv",
		},
		{
			arg: { before: "b" },
			expect: "/(?=b)/gmsv",
		},
		{
			arg: { after: "a" },
			expect: "/(?<=a)/gmsv",
		},
		{
			arg: { before: "b", from: "f" },
			expect: "/f(?=b)/gmsv",
		},
		{
			arg: { after: "a", from: "f" },
			expect: "/(?<=a)f/gmsv",
		},
		{
			arg: { after: "a", from: "f", before: "b" },
			expect: "/(?<=a)f(?=b)/gmsv",
		},
	],
};
