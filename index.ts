type DragState = {
    isHandleDragged: boolean;
    isDrawnLineDragged: boolean;
    activeElement: SVGElement | null;
}

type Point = {
    x: number;
    y: number;
}

class DrawingCanvas{
    private svg: SVGSVGElement;
    private isDrawing: boolean;
    private currentLine : SVGLineElement | null;
    private previewLine : PreviewLine | null;
    private pointerPosition : Point;
    private dragState : DragState

    constructor(svgElement: SVGSVGElement){
        this.svg = svgElement;
        this.isDrawing = false;
        this.currentLine = null;
        this.previewLine = null;
        this.pointerPosition = {x:0, y:0};
        this.setupSVGeventListeners();
        this.dragState = {
            isHandleDragged: false,
            isDrawnLineDragged: false,
            activeElement: null
        };
    }

    private setupSVGeventListeners():void{
        this.svg.addEventListener('pointerdown', this.handleSVGPointerDown.bind(this));
        this.svg.addEventListener('pointermove', this.handleSVGPointerMove.bind(this));
    }

    private handleSVGPointerMove(event:PointerEvent):void{
        if (!this.previewLine) return;

        const eventPosition = { x: event.clientX, y: event.clientY };
        this.pointerPosition = SvgUtils.clientToSvgPoint(this.svg,eventPosition);
        this.previewLine.setLineEndPoint(this.pointerPosition);
    }

    private handleSVGPointerDown(event:PointerEvent):void{
        if(!event.isPrimary)return;
        if(this.dragState.isHandleDragged)return;
        event.preventDefault();
        this.svg.setPointerCapture(event.pointerId)

        const eventPosition = { x: event.clientX, y: event.clientY };
        this.pointerPosition = SvgUtils.clientToSvgPoint(this.svg, eventPosition);
        console.log("pointer down!")

        if (this.isDrawing === false){
            console.log("isDrawing is false!")
            this.previewLine = new PreviewLine(this.svg, this.pointerPosition);
            this.previewLine.createLineElement()
            this.isDrawing = true;
        }else{
            if(!this.previewLine)return;
            this.previewLine.setLineEndPoint(this.pointerPosition)
            this.svg.releasePointerCapture(event.pointerId)

            //get endpoints of previewLine
            const previewLineEndpoints = this.previewLine.getLineEndpoints();
            const firstPreviewLinePoint = previewLineEndpoints?.get("point1"); 
            const secondPreviewLinePoint = previewLineEndpoints?.get("point2");

            if (firstPreviewLinePoint && secondPreviewLinePoint) {
                console.log("juranimo")
                const drawnLineObj = new Line(this.svg, firstPreviewLinePoint, secondPreviewLinePoint);
                const drawnLine = drawnLineObj.createLineElement();
                this.svg.replaceChild(drawnLine ,this.previewLine.getLineObject())
                this.isDrawing = false;
            }
        
        }
    }
}


class Line{
    protected className : string
    private svg : SVGSVGElement
    private point1 : Point;
    private point2 : Point;
    private handles : string[]
    private lineElement : SVGLineElement | null;
    

    constructor(svg: SVGSVGElement, point1: Point, point2: Point){
        this.svg = svg;
        this.point1 = point1;
        this.point2 = point2;
        this.handles = [];
        this.className = 'user-line'
        this.lineElement = null;
    }

    createLineElement(){
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('class', this.className);
        line.setAttribute('x1', `${this.point1.x}`)
        line.setAttribute('y1', `${this.point1.y}`)
        line.setAttribute('x2', `${this.point2.x}`)
        line.setAttribute('y2', `${this.point2.y}`)

        this.lineElement = line;
        this.svg.appendChild(this.lineElement);

        return this.lineElement
    }

    setLineEndPoint(endPoint: Point){
        if (!this.lineElement)return;
        this.lineElement.setAttribute('x2', `${endPoint.x}`)
        this.lineElement.setAttribute('y2', `${endPoint.y}`)
    }

    getLineEndpoints(): Map<string, Point> | null {
        if(!this.lineElement)return null;
        const endPoints = new Map<string, Point>();
        const point1: Point = { x: parseFloat(this.lineElement.getAttribute('x1') || '0'), y: parseFloat(this.lineElement.getAttribute('y1') || '0') };
        const point2: Point = { x: parseFloat(this.lineElement.getAttribute('x2') || '0'), y: parseFloat(this.lineElement.getAttribute('y2') || '0') };
        endPoints.set('point1', point1);
        endPoints.set('point2', point2);
        return endPoints;
    }

    getLineObject(): SVGLineElement {
        if (!this.lineElement) {
            throw new Error("Line element is not initialized.");
        }
        return this.lineElement;
    }
}

class PreviewLine extends Line{
    constructor(svg:SVGSVGElement,point1: Point){
        super(svg, point1, point1);
        this.className = 'preview'
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