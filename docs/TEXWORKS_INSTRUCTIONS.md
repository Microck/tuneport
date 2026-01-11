# Building with TeXworks

It appears `pdflatex` and `bibtex` are not in your system PATH, but you have TeXworks installed.

## Solution: Use the "pdfLaTeX+MakeIndex+BibTeX" tool in TeXworks

1.  Open **TeXworks**.
2.  Open the file `docs\paper.tex`.
3.  In the toolbar dropdown menu (usually showing "pdfLaTeX"), select **"pdfLaTeX+MakeIndex+BibTeX"** (or similar, sometimes called "Typeset" with a specific configuration).
    *   If that specific option isn't there, you might need to run them manually from the Typeset menu in this order:
        1.  pdfLaTeX
        2.  BibTeX
        3.  pdfLaTeX
        4.  pdfLaTeX
4.  Click the green **Play/Typeset** button.

This will tell TeXworks to handle the compilation chain for you using its internal path to the tools.
