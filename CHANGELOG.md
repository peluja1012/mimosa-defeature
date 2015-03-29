v1.0.0

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
