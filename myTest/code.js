"use strict";
// This plugin will detect if the selected frame has or is a dark pattern
// for this the user has has to select a frame before sendig a message here
// and this code will analyse the selected frame and try to detect a dkp
// the dark pattern tried is the "pop-up", that means that is in the selected 
// frame there is a shape bigger tna half of the dimensioons of the frame 
// in the frame then a message should be show in the console saying : 
// DARK PATTERN POP UP DETECTED 
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 300, height: 400 });
// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    // verificacion del mensaje recibido
    if (msg.type === 'next-page') {
        console.log("HELLO WE WANT A NEXT PAGE");
        let ejReal = false;
        let imageData = null;
        // Get the selected frame
        const selectedFrame = figma.currentPage.selection[0];
        // Check if a frame is selected
        if (!selectedFrame) {
            console.error('Please select a frame to analyze.');
            //parent.postMessage({ pluginMessage: { type: 'error', message: 'Please select a frame to analyze.' } }, '*');
            figma.ui.postMessage(0);
            return;
        }
        // Check if the selected node is a frame
        else if (selectedFrame.type !== 'FRAME') {
            console.error('Please select a frame. Other node types are not supported.' + selectedFrame.type);
            figma.ui.postMessage(0);
            return;
        }
        else if (selectedFrame.type === 'FRAME' && selectedFrame.children.length === 1 && isAbsolutePositioned(selectedFrame.children[0])) {
            console.log("PUEDE LLEGAR A SER UNA IMAGEN");
            ejReal = true;
            testImage(selectedFrame.children[0]);
        }
        else {
            console.log("good");
            figma.ui.postMessage(1);
        }
        if (ejReal) {
            const getSelected = () => __awaiter(void 0, void 0, void 0, function* () {
                for (const node of figma.currentPage.selection) {
                    // @ts-ignore
                    for (const paint of node.fills) {
                        if (paint.type === 'IMAGE') {
                            // Get the (encoded) bytes for this image.
                            const bytes = yield node.exportAsync();
                            figma.ui.postMessage({ type: 'upload', image: bytes });
                        }
                    }
                }
            });
        }
        // create the frame and name it: 
        const parentFrame = figma.createFrame();
        parentFrame.name = 'Next Page';
        // Add Layout to the frame an set the direction, set the background color,  padding and spacing and sizng mode
        parentFrame.layoutMode = "VERTICAL";
        parentFrame.resize(400, 600);
        //parentFrame.backgrounds = [{ type: 'SOLID', color: { r: 0.7, g: 0.3, b: 0.2} }];   
        parentFrame.primaryAxisSizingMode = 'FIXED';
        parentFrame.counterAxisSizingMode = 'FIXED';
        const analysisResult = analyzeShapes(selectedFrame);
        // Display message in Figma UI
        console.log("MESSSSSSSSSSSSSSSS:" + analysisResult);
        // text Node for the title 
        const textNodeTitle = figma.createText();
        // text node for the analysis result
        const textNode = figma.createText();
        // Load the font asynchronously before setting characters
        figma.loadFontAsync({ family: "Inter", style: "Regular" })
            .then(() => {
            // Creation of the textNode Title: 
            textNodeTitle.characters = "ANALYSIS RESULTS:";
            textNodeTitle.x = 20; // Set horizontal position 
            textNodeTitle.y = 20; // Set vertical position 
            textNodeTitle.fontSize = 24; // Set font size 
            // Creation of the  text node with the analysis result: 
            textNode.characters = analysisResult;
            // Position and style the text node
            textNode.x = 20; // Set horizontal position 
            textNode.y = 30; // Set vertical position 
            textNode.fontSize = 16; // Set font size
            // Add the textNodes
            parentFrame.appendChild(textNodeTitle);
            parentFrame.appendChild(textNode);
            console.log("llegas aqui?");
            figma.closePlugin("closed at the end");
        })
            .catch(error => {
            console.error("Error loading font:", error);
        });
    }
    else if (msg.type === 'actionExit') {
        //Close the plugin
        figma.closePlugin("closed with actionExit");
    }
});
function analyzeShapes(selectedFrame, real) {
    let largestShape = null;
    let mess = null;
    let hasText = false;
    let hasShapes = false;
    let textCovered = false;
    let shapeCoversTooMuch = false;
    // miramos si hay un text Node
    for (const node of selectedFrame.findAll()) {
        console.log("avjlkehbselgviu" + node.type);
        if (node.type === 'TEXT') {
            hasText = true;
            break;
        }
    }
    // miramos si hay shapes
    for (const node of selectedFrame.children) {
        const ndT = node === null || node === void 0 ? void 0 : node.type;
        console.log(ndT);
        if (ndT === "RECTANGLE" || ndT === "POLYGON" || ndT === "ELLIPSE") {
            hasShapes = true;
            console.log("entras en if shape ?");
            if (largestShape === null || node.width * node.height > largestShape.width * largestShape.height) {
                largestShape = node;
            }
            // miramos si la shape cubre mas del cuarto de la frame
            const frameArea = selectedFrame.width * selectedFrame.height;
            const threshold = frameArea * 0.25;
            if (largestShape && largestShape.width * largestShape.height > threshold) {
                shapeCoversTooMuch = true;
                //break;
            }
            // miramos si el shape cubre text Node ( en el caso de que haya text Node)
            if (hasText && checkShapeOverlapsText(largestShape, selectedFrame)) {
                textCovered = true;
                break;
            }
        }
    }
    console.log("cosas:  " + hasShapes + ",,,,," + hasText + ",,,,," + shapeCoversTooMuch + "......." + textCovered);
    if (hasShapes && textCovered && hasText) {
        mess = 'Potential dark pattern detected \n shape over text zone ';
        console.warn(mess);
    }
    else if (hasShapes && !hasText && shapeCoversTooMuch) {
        mess = 'Potential dark pattern detected: Shape covers too much area.';
        console.warn(mess);
    }
    else if (hasShapes && !hasText && !shapeCoversTooMuch) {
        mess = 'A shape is present, but no dark pattern detected';
        console.log(mess);
    }
    else if (!hasShapes && hasText) {
        mess = 'All good! Text is present, but no shapes were found.';
        console.log(mess);
    }
    else {
        mess = 'All good! No potential dark patterns detected.';
        console.log(mess);
    }
    return 'Analysis complete! Results:' + mess;
}
function checkShapeOverlapsText(shape, frame) {
    // Simplified example using x, y, width, and height for basic overlap check
    const shapeX = shape.x;
    const shapeY = shape.y;
    const shapeWidth = shape.width;
    const shapeHeight = shape.height;
    console.log(" AVER QUE SOIS", +shape + "kjlik" + frame);
    for (const textNode of frame.findAll(node => node.type === 'TEXT')) {
        console.log("ENTRAS EN ESTE BUCLE ? ");
        const textX = textNode.x;
        const textY = textNode.y;
        const textWidth = textNode.width;
        const textHeight = textNode.height;
        if (shapeX < textX + textWidth && // Right edge of shape past left edge of text
            shapeX + shapeWidth > textX && // Left edge of shape before right edge of text
            shapeY < textY + textHeight && // Bottom of shape below top of text
            shapeY + shapeHeight > textY // Top of shape above bottom of text
        ) {
            return true;
        }
    }
    return false;
}
function isAbsolutePositioned(node) {
    return node.relativeTransform[0][0] === 1 && // Check for FIXED positioning
        node.relativeTransform[1][1] === 1;
}
function testImage(selected) {
    return __awaiter(this, void 0, void 0, function* () {
        // Export a 2x resolution PNG of the node
        const bytes = yield selected.exportAsync({
            format: 'PNG',
            constraint: { type: 'SCALE', value: 1 },
        });
    });
}
