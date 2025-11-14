export class ImageObject {
    constructor(imageFile, svgCanvas) {
        this.imageFile = imageFile;
        this.id = crypto.randomUUID();
        this.src = URL.createObjectURL(imageFile);
        this.x = 0;
        this.y = 0;
        this.scale = 1;
        this.rotation = 0;
        this.selected = false;
        this.svgCanvas = svgCanvas;
        this.createImageObject();
    }
    createImageObject() {
        this.imageElement = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        this.imageElement.setAttributeNS(null, "href", this.src);
        this.svgCanvas.appendChild(this.imageElement);
    }
}
export function importImage(svgCanvas) {
    //get form object
    const importBtn = document.getElementById("import_img");
    const fileObject = document.getElementById("file");
    if (!importBtn || !fileObject || !svgCanvas) {
        console.error("Required elements not found");
        return;
    }
    //set events for importBtn
    importBtn.addEventListener("click", () => {
        fileObject.click();
    });
    fileObject.addEventListener("change", (event) => {
        var _a;
        const target = event.target;
        const file = (_a = target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (file && file.type.startsWith('image/')) {
            // Process the image file here
            console.log("Image file selected:", file.name);
            //create an image using the fileObject
            const image = new ImageObject(file, svgCanvas);
            const url = URL.createObjectURL(file);
        }
        else {
            alert("Please select a valid image file");
        }
    });
}
