# BAtch Find & Replace

Ever written some complex find & replace operations in a text editor, and wished you could save them somewhere and re-run them in the future,
either on the same file or other files?
This is exactly what bafr (**BA**tch **F**ind & **R**eplace) does.

You write a bafr script (see syntax below), and then you apply it from the command-line like:

```bash
bafr myscript.toml src/**/*.html
```

This will apply the script `myscript.toml` to all HTML files in the `src` folder and its subfolders.
You don’t need to specify the file paths multiple times if they don’t change, you can include them in your script as defaults (and still override them if needed).

## Installation

You will need to have [Node.js](https://nodejs.org/) installed.
Then, to install bafr, run:

```bash
npm install -g bafr
```

## Syntax

There are two main syntaxes, each more appropriate for different use cases:
1. [TOML](https://toml.io/en/) when your strings are multiline or have weird characters and you want their boundaries to be very explicit
2. [YAML](https://yaml.org/) when you want a more concise syntax for simple replacements
3. [JSON](https://www.json.org/) is also supported, but it’s not recommended for writing by hand.

The docs below will show both, and it’s up to you what you prefer.

#### Stripping away matches

Here is the most basic bafr script that simply strips away all `<br>` tags:

```toml
from = "<br>"
```
```yaml
from: <br>
```

#### Replacing matches with a string

In most cases you’d want to replace the instances found with something else.
Here is how you can replace all `<br>` tags with a newline:

```toml
from = "<br>"
to = "\n"
```
```yaml
from: <br>
to: "\n"
```

#### Multiline strings

This also works, and shows how you can do multiline strings:

```toml
from = "<br>"
to = """
"""
```

I do not recommend using YAML for multiline strings.

#### Regular expressions

Replacing fixed strings with other fixed strings is useful, but not very powerful.
The real power of bafr comes from its ability to use regular expressions.
For example, here is how you’d strip all `<blink>` tags:

```toml
regexp = true
from = "<blink>([\S\s]+?)</blink>"
to = "$1" # $1 will match the content of the tag
```
```yaml
regexp: true
from: <blink>([\S\s]+?)</blink>
to: $1 # $1 will match the content of the tag
```

bafr uses the [JS syntax for regular expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions) ([cheatsheet](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions/Cheatsheet)).

#### Multiple find & replace operations

So far our script has only been specifying a single find & replace operation.
That’s not very powerful.
The real power of Bafr is that a single script can specify multiple find & replace operations,
executed in order, with each operating on the result of the previous one.
To specify multiple find & replace operations, you simply add `[[ replace ]]` sections:

```toml
[[ replace ]]
from = "<blink>"

[[ replace ]]
from = "</blink>"
```
```yaml
replace:
- from: <blink>
- from: </blink>
```

In the rest of the docs we will refer to each of these `[[ replace ]]` sections as a “replacement”.

Here is how we would specify multiple replacements with a `to` field:

```toml
[[ replace ]]
from = "<blink>"
to = '<span class="blink">'

[[ replace ]]
from = "</blink>"
to = "</span>"
```
```yaml
replace:
- { from: <blink>, to: '<span class="blink">' }
- { from: </blink>, to: "</span>" }
```

#### Append/prepend

You can always use `$&` to refer to the matched string.
For example, to prepend every instance of "Foo" with "Bar":

```toml
from = "Foo"
to = "Bar$&"
```
```yaml
from: Foo
to: Bar$&
```

However, since this is a little cryptic, bafr supports a nicer syntax for this:

```toml
before = "Foo"
insert = "Bar"
```
```yaml
before: Foo
insert: Bar
```

`after` is also supported and works the same way.

#### Global settings

You can also set global settings for all replacements by including `key = value` pairs at the top level of the file.

```toml
files = "content/*.md"

[[ replace ]]
from = "<br>"
```
```yaml
files: content/*.md
replace:
- from: <br>
```

You can also specify any replacement settings as global settings to set defaults.

## Syntax reference

| Key | Context | Type | Default | Description |
| --- | -- | ---- | ------- | ----------- |
| `files` | Global | A glob pattern to match files to process. |
| `suffix` | Global | String | `""` | The suffix to append to the original filename when writing back. |
| `from` | Replacement | String | (Mandatory) | The string to search for. |
| `to` | Replacement | String | `""` | The string to replace the `from` string with. |
| `regexp` | Replacement | Boolean | `false` | Whether the `from` field should be treated as a regular expression. |
| `case_sensitive` | Replacement | Boolean | `false` | Whether the search should be case-sensitive. |
| `recursive` | Replacement | Boolean | `false` | Whether the replacement should be done recursively. |

## CLI

To use the files specified in the script, simply run:

```bash
bafr script.bafr.toml
```

Where `script.bafr.toml` is your bafr script (and could be a `.yaml` or `.json` file).

To override the files specified in the script, specify them after the script file name, like so:

```bash
bafr script.bafr.toml src/*.md
```

> [!NOTE]
> You can name your script however you want, however ending in `.bafr.ext` is recommended (where ext is `toml`, `yaml`, `json`, etc.) to make it clear that this is a bafr script.

### Supported flags

- `--verbose`
- `--dry-run`: Just print out the output and don’t write anything

## JS API

There are two classes: `Bafr` that has the most functionality but only works in Node,
and `Replacer` with the core functionality that works in both Node and the browser.

### `Replacer`

```js
import { Replacer } from "bafr/replacer";
```

Instance methods:
- `replacer.transform(content)`: Process a string and return the result.

### `Bafr` (Node.js-only)

```js
import Bafr from "bafr";
```

Instance methods:
- `bafr.text(content)`: Process a string (internally calls `replacer.transform()`).
- `bafr.file(path [, outputPath])`: Process a file and write the results back (async).
- `bafr.files(paths)`: Process multiple files and write the results back
- `bafr.glob(pattern)`: Process multiple files and write the results back

## Future plans

### I/O

- A way to intersect globs, e.g. the script specifies `**/*.html` then the script user specifies `folder/**` and all HTML files in `folder` are processed.
- A way to change the extension of the output file

### CLI

- Interactive mode
- `--help` flag
- `--version` flag

