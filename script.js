const svg = document.getElementById('svg');
let isDrawing = false;
let start = { x: 0, y: 0 };
let previewLine = null;
let isHandleDragged = false;
let isDrawnLineDragged = false;
const handleLength = 12
tickLength = 20;
const proportionUnit = 100.00

function clientToSvgPoint(clientX, clientY) {//<---This function creates an SVG point and uses a matrix transform to convert screen space inputs to svg coordinates 
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
}

// === Drawing logic ===
svg.addEventListener('pointerdown', (ev) => {
    if (!ev.isPrimary) return;//<--checks if it was the main pointer device of the computer that created the event
    if (isHandleDragged) return;
    ev.preventDefault(); //<--don't allow the browser do any default action when you click
    svg.setPointerCapture(ev.pointerId);

    const p = clientToSvgPoint(ev.clientX, ev.clientY);
    start.x = p.x; start.y = p.y;

    if (isDrawing == false) {
        previewLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        previewLine.setAttribute('class', 'preview');
        previewLine.setAttribute('x1', start.x);
        previewLine.setAttribute('y1', start.y);
        previewLine.setAttribute('x2', start.x);
        previewLine.setAttribute('y2', start.y);
        svg.appendChild(previewLine);
        isDrawing = true;
    } else {
        previewLine.setAttribute('x2', start.x);
        previewLine.setAttribute('y2', start.y);

        svg.releasePointerCapture(ev.pointerId);

        if (!previewLine) return;

        group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        drawnLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');

        const pointX1 = parseFloat(previewLine.getAttribute('x1'));
        const pointX2 = parseFloat(previewLine.getAttribute('x2'));
        const pointY1 = parseFloat(previewLine.getAttribute('y1'));
        const pointY2 = parseFloat(previewLine.getAttribute('y2'));

        drawnLine.setAttribute('class', 'user-line');
        drawnLine.setAttribute('x1', pointX1);
        drawnLine.setAttribute('x2', pointX2);
        drawnLine.setAttribute('y1', pointY1);
        drawnLine.setAttribute('y2', pointY2);


        group.appendChild(drawnLine);
        svg.replaceChild(group, previewLine);

        previewLine = null;
        isDrawing = false;

        const angle = Math.atan2(pointY2 - pointY1, pointX2 - pointX1);
        const firstHandle = createHandle(pointX1, pointY1, angle, group);
        const secondHandle = createHandle(pointX2, pointY2, angle, group);

        firstHandle.setAttribute('isFirstHandle', true);
        secondHandle.setAttribute('isFirstHandle', false);

        // === set events for handles ===
        setEventsForHandles(firstHandle, secondHandle, drawnLine, group);
        setEventsForHandles(secondHandle, firstHandle, drawnLine, group);

        // === set events for drawn line ===
        setEventForDrawnLine(drawnLine, group);
    }
});

// === Add logic for when mouse is moved to create line endpoint===
svg.addEventListener('pointermove', (ev) => {
    if (!previewLine) return;
    pt2 = clientToSvgPoint(ev.clientX, ev.clientY)
    previewLine.setAttribute('x2', pt2.x);
    previewLine.setAttribute('y2', pt2.y);
    lineDrawn = true;
});

// === Add logic for creating handles ===
function createHandle(x, y, angle, group) {
    const handleLength = 24
    const dx = Math.cos(angle + Math.PI / 2) * handleLength / 2;
    const dy = Math.sin(angle + Math.PI / 2) * handleLength / 2;
    const handle = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    handle.setAttribute('class', 'handle');
    handle.setAttribute('x1', x - dx);
    handle.setAttribute('y1', y - dy);
    handle.setAttribute('x2', x + dx);
    handle.setAttribute('y2', y + dy);
    group.appendChild(handle);
    return handle;
};

// === implement events for handles ===
function setEventsForHandles(handle, pairedHandle, drawnLine, group) {

    handle.addEventListener('pointerdown', (e) => {
        if (isHandleDragged == false) {
            isHandleDragged = true;
            handle.setPointerCapture(e.pointerId)
            console.log(`handle clicked. isHandleDragged: ${isHandleDragged}`)
        }
    })

    handle.addEventListener('pointermove', (e) => {
        if (isHandleDragged == false) return;

        console.log('handle moved')
        pointerPosition = clientToSvgPoint(e.clientX, e.clientY);
        if (handle.getAttribute('isFirstHandle') === 'true') {
            drawnLine.setAttribute('x1', pointerPosition.x);
            drawnLine.setAttribute('y1', pointerPosition.y);
            updateHandlePosition(handle, pairedHandle, drawnLine);
            tickMarkPositions = getTickMarkPositions(drawnLine, proportionUnit);
            ticks = createTick(tickMarkPositions, drawnLine, group);
        } else {
            drawnLine.setAttribute('x2', pointerPosition.x);
            drawnLine.setAttribute('y2', pointerPosition.y);
            updateHandlePosition(pairedHandle, handle, drawnLine);
            tickMarkPositions = getTickMarkPositions(drawnLine, proportionUnit);
            ticks = createTick(tickMarkPositions, drawnLine, group);
        }
    })

    handle.addEventListener('pointerup', (e) => {
        isHandleDragged = false;

    })
}

