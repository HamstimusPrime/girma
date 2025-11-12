export class ImageObject{
    private id! : string
    private src!: string
    private x!: number
    private y!: number
    private scale!: number
    private rotation!: number
    private selected!: boolean

    createImageObject() {
        
    }
}

export function importImage(){
    //get form object
    const importBtn = document.getElementById("import_img") as HTMLButtonElement;
    const fileObject = document.getElementById("file") as HTMLInputElement;
    const svgCanvas = document.getElementById("svg_canvas") as unknown as SVGElement;

    if (!importBtn || !fileObject || !svgCanvas) {
        console.error("Required elements not found");
        return;
    }

    //set events for importBtn
    importBtn.addEventListener("click", () => {
        fileObject.click();
    });

    fileObject.addEventListener("change", (event)=>{
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        
        if (file && file.type.startsWith('image/')) {
            // Process the image file here
            console.log("Image file selected:", file.name);
        } else {
            alert("Please select a valid image file");
        }
    });

    //create an image using the fileObject
    
}
