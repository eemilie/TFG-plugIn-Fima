// This plugin will detect if the selected frame has or is a dark pattern
// for this the user has has to select a frame before sendig a message here
// and this code will analyse the selected frame and try to detect a dkp
// the dark pattern tried is the "pop-up", that means that is in the selected 
// frame there is a shape bigger tna half of the dimensioons of the frame 
// in the frame then a message should be show in the console saying : 
// DARK PATTERN POP UP DETECTED 

// This shows the HTML page in "ui.html".
figma.showUI(__html__,{width: 300, height:400});


// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage =  async msg => {
  // verificacion del mensaje recibido
  if (msg.type === 'next-page') {
    console.log("HELLO WE WANT A NEXT PAGE NUEVO esgbaerbgerab");

    // Get the selected frame
    const selectedFrame = figma.currentPage.selection[0] as FrameNode;
    
    // Check if a frame is selected
    if (!selectedFrame) {
      console.error('Por favor seleccione un frame para analizar.');
      figma.ui.postMessage(0);
      return;
    }
    if (selectedFrame.type !== 'FRAME') {
      console.error('Por favor seleccione un framepara analizar. Otros tipos no son validos.'+selectedFrame.type);
      figma.ui.postMessage(2);
      return;
    }
    else {
      console.log("good");
      figma.ui.postMessage(1);
    }

    // create the frame and name it: 
    const parentFrame = figma.createFrame()
    parentFrame.name = 'Next Page'
    // Add Layout to the frame an set the direction, set the background color,  padding and spacing and sizng mode
    parentFrame.layoutMode = "VERTICAL";
    parentFrame.resize(550,350); 
    //parentFrame.backgrounds = [{ type: 'SOLID', color: { r: 0.7, g: 0.9, b: 1} }];   
    parentFrame.primaryAxisSizingMode = 'FIXED'
    parentFrame.counterAxisSizingMode = 'FIXED';


    // ANALIZAR IAMGEN + RESULTADOS
    const analysisResult = analyzeShapes(selectedFrame); 
    console.log("MESSSSSSSSSSSSSSSS:"+ analysisResult);

    // text Node for the title 
    const textNodeTitle = figma.createText(); 
    // text node for the analysis result
    const textNode = figma.createText();
    
    // Load the font asynchronously before setting characters
    figma.loadFontAsync({ family: "Inter", style: "Regular" })
    .then(() => {
      // Creation of the textNode Title: 
      textNodeTitle.characters = "ANALYSIS RESULTS: \n"

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
  
  else if(msg.type === 'actionExit'){
    //Close the plugin
    figma.closePlugin("closed with actionExit")
  }

};


function analyzeShapes(selectedFrame: FrameNode) {
  let largestShape = null;
  let mess = null; 
  let hasText = false; 
  let hasShapes = false; 
  let textCovered = false; 
  let shapeCoversTooMuch = false;

  // miramos si hay un text Node
  for (const node of selectedFrame.findAll()) {
    console.log("avjlkehbselgviu"+node.type);
    if (node.type === 'TEXT') {
      hasText = true;
      break;
    }
  }

  // miramos si hay shapes
  for (const node of selectedFrame.children){
    const ndT = node?.type
    console.log(ndT);
    if (ndT === "RECTANGLE" || ndT === "POLYGON" || ndT === "ELLIPSE"){
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
  console.log("cosas:  "+ hasShapes+",,,,,"+hasText+",,,,,"+shapeCoversTooMuch+"......."+textCovered);

  if(hasShapes && textCovered && hasText){
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

  return 'Analysis complete! \nResults:' + mess;
}

function checkShapeOverlapsText(shape: SceneNode, frame: FrameNode) {
  // Simplified example using x, y, width, and height for basic overlap check
  const shapeX = shape.x;
  const shapeY = shape.y;
  const shapeWidth = shape.width;
  const shapeHeight = shape.height;
  console.log(" AVER QUE SOIS", + shape +"kjlik"+frame);

  for (const textNode of frame.findAll(node => node.type === 'TEXT')) {
    console.log("ENTRAS EN ESTE BUCLE ? ");
    const textX = textNode.x;
    const textY = textNode.y;
    const textWidth = textNode.width;
    const textHeight = textNode.height;

    if (
      shapeX < textX + textWidth && // Right edge of shape past left edge of text
      shapeX + shapeWidth > textX && // Left edge of shape before right edge of text
      shapeY < textY + textHeight && // Bottom of shape below top of text
      shapeY + shapeHeight > textY // Top of shape above bottom of text
    ) {
      return true;
    }
  }
  return false;
}