// === logic for updating position of handles after line has been translated ===
function updateHandlePosition(firstHandle, secondHandle, drawnLine) {
    const pointX1 = parseFloat(drawnLine.getAttribute('x1'));
    const pointX2 = parseFloat(drawnLine.getAttribute('x2'));
    const pointY1 = parseFloat(drawnLine.getAttribute('y1'));
    const pointY2 = parseFloat(drawnLine.getAttribute('y2'));

    const angle = Math.atan2(pointY2 - pointY1, pointX2 - pointX1);
    const dx1 = Math.cos(angle + Math.PI / 2) * handleLength;
    const dy1 = Math.sin(angle + Math.PI / 2) * handleLength;

    firstHandle.setAttribute('x1', pointX1 - dx1);
    firstHandle.setAttribute('y1', pointY1 - dy1);
    firstHandle.setAttribute('x2', pointX1 + dx1);
    firstHandle.setAttribute('y2', pointY1 + dy1);

    secondHandle.setAttribute('x1', pointX2 - dx1);
    secondHandle.setAttribute('y1', pointY2 - dy1);
    secondHandle.setAttribute('x2', pointX2 + dx1);
    secondHandle.setAttribute('y2', pointY2 + dy1);
}

function setEventForDrawnLine(line, group) {
    let startDragPoint = null;
    let groupTransform = { x: 0, y: 0 };

    line.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        isDrawnLineDragged = true;
        startDragPoint = clientToSvgPoint(e.clientX, e.clientY);

        // Get current transform
        const transform = group.getAttribute('transform');
        if (transform) {
            const match = transform.match(/translate\(([-\d.]+),([-\d.]+)\)/);
            if (match) {
                groupTransform.x = parseFloat(match[1]);
                groupTransform.y = parseFloat(match[2]);
            }
        }
        line.setPointerCapture(e.pointerId);
    });

    line.addEventListener('pointermove', (e) => {
        if (!isDrawnLineDragged || !startDragPoint) return;

        const currentPointerPosition = clientToSvgPoint(e.clientX, e.clientY);
        const dx = currentPointerPosition.x - startDragPoint.x;
        const dy = currentPointerPosition.y - startDragPoint.y;

        const newX = groupTransform.x + dx;
        const newY = groupTransform.y + dy;
        group.setAttribute('transform', `translate(${newX},${newY})`);

    });

    line.addEventListener('pointerup', (e) => {
        if (!isDrawnLineDragged) return;

        isDrawnLineDragged = false;
        line.releasePointerCapture(e.pointerId);

        // Update line and handle coordinates to account for translation
        //get transform of the group containing the drawn line and handles
        const transform = group.getAttribute('transform');
        if (transform) {
            const match = transform.match(/translate\(([-\d.]+),([-\d.]+)\)/);
            if (match) {
                //store the x and y coordinates of the groups transform
                const tx = parseFloat(match[1]);
                const ty = parseFloat(match[2]);

                // Reset transform of the group
                group.setAttribute('transform', '');

                // Update line coordinates. set drawn line position by adding stored group transform to it
                const x1 = parseFloat(line.getAttribute('x1')) + tx;
                const y1 = parseFloat(line.getAttribute('y1')) + ty;
                const x2 = parseFloat(line.getAttribute('x2')) + tx;
                const y2 = parseFloat(line.getAttribute('y2')) + ty;

                line.setAttribute('x1', x1);
                line.setAttribute('y1', y1);
                line.setAttribute('x2', x2);
                line.setAttribute('y2', y2);

                // Update Position of handles
                const handles = group.getElementsByClassName('handle');
                for (let handle of handles) {
                    const hx1 = parseFloat(handle.getAttribute('x1')) + tx;
                    const hy1 = parseFloat(handle.getAttribute('y1')) + ty;
                    const hx2 = parseFloat(handle.getAttribute('x2')) + tx;
                    const hy2 = parseFloat(handle.getAttribute('y2')) + ty;

                    handle.setAttribute('x1', hx1);
                    handle.setAttribute('y1', hy1);
                    handle.setAttribute('x2', hx2);
                    handle.setAttribute('y2', hy2);
                }

                // Update position of tickMarks
                const tickMarks = group.getElementsByClassName('tickmark');
                for (let tickMark of tickMarks) {
                    const tmx1 = parseFloat(tickMark.getAttribute('x1')) + tx;
                    const tmy1 = parseFloat(tickMark.getAttribute('y1')) + ty;
                    const tmx2 = parseFloat(tickMark.getAttribute('x2')) + tx;
                    const tmy2 = parseFloat(tickMark.getAttribute('y2')) + ty;

                    tickMark.setAttribute('x1', tmx1);
                    tickMark.setAttribute('y1', tmy1);
                    tickMark.setAttribute('x2', tmx2);
                    tickMark.setAttribute('y2', tmy2);

                }
                groupTransform = { x: 0, y: 0 };
            };

        }



    })
}

