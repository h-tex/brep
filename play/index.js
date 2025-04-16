import { createApp } from "https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js";
import parse, { parsers } from "../src/parse.js";
import Replacer from "../src/replacer.js";

let scriptRaw =
	localStorage.scriptRaw ??
	`regexp: true
from: foo+
to: bar`;

let input =
	localStorage.input ??
	`Foo bar
foo
foooooo
baz`;

globalThis.app = createApp({
	data () {
		return {
			scriptRaw,
			input,
			format: undefined,
			JSON,
		};
	},

	computed: {
		script () {
			let formats = Object.keys(parsers);
			for (let format of formats) {
				try {
					let script = parse(this.scriptRaw, format);
					this.format = format; // last successful format
					this.$refs.script?.setCustomValidity("");

					return script;
				}
				catch (e) {}
			}

			let errorMessage = `Cannot parse script as any of the supported formats (${formats.join(", ")})`;
			this.$refs.script?.setCustomValidity(errorMessage);
			this.$refs.script?.reportValidity();
			this.format = undefined;
			// throw new Error(errorMessage);
		},

		replacer () {
			return new Replacer(this.script);
		},

		result () {
			return this.replacer.transform(this.input);
		},
	},

	watch: {
		scriptRaw (value) {
			localStorage.scriptRaw = value;
		},

		input (value) {
			localStorage.input = value;
		},
	},
}).mount(document.body);
