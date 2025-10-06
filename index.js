var DrawingCanvas = /** @class */ (function () {
    function DrawingCanvas(svgElement) {
        this.svg = svgElement;
        this.isDrawing = false;
        this.currentLine = null;
        this.previewLine = null;
        this.pointerPosition = { x: 0, y: 0 };
        this.setupSVGeventListeners();
        this.dragState = {
            isHandleDragged: false,
            isDrawnLineDragged: false,
            activeElement: null
        };
    }
    DrawingCanvas.prototype.setupSVGeventListeners = function () {
        this.svg.addEventListener('pointerdown', this.handleSVGPointerDown.bind(this));
        // this.svg.addEventListener('pointermove', this.handleSVGPointerMove.bind(this));
    };
    DrawingCanvas.prototype.handleSVGPointerDown = function (event) {
        if (!event.isPrimary)
            return;
        if (this.dragState.isHandleDragged)
            return;
        event.preventDefault();
        this.svg.setPointerCapture(event.pointerId);
    };
    return DrawingCanvas;
}());
// Initialize app when DOM is fully loaded
function initializeApp() {
    var svg = document.getElementById('svg');
    if (!(svg instanceof SVGSVGElement)) {
        console.log('SVG element not found');
        return;
    }
    var canvas = new DrawingCanvas(svg);
    return canvas;
}
//App entry point
document.addEventListener('DOMContentLoaded', function () {
    var app = initializeApp();
});
