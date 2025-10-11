"use strict";
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
        // this.isDrawing = false;
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
            const handleLine = new HandleLine(this.svg, firstPreviewLinePoint, secondPreviewLinePoint);
            const handleLineGroup = handleLine.createHandleLine();
            this.svg.replaceChild(handleLineGroup, this.previewLine.getLineObject());
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
class HandleLine {
    constructor(svg, point1, point2) {
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
        //create handles and Line and then setup events for both handles
        this.middleLine = new Line(this.svg, this.point1, this.point2);
        const lineElement = this.middleLine.createLineElement();
        // Remove line from SVG and add to group instead
        this.svg.removeChild(lineElement);
        this.groupElement.appendChild(lineElement);
        //create Handles
        this.firstHandle = new Handle(this.svg, this.middleLine, true);
        this.firstHandle.createHandle();
        const firstHandleElement = this.firstHandle.getLineObject();
        this.svg.removeChild(firstHandleElement);
        this.groupElement.appendChild(firstHandleElement);
        this.setHandleEvents(this.firstHandle);
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
        //update first and second handle positions and orientation
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
    const svg = document.getElementById('svg');
    if (!(svg instanceof SVGSVGElement)) {
        console.log('SVG element not found');
        return;
    }
    const canvas = new DrawingCanvas(svg);
    return canvas;
}
//App entry point
document.addEventListener('DOMContentLoaded', () => {
    const app = initializeApp();
});
