import Replacer from "../src/replacer.js";

export default {
	name: "Text replacement",
	run (text, script) {
		return new Replacer(script).transform(text);
	},
	tests: [
		{
			name: "Static",
			args: ["foooo", { from: "o", to: "a" }],
			expect: "faaaa",
		},
		{
			name: "[from, to]",
			args: ["foooo", ["o", "a"]],
			expect: "faaaa",
		},
		{
			name: "Case insensitive",
			args: ["foooo", { from: "O", to: "a", ignore_case: true }],
			expect: "faaaa",
		},
		{
			name: "Regex",
			args: ["fo(aa)o", { from: "\\((a+)\\)", to: "$1", regexp: true }],
			expect: "foaao",
		},
		{
			name: "Whole word",
			args: ["foo foooooo foo.bar foo", { from: "foo", to: "baz", whole_word: true }],
			expect: "baz foooooo baz.bar baz",
		},
		{
			name: "Whole word unicode",
			args: ["γάτα γατάκι", { from: "γάτα", to: "σκύλος", whole_word: true }],
			expect: "σκύλος γατάκι",
		},
		{
			name: "Whole word surrounded by non-word boundaries",
			args: ["=<foo>=", { from: "<foo>", to: "bar", whole_word: true }],
			expect: "=bar=",
		},
		{
			name: "Whole word beginning and ending in non-word characters, surrounded by word characters",
			args: ["a<foo>b", { from: "<foo>", to: "bar", whole_word: true }],
			expect: "abarb",
		},
		{
			name: "$&",
			args: ["abc", { from: "b", to: "[$&]" }],
			expect: "a[b]c",
		},
		{
			name: "$`",
			args: ["abc", { from: "b", to: "[$`]" }],
			expect: "a[a]c",
		},
		{
			name: "$'",
			args: ["abc", { from: "b", to: "[$']" }],
			expect: "a[c]c",
		},
		{
			name: "Indexed capturing group",
			args: ["a[b]c", { regexp: true, from: "a\\[(b)\\]c", to: "a$1c" }],
			expect: "abc",
		},
		{
			name: "from: []",
			args: ["foo", { from: ["f", "o"], to: "a" }],
			expect: "aaa",
		},
		{
			name: "from: [] + regexp",
			args: ["foo bar baz", { from: ["^.", "(?<=b)."], to: "i", regexp: true }],
			expect: "ioo bir biz",
		},
		{
			name: "to: function",
			tests: [
				{
					args: ["foo", { from: "o", to: () => "a" }],
					expect: "faa",
				},
				{
					args: ["foo", { from: "o", to: match => match.toUpperCase() }],
					expect: "fOO",
				},
			],
		},
	],
};
