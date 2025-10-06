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
    private previewLine : SVGLineElement | null;
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
        // this.svg.addEventListener('pointermove', this.handleSVGPointerMove.bind(this));
    }
    private handleSVGPointerDown(event:PointerEvent):void{
        if(!event.isPrimary)return;
        if(this.dragState.isHandleDragged)return;
        event.preventDefault();
        this.svg.setPointerCapture(event.pointerId)
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