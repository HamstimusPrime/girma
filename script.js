const svg = document.getElementById('svg');
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
    if (!ev.isPrimary) return;//<--checks if it was the main pointer device of the computer that created the event
    ev.preventDefault(); //<--don't allow the browser do any default action when you click
    svg.setPointerCapture(ev.pointerId);
    
    const p = clientToSvgPoint(ev.clientX, ev.clientY);
    start.x = p.x; start.y = p.y;

    if(isDrawing == false){
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

        svg.releasePointerCapture(ev.pointerId);
        
        if(!previewLine)return;

        group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        drawnLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');

        const x1 = parseFloat(previewLine.getAttribute('x1'));
        const x2 = parseFloat(previewLine.getAttribute('x2'));
        const y1 = parseFloat(previewLine.getAttribute('y1'));
        const y2 = parseFloat(previewLine.getAttribute('y2'));

        drawnLine.setAttribute('class', 'user-line');
        drawnLine.setAttribute('x1', x1);
        drawnLine.setAttribute('x2', x2);
        drawnLine.setAttribute('y1', y1);
        drawnLine.setAttribute('y2', y2);

        group.appendChild(drawnLine);
        svg.replaceChild(group, previewLine);

        previewLine = null;
        isDrawing = false;

        const angle = Math.atan2(y2 - y1, x2 - x1);
        const handle1 = createHandle(x1, y1, angle, group);
        const handle2 = createHandle(x2, y2, angle, group);

        // === give handles ability to be dragged to resize line ===
    }
})

// === Add logic for when mouse is moved after first click ===
svg.addEventListener('pointermove', (ev) =>{
    if (!previewLine) return;
    pt2 = clientToSvgPoint(ev.clientX, ev.clientY)
    previewLine.setAttribute('x2',pt2.x)
    previewLine.setAttribute('y2',pt2.y)
    lineDrawn = true;
});

// === Add logic for creating handles ===
function createHandle(x, y, angle, group){
    const len = 24
    const dx = Math.cos(angle + Math.PI/2) * len/2;
    const dy = Math.sin(angle + Math.PI/2) * len/2;
    const handle = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    handle.setAttribute('class', 'handle');
    handle.setAttribute('x1', x - dx);
    handle.setAttribute('y1', y - dy);
    handle.setAttribute('x2', x + dx);
    handle.setAttribute('y2', y + dy);
    group.appendChild(handle);
    return handle;
    }


// === Add logic for moving handles ===
function enableHandleDrag(handle, isStartingHandle){
    let isHandleDragged = false;
}


