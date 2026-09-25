const canvas = document.getElementById('frameCanvas');
const context = canvas.getContext('2d');
const formulaRender = document.getElementById('formulaRender');
const colors = ['#087f8c', '#e56b57', '#d69a2d', '#6d5cae', '#2f8f83', '#bd5d4b', '#55738b'];
const state = {
    frames: [
        { name: 'world', x: 0.20, y: 0.24 },
        { name: 'base_link', x: 0.52, y: 0.20 },
        { name: 'camera', x: 0.77, y: 0.43 },
        { name: 'end_effector', x: 0.43, y: 0.70 }
    ],
    known: new Map(),
    selectedPath: [],
    dragging: null,
    dragOffset: null
};

function frameByName(name) { return state.frames.find(frame => frame.name === name); }
function normalizeFrameName(value) { return value.trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_.-]/g, '_').replace(/_+/g, '_'); }
function edgeKey(first, second) { return [first, second].sort().join('|'); }
function allEdges() {
    const edges = [];
    for (let first = 0; first < state.frames.length; first += 1) {
        for (let second = first + 1; second < state.frames.length; second += 1) edges.push({ first: state.frames[first], second: state.frames[second] });
    }
    return edges;
}
function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    const bounds = canvas.getBoundingClientRect();
    canvas.width = Math.round(bounds.width * ratio); canvas.height = Math.round(bounds.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0); draw();
}
function point(frame) { return { x: frame.x * canvas.clientWidth, y: frame.y * canvas.clientHeight }; }
function frameDimensions(frame) {
    context.font = '700 12px Arial';
    return { width: Math.max(72, context.measureText(`{${frame.name}}`).width + 24), height: 42 };
}
function frameBoundaryDistance(frame, ux, uy) {
    const dimensions = frameDimensions(frame);
    return Math.min((dimensions.width / 2) / Math.max(Math.abs(ux), 0.001), (dimensions.height / 2) / Math.max(Math.abs(uy), 0.001)) + 5;
}
function drawArrow(from, to, color, dashed, highlighted) {
    const start = point(from); const finish = point(to); const distance = Math.hypot(finish.x - start.x, finish.y - start.y);
    const ux = (finish.x - start.x) / distance; const uy = (finish.y - start.y) / distance;
    const startInset = frameBoundaryDistance(from, ux, uy); const endInset = frameBoundaryDistance(to, ux, uy);
    const x1 = start.x + ux * startInset; const y1 = start.y + uy * startInset; const x2 = finish.x - ux * endInset; const y2 = finish.y - uy * endInset;
    const shaftEndInset = dashed ? 0 : 3;
    context.save(); context.beginPath(); context.moveTo(x1, y1); context.lineTo(x2 - ux * shaftEndInset, y2 - uy * shaftEndInset); context.strokeStyle = color;
    context.lineWidth = highlighted ? 3.5 : dashed ? 1.5 : 2.5; context.setLineDash(dashed ? [7, 7] : []); context.stroke(); context.setLineDash([]);
    if (dashed) { context.restore(); return; }
    context.translate(x2, y2); context.rotate(Math.atan2(y2 - y1, x2 - x1)); context.beginPath(); context.moveTo(0, 0); context.lineTo(-14, -7); context.lineTo(-14, 7); context.closePath(); context.fillStyle = color; context.fill(); context.restore();
}
function drawTransformBadge(from, to, relation, color) {
    const start = point(from); const finish = point(to); const centerX = (start.x + finish.x) / 2; const centerY = (start.y + finish.y) / 2;
    const longestName = Math.max(relation.from.length, relation.to.length);
    const labelSize = Math.max(8, Math.min(11, 72 / Math.max(8, longestName)));
    context.font = `700 ${labelSize}px Arial`;
    const labelWidth = Math.max(context.measureText(relation.from).width, context.measureText(relation.to).width);
    const radius = Math.max(24, Math.min(44, labelWidth / 2 + 18));
    context.beginPath(); context.arc(centerX, centerY, radius, 0, Math.PI * 2); context.fillStyle = '#fff'; context.fill();
    context.lineWidth = 2; context.strokeStyle = color; context.stroke();
    context.fillStyle = '#243242'; context.textAlign = 'left'; context.textBaseline = 'middle'; context.font = '700 18px Georgia'; context.fillText('H', centerX - 15, centerY + 1);
    context.font = `700 ${labelSize}px Arial`; context.fillText(relation.from, centerX + 1, centerY - 10); context.fillText(relation.to, centerX + 1, centerY + 11);
}
function draw() {
    const width = canvas.clientWidth; const height = canvas.clientHeight;
    context.clearRect(0, 0, width, height); context.fillStyle = '#fbfdfe'; context.fillRect(0, 0, width, height);
    context.strokeStyle = '#edf2f4'; context.lineWidth = 1;
    for (let x = 0; x < width; x += 32) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke(); }
    for (let y = 0; y < height; y += 32) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); }
    allEdges().forEach(edge => {
        const key = edgeKey(edge.first.name, edge.second.name); const relation = state.known.get(key); const highlighted = state.selectedPath.some(link => link.key === key);
        const color = highlighted ? '#e56b57' : relation ? '#087f8c' : '#a8b8c0';
        const arrowFrom = relation ? frameByName(relation.from) : edge.first; const arrowTo = relation ? frameByName(relation.to) : edge.second;
        drawArrow(arrowFrom, arrowTo, color, !relation, highlighted);
        if (relation) drawTransformBadge(arrowFrom, arrowTo, relation, color);
    });
    state.frames.forEach((frame, index) => {
        const { x, y } = point(frame); const dimensions = frameDimensions(frame); const color = colors[index % colors.length];
        context.beginPath(); context.roundRect(x - dimensions.width / 2, y - dimensions.height / 2, dimensions.width, dimensions.height, 7); context.fillStyle = '#fff'; context.fill(); context.lineWidth = 3; context.strokeStyle = color; context.stroke();
        context.fillStyle = color; context.font = '700 12px Arial'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(`{${frame.name}}`, x, y);
    });
}
function updateSelectors() {
    const from = document.getElementById('fromFrame'); const to = document.getElementById('toFrame'); const remove = document.getElementById('removeFrame'); const rename = document.getElementById('renameFrame');
    const previousFrom = from.value; const previousTo = to.value; const previousRemove = remove.value; const previousRename = rename.value;
    from.innerHTML = ''; to.innerHTML = ''; remove.innerHTML = ''; rename.innerHTML = '';
    state.frames.forEach(frame => {
        from.add(new Option(frame.name, frame.name)); to.add(new Option(frame.name, frame.name)); remove.add(new Option(frame.name, frame.name)); rename.add(new Option(frame.name, frame.name));
    });
    from.value = frameByName(previousFrom) ? previousFrom : state.frames[0].name; to.value = frameByName(previousTo) ? previousTo : state.frames[Math.min(1, state.frames.length - 1)].name;
    remove.value = frameByName(previousRemove) ? previousRemove : state.frames[0].name;
    rename.value = frameByName(previousRename) ? previousRename : state.frames[0].name;
    document.getElementById('removeButton').disabled = state.frames.length <= 1;
}
function updateStatus() { document.getElementById('graphStatus').textContent = `${state.frames.length} frames / ${state.known.size} known transforms`; }
function latexFrame(name) { return name.replace(/([\\{}_^%#$&])/g, '\\$1'); }
function latexTransform(child, parent) { return `H_{${latexFrame(child)}}^{${latexFrame(parent)}}`; }
function renderLatex(latex) {
    formulaRender.innerHTML = latex ? `\\[${latex}\\]` : '';
    if (window.MathJax && window.MathJax.typesetPromise) window.MathJax.typesetPromise([formulaRender]);
}
function refreshLatexWhenReady() {
    if (window.MathJax && window.MathJax.typesetPromise) renderLatex(formulaRender.dataset.latex || '');
}
function findPath(startName, endName) {
    const queue = [{ name: startName, links: [] }]; const visited = new Set([startName]);
    while (queue.length) {
        const current = queue.shift(); if (current.name === endName) return current.links;
        state.known.forEach((relation, key) => {
            let next = null; let direct = false;
            if (relation.from === current.name) { next = relation.to; direct = true; }
            if (relation.to === current.name) next = relation.from;
            if (next && !visited.has(next)) { visited.add(next); queue.push({ name: next, links: current.links.concat({ key, from: current.name, to: next, direct }) }); }
        });
    }
    return null;
}
function showFormula() {
    const from = document.getElementById('fromFrame').value; const to = document.getElementById('toFrame').value;
    const message = document.getElementById('resultMessage'); const path = findPath(from, to); state.selectedPath = path || [];
    if (from === to) {
        message.textContent = 'Same frame: no transform is needed.';
        formulaRender.dataset.latex = `${latexTransform(from, from)} = I`;
    } else if (!path) {
        message.textContent = `No known chain connects ${from} to ${to}.`;
        formulaRender.dataset.latex = '';
    } else {
        const latexTerms = path.map(link => link.direct ? latexTransform(link.to, link.from) : `(${latexTransform(link.from, link.to)})^{-1}`);
        message.textContent = `Chain found: ${path.length} transform${path.length === 1 ? '' : 's'}.`;
        formulaRender.dataset.latex = `${latexTransform(to, from)} = ${latexTerms.join(' \\cdot ')}`;
    }
    renderLatex(formulaRender.dataset.latex || '');
    draw();
}
function canvasPosition(event) { const bounds = canvas.getBoundingClientRect(); return { x: event.clientX - bounds.left, y: event.clientY - bounds.top }; }
function frameAt(position) {
    return state.frames.find(frame => {
        const center = point(frame); const dimensions = frameDimensions(frame);
        return Math.abs(center.x - position.x) < dimensions.width / 2 && Math.abs(center.y - position.y) < dimensions.height / 2;
    });
}
function distanceToSegment(position, first, second) {
    const a = point(first); const b = point(second); const dx = b.x - a.x; const dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((position.x - a.x) * dx + (position.y - a.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(position.x - (a.x + t * dx), position.y - (a.y + t * dy));
}
canvas.addEventListener('pointerdown', event => {
    const position = canvasPosition(event); const frame = frameAt(position);
    if (frame) { state.dragging = frame; state.dragOffset = { x: frame.x - position.x / canvas.clientWidth, y: frame.y - position.y / canvas.clientHeight }; canvas.setPointerCapture(event.pointerId); canvas.style.cursor = 'grabbing'; }
});
canvas.addEventListener('pointermove', event => {
    if (!state.dragging) return; const position = canvasPosition(event);
    state.dragging.x = Math.max(0.08, Math.min(0.92, position.x / canvas.clientWidth + state.dragOffset.x)); state.dragging.y = Math.max(0.10, Math.min(0.90, position.y / canvas.clientHeight + state.dragOffset.y)); draw();
});
canvas.addEventListener('pointerup', event => {
    if (state.dragging) { state.dragging = null; canvas.style.cursor = 'default'; return; }
    const position = canvasPosition(event); const edge = allEdges().find(item => distanceToSegment(position, item.first, item.second) < 10);
    if (edge) {
        const key = edgeKey(edge.first.name, edge.second.name); const relation = state.known.get(key);
        if (!relation) state.known.set(key, { from: edge.first.name, to: edge.second.name });
        else if (relation.from === edge.first.name && relation.to === edge.second.name) state.known.set(key, { from: edge.second.name, to: edge.first.name });
        else state.known.delete(key);
        state.selectedPath = []; updateStatus();
        document.getElementById('resultMessage').textContent = 'Graph changed. Show a formula chain to update the result.'; formulaRender.dataset.latex = ''; renderLatex(''); draw();
    }
});
document.getElementById('findButton').addEventListener('click', showFormula);
document.getElementById('addButton').addEventListener('click', () => {
    const input = document.getElementById('frameName'); const name = normalizeFrameName(input.value); if (!name || frameByName(name)) return;
    const index = state.frames.length; const angle = index * 2.399963; const radius = 0.18 + 0.025 * Math.floor(index / 8);
    state.frames.push({ name, x: 0.5 + Math.cos(angle) * radius, y: 0.5 + Math.sin(angle) * radius }); input.value = ''; updateSelectors(); updateStatus(); resizeCanvas();
});
document.getElementById('removeButton').addEventListener('click', () => {
    if (state.frames.length <= 1) return;
    const name = document.getElementById('removeFrame').value;
    state.frames = state.frames.filter(frame => frame.name !== name);
    for (const key of state.known.keys()) if (key.split('|').includes(name)) state.known.delete(key);
    state.selectedPath = []; updateSelectors(); updateStatus();
    document.getElementById('resultMessage').textContent = `Removed ${name}. Show a formula chain to update the result.`;
    formulaRender.dataset.latex = ''; renderLatex(''); resizeCanvas();
});
document.getElementById('renameButton').addEventListener('click', () => {
    const oldName = document.getElementById('renameFrame').value;
    const input = document.getElementById('newFrameName'); const newName = normalizeFrameName(input.value);
    if (!newName || newName === oldName || frameByName(newName)) return;
    const frame = frameByName(oldName); frame.name = newName;
    const renamedRelations = new Map();
    state.known.forEach(relation => {
        const from = relation.from === oldName ? newName : relation.from; const to = relation.to === oldName ? newName : relation.to;
        renamedRelations.set(edgeKey(from, to), { from, to });
    });
    state.known = renamedRelations; state.selectedPath = []; input.value = ''; updateSelectors();
    document.getElementById('resultMessage').textContent = `Renamed ${oldName} to ${newName}. Show a formula chain to update the result.`;
    formulaRender.dataset.latex = ''; renderLatex(''); resizeCanvas();
});
window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', refreshLatexWhenReady);
updateSelectors(); updateStatus(); resizeCanvas();
