import { resolvePath } from "../src/util-node.js";

export default {
	name: "Utility functions",
	tests: [
		{
			name: "resolvePath()",
			run (to) {
				let path = resolvePath(this.data.from, to);
				return to.startsWith("/") ? path : path.replace(process.cwd() + "/", "");
			},
			data: {
				from: "papers/foo/bar.tex",
			},
			tests: [
				{
					arg: ".",
					expect: "papers/foo/bar.tex",
				},
				{
					arg: "..",
					expect: "papers/bar.tex",
				},
				{
					arg: "../../src",
					expect: "src/bar.tex",
				},
				{
					arg: "baz/yolo",
					expect: "papers/foo/baz/yolo/bar.tex",
				},
				{
					arg: "/baz",
					expect: "/baz/bar.tex",
				},
			],
		},
	],
};
