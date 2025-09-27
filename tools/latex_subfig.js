function generateLatex() {
    const rows = parseInt(document.getElementById('rows').value);
    const cols = parseInt(document.getElementById('cols').value);
    const addSubcaption = document.getElementById('addSubcaption').checked;
    const addSubcaptionTitle = document.getElementById('addSubcaptionTitle').checked;
    const addHfill = document.getElementById('addHfill').checked;
    const addVspace = document.getElementById('addVspace').checked;
    const output = document.getElementById('latexOutput');

    // Calculate subfigure width (e.g., divide 0.9\textwidth by number of columns)
    const subfigWidth = (0.9 / cols).toFixed(3);

    let latexCode = `\\begin{figure}[ht]\n` +
        `    \\centering\n`;

    // Generate subfigures
    for (let i = 1; i <= rows; i++) {
        for (let j = 1; j <= cols; j++) {
            latexCode += `    \\begin{subfigure}{${subfigWidth}\\textwidth}\n` +
                `        \\centering\n` +
                `        \\includegraphics[width=\\textwidth]{example-image-a}\n` +
                `        %\\includesvg[]{your-svg-file.svg} % Uncomment this line to include SVG files\n`;

            // Add caption based on checkbox options
            if (addSubcaption) {
                if (addSubcaptionTitle) {
                    latexCode += `        \\caption{Subfigure ${i}${j}}\n`;
                } else {
                    latexCode += `        \\caption{}\n`;
                }
            }

            latexCode += `        \\label{fig:subfig${i}${j}}\n` +
                `    \\end{subfigure}\n`;

            // Add space between subfigures in the same row
            if (j < cols && addHfill) {
                latexCode += `    \\hfill\n`;
            }
        }
        // Add vertical space between rows
        if (i < rows && addVspace) {
            latexCode += `    \\vspace{10pt}\n`;
        }
    }

    latexCode += `    \\caption{Main figure caption}\n` +
        `    \\label{fig:main}\n` +
        `\\end{figure}\n`;

    output.value = latexCode;
}

function copyLatex() {
    const output = document.getElementById('latexOutput');
    output.select();
    document.execCommand('copy');
}