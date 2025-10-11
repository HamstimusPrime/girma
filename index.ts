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
}

type Point = {
    x: number;
    y: number;
}

class DrawingCanvas{
    private svg: SVGSVGElement;
    // private isDrawing: boolean;
    private currentLine : SVGLineElement | null;
    private previewLine : PreviewLine | null;
    private pointerPosition : Point;


    constructor(svgElement: SVGSVGElement){
        this.svg = svgElement;
        // this.isDrawing = false;
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
            const previewLineEndpoints = this.previewLine.getLineEndpoints();
            const firstPreviewLinePoint = previewLineEndpoints?.get("point1"); 
            const secondPreviewLinePoint = previewLineEndpoints?.get("point2");

            if (!firstPreviewLinePoint || !secondPreviewLinePoint) {
                throw new Error("could not get previewLine endpoints.");
            }
            console.log("juranimo")
            const handleLine = new HandleLine(this.svg, firstPreviewLinePoint, secondPreviewLinePoint);
            const handleLineGroup = handleLine.createHandleLine();

            this.svg.replaceChild(handleLineGroup, this.previewLine.getLineObject());
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

    updateLinePosition(){}

    getLineEndpoints(): Map<string, Point> | null {
        if(!this.lineElement)return null;
        const endPoints = new Map<string, Point>();
        const point1: Point = { x: parseFloat(this.lineElement.getAttribute('x1') || '0'), y: parseFloat(this.lineElement.getAttribute('y1') || '0') };
        const point2: Point = { x: parseFloat(this.lineElement.getAttribute('x2') || '0'), y: parseFloat(this.lineElement.getAttribute('y2') || '0') };
        endPoints.set('point1', point1);
        endPoints.set('point2', point2);
        return endPoints;
    }

    getLineAngle():number{
        const parentLinePoints = this.getLineEndpoints()
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
    private handleLength : number
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
        const parentPoint1 = this.parentLine.getLineEndpoints()?.get("point1");
        const parentPoint2 = this.parentLine.getLineEndpoints()?.get("point2");

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
        
        //create handles and Line and then setup events for both handles
        this.middleLine = new Line(this.svg,this.point1,this.point2);
        const lineElement = this.middleLine.createLineElement();
        
        // Remove line from SVG and add to group instead
        this.svg.removeChild(lineElement);
        this.groupElement.appendChild(lineElement);

        //create Handles
        const firstHandle = new Handle(this.svg,this.middleLine,true);
        firstHandle.createHandle();
        const firstHandleElement = firstHandle.getLineObject();
        this.svg.removeChild(firstHandleElement);
        this.groupElement.appendChild(firstHandleElement);
        this.setHandleEvents(firstHandle);

        const secondHandle = new Handle(this.svg,this.middleLine,false);
        secondHandle.createHandle();
        const secondHandleElement = secondHandle.getLineObject();
        this.svg.removeChild(secondHandleElement);
        this.groupElement.appendChild(secondHandleElement);
        this.setHandleEvents(secondHandle);

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
        State.dragState.isHandleDragged == false
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
        //update first and second handle positions and orientation
}

    private updateHandlePosition(movedHandle:Handle, pairedHandle: Handle){
        //get Parent line Point position
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
    const svg = document.getElementById('svg');
    if (!(svg instanceof SVGSVGElement)){
        console.log('SVG element not found');
        return;
    }
    const canvas = new DrawingCanvas(svg);
    return canvas;
}

//App entry point
document.addEventListener('DOMContentLoaded', ()=>{
    const app = initializeApp();
})