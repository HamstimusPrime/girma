export class ImageObject {
    createImageObject() {
    }
}
export function importImage() {
    //get form object
    const importBtn = document.getElementById("import_img");
    const fileObject = document.getElementById("file");
    const svgCanvas = document.getElementById("svg_canvas");
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
        }
        else {
            alert("Please select a valid image file");
        }
    });
    //create an image using the fileObject
}
