class DrawingCanvas{
    constructor(svgElement){
        this.svg = svgElement;
        this.isDrawing = false;
        this.currentLine = null;
        this.previewLine = null;
        this.pointerStartPosition = {x:0, y:0};
        this.groupManager = new GroupManager(svgElement);
        this.setupEventListeners();
        this.dragState = {
            isHandleDragged: false,
            isDrawnLineDragged: false,
            activeElement: null
        };
    }

    setupEventListeners() {
        this.svg.addEventListener('pointerdown', this.handleSVGPointerDown.bind(this));
    }

    // === event handlers ===

    handleSVGPointerDown(event){
        if (!event.isPrimary)return;
        if(this.dragState.isHandleDragged)return;
        event.preventDefault();

        event.preventDefault();
        this.svg.setPointerCapture(event.pointerId);

        const pointerPosition = SvgUtils.clientToSvgPoint(this.svg, event.clientX, event.clientY);
        this.pointerStartPosition.x = pointerPosition.x;
        this.pointerStartPosition.y = pointerPosition.y;

        if (this.isDrawing == false){
            console.log("no drawing action on svg yet, just pointer down!");
            this.previewLine = new PreviewLine(this.svg, this.pointerStartPosition.x, this.pointerStartPosition.y);
            this.isDrawing = true;
        }else{
            //second click logic after first click has been made
            if (!this.previewLine)return;
            console.log("second click on svg element made!");
            this.previewLine.updateEndPoints(pointerPosition.x, pointerPosition.y);
            this.svg.releasePointerCapture(event.pointerId);
            
            // use previewLine data to create drawnline
            const pointX1 = parseFloat(this.previewLine.lineElement.getAttribute('x1'));
            const pointX2 = parseFloat(this.previewLine.lineElement.getAttribute('x2'));
            const pointY1 = parseFloat(this.previewLine.lineElement.getAttribute('y1'));
            const pointY2 = parseFloat(this.previewLine.lineElement.getAttribute('y2'));

            const lineObject = new Line(this.svg, pointX1, pointX2, pointY1, pointY2);
            const drawnLine = lineObject.lineElement

            //create group and append drawn-line to group

            //replace preview line with drawn-line
            this.isDrawing = false;
        }
    }

    handleSVGPointerUp(event){

    }

}

/*drawn-line and preview-line are extensions of line
*/

class Line{
    constructor(svg, pointX1, pointX2, pointY1, pointY2){
        this.svg = svg;
        this.pointX1 = pointX1;
        this.pointX2 = pointX2;
        this.pointY1 = pointY1;
        this.pointY2 = pointY2;
        this.handles = [];
        // this.group = this.createGroup();
        this.lineAngle = this.getLineAngle()
        //create the start point of a line
        this.lineElement = this.createLineElement();
        this.appendToSVG();
    
    }
    createLineElement(){
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('class', 'line');
        line.setAttribute('x1', this.pointX1);
        line.setAttribute('y1', this.pointY1);
        line.setAttribute('x2', this.pointX2);
        line.setAttribute('y2', this.pointY2);

        return line;
    }

    appendToSVG(){
        // const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        // group.appendChild(this.lineElement);
        this.svg.appendChild(this.lineElement);
    }

    getLineAngle(){
        const angle = Math.atan2(this.pointY2 - this.pointY1, this.pointX2 - this.pointX1);
        return angle;
    }
    
    getElement(){
        return this.lineElement;
    }
}

class PreviewLine extends Line {
    constructor(svg, pointX1,pointY1 ){
        super(svg,pointX1, pointX1,pointY1, pointY1);

        this.lineElement.setAttribute('class', 'preview');
    }
    // === method to update endpoints ===
    updateEndPoints(pointX2, pointY2){
        this.lineElement.setAttribute('x2', pointX2)
        this.lineElement.setAttribute('y2', pointY2)
    }

}


class Handle extends Line{
    constructor(){
        super(pointX1, pointX1,pointY1, pointY1);


    }
}


class SvgUtils{
    static clientToSvgPoint(svgElement, clientX, clientY){
        const svg = svgElement;
        const pointerPosition = svg.createSVGPoint();
        pointerPosition.x = clientX;
        pointerPosition.y = clientY;

        return pointerPosition.matrixTransform(svg.getScreenCTM().inverse());
    }
}

// === group manager implementation ===

class GroupManager {
    constructor (svg){
        this.svg = svg;
        this.groups = new Map();
        this.activeGroup = null;
    }

    createGroup(id){
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('id', id);
        this.svg.appendChild(group);
        return group
    }

    addElementToGroup(){
        this.activeGroup
    }
}



// Initialize app when DOM is fully loaded
function initializeApp(){
    const svg = document.getElementById('svg');
    if (!svg){
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



