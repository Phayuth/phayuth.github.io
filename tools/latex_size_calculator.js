// Conversion factors to points (pt)
const conversionFactors = {
    pt: 1,              // 1 pt = 1 pt
    pc: 12,             // 1 pc = 12 pt
    mm: 2.834646,       // 1 mm = 2.834646 pt
    cm: 28.34646,       // 1 cm = 28.34646 pt
    in: 72,             // 1 in = 72 pt
    px: 0.75,           // 1 px = 0.75 pt (at 96 DPI)
    em: 12,             // 1 em ≈ 12 pt (approximate, font-dependent)
    ex: 6               // 1 ex ≈ 6 pt (approximate, font-dependent)
};

function convertUnits() {
    const inputValue = parseFloat(document.getElementById('inputValue').value);
    const inputUnit = document.getElementById('inputUnit').value;
    const resultsDiv = document.getElementById('results');

    if (isNaN(inputValue) || inputValue === '') {
        resultsDiv.innerHTML = '<p class="error">Please enter a valid number</p>';
        return;
    }

    // Convert input to points first
    const valueInPoints = inputValue * conversionFactors[inputUnit];

    // Convert to all other units
    let resultsHTML = '<h3>Conversion Results</h3><table class="unit-table"><thead><tr><th>Unit</th><th>Value</th><th>Formatted</th></tr></thead><tbody>';

    for (const [unit, factor] of Object.entries(conversionFactors)) {
        const convertedValue = valueInPoints / factor;
        const formattedValue = convertedValue.toFixed(4);
        const highlight = unit === inputUnit ? ' class="highlight"' : '';

        resultsHTML += `<tr${highlight}>
            <td><strong>${unit}</strong></td>
            <td>${formattedValue}</td>
            <td>${formattedValue} ${unit}</td>
        </tr>`;
    }

    resultsHTML += '</tbody></table>';

    // Add note about relative units
    if (inputUnit === 'em' || inputUnit === 'ex') {
        resultsHTML += '<div class="instructions"><p><strong>Note:</strong> Em and Ex units are relative to font size and may vary depending on the actual font and size used.</p></div>';
    }

    resultsDiv.innerHTML = resultsHTML;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Allow Enter key to trigger conversion
    document.getElementById('inputValue').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            convertUnits();
        }
    });
});