import {ImageObject, importImage} from './utils.js'

type DragState = {
    isHandleDragged: boolean;
    isDrawnLineDragged: boolean;
    activeElement: SVGElement | null
}



class State {
    static dragState: DragState = {
    isHandleDragged: false,
    isDrawnLineDragged: false,
    activeElement: null
    }
    static isDrawing : boolean = false;
    static images : ImageObject[];
}

type Point = {
    x: number;
    y: number;
}


class DrawingCanvas{
    private svg: SVGSVGElement;
    private currentLine : SVGLineElement | null;
    private previewLine : PreviewLine | null;
    private pointerPosition : Point;


    constructor(svgElement: SVGSVGElement){
        this.svg = svgElement;
        this.currentLine = null;
        this.previewLine = null;
        this.pointerPosition = {x:0, y:0};
        this.setupSVGeventListeners();
    }

    private setupSVGeventListeners():void{
        this.svg.addEventListener('pointerdown', this.svgEventPointerDown.bind(this));
        this.svg.addEventListener('pointermove', this.svgEventPointerMove.bind(this));
    }

    private svgEventPointerMove(event:PointerEvent):void{
        if (!this.previewLine) return;

        const eventPosition = { x: event.clientX, y: event.clientY };
        this.pointerPosition = SvgUtils.clientToSvgPoint(this.svg,eventPosition);
        this.previewLine.setLineEndPoint(this.pointerPosition, "x2", "y2");
    }

    private svgEventPointerDown(event:PointerEvent):void{
        if(!event.isPrimary)return;
        if(State.dragState.isHandleDragged)return;
        event.preventDefault();
        this.svg.setPointerCapture(event.pointerId)

        const eventPosition = { x: event.clientX, y: event.clientY };
        this.pointerPosition = SvgUtils.clientToSvgPoint(this.svg, eventPosition);
        console.log("pointer down!")

        if (State.isDrawing === false){
            console.log("isDrawing is false!")
            this.previewLine = new PreviewLine(this.svg, this.pointerPosition);
            this.previewLine.createLineElement()
            State.isDrawing = true;
        }else{
            if(!this.previewLine)return;
            this.previewLine.setLineEndPoint(this.pointerPosition, "x2", "y2")
            this.svg.releasePointerCapture(event.pointerId)

            //get endpoints of previewLine
            const previewLineEndpoints = this.previewLine.getLineEndPoints();
            const firstPreviewLinePoint = previewLineEndpoints?.get("point1"); 
            const secondPreviewLinePoint = previewLineEndpoints?.get("point2");

            if (!firstPreviewLinePoint || !secondPreviewLinePoint) {
                throw new Error("could not get previewLine endpoints.");
            }
            console.log("juranimo")
            const tickHandleLine = new TickHandleLine(this.svg, firstPreviewLinePoint, secondPreviewLinePoint,50);
            const tickHandleLineGroup = tickHandleLine.createTickHandleLine();

            if (tickHandleLineGroup) {
                this.svg.replaceChild(tickHandleLineGroup, this.previewLine.getLineObject());
            }
            State.isDrawing = false;
    
        }
    }
}


class Line{
    protected className : string
    protected svg : SVGSVGElement;
    private point1 : Point;
    private point2 : Point;
    protected lineElement : SVGLineElement | null;
    

    constructor(svg: SVGSVGElement, point1: Point, point2: Point){
        this.svg = svg;
        this.point1 = point1;
        this.point2 = point2;
        this.className = 'user-line'
        this.lineElement = null;
        this.setupLineEventListeners();
    }

    createLineElement(): SVGLineElement {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('class', this.className);
        line.setAttribute('x1', `${this.point1.x}`)
        line.setAttribute('y1', `${this.point1.y}`)
        line.setAttribute('x2', `${this.point2.x}`)
        line.setAttribute('y2', `${this.point2.y}`)

        this.lineElement = line;
        this.svg.appendChild(this.lineElement);

        if (!this.lineElement) {
            throw new Error("Failed to create line element");
        }
        return this.lineElement
    }

