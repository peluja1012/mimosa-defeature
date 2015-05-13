v1.0.2
------

This release adds a feature called `environment-production`, which is automatically recognized
when `NODE_ENV` is set to `production`.


v1.0.1
------

This release adds a feature called `mimosa-build-exclude`, which is automatically recognized. 

This allows for excluding features based on whether Mimosa is running a `watch` or a `build`.
When running a `build`, all code using the `mimosa-build-exclude` feature flag will be removed/commented.

v1.0.0
------

This release introduces a change to the default functionality of the plugin.

Two flags for templates and javascript have been added such that when files of those types
are `:file` defeatured and the flags are set to `true`, the file will be omitted
from the files to be considered for output. If a template is `:file` defeatured
it will no longer be in the list of templates to concatenate, if javascript is
`:file` defeatured it will be removed from the `options.files` array.

These flags, `removeFileDefeatures.javascript` and
`removeFileDefeatures.template`, are set to `true` by default and can be
overriden in the plugin config. Set these flags to `false` if you want the
plugin to behave the same as before. Thanks @dbashford for this improvement.
