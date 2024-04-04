import os, sys, py_compile

to_compile_filename = sys.argv[1]

compiled_executable_path = sys.argv[2]

try:
    py_compile.compile(file = to_compile_filename, cfile = compiled_executable_path)
except py_compile.PyCompileError:
    pass