    setLineEndPoint(endPoint: Point,xCoord: string, yCoord: string){
        if (!this.lineElement)return;
        this.lineElement.setAttribute(`${xCoord}`, `${endPoint.x}`)
        this.lineElement.setAttribute(`${yCoord}`, `${endPoint.y}`)
    }

    updateLinePosition(point1 : Point, point2 : Point){
        if (!this.lineElement)return;
        this.lineElement.setAttribute('x1', `${point1.x}`);
        this.lineElement.setAttribute('y1', `${point1.y}`);
        this.lineElement.setAttribute('x2', `${point2.x}`);
        this.lineElement.setAttribute('y2', `${point2.y}`);
    }

    getLineEndPoints(): Map<string, Point> | null {
        if(!this.lineElement)return null;
        const endPoints = new Map<string, Point>();
        const point1: Point = { x: parseFloat(this.lineElement.getAttribute('x1') || '0'), y: parseFloat(this.lineElement.getAttribute('y1') || '0') };
        const point2: Point = { x: parseFloat(this.lineElement.getAttribute('x2') || '0'), y: parseFloat(this.lineElement.getAttribute('y2') || '0') };
        endPoints.set('point1', point1);
        endPoints.set('point2', point2);
        return endPoints;
    }

    getLineLength(){
        const parentLinePoints = this.getLineEndPoints()
        const firstPoint = parentLinePoints?.get("point1"); 
        const secondPoint = parentLinePoints?.get("point2");
        if (!firstPoint || !secondPoint){
            throw new Error("Line element is not initialized.");
        }

        const lineLength = Math.hypot(secondPoint.x - firstPoint.x, secondPoint.y - firstPoint.y);
        return lineLength;
    }

    getLineAngle():number{
        const parentLinePoints = this.getLineEndPoints()
        const firstPoint = parentLinePoints?.get("point1"); 
        const secondPoint = parentLinePoints?.get("point2");

        if (!firstPoint || !secondPoint){
            throw new Error("Line element is not initialized.");
        }

        const angle = Math.atan2(secondPoint.y - firstPoint.y, secondPoint.x - firstPoint.x);
        return angle;
    }

    getLineObject(): SVGLineElement {
        if (!this.lineElement) {
            throw new Error("Line element is not initialized.");
        }
        return this.lineElement;
    }

    private setupLineEventListeners(): void{
        if (!this.lineElement)return;
        this.lineElement.addEventListener('pointerdown',this.lineEventPointerDown.bind(this));
    }

    private lineEventPointerDown(event: PointerEvent){
        console.log("line clicked!!!")
        this.lineElement?.setPointerCapture(event.pointerId)
        
    }
}

class PreviewLine extends Line{
    constructor(svg:SVGSVGElement,point1: Point){
        super(svg, point1, point1);
        this.className = 'preview'
    }
}

class Handle extends Line{
    private parentLine : Line;
    handleLength : number
    isFirstHandle : boolean | null;

    constructor(svg:SVGSVGElement, parentLine: Line, isFirstHandle: boolean){
        const temporaryPoint = { x: 0, y: 0 };
        super(svg, temporaryPoint, temporaryPoint);

        this.parentLine = parentLine;
        this.isFirstHandle = isFirstHandle;
        this.handleLength = 24
        this.className = 'handle'

    }

    createHandle(){
        /* A handle needs the angle and endpoints of its parent line */
        const parentLineAngle = this.parentLine.getLineAngle();
        const parentPoint1 = this.parentLine.getLineEndPoints()?.get("point1");
        const parentPoint2 = this.parentLine.getLineEndPoints()?.get("point2");

        const dx = Math.cos(parentLineAngle+ Math.PI / 2) * this.handleLength / 2;
        const dy = Math.sin(parentLineAngle + Math.PI / 2) * this.handleLength / 2;

        if (!parentPoint1 || !parentPoint2){
            throw new Error("Line element is not initialized.");
        }

        this.createLineElement()
        const anchorPoint = this.isFirstHandle ? parentPoint1 : parentPoint2;

        this.lineElement?.setAttribute('x1', `${anchorPoint.x - dx}`);
        this.lineElement?.setAttribute('y1', `${anchorPoint.y - dy}`);
        this.lineElement?.setAttribute('x2', `${anchorPoint.x + dx}`); 
        this.lineElement?.setAttribute('y2', `${anchorPoint.y + dy}`); 
    }

    }

class Tick extends Line{
    tickLength : number;
    constructor(svg: SVGSVGElement, point1: Point, point2: Point, tickLength: number){
        super(svg, point1, point2);
        this.tickLength = tickLength;
    }
}



class HandleLine{
    /*Important!! the handle line is responsible for setting 
    every event for the handles BUT it should be setup to take in optional lines
    such as tick lines and lets them setup their own events */
    svg : SVGSVGElement
    point1 : Point;
    point2 : Point;
    firstHandle : Handle | null;
    secondHandle : Handle | null;
    middleLine : Line | null;
    groupElement : SVGGElement | null;
    protected handleLineEventObservers: TickHandleLine[] = [];

    constructor(svg: SVGSVGElement, point1:Point, point2: Point){
        this.svg = svg;
        this.point1 = point1;
        this.point2 = point2;
        this.firstHandle = null;
        this.secondHandle = null;
        this.middleLine = null;
        this.groupElement = null;
    }

    createHandleLine(): SVGElement{
        // Create a group element to contain all handle line elements
        this.groupElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.groupElement.setAttribute('class', 'handle-line-group');
        
        //create middle-line
        this.middleLine = new Line(this.svg,this.point1,this.point2);
        const lineElement = this.middleLine.createLineElement();
        
        // Remove middle-line from SVG and add to group instead
        this.svg.removeChild(lineElement);
        this.groupElement.appendChild(lineElement);

        //create First Handle set its events and put it in group
        this.firstHandle = new Handle(this.svg,this.middleLine,true);
        this.firstHandle.createHandle();
        const firstHandleElement = this.firstHandle.getLineObject();
        this.svg.removeChild(firstHandleElement);
        this.groupElement.appendChild(firstHandleElement);
        this.setHandleEvents(this.firstHandle);

        //create Second Handle set its events and put it in group
        this.secondHandle = new Handle(this.svg,this.middleLine,false);
        this.secondHandle.createHandle();
        const secondHandleElement = this.secondHandle.getLineObject();
        this.svg.removeChild(secondHandleElement);
        this.groupElement.appendChild(secondHandleElement);
        this.setHandleEvents(this.secondHandle);

        // Add the group to the SVG
        this.svg.appendChild(this.groupElement);

        return this.groupElement;
    }

    getGroupElement(): SVGGElement | null {
        return this.groupElement;
    }

    setHandleEvents(handle: Handle){
        const handleElement = handle.getLineObject();
        handleElement.addEventListener('pointerdown', this.handleEventPointerDown.bind(this));
        handleElement.addEventListener('pointerup', this.handleEventPointerUp.bind(this));
        handleElement.addEventListener('pointermove', (event)=>{this.handleEventPointerMove(event,handle)});
    };
    

    private handleEventPointerDown(event: PointerEvent){
        if (!event.isPrimary) return;
        event.preventDefault();
        event.stopPropagation();

        if(State.dragState.isHandleDragged == false){
            State.dragState.isHandleDragged = true;
            const target = event.currentTarget as Element;
            target.setPointerCapture(event.pointerId);
            console.log(`handle clicked. isHandleDragged: ${State.dragState.isHandleDragged}`)
        }
    }

    private handleEventPointerUp(event: PointerEvent){
        State.dragState.isHandleDragged = false;
        const target = event.currentTarget as Element;
        target.releasePointerCapture(event.pointerId);  // Also release pointer capture
        console.log(`handle released. isHandleDragged: ${State.dragState.isHandleDragged}`);
    }

    private handleEventPointerMove(event: PointerEvent, handle :Handle){
        if (State.dragState.isHandleDragged == false) return;
        const eventPosition = { x: event.clientX, y: event.clientY };
        const pointerPosition = SvgUtils.clientToSvgPoint(this.svg, eventPosition);

        if (!State.dragState.isHandleDragged) return;
        console.log("handle moved")

        const xAttr = handle.isFirstHandle ? 'x1' : 'x2';
        const yAttr = handle.isFirstHandle ? 'y1' : 'y2';

        this.middleLine?.setLineEndPoint(pointerPosition,xAttr,yAttr);
        this.updateHandlePosition();

        //notify observers that a move event has occured
        this.notifyObservers();
    }

