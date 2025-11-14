import { importImage } from './utils.js';
class State {
}
State.dragState = {
    isHandleDragged: false,
    isDrawnLineDragged: false,
    activeElement: null
};
State.isDrawing = false;
class DrawingCanvas {
    constructor(svgElement) {
        this.svg = svgElement;
        this.currentLine = null;
        this.previewLine = null;
        this.pointerPosition = { x: 0, y: 0 };
        this.setupSVGeventListeners();
    }
    setupSVGeventListeners() {
        this.svg.addEventListener('pointerdown', this.svgEventPointerDown.bind(this));
        this.svg.addEventListener('pointermove', this.svgEventPointerMove.bind(this));
    }
    svgEventPointerMove(event) {
        if (!this.previewLine)
            return;
        const eventPosition = { x: event.clientX, y: event.clientY };
        this.pointerPosition = SvgUtils.clientToSvgPoint(this.svg, eventPosition);
        this.previewLine.setLineEndPoint(this.pointerPosition, "x2", "y2");
    }
    svgEventPointerDown(event) {
        if (!event.isPrimary)
            return;
        if (State.dragState.isHandleDragged)
            return;
        event.preventDefault();
        this.svg.setPointerCapture(event.pointerId);
        const eventPosition = { x: event.clientX, y: event.clientY };
        this.pointerPosition = SvgUtils.clientToSvgPoint(this.svg, eventPosition);
        console.log("pointer down!");
        if (State.isDrawing === false) {
            console.log("isDrawing is false!");
            this.previewLine = new PreviewLine(this.svg, this.pointerPosition);
            this.previewLine.createLineElement();
            State.isDrawing = true;
        }
        else {
            if (!this.previewLine)
                return;
            this.previewLine.setLineEndPoint(this.pointerPosition, "x2", "y2");
            this.svg.releasePointerCapture(event.pointerId);
            //get endpoints of previewLine
            const previewLineEndpoints = this.previewLine.getLineEndPoints();
            const firstPreviewLinePoint = previewLineEndpoints === null || previewLineEndpoints === void 0 ? void 0 : previewLineEndpoints.get("point1");
            const secondPreviewLinePoint = previewLineEndpoints === null || previewLineEndpoints === void 0 ? void 0 : previewLineEndpoints.get("point2");
            if (!firstPreviewLinePoint || !secondPreviewLinePoint) {
                throw new Error("could not get previewLine endpoints.");
            }
            console.log("juranimo");
            const tickHandleLine = new TickHandleLine(this.svg, firstPreviewLinePoint, secondPreviewLinePoint, 50);
            const tickHandleLineGroup = tickHandleLine.createTickHandleLine();
            if (tickHandleLineGroup) {
                this.svg.replaceChild(tickHandleLineGroup, this.previewLine.getLineObject());
            }
            State.isDrawing = false;
        }
    }
}
class Line {
    constructor(svg, point1, point2) {
        this.svg = svg;
        this.point1 = point1;
        this.point2 = point2;
        this.className = 'user-line';
        this.lineElement = null;
        this.setupLineEventListeners();
    }
    createLineElement() {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('class', this.className);
        line.setAttribute('x1', `${this.point1.x}`);
        line.setAttribute('y1', `${this.point1.y}`);
        line.setAttribute('x2', `${this.point2.x}`);
        line.setAttribute('y2', `${this.point2.y}`);
        this.lineElement = line;
        this.svg.appendChild(this.lineElement);
        if (!this.lineElement) {
            throw new Error("Failed to create line element");
        }
        return this.lineElement;
    }
    setLineEndPoint(endPoint, xCoord, yCoord) {
        if (!this.lineElement)
            return;
        this.lineElement.setAttribute(`${xCoord}`, `${endPoint.x}`);
        this.lineElement.setAttribute(`${yCoord}`, `${endPoint.y}`);
    }
    updateLinePosition(point1, point2) {
        if (!this.lineElement)
            return;
        this.lineElement.setAttribute('x1', `${point1.x}`);
        this.lineElement.setAttribute('y1', `${point1.y}`);
        this.lineElement.setAttribute('x2', `${point2.x}`);
        this.lineElement.setAttribute('y2', `${point2.y}`);
    }
    getLineEndPoints() {
        if (!this.lineElement)
            return null;
        const endPoints = new Map();
        const point1 = { x: parseFloat(this.lineElement.getAttribute('x1') || '0'), y: parseFloat(this.lineElement.getAttribute('y1') || '0') };
        const point2 = { x: parseFloat(this.lineElement.getAttribute('x2') || '0'), y: parseFloat(this.lineElement.getAttribute('y2') || '0') };
        endPoints.set('point1', point1);
        endPoints.set('point2', point2);
        return endPoints;
    }
    getLineLength() {
        const parentLinePoints = this.getLineEndPoints();
        const firstPoint = parentLinePoints === null || parentLinePoints === void 0 ? void 0 : parentLinePoints.get("point1");
        const secondPoint = parentLinePoints === null || parentLinePoints === void 0 ? void 0 : parentLinePoints.get("point2");
        if (!firstPoint || !secondPoint) {
            throw new Error("Line element is not initialized.");
        }
        const lineLength = Math.hypot(secondPoint.x - firstPoint.x, secondPoint.y - firstPoint.y);
        return lineLength;
    }
    getLineAngle() {
        const parentLinePoints = this.getLineEndPoints();
        const firstPoint = parentLinePoints === null || parentLinePoints === void 0 ? void 0 : parentLinePoints.get("point1");
        const secondPoint = parentLinePoints === null || parentLinePoints === void 0 ? void 0 : parentLinePoints.get("point2");
        if (!firstPoint || !secondPoint) {
            throw new Error("Line element is not initialized.");
        }
        const angle = Math.atan2(secondPoint.y - firstPoint.y, secondPoint.x - firstPoint.x);
        return angle;
    }
    getLineObject() {
        if (!this.lineElement) {
            throw new Error("Line element is not initialized.");
        }
        return this.lineElement;
    }
    setupLineEventListeners() {
        if (!this.lineElement)
            return;
        this.lineElement.addEventListener('pointerdown', this.lineEventPointerDown.bind(this));
    }
    lineEventPointerDown(event) {
        var _a;
        console.log("line clicked!!!");
        (_a = this.lineElement) === null || _a === void 0 ? void 0 : _a.setPointerCapture(event.pointerId);
    }
}
class PreviewLine extends Line {
    constructor(svg, point1) {
        super(svg, point1, point1);
        this.className = 'preview';
    }
}
class Handle extends Line {
    constructor(svg, parentLine, isFirstHandle) {
        const temporaryPoint = { x: 0, y: 0 };
        super(svg, temporaryPoint, temporaryPoint);
        this.parentLine = parentLine;
        this.isFirstHandle = isFirstHandle;
        this.handleLength = 24;
        this.className = 'handle';
    }
    createHandle() {
        var _a, _b, _c, _d, _e, _f;
        /* A handle needs the angle and endpoints of its parent line */
        const parentLineAngle = this.parentLine.getLineAngle();
        const parentPoint1 = (_a = this.parentLine.getLineEndPoints()) === null || _a === void 0 ? void 0 : _a.get("point1");
        const parentPoint2 = (_b = this.parentLine.getLineEndPoints()) === null || _b === void 0 ? void 0 : _b.get("point2");
        const dx = Math.cos(parentLineAngle + Math.PI / 2) * this.handleLength / 2;
        const dy = Math.sin(parentLineAngle + Math.PI / 2) * this.handleLength / 2;
        if (!parentPoint1 || !parentPoint2) {
            throw new Error("Line element is not initialized.");
        }
        this.createLineElement();
        const anchorPoint = this.isFirstHandle ? parentPoint1 : parentPoint2;
        (_c = this.lineElement) === null || _c === void 0 ? void 0 : _c.setAttribute('x1', `${anchorPoint.x - dx}`);
        (_d = this.lineElement) === null || _d === void 0 ? void 0 : _d.setAttribute('y1', `${anchorPoint.y - dy}`);
        (_e = this.lineElement) === null || _e === void 0 ? void 0 : _e.setAttribute('x2', `${anchorPoint.x + dx}`);
        (_f = this.lineElement) === null || _f === void 0 ? void 0 : _f.setAttribute('y2', `${anchorPoint.y + dy}`);
    }
}
class Tick extends Line {
    constructor(svg, point1, point2, tickLength) {
        super(svg, point1, point2);
        this.tickLength = tickLength;
    }
}
class HandleLine {
    constructor(svg, point1, point2) {
        this.handleLineEventObservers = [];
        this.svg = svg;
        this.point1 = point1;
        this.point2 = point2;
        this.firstHandle = null;
        this.secondHandle = null;
        this.middleLine = null;
        this.groupElement = null;
    }
    createHandleLine() {
        // Create a group element to contain all handle line elements
        this.groupElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.groupElement.setAttribute('class', 'handle-line-group');
        //create middle-line
        this.middleLine = new Line(this.svg, this.point1, this.point2);
        const lineElement = this.middleLine.createLineElement();
        // Remove middle-line from SVG and add to group instead
        this.svg.removeChild(lineElement);
        this.groupElement.appendChild(lineElement);
        //create First Handle set its events and put it in group
        this.firstHandle = new Handle(this.svg, this.middleLine, true);
        this.firstHandle.createHandle();
        const firstHandleElement = this.firstHandle.getLineObject();
        this.svg.removeChild(firstHandleElement);
        this.groupElement.appendChild(firstHandleElement);
        this.setHandleEvents(this.firstHandle);
        //create Second Handle set its events and put it in group
        this.secondHandle = new Handle(this.svg, this.middleLine, false);
        this.secondHandle.createHandle();
        const secondHandleElement = this.secondHandle.getLineObject();
        this.svg.removeChild(secondHandleElement);
        this.groupElement.appendChild(secondHandleElement);
        this.setHandleEvents(this.secondHandle);
        // Add the group to the SVG
        this.svg.appendChild(this.groupElement);
        return this.groupElement;
    }
    getGroupElement() {
        return this.groupElement;
    }
    setHandleEvents(handle) {
        const handleElement = handle.getLineObject();
        handleElement.addEventListener('pointerdown', this.handleEventPointerDown.bind(this));
        handleElement.addEventListener('pointerup', this.handleEventPointerUp.bind(this));
        handleElement.addEventListener('pointermove', (event) => { this.handleEventPointerMove(event, handle); });
    }
    ;
    handleEventPointerDown(event) {
        if (!event.isPrimary)
            return;
        event.preventDefault();
        event.stopPropagation();
        if (State.dragState.isHandleDragged == false) {
            State.dragState.isHandleDragged = true;
            const target = event.currentTarget;
            target.setPointerCapture(event.pointerId);
            console.log(`handle clicked. isHandleDragged: ${State.dragState.isHandleDragged}`);
        }
    }
    handleEventPointerUp(event) {
        State.dragState.isHandleDragged = false;
        const target = event.currentTarget;
        target.releasePointerCapture(event.pointerId); // Also release pointer capture
        console.log(`handle released. isHandleDragged: ${State.dragState.isHandleDragged}`);
    }
    handleEventPointerMove(event, handle) {
        var _a;
        if (State.dragState.isHandleDragged == false)
            return;
        const eventPosition = { x: event.clientX, y: event.clientY };
        const pointerPosition = SvgUtils.clientToSvgPoint(this.svg, eventPosition);
        if (!State.dragState.isHandleDragged)
            return;
        console.log("handle moved");
        const xAttr = handle.isFirstHandle ? 'x1' : 'x2';
        const yAttr = handle.isFirstHandle ? 'y1' : 'y2';
        (_a = this.middleLine) === null || _a === void 0 ? void 0 : _a.setLineEndPoint(pointerPosition, xAttr, yAttr);
        this.updateHandlePosition();
        //notify observers that a move event has occured
        this.notifyObservers();
    }
    updateHandlePosition() {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        //get Parent line Point position
        const middleLinePoint1 = (_b = (_a = this.middleLine) === null || _a === void 0 ? void 0 : _a.getLineEndPoints()) === null || _b === void 0 ? void 0 : _b.get("point1");
        const middleLinePoint2 = (_d = (_c = this.middleLine) === null || _c === void 0 ? void 0 : _c.getLineEndPoints()) === null || _d === void 0 ? void 0 : _d.get("point2");
        if (!middleLinePoint1 || !middleLinePoint2) {
            console.warn("Unable to get line endpoints for handle position update");
            return;
        }
        const handleLength = (_f = (_e = this.firstHandle) === null || _e === void 0 ? void 0 : _e.handleLength) !== null && _f !== void 0 ? _f : 24;
        const angle = Math.atan2(middleLinePoint2.y - middleLinePoint1.y, middleLinePoint2.x - middleLinePoint1.x);
        const dx = Math.cos(angle + Math.PI / 2) * handleLength / 2;
        const dy = Math.sin(angle + Math.PI / 2) * handleLength / 2;
        // First handle endpoints (both relative to middleLinePoint1)
        const firstHandlePoint1 = {
            x: middleLinePoint1.x - dx,
            y: middleLinePoint1.y - dy
        };
        const firstHandlePoint2 = {
            x: middleLinePoint1.x + dx,
            y: middleLinePoint1.y + dy
        };
        // Second handle endpoints (both relative to middleLinePoint2)
        const secondHandlePoint1 = {
            x: middleLinePoint2.x - dx,
            y: middleLinePoint2.y - dy
        };
        const secondHandlePoint2 = {
            x: middleLinePoint2.x + dx,
            y: middleLinePoint2.y + dy
        };
        (_g = this.firstHandle) === null || _g === void 0 ? void 0 : _g.updateLinePosition(firstHandlePoint1, firstHandlePoint2);
        (_h = this.secondHandle) === null || _h === void 0 ? void 0 : _h.updateLinePosition(secondHandlePoint1, secondHandlePoint2);
        this.notifyObservers();
    }
    notifyObservers() {
        console.log('observers notified');
        this.handleLineEventObservers.forEach(observer => {
            observer.updateTickPositions();
        });
    }
}
class TickHandleLine extends HandleLine {
    constructor(svg, point1, point2, proportionUnit) {
        super(svg, point1, point2);
        this.proportionUnit = proportionUnit;
        this.tickLength = 14;
        this.tickObjectsCreated = [];
        this.handleLineEventObservers.push(this);
    }
    getNumberOfTicksToCreate() {
        var _a;
        if (!this.middleLine) {
            throw new Error("Failed to create line element");
        }
        const numberOfTicksToCreate = Math.floor(((_a = this.middleLine) === null || _a === void 0 ? void 0 : _a.getLineLength()) / this.proportionUnit);
        return numberOfTicksToCreate;
    }
    getTickPositions() {
        var _a, _b;
        let tickPositions = [];
        const numberOfTicksToCreate = this.getNumberOfTicksToCreate();
        // Calculate direction vector of the middleLine
        const middleLineLength = (_a = this.middleLine) === null || _a === void 0 ? void 0 : _a.getLineLength();
        const middleLinePoints = (_b = this.middleLine) === null || _b === void 0 ? void 0 : _b.getLineEndPoints();
        const firstPoint = middleLinePoints === null || middleLinePoints === void 0 ? void 0 : middleLinePoints.get("point1");
        const secondPoint = middleLinePoints === null || middleLinePoints === void 0 ? void 0 : middleLinePoints.get("point2");
        if (!firstPoint || !secondPoint || !middleLineLength) {
            throw new Error("Line element is not initialized.");
        }
        const dirX = (secondPoint.x - firstPoint.x) / middleLineLength;
        const dirY = (secondPoint.y - firstPoint.y) / middleLineLength;
        if (numberOfTicksToCreate > 0) {
            for (let i = 1; i <= numberOfTicksToCreate; i++) {
                // Calculate tick position along middle line
                const distance = i * this.proportionUnit;
                const pointX = firstPoint.x + dirX * distance;
                const pointY = firstPoint.y + dirY * distance;
                const tickPointPosition = {
                    x: pointX,
                    y: pointY
                };
                tickPositions.push(tickPointPosition);
            }
        }
        return tickPositions;
    }
    createTicks() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        // Remove any existing tick marks
        (_a = this.groupElement) === null || _a === void 0 ? void 0 : _a.querySelectorAll('.tickmark').forEach(tick => tick.remove());
        const tickPositions = this.getTickPositions();
        if (tickPositions.length == 0) {
            console.error("no tick positions, tick position array empty");
        }
        //get transform of the group
        const transform = (_b = this.groupElement) === null || _b === void 0 ? void 0 : _b.getAttribute('transform');
        let tx = 0, ty = 0;
        if (transform) {
            const matrix = new DOMMatrix(transform);
            tx = matrix.e; // e is the horizontal translation
            ty = matrix.f; // f is the vertical translation
        }
        //get angle of middle Line and use to create ticks
        const middleLineAngle = (_c = this.middleLine) === null || _c === void 0 ? void 0 : _c.getLineAngle();
        //create Tick logic
        for (let pos of tickPositions) {
            const dx = Math.cos((middleLineAngle !== null && middleLineAngle !== void 0 ? middleLineAngle : 0) + Math.PI / 2) * this.tickLength / 2;
            const dy = Math.sin((middleLineAngle !== null && middleLineAngle !== void 0 ? middleLineAngle : 0) + Math.PI / 2) * this.tickLength / 2;
            const middleLinePoint1 = (_e = (_d = this.middleLine) === null || _d === void 0 ? void 0 : _d.getLineEndPoints()) === null || _e === void 0 ? void 0 : _e.get("point1");
            const middleLinePoint2 = (_g = (_f = this.middleLine) === null || _f === void 0 ? void 0 : _f.getLineEndPoints()) === null || _g === void 0 ? void 0 : _g.get("point2");
            if (!middleLinePoint1 || !middleLinePoint2) {
                console.warn("Unable to get line endpoints for handle position update");
                return [];
            }
            const firstTickPoint = {
                x: (pos.x - dx - tx),
                y: (pos.y - dy - ty)
            };
            const secondTickPoint = {
                x: (pos.x + dx - tx),
                y: (pos.y + dy - ty)
            };
            const tickObject = new Tick(this.svg, middleLinePoint1, middleLinePoint2, this.tickLength);
            const tickElement = tickObject.createLineElement();
            // Add the tickmark class so it can be properly removed later
            tickElement.setAttribute('class', tickElement.getAttribute('class') + ' tickmark');
            tickObject.updateLinePosition(firstTickPoint, secondTickPoint);
            // Add tick to group Element
            this.svg.removeChild(tickElement);
            (_h = this.groupElement) === null || _h === void 0 ? void 0 : _h.appendChild(tickElement);
            (_j = this.tickObjectsCreated) === null || _j === void 0 ? void 0 : _j.push(tickObject);
        }
        return this.tickObjectsCreated;
    }
    createTickHandleLine() {
        this.createHandleLine();
        this.createTicks();
        return this.groupElement;
    }
    updateTickPositions() {
        var _a;
        //update the positions of the tick Marks along the middle line
        if (!this.middleLine || !this.tickObjectsCreated)
            return;
        // Get the updated tick positions along the new middle line
        const updatedTickPositions = this.getTickPositions();
        // If the number of ticks has changed, recreate them
        if (updatedTickPositions.length !== this.tickObjectsCreated.length) {
            this.createTicks();
            return;
        }
        // Get the current middle line angle for perpendicular tick calculation
        const middleLineAngle = this.middleLine.getLineAngle();
        const dx = Math.cos(middleLineAngle + Math.PI / 2) * this.tickLength / 2;
        const dy = Math.sin(middleLineAngle + Math.PI / 2) * this.tickLength / 2;
        // Get transform of the group (if any)
        const transform = (_a = this.groupElement) === null || _a === void 0 ? void 0 : _a.getAttribute('transform');
        let tx = 0, ty = 0;
        if (transform) {
            const matrix = new DOMMatrix(transform);
            tx = matrix.e; //e is the horizontal axis of the matrix
            ty = matrix.f; //f is the vertical axis of the matrix
        }
        // Update each tick to its new position
        for (let i = 0; i < this.tickObjectsCreated.length; i++) {
            const tickObject = this.tickObjectsCreated[i];
            const tickPosition = updatedTickPositions[i];
            // Calculate the perpendicular endpoints for this tick
            const firstTickPoint = {
                x: tickPosition.x - dx - tx,
                y: tickPosition.y - dy - ty
            };
            const secondTickPoint = {
                x: tickPosition.x + dx - tx,
                y: tickPosition.y + dy - ty
            };
            // Update this tick's position
            tickObject.updateLinePosition(firstTickPoint, secondTickPoint);
        }
    }
}
class SvgUtils {
    static clientToSvgPoint(svgElement, clientPoints) {
        var _a;
        const svg = svgElement;
        const pointerPosition = svg.createSVGPoint();
        pointerPosition.x = clientPoints.x;
        pointerPosition.y = clientPoints.y;
        return pointerPosition.matrixTransform((_a = svg.getScreenCTM()) === null || _a === void 0 ? void 0 : _a.inverse());
    }
}
// Initialize app when DOM is fully loaded
function initializeApp() {
    const svg = document.getElementById('svg_canvas');
    if (!(svg instanceof SVGSVGElement)) {
        console.log('SVG element not found');
        return;
    }
    const canvas = new DrawingCanvas(svg);
    importImage(svg);
    return canvas;
}
//App entry point
document.addEventListener('DOMContentLoaded', () => {
    const app = initializeApp();
    // Initialize image import functionality
});
