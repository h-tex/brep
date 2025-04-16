import compile from "./compile.js";
import replace from "./replace.js";
import { default as util } from "./util.js";

export default {
	name: "All tests",
	tests: [compile, replace, util],
};