    private updateHandlePosition(){
        //get Parent line Point position
        const middleLinePoint1 = this.middleLine?.getLineEndPoints()?.get("point1");
        const middleLinePoint2 = this.middleLine?.getLineEndPoints()?.get("point2");

        if (!middleLinePoint1 || !middleLinePoint2) {
        console.warn("Unable to get line endpoints for handle position update");
        return;
        }

        const handleLength = this.firstHandle?.handleLength ?? 24;
        const angle = Math.atan2(middleLinePoint2.y - middleLinePoint1.y, middleLinePoint2.x - middleLinePoint1.x);
        const dx = Math.cos(angle + Math.PI / 2) * handleLength / 2;
        const dy = Math.sin(angle + Math.PI / 2) * handleLength / 2;
        
        // First handle endpoints (both relative to middleLinePoint1)
        const firstHandlePoint1: Point = {
            x: middleLinePoint1.x - dx,
            y: middleLinePoint1.y - dy
        };
        const firstHandlePoint2: Point = {
            x: middleLinePoint1.x + dx,
            y: middleLinePoint1.y + dy
        };

        // Second handle endpoints (both relative to middleLinePoint2)
        const secondHandlePoint1: Point = {
            x: middleLinePoint2.x - dx,
            y: middleLinePoint2.y - dy
        };
        const secondHandlePoint2: Point = {
            x: middleLinePoint2.x + dx,
            y: middleLinePoint2.y + dy
        };

        this.firstHandle?.updateLinePosition(firstHandlePoint1, firstHandlePoint2);
        this.secondHandle?.updateLinePosition(secondHandlePoint1, secondHandlePoint2);
        this.notifyObservers();

    }

    private notifyObservers(): void {
            console.log('observers notified');
            this.handleLineEventObservers.forEach(observer => {
                observer.updateTickPositions()})
    }   
}


class TickHandleLine extends HandleLine{
    proportionUnit : number;
    tickLength : number
    tickObjectsCreated : Tick[]
    constructor(svg: SVGSVGElement, point1:Point, point2: Point, proportionUnit: number){
        super(svg, point1, point2); 
        this.proportionUnit = proportionUnit;
        this.tickLength = 14
        this.tickObjectsCreated = []
        this.handleLineEventObservers.push(this)
    }

    getNumberOfTicksToCreate(){
        if (!this.middleLine) {
            throw new Error("Failed to create line element");
        }
        const numberOfTicksToCreate = Math.floor(this.middleLine?.getLineLength() / this.proportionUnit)
        return numberOfTicksToCreate;
    }

    getTickPositions(): Point[]{
        let tickPositions : Point[] = [];
        const numberOfTicksToCreate = this.getNumberOfTicksToCreate();
        
        // Calculate direction vector of the middleLine
        const middleLineLength = this.middleLine?.getLineLength();
        const middleLinePoints = this.middleLine?.getLineEndPoints()
        const firstPoint = middleLinePoints?.get("point1"); 
        const secondPoint = middleLinePoints?.get("point2");
        if (!firstPoint || !secondPoint || !middleLineLength){
            throw new Error("Line element is not initialized.");
        }
        
        const dirX = (secondPoint.x - firstPoint.x) / middleLineLength;
        const dirY = (secondPoint.y - firstPoint.y) / middleLineLength;
        
        if(numberOfTicksToCreate > 0){
            for(let i = 1; i <= numberOfTicksToCreate; i++){
                // Calculate tick position along middle line
                const distance = i * this.proportionUnit;
                const pointX = firstPoint.x + dirX * distance;
                const pointY = firstPoint.y + dirY * distance;
                const tickPointPosition: Point = {
                    x: pointX, 
                    y: pointY  
                }

                tickPositions.push(tickPointPosition);
            }
        }
        return tickPositions;
    }

