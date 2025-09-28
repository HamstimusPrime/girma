class DrawingCanvas{
    constructor(svgElement){
        this.svg = svgElement;
        this.isDrawing = false;
        this.currentLine = null;
        this.previewLine = null;
        this.pointerPosition = {x:0, y:0};
        this.groupManager = new GroupManager(svgElement);
        this.setupSVGeventListeners();
        this.dragState = {
            isHandleDragged: false,
            isDrawnLineDragged: false,
            activeElement: null
        };
    }

    setupSVGeventListeners() {
        this.svg.addEventListener('pointerdown', this.handleSVGPointerDown.bind(this));
        this.svg.addEventListener('pointermove', this.handleSVGPointerMove.bind(this));
    }

    // === event handlers ===

    handleSVGPointerDown(event){
        if (!event.isPrimary)return;
        if(this.dragState.isHandleDragged)return;
        event.preventDefault();
        this.svg.setPointerCapture(event.pointerId);

        this.pointerPosition = SvgUtils.clientToSvgPoint(this.svg, event.clientX, event.clientY);

        if (this.isDrawing == false){
            console.log("no drawing action on svg yet, just pointer down!");
            this.previewLine = new PreviewLine(this.svg, this.pointerPosition.x, this.pointerPosition.y);
            this.previewLine.createLineElement();
            this.isDrawing = true;
        }else{
            //second click logic after first click has been made
            if (!this.previewLine)return;
            console.log("second click on svg element made!");
            this.previewLine.updateLineEndPoints(this.pointerPosition.x, this.pointerPosition.y);
            this.svg.releasePointerCapture(event.pointerId);

            // use previewLine data to create drawnline
            const previewLinePoints = this.previewLine.getPointsPosition()
            const line = new Line(this.svg, previewLinePoints.x1, previewLinePoints.x2, previewLinePoints.y1, previewLinePoints.y2);
            line.createLineElement();

            const handles = new LineHandles(this.svg, line);
            


            //class to create handles on line
            
            //replace preview line with drawn-line
            const lineElement = line.getElement()
            const previewLineElement = this.previewLine.getElement();
            this.svg.replaceChild(lineElement, previewLineElement);
            this.previewLine = null;
            
            this.isDrawing = false;

            //create group and append drawn-line to group

        }
    }

    handleSVGPointerMove(event){
        if (!this.previewLine) return;
        this.pointerPosition = SvgUtils.clientToSvgPoint(this.svg, event.clientX, event.clientY);
        this.previewLine.updateLineEndPoints(this.pointerPosition.x, this.pointerPosition.y);
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
        this.className = 'user-line'
        // this.group = this.createGroup();
        this.lineElement = null;
        this.lineAngle = this.getLineAngle()
        //create the start point of a line
        
    
    }
    createLineElement(){
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('class', this.className);
        line.setAttribute('x1', this.pointX1);
        line.setAttribute('y1', this.pointY1);
        line.setAttribute('x2', this.pointX2);
        line.setAttribute('y2', this.pointY2);
        
        this.lineElement = line;
        this.appendToSVG();
    }

    appendToSVG(){
        this.svg.appendChild(this.getElement());
    }

    getLineAngle(){
        const angle = Math.atan2(this.pointY2 - this.pointY1, this.pointX2 - this.pointX1);
        return angle;
    }
    
    updateLineEndPoints(pointX2, pointY2){
        this.lineElement.setAttribute('x2', pointX2)
        this.lineElement.setAttribute('y2', pointY2)
    }

    updateLinePoints(pointX1, pointX2, pointY1, pointY2){
        this.lineElement.setAttribute()
        this.lineElement.setAttribute('x1', pointX1);
        this.lineElement.setAttribute('y1', pointY1);
        this.lineElement.setAttribute('x2', pointX2);
        this.lineElement.setAttribute('y2', pointY2);
    }

    getElement(){
        return this.lineElement;
    }

    getPointsPosition(){
        const linePointsPosition = {};
        linePointsPosition.x1 = parseFloat(this.lineElement.getAttribute('x1'));
        linePointsPosition.x2 = parseFloat(this.lineElement.getAttribute('x2'));
        linePointsPosition.y1 = parseFloat(this.lineElement.getAttribute('y1'));
        linePointsPosition.y2 = parseFloat(this.lineElement.getAttribute('y2'));

        return linePointsPosition;
    }
}

class PreviewLine extends Line {
    constructor(svg, pointX1,pointY1 ){
        super(svg,pointX1, pointX1,pointY1, pointY1);
        this.className = 'preview';
    }
}

class Handle extends Line{
    constructor( svg, pointX1, pointY1,parentLineAngle,handleLength = 24 ){
        super(svg, pointX1, pointX1,pointY1, pointY1);
        this.handleLength = handleLength;
        this.className = 'handle'
        this.parentLineAngle = parentLineAngle;
    }

    createLineHandle(){
        const dx = Math.cos(this.parentLineAngle + Math.PI / 2) * this.handleLength / 2;
        const dy = Math.sin(this.parentLineAngle + Math.PI / 2) * this.handleLength / 2;
        this.lineElement.setAttribute('x1', this.pointX1 - dx);
        this.lineElement.setAttribute('x2', this.pointX1 + dx);
        this.lineElement.setAttribute('y1', this.pointY1 - dy);
        this.lineElement.setAttribute('y2', this.pointY1 + dy);


        return this.lineElement;
    }

    handlerHandlePointerDown(event){

    }
}

class LineHandles {
    constructor(svg, parentLine = null, group = null){
        this.svg = svg
        this.parentLine = parentLine;
        this.firstHandle = null;
        this.secondHandle = null;
        this.parentLine = parentLine;
        this.group = group;
    }

    createHandles(){
        if (!this.parentLine)return;
        const parentLinePoints = this.parentLine.getPointsPosition();
        this.firstHandle = new Handle(this.svg,parentLinePoints.x1, parentLinePoints.y1);
        this.secondHandle = new Handle(this.svg,parentLinePoints.x2, parentLinePoints.y2);
        
        this.firstHandle.createLineElement();
        this.secondHandle.createLineElement();


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



