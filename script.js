class DrawingCanvas{
    constructor(svgElement){
        this.svg = svgElement;
        this.isDrawing = false;
        this.currentLine = null;
        this.setupEventListeners();
        this.dragState = {
            isHandleDragged: false,
            isDrawnLineDragged: false,
            activeElement: null
        };
    }

    setupEventListeners() {
        this.svg.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    }

    // === event handlers ===

    handlePointerDown(event){
        if (!event.isPrimary)return;
        if(this.dragState.isHandleDragged)return;

        event.preventDefault();
        this.svg.setPointerCapture(event.pointerId);

        const pointerPosition = SvgUtils.clientToSvgPoint(this.svg, event.clientX, event.clientY);
        start.x = pointerPosition.x;
        start.y = pointerPosition.y

        if (this.isDrawing == false){
            return;
        }
        



        
    }
}


/*preview line is and extenstion of line
*/

class Line{
    constructor(canvas, pointX1, pointX2, pointY1, pointY2){
        this.canvas = canvas;
        //create the start point of a line
        this.element = this.createLineElement(pointX1, pointX2, pointY1,pointY2);
    
    }

    createLineElement(pointX1, pointX2, pointY1, pointY2){

    }
}




class SvgUtils{
    static clientToSvgPoint(element, clientX, clientY){
        const svg = element.svg
        const pointerPosition = svg.createSVGPoint();
        pointerPosition.x = clientX;
        pointerPosition.y = clientY;

        return pointerPosition.matrixTransform(svg.getScreenCTM().inverse());
    }


}

// Initialize app when DOM is fully loaded
function initializeApp(){
    const svg = document.getElementById('svg');
    if (!svg){
        console.error('SVG element not found');
        return;
    }
    const canvas = new DrawingCanvas(svg);
    return canvas;
}

//App entry point
document.addEventListener('DOMContentLoaded', ()=>{
    const app = initializeApp();
})



