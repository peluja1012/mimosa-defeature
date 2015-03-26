mimosa-defeature
================

A mimosa module for flagging features and removing them from a project build. This is an external module and does not come by default with Mimosa.

For more information regarding mimosa, see http://mimosa.io

Usage
=====

Add `'defeature'` to your list of modules. Mimosa will install the module for you on start up. For a detailed example of how to use this module, refer to [this](https://github.com/peluja1012/MimosaEmberSkeleton) sample project.

Flagging features
=========================

You can flag javascript, css, and template code as features. In general, you can flag a feature by creating a block comment in your source file that follows the following format:
```
<blank space>feature featureName[:optionalFlag]<blank space>
```

* `featureName` is the name of your feature.
* When no `optionalFlag` is used, `defeature` will flag the next line as a part of your feature.
* `optionalFlag` can be one of the following values:
  * `start` Signals the start of a feature code block
  * `end` Signals the end of a feature code block
  * `file` Signals that the entire file is part of a feature

### CSS ###
The `defeature` module will allow you to defeature plain CSS files as well as SASS files. You will also be able to use `defeature` with other CSS preprocessors as long as the `@import` behaviour for partials is similar to SASS. One important thing to note when using CSS preprocessors is that the `:file` optional flag will not work as expected so it's best to avoid it. Additionally, when using CSS preprocessors, using a feature comment with no optional flags above an '@import' line will not work as expected, as it will NOT feature flag the entire partial being imported, but instead it will feature flag the first line of the partial.

**Note:** The `defeature` module will replace unwanted feature flagged CSS code with empty space (new line characters equaling in number to the lines in the original code). This is done in order for source maps to work as expected when using CSS preprocessors.

Examples:

```css
/* feature my_feature:start */
@import 'components/search_status_popover';
/* feature my_feature:end */

// Will feature flag the entire partial
```

```css
/* feature my_feature */
@import 'components/search_status_popover';

// Will feature flag the first line of the partial
```

```css
/* feature tags:start */
.icon-tag {
  color: red;
  display: inline-block;
}
/* feature tags:end */

// Will feature flag a block of css
```

```css
.icon-tag {
  color: red;
  /* feature tags */
  display: inline-block;
}

// Will feature flag a line of css
```

### Javascript ###
`defeature` allows you to feature flag javascript files.

Examples:

```javascript
/* feature my_feature:file */
var hello;
...
...
...

// Will feature flag entire file
```

```javascript
/* feature my_feature */
var hello;
var foo = 3;

// Will feature flag 'var hello;'
```

```javascript
/* feature my_feature:start */
var hello;
var foo = 3;
/* feature my_feature:end */

// Will feature flag block of javascript
```

### Templates ###
`defeature` currently only allows you to feature flag Handlebars templates.

Examples:

```
{{!-- feature download-documents:file --}}
<div class="download-modal">
  <div class="title">Download Documents</div>
  ...
  ...
  ...

// Will feature flag entire template file
```

```
<div class="download-modal">
  <div class="title">Download Documents</div>
  {{!-- feature download-documents --}}
  <span class="foo">hello</span>
</div>


// Will feature flag the next line
```

```
<div class="download-modal">
  {{!-- feature download-documents:start --}}
  <div class="title">Download Documents</div>
  <span class="foo">hello</span>
  {{!-- feature download-documents:end --}}
</div>


// Will feature flag a template block
```

Removing features
=================

Then inclusion or exclusion of features depends on the values present in your `master` and `child` files, which you can specify in the module config. Nested features will result in hyphenated feature names.

Examples

```
Master file

{
  "my_feature": false,
  "foo": {
    "geo": {
      "heatmap": true,
      "overlay": false
    }
  }
}


The following features will be excluded from the build: 'my_feature', 'foo-geo-overlay'

```


```
Master file

{
  "my_feature": true,
  "foo": {
    "geo": {
      "heatmap": true,
      "overlay": true
    }
  }
}

Child file

{
  "foo": false
}


The following features will be excluded from the build: 'foo-geo-overlay', 'foo-geo-heatmap

```

Functionality
=============

The `defeature` module will remove flagged features from your source code. The module will use `master` and `child` files to determine which features to remove. These files should be in `json` format. The module will look for these files in the `folder` that you specify in the config. You should specify a `child` file if different versions of your application will have different features. Usually, you'll have one child file per version of your app. You can use `mimosa` profiles to switch between versions.

If both `master` and `child` are present, `defeature` will perform a smart merge of the two files to determine the final feature list. If only `master` is present, it will use the values in `master` to determine the final feature list. You can nest features in both `master` and `child` files.

`mimosa` will remove features when your run `mimosa watch` or `mimosa build`.

Default Config
======

```
defeature: {
  folder: "feature",
  features: {
    master: "master",
    child: null
  },
  removeFileDefeatures: {
    css: true,
    template: true,
    javascript: true
  }
}
```

#### `removeFileDefeatures` object
An object indicating when the defeaturing of a file should result in that file being excluded from output.

#### `removeFileDefeatures.css` boolean
A flag, when set to `true` (which is the default), will result in the CSS/SASS file not being processed/written.

#### `removeFileDefeatures.template` boolean
A flag, when set to `true` (which is the default), will result in the template file being excluded from template processing, which means it will not be merged together by any of Mimosa's template compilers.  If set to `false`, defeature will retain `file` excluded templates, and those templates will be used by Mimosa's template compilers as contentless.

#### `removeFileDefeatures.javascript` boolean
A flag, when set to `true` (which is the default), will result in the javascript file not being processed any further.  


Example Config
==============

```
defeature: {
  folder: "feature",
  features: {
    master: "master",
    child: "admin"
  }
}
```


