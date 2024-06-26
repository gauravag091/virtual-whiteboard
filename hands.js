/**
 * This JavaScript code sets up a hand tracking system using MediaPipe Hands and allows the user to
 * draw on a canvas using their index finger.
 * @param results - The `results` parameter is an object that contains the following properties:
 */
const video3 = document.getElementsByClassName('input_video3')[0];
video3.display = 'none';
const out3 = document.getElementsByClassName('output3')[0];
const controlsElement3 = document.getElementsByClassName('control3')[0];
const canvasCtx3 = out3.getContext('2d');
const fpsControl = new FPS();
let isHandTrackingOn = false;

const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
let isDrawing = true;
let isEraser = false;

const usersScreen = document.getElementById('output_screen');
const width = usersScreen.offsetWidth;
out3.width = canvas.offsetWidth + 210;

const activepen = document.getElementById('active-pen');
const activeeraser = document.getElementById('active-eraser');
const eraser = document.getElementById('eraser');
const pen = document.getElementById('pen');
activepen.style.position = 'absolute'





const spinner = document.querySelector('.loading');
spinner.ontransitionend = () => {
  spinner.style.display = 'none';
};

function onResultsHands(results) {
  document.body.classList.add('loaded');
  fpsControl.tick();

  canvasCtx3.save();
  canvasCtx3.clearRect(0, 0, out3.width, out3.height);
  canvasCtx3.drawImage(
    results.image, 0, 0, out3.width, out3.height);
  if (results.multiHandLandmarks && results.multiHandedness) {
    for (let index = 0; index < results.multiHandLandmarks.length; index++) {
      const classification = results.multiHandedness[index];
      const isRightHand = classification.label === 'Right';
      const landmarks = results.multiHandLandmarks[index];

      if (landmarks) {
        const indexFingerTip = landmarks[8];
        const middleFingerTip = landmarks[12];
        const indexFingerBase = landmarks[5]; // Use a different landmark for the base (e.g., 5 for the base of the index finger)

        const indexFingerTipY = indexFingerTip.y * canvas.height;
        const indexFingerBaseY = indexFingerBase.y * canvas.height;
        const middleFingerTipY = middleFingerTip.y * canvas.height;

        const fingersConnected = Math.abs(indexFingerTipY - middleFingerTipY) < 24;
        // Check if the index finger is extended
        if (fingersConnected) {
          console.log("fingers are connected");
          isDrawing = true;
          isEraser = false;

          const isClosedFist = detectClosedFist(landmarks);
          if (isClosedFist) {
            console.log("fist is closed")
            ctx.strokeStyle = 'white';
            isEraser = true;
            isDrawing = false;
            
            // Implement actions for closed fist gesture
          } else {
            // Implement actions for other gestures
          }

          isDrawing = false;
          resetPrevCoordinates();
          ctx.beginPath();
        } else
        {
          isDrawing = true;
        }
        if (isDrawing && !fingersConnected) {
          // Draw on the canvas
          drawLine(indexFingerTip.x * canvas.width, indexFingerTipY);
        } else {
          // Stop drawing if the index finger is not extended
          isDrawing = false;
          ctx.beginPath();
        }
      }

      drawConnectors(
        canvasCtx3, landmarks, HAND_CONNECTIONS,
        { color: isRightHand ? '#00FF00' : '#FF0000' }),
        drawLandmarks(canvasCtx3, landmarks, {
          color: isRightHand ? '#00FF00' : '#FF0000',
          fillColor: isRightHand ? '#FF0000' : '#00FF00',
          radius: (x) => {
            return lerp(x.from.z, -0.15, .1, 10, 1);
          }
        });
    }
  }
  canvasCtx3.restore();
}

