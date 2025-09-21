const svg = document.getElementById('svg');
const drawnLine = document.getElementById
let isDrawing = false;
let start = {x: 0, y: 0};
let previewLine = null;

function clientToSvgPoint(clientX, clientY) {//<---This function creates an SVG point and uses a matrix transform to convert screen space inputs to svg coordinates 
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
}

// === Drawing logic ===
svg.addEventListener('pointerdown', (ev) => {
    if (!ev.isPrimary || ev.target.closest('.handle')) return;//<--checks if the hamdle was touched and do nothing if it was or if it was the main pointer device of the computerthat was used
    ev.preventDefault(); //<--don't allow the browser do any default action when you click
    // svg.setPointerCapture(ev.pointerId);
    
    const p = clientToSvgPoint(ev.clientX, ev.clientY);
    start.x = p.x; start.y = p.y;
    if(!isDrawing){
        previewLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        previewLine.setAttribute('class', 'preview');
        previewLine.setAttribute('x1', start.x);
        previewLine.setAttribute('y1', start.y);
        previewLine.setAttribute('x2', start.x);
        previewLine.setAttribute('y2', start.y);
        svg.appendChild(previewLine);
        isDrawing = true;
    }else{
        previewLine.setAttribute('x2', start.x);
        previewLine.setAttribute('y2', start.y);
        previewLine = null
        isDrawing = false;
    }



})

// === Add logic for dragging to draw line ===

svg.addEventListener('pointermove', (ev) =>{
    if (!previewLine) return;
    pt2 = clientToSvgPoint(ev.clientX, ev.clientY)
    previewLine.setAttribute('x2',pt2.x)
    previewLine.setAttribute('y2',pt2.y)
    lineDrawn = true
})

// === Add logic for making handle on drawn line ===
// function createTick(xStart, yStart, xEnd, yEnd)
// handle = document.createElementNS('http://www.w3.org/2000/svg', 'line')
// handle.setAttribute()