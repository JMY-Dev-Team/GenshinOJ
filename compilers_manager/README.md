# Introduction to create customized submodules for supporting judgment for specific language(s)

In this program we create a list containing objects of the classes you provide.

The classes must implement `__init__()` and `__del__()` method, thus making it convenient to debug.

Whenever we receive a source code of languages binding to your bundle, callback method `on_compile()` will be called, which is given the arguments of `language`, `compile_file_path` and `compile_binary_path`, to do the compilation task.

Whenever we finished the judgment and need to clean-up, callback method `on_cleanup()` will be called, which is given the arguments of `language`, `compile_file_path` and `compile_binary_path`, to do the clean-up task.

And we also need two methods called `get_file_appendix()` and `get_binary_appendix()`,to find the source files and binaries.

In all callback method should you return the status of it. Any incorrect or unfinished implement may crash the server.