    createTicks(): Tick[]{
        // Remove any existing tick marks
        this.groupElement?.querySelectorAll('.tickmark').forEach(tick => tick.remove());
        const tickPositions = this.getTickPositions();
        if (tickPositions.length == 0){
            console.error("no tick positions, tick position array empty")
        }

        //get transform of the group
        const transform = this.groupElement?.getAttribute('transform');
        let tx = 0, ty = 0;
        if (transform) {
            const matrix = new DOMMatrix(transform);
            tx = matrix.e; // e is the horizontal translation
            ty = matrix.f; // f is the vertical translation
        }

        //get angle of middle Line and use to create ticks
        const middleLineAngle = this.middleLine?.getLineAngle();
        
        //create Tick logic
        for (let pos of tickPositions){
            const dx = Math.cos((middleLineAngle ?? 0) + Math.PI / 2) * this.tickLength / 2;
            const dy = Math.sin((middleLineAngle ?? 0) + Math.PI / 2) * this.tickLength / 2;

            const middleLinePoint1 = this.middleLine?.getLineEndPoints()?.get("point1");
            const middleLinePoint2 = this.middleLine?.getLineEndPoints()?.get("point2");

            if (!middleLinePoint1 || !middleLinePoint2) {
            console.warn("Unable to get line endpoints for handle position update");
            return [];
            }

            
            const firstTickPoint : Point = {
                x: (pos.x - dx - tx),
                y: (pos.y - dy - ty)
            }
            const secondTickPoint : Point = {
                x: (pos.x + dx - tx),
                y: (pos.y + dy - ty)
            }
            
            const tickObject = new Tick(this.svg, middleLinePoint1, middleLinePoint2, this.tickLength)

            const tickElement = tickObject.createLineElement();
            // Add the tickmark class so it can be properly removed later
            tickElement.setAttribute('class', tickElement.getAttribute('class') + ' tickmark');
            tickObject.updateLinePosition(firstTickPoint,secondTickPoint);
            
        

            // Add tick to group Element
            this.svg.removeChild(tickElement);
            this.groupElement?.appendChild(tickElement);

            this.tickObjectsCreated?.push(tickObject)
        }
        
        return this.tickObjectsCreated;
    } 
    
    createTickHandleLine(){
        this.createHandleLine()
        this.createTicks()
        return this.groupElement
    }

    updateTickPositions(){
        //update the positions of the tick Marks along the middle line
        if(!this.middleLine || !this.tickObjectsCreated)  return;

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
        const transform = this.groupElement?.getAttribute('transform');
        let tx = 0, ty = 0;
        if (transform) {
            const matrix = new DOMMatrix(transform);
            tx = matrix.e;//e is the horizontal axis of the matrix
            ty = matrix.f;//f is the vertical axis of the matrix
        }

        // Update each tick to its new position
        for (let i = 0; i < this.tickObjectsCreated.length; i++) {
            const tickObject = this.tickObjectsCreated[i];
            const tickPosition = updatedTickPositions[i];

            // Calculate the perpendicular endpoints for this tick
            const firstTickPoint: Point = {
                x: tickPosition.x - dx - tx,
                y: tickPosition.y - dy - ty
            };
            const secondTickPoint: Point = {
                x: tickPosition.x + dx - tx,
                y: tickPosition.y + dy - ty
            };

            // Update this tick's position
            tickObject.updateLinePosition(firstTickPoint, secondTickPoint);
        }
    }
}

class SvgUtils{
    static clientToSvgPoint(svgElement: SVGSVGElement, clientPoints: Point): DOMPoint{
        const svg = svgElement;
        const pointerPosition = svg.createSVGPoint();
        pointerPosition.x = clientPoints.x;
        pointerPosition.y = clientPoints.y;

        return pointerPosition.matrixTransform(svg.getScreenCTM()?.inverse())
    }
}

// Initialize app when DOM is fully loaded
function initializeApp(){
    const svg = document.getElementById('svg_canvas');
    if (!(svg instanceof SVGSVGElement)){
        console.log('SVG element not found');
        return;
    }
    const canvas = new DrawingCanvas(svg);
    importImage(svg); 
    return canvas;
}

//App entry point
document.addEventListener('DOMContentLoaded', ()=>{
    const app = initializeApp();
   // Initialize image import functionality
})