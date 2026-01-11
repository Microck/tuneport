#!/bin/bash
# Clean up previous artifacts
rm -f *.aux *.log *.out *.pdf *.bbl *.blg

# Compile sequence for proper reference generation
echo "Step 1: Initial pdflatex run..."
pdflatex paper.tex

echo "Step 2: Running bibtex..."
bibtex paper

echo "Step 3: Second pdflatex run (linking references)..."
pdflatex paper.tex

echo "Step 4: Final pdflatex run (resolving layout)..."
pdflatex paper.tex

echo "Done! Generated paper.pdf"