const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.1/${file}`;
  }
});




const startHandTracking = async () => {
  hands.onResults(onResultsHands);
  isHandTrackingOn = true;
};

const stopHandTracking = async () => {
  hands.onResults(null);
  canvasCtx3.clearRect(0, 0, width, usersScreen.offsetHeight);
  isHandTrackingOn = false;
};

function detectClosedFist(landmarks) {
  // Calculate distances or angles between landmarks to determine if the hand is in a closed fist position
  // Example criteria: If the distance between fingertips and palm base is less than a certain threshold
  const finger1 = landmarks[8]; // Index finger tip
  const finger2 = landmarks[12]; // Middle finger tip
  const finger3 = landmarks[16]; // Ring finger tip
  const finger4 = landmarks[20]; // Little finger tip
  const palmBase = landmarks[0]; // Palm base

  // Calculate the distance between fingertips and palm base
  const distanceThreshold = 0.3; // Adjust as needed
  const distance1 = calculateDistance(finger1, palmBase);
  const distance2 = calculateDistance(finger2, palmBase);
  const distance3 = calculateDistance(finger3, palmBase);
  const distance4 = calculateDistance(finger4, palmBase);

  // Check if the distances are less than the threshold, indicating a closed fist
  return distance1 < distanceThreshold && distance2 < distanceThreshold &&
         distance3 < distanceThreshold && distance4 < distanceThreshold;
}

// Function to calculate distance between two landmarks
function calculateDistance(landmark1, landmark2) {
  return Math.sqrt((landmark1.x - landmark2.x) ** 2 + (landmark1.y - landmark2.y) ** 2);
}

const camera = new Camera(video3, {
  onFrame: async () => {
    await hands.send({ image: video3 });
  },
  width: width,
  height: 480
});
camera.start();

new ControlPanel(controlsElement3, {
  selfieMode: true,
  maxNumHands: 1,
  minDetectionConfidence: 0.8,
  minTrackingConfidence: 0.8
})
  .add([
    new StaticText({ title: 'MediaPipe Hands' }),
    fpsControl,
    new Toggle({ title: 'Selfie Mode', field: 'selfieMode' }),
    new Slider(
      { title: 'Max Number of Hands', field: 'maxNumHands', range: [1, 4], step: 1 }),
    new Slider({
      title: 'Min Detection Confidence',
      field: 'minDetectionConfidence',
      range: [0, 1],
      step: 0.01
    }),
    new Slider({
      title: 'Min Tracking Confidence',
      field: 'minTrackingConfidence',
      range: [0, 1],
      step: 0.01
    }),
  ])
  .on(options => {
    video3.classList.toggle('selfie', options.selfieMode);
    hands.setOptions(options);
  });

const clearButton = document.getElementById('clearButton');
clearButton.addEventListener('click', () => {
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});




const smoothingFactor = 0.3;  // Adjust the smoothing factor as needed
let prevX, prevY;

function drawLine(x, y) {
  // Initialize prevX and prevY if not already set
  if (prevX === undefined || prevY === undefined) {
    prevX = x;
    prevY = y;
  }

  // Smooth the current point
  const smoothedX = prevX + smoothingFactor * (x - prevX);
  const smoothedY = prevY + smoothingFactor * (y - prevY);
  


  if(isEraser){
    ctx.strokeStyle = 'white';
    activepen.style.display = 'none';
    activeeraser.style.display = 'block';
    activeeraser.style.position = 'absolute';
    activeeraser.style.left = `${smoothedX+95}px`;
    activeeraser.style.top = `${smoothedY+133}px`;
    eraser.style.backgroundColor = 'lightgrey';
    pen.style.backgroundColor = 'white';
    ctx.lineWidth = 20;
  }
  else
  {
    ctx.strokeStyle = 'black';
    
    activepen.style.left = `${smoothedX+95}px`;
    activepen.style.top = `${smoothedY+133}px`;
    activeeraser.style.display = 'none';
    ctx.lineWidth = 3;
    activepen.style.display = 'block';
    eraser.style.backgroundColor = 'white';
    pen.style.backgroundColor = 'lightgrey';
  }
  ctx.lineTo(smoothedX, smoothedY);
  ctx.stroke();



  // Update prevX and prevY for the next iteration
  prevX = smoothedX;
  prevY = smoothedY;
}

function resetPrevCoordinates() {
  // Reset prevX and prevY when drawing is stopped
  prevX = undefined;
  prevY = undefined;
}

const toggleButton = document.getElementById('toggleButton');
toggleButton.addEventListener('click', () => {
  if (isHandTrackingOn) {
    stopHandTracking();
    toggleButton.innerText = 'Start Whiteboard';
  } else {
    startHandTracking();
    toggleButton.innerText = 'Stop Whiteboard';
  }
});

startHandTracking();


// Set the width and height of the whiteboard canvas to match the user's screen
canvas.width = out3.width;
canvas.height = out3.height;

