# brep (Batch REPlace) [![npm](https://img.shields.io/npm/v/brep)](https://www.npmjs.com/package/brep)

_For versions < 0.0.8 see [bafr](https://www.npmjs.com/package/bafr)_

[Online playground](https://brep.htex.app/play/)

Ever written some complex find & replace operations in a text editor, `sed` or whatever, and wished you could save them somewhere and re-run them in the future in one go?
This is exactly what brep _(**B**atch **Rep**lace)_ does!

You write a _brep script_ (see below), and then you apply it to any files you want from the command-line.
Example:

```sh
brep myscript.brep.toml src/**/*.html
```

This will apply the script `myscript.brep.toml` to all HTML files in the `src` folder and its subfolders and overwrite each file with the result of the replacements.
You can even include default file paths in the script itself, so that you don't have the specify them every time if they rarely change (and you can still override them if needed!).

## Contents

1. [Installation](#installation)
2. [Syntax](#syntax)
3. [Syntax reference](#syntax-reference)
4. [CLI](#cli)
5. [JS API](#js-api)
6. [Future plans](#future-plans)

## Installation

You will need to have [Node.js](https://nodejs.org/) installed.
Then, to install brep, run:

```sh
npm install -g brep
```

## Syntax

Brep scripts are just data that follow a certain structure and in theory you could use any data format that supports hierarchical data.
Out of the box, brep supports the following syntaxes, each with its own pros and cons:
1. [TOML](https://toml.io/en/) when your strings are multiline or have weird characters and you want their boundaries to be very explicit
2. [YAML](https://yaml.org/) when you want a more concise syntax for simple replacements
3. [JSON](https://www.json.org/) is also supported. It’s not recommended for writing by hand but can be convenient as the output from other tools.

Of all three, YAML is the most concise and human-readable, but can behave unpredictably or be confusing in edge cases (special symbols, multiline strings).
TOML supports a very precise syntax, and multiline strings, but can look rather awkward.
Lastly, JSON is very fragile and verbose, but has the best compatibility with other tools.

|     | TOML | YAML | JSON |
| --- | ---- | ---- | ---- |
| Readability | ★★★☆☆ | ★★★★☆ | ★★☆☆☆ |
| Conciseness | ★★☆☆☆ | ★★★★★ | ★★☆☆☆ |
| Robustness[^robustness] | ★★★☆☆ | ★★☆☆☆ | ★☆☆☆☆ |
| Compatibility | ★☆☆☆☆ | ★★☆☆☆ | ★★★★★ |
| Supports comments? | ✅ | ✅ | 🚫 |
| Multiline strings? | ✅ | ✅ but [very complex](https://yaml-multiline.info/) | 🚫[^crlf] |

[^robustness]: Opposite of error-proneness. How hard is it to make mistakes?
This includes both syntax errors or writing syntax that behaves differently than what you expect.

[^crlf]: This refers to support for strings that can spread across multiple lines in your brep script.
You can always include line breaks by using `\n` to represent them.

The docs below will show TOML and YAML, and it’s up to you what you prefer.

#### Replacing text with different text

The most basic brep script is a single replacement consisting of
a single static `from` declaration and a single `to` replacement.

As an example, here is how you can replace all instances of `<br>` with a line break character:

```toml
from = "<br>"
to = "\n"
```
```yaml
from: <br>
to: "\n"
```
```json
{
	"from": "<br>",
	"to": "\n"
}
```

Note that the YAML syntax allows you to not quote strings in [many cases](https://stackoverflow.com/a/22235064/90826),
which can be quite convenient but can also create errors if you’re not careful.

#### Multiline strings

This also works, and shows how you can do multiline strings:

```toml
from = "<br>"
to = """
"""
```
```yaml
from: <br>
to: >+

```

I do not recommend using YAML for multiline strings but you can read more about the many different ways to do it [here](https://yaml-multiline.info/).

#### Regular expressions

Replacing fixed strings with other fixed strings is useful, but not very powerful.
The real power of brep comes from its ability to use regular expressions.
For example, here is how you’d strip all `<blink>` tags:

```toml
regexp = true
from = "<blink>([\S\s]+?)</blink>"
to = "<span class=blink>$1</span>" # $1 will match the content of the tag
```
```yaml
regexp: true
from: <blink>([\S\s]+?)</blink>
to: <span class=blink>$1</span> # $1 will match the content of the tag
```
```json
{
	"regexp": true,
	"from": "<blink>([\\S\\s]+?)</blink>",
	"to": "<span class=blink>$1</span>"
}
```

brep uses the [JS dialect for regular expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions) ([cheatsheet](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions/Cheatsheet)) with the following flags:
- `g` (global): Replace all occurrences, not just the first one
- `m` (multiline): `^` and `$` match the start and end of lines, not of the whole file.
- `s` (dotAll): `.` matches any character, including newlines. Use `[^\r\n]` to match any character _except_ newlines.
- `v` (unicodeSets): More reasonable Unicode handling, and named Unicode classes as `\p{…}` (e.g. `\p{Letter}`).
- The `i` flag (case-insensitive) is not on by default, but can be enabled with the `ignore_case` option.

### Multiple find & replace operations

So far our script has only been specifying a single find & replace operation.
That’s not very powerful.
The real power of Brep is that a single script can specify multiple find & replace operations,
executed in order, with each operating on the result of the previous one.
We will refer to each of these as a _replacement_ in the rest of the docs.

#### Multiple replacements in TOML

To specify multiple find & replace operations, you simply add `[[ replace ]]` sections:

```toml
[[ replace ]]
from = "<blink>"
to = "<span class=blink>"

[[ replace ]]
from = "</blink>"
to = "</span>"
```

You can also do it like this:

```toml
replace = [
	{ from = "<blink>", to = "<span class=blink>" },
	{ from = "</blink>", to = "</span>" },
]
```

#### Multiple replacements in YAML

To specify multiple declarations, you need to enclose them in `{ }`:

```yaml
replace:
- { from: <blink>, to: '<span class="blink">' }
- { from: </blink>, to: "</span>" }
```

#### Multiple replacements in JSON

```json
"replace": [
	{"from": "<blink>", "to": "<span class=blink>"},
	{"from": "</blink>", "to": "</span>"}
]
```

### Nested replacements

In some cases it’s more convenient to match a larger part of the text and then do more specific replacements inside just those matches.
In a way, that is similar to a text editor’s "find in selection" feature, except on steroids.

```yaml
# Match sequences of single-line JS comments
regexp: true
from: "(^//[^\n\r]*$)+"
to: "/* $& */" # Convert to block comments
replace:
# Strip comment character
- { regexp: true, from: "^//", to: "" }
- { regexp: true, from: "^/* //", to: "/*" }
```

If you specify a `to`, it will be applied _before_ the child replacements.

### Refer to the matched string

You can use `$&` to refer to the matched string (even when not in regexp mode).
For example, to wrap every instance of "brep" with an `<abbr>` tag you can do:

```toml
from = "brep"
to = '<abbr title="Batch REPlace">$&</abbr>'
```
```yaml
from: brep
to: '<abbr title="Batch REPlace">$&</abbr>'
```

Beyond `$&` there is [a bunch of other special replacements](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_string_as_the_replacement), all starting with a dollar sign (`$`).
To disable these special replacements, use `literal = true` / `literal: true`.

### Append/prepend

While `$&` can be convenient, it’s also a little cryptic.
To make it easier to append or prepend matches with a string,
brep also supports `before`, `after`, and `insert` properties.

For example, this will insert "Bar" before every instance of "Foo":

```toml
before = "Foo"
insert = "Bar"
```
```yaml
before: Foo
insert: Bar
```

`after` is also supported and works as you might expect.

> [!NOTE]
> `insert` is literally just a an alias of `to`, it just reads nicer in these cases.

You can also combine these with `from` to add additional criteria.
For example this script:

```toml
from = "brep"
after = "using"
to = "awesome brep"
```

Will convert "I am using brep" to "I am using awesome brep".

### [from, to] shortcut syntax for many simple replacements

There are many cases where you want to make many replacements, all with the same settings (specified on their parent) and just different `from`/`to` values.
Brep supports a shortcut for this.

Instead of declarations, you can specify from/to pairs directly by enclosing them in brackets, separated by a comma.
This can be combined with regular replacements, though far more easily in YAML:

```yaml
replace:
- [foo, bar]
- [baz, quux]
- {from: yolo, to: hello} # regular replacement
```

In TOML, it cannot be combined with regular `[[ replace ]]` blocks, so **all** replacements need to be specified in a different way:

```toml
replace = [
	["foo", "bar"],
	["baz", "quux"],
	# cannot be combined with [[ replace ]] blocks
	{ from = "yolo", to = "hello", ignore_case = true },
]
```

## Syntax reference

### Replacements

| Key | Type | Default | Description |
| --- | ---- | ------- | ----------- |
| `from` | String or array of strings | (Mandatory) | The string to search for. If an array of strings, they are considered alternatives. |
| `to` | String | _(matched string)_ | The string to replace the `from` string with. |
| `before` | String or array of strings | - | Match only strings before this one. Will be interpreted as a regular expression in regexp mode. |
| `after` | String or array of strings | - | Match only strings after this one. Will be interpreted as a regular expression in regexp mode. |
| `regexp` | Boolean | `false` | Whether the `from` field should be treated as a regular expression. |
| `ignore_case` | Boolean | `false` | Set to `true` to make the search should case-insensitive. |
| `whole_word` | Boolean | `false` | Match only matches either beginning/ending in non-word characters or preceded/followed by non-word characters. Unicode aware. |
| `recursive` | Boolean | `false` | Whether the replacement should be run recursively on its own output until it stops changing the output. |
| `files` | String or array of strings | - | Partial paths to filter against. This is an additional filter over the files being processed, to apply specific replacements only to some of the files. |

### Global settings

| Key | Type | Default | Description |
| --- | ---- | ------- | ----------- |
| `files` | String or array of strings | - | A glob pattern to match files to process. |
| `suffix` | String | `""` | Instead of overwriting the original file, append this suffix to its filename |
| `extension` | String | - | Instead of overwriting the original file, change its extension to this value. Can start with a `.` but doesn’t need to. |
| `path` | String | - | Allows the new file to be in a different directory. Both absolute and relative paths are supported. If relative, it's resolved based on the original file's location. For example, `..` will write a file one directory level up. |

## CLI

To apply a brep script to the files specified in the script, simply run:

```sh
brep script.brep.toml
```

Where `script.brep.toml` is your brep script (and could be a `.yaml` or `.json` file).

To override the files specified in the script, specify them after the script file name, like so:

```sh
brep script.brep.toml src/*.md
```

The syntax (TOML, YAML, JSON) is inferred from the file extension.
To override that (or to use an arbitrary file extension) you can use `--format`:

```sh
brep script.brep --format=toml
```

> [!NOTE]
> You can name your script however you want, however ending in `.brep.ext` can more clearly communicate that this is a brep script.

### Supported flags

- `--verbose`: Print out additional information
- `--dry-run`: Just print out the output and don’t write anything
- `--version`: Just print out the version and don’t do anything

Any root-level setting can also be specified as a flag, e.g. `--suffix=-edited` or `--extension=txt`.

## JS API

You can access all of brep’s functionality via JS, and some of it even works client-side, in the browser!

### Accessing the CLI via JS (Node.js only)

There is also the JS version of the CLI you can access as:

```js
import brep from "brep/cli";
let outcome = await brep("script.yaml");
// Do stuff after script runs
console.log(outcome);
```

The script is passed as the first argument and every named argument is passed as an options object.
It will read, parse, and run the script, process write the output to the files the CLI would, and return an object with various metadata about the run.

Because this works exactly like the CLI, it is of limited utility if you want to actually process the files (or the script) further.
In most cases, you probably want to use the `Brep` or `Replacer` classes instead.
- The `Replacer` class is the parsed form of a script. You can feed it text and it will return the processed text, but it does not do any file I/O.
- The `Brep` class will read a script, parse it, and apply it to one or more files, or raw text.

### `Brep` class (Node.js-only)

This takes care of reading script files, parsing them, creating `Replacer` instances (see below), and applying the Brep script to files.
If you have your script as an object, you can use the constructor directly:

```js
import Brep from "brep";

let brep = new Brep({
	from: 'foo',
	to: 'bar'
}, {
	paths: {
		"foo.src.html": "foo.html"
	}
});
```

If your script lives in a file, you can use `Brep.fromPath()` to read it and parse it,
then apply it to files or other input:

```js
import Brep from "brep";

let brep = Brep.fromPath("script.yaml", {
	paths: {
		"foo.src.html": "foo.html"
	}
});
```

Instance methods:
- `brep.text(content)`: Process a string and return the result as a string (internally calls `replacer.transform()`).
- `brep.file(path [, outputPath])`: Process a file and write the results back (async).
- `brep.files(paths)`: Process multiple files and write the results back
- `brep.glob(pattern)`: Process multiple files and write the results back

### `Replacer` class (Browser-compatible)

This is the core of brep and takes care of applying the replacements on strings of text.

```js
import Replacer from "brep/replacer";
```

or, in the browser:

```js
import Replacer from "node_modules/brep/src/replacer-core.js";
```

`Replacer.fromPath(path)` reads a script file and parses it into a `Replacer` instance.

```js
import Replacer from "brep/replacer";

let replacer = await Replacer.fromPath("script.yaml");
```

If you already have the script as an object, you can use the constructor directly:

```js
import Replacer from "brep/replacer";
let replacer = new Replacer({
	from: 'foo',
	to: 'bar'
});
```

Instance methods:
- `new Replacer(script, parent)`: Create a new instance of the replacer. `script` is the script object, `parent` is the parent replacer (if any).
- `replacer.transform(content)`: Process a string and return the result.


## Future plans

### I/O

- A way to intersect globs, e.g. the script specifies `**/*.html` then the script user specifies `folder/**` and all HTML files in `folder` are processed.

### CLI

- Interactive mode
- `--help` flag

