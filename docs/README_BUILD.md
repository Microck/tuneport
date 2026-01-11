# Building the Research Paper

This directory contains the LaTeX source for the research paper. To generate the PDF with all references and diagrams correctly linked, you must use the provided build scripts.

## Prerequisites
- A LaTeX distribution (TeX Live, MikTeX, or MacTeX)
- `pdflatex` and `bibtex` must be in your system PATH.

## How to Compile

### Windows
Double-click `compile.bat` or run it from the command line:
```cmd
cd docs
compile.bat
```

### Linux / macOS
Run the shell script:
```bash
cd docs
chmod +x compile.sh
./compile.sh
```

## Why isn't the bibliography showing?
LaTeX requires a specific compilation order to generate the bibliography:
1. `pdflatex` (Generates .aux file)
2. `bibtex` (Reads .aux and .bib, generates .bbl file)
3. `pdflatex` (Incorporates .bbl into document)
4. `pdflatex` (Fixes final page numbers and cross-references)

The provided scripts handle this sequence automatically.