// === implement proportion ticks ===

function getTickMarkPositions(line, proportionUnit) {
    let tickMarkPositions = [];

    const x1 = parseFloat(line.getAttribute("x1"));
    const y1 = parseFloat(line.getAttribute("y1"));
    const x2 = parseFloat(line.getAttribute("x2"));
    const y2 = parseFloat(line.getAttribute("y2"));

    const lineLength = Math.hypot(x2 - x1, y2 - y1);
    const numberOfTicks = Math.floor(lineLength / proportionUnit);

    // Calculate direction vector of the line
    const dirX = (x2 - x1) / lineLength;
    const dirY = (y2 - y1) / lineLength;

    if (numberOfTicks > 0) {
        for (let i = 1; i <= numberOfTicks; i++) {
            // Calculate position along the line
            const distance = i * proportionUnit;
            const pointX = x1 + dirX * distance;
            const pointY = y1 + dirY * distance;

            tickMarkPositions.push({ x: pointX, y: pointY });
        }
    }

    return tickMarkPositions;
}

function createTick(tickMarkPositions, line, group) {
    // Remove any existing tick marks
    const existingTicks = group.getElementsByClassName('tickmark');
    while (existingTicks.length > 0) {
        existingTicks[0].remove();
    }

    if (tickMarkPositions.length === 0) {
        return;
    }

    // Get current transform
    const transform = group.getAttribute('transform');
    let tx = 0, ty = 0;
    if (transform) {
        const match = transform.match(/translate\(([-\d.]+),([-\d.]+)\)/);
        if (match) {
            tx = parseFloat(match[1]);
            ty = parseFloat(match[2]);
        }
    }

    const x1 = parseFloat(line.getAttribute('x1'));
    const x2 = parseFloat(line.getAttribute('x2'));
    const y1 = parseFloat(line.getAttribute('y1'));
    const y2 = parseFloat(line.getAttribute('y2'));

    const angle = Math.atan2(y2 - y1, x2 - x1);

    ticksCreated = [];

    for (let pos of tickMarkPositions) {
        const dx = Math.cos(angle + Math.PI / 2) * tickLength / 2;
        const dy = Math.sin(angle + Math.PI / 2) * tickLength / 2;

        const tickmark = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        tickmark.setAttribute('class', 'tickmark');

        // Apply transform offset to tick mark positions
        tickmark.setAttribute('x1', pos.x - dx - tx);
        tickmark.setAttribute('y1', pos.y - dy - ty);
        tickmark.setAttribute('x2', pos.x + dx - tx);
        tickmark.setAttribute('y2', pos.y + dy - ty);

        group.appendChild(tickmark);
        ticksCreated.push(tickmark);
    }

    return ticksCreated;
}



// function updateTickMarkPosition(tickMarks, drawnLine) {
//     if (!tickMarks) return;
//     //get last position of tick and then add pointer displacement to it
//     for (let i = 0; i < tickMarks.length; i++) {
//         tickMark = tickMarks[i]
//         const pointX1 = parseFloat(drawnLine.getAttribute('x1'));
//         const pointX2 = parseFloat(drawnLine.getAttribute('x2'));
//         const pointY1 = parseFloat(drawnLine.getAttribute('y1'));
//         const pointY2 = parseFloat(drawnLine.getAttribute('y2'));

//         const angle = Math.atan2(pointY2 - pointY1, pointX2 - pointX1);
//         const dx1 = Math.cos(angle + Math.PI / 2) * tickLength;
//         const dy1 = Math.sin(angle + Math.PI / 2) * tickLength;

//         tickMark.setAttribute('x1', pointX1 - dx1);
//         tickMark.setAttribute('y1', pointY1 + dy1);
//         tickMark.setAttribute('x2', pointX1 - dx1);
//         tickMark.setAttribute('y2', pointY1 - dy1);
//     }
// 