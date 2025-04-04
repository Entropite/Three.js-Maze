let scene, camera, renderer, controls, clock, skybox, skyboxTexture, maze;
let minimapCamera, minimapRenderer, playerMarker;

const SPEED = 1;

const MOUSE_SENSITIVITY = 0.001;
const WALL_WIDTH = 5;
const WALL_HEIGHT = 8;
const MAZE_SIZE = 10;
const MINIMAP_SIZE = 200; // Size of the minimap in pixels

function init() {
  scene = new THREE.Scene();

  // Creating the skybox
  const imageSkybox = "DaylightBox";

  function pathStrings(filename) {
    const pathBase = "https://media.githubusercontent.com/media/Entropite/Three.js-Maze/master/public/";
    const baseFilename = pathBase + filename;
    const typeOfFile = ".jpg";
    const sides = ["Back", "Front", "Top", "Bottom", "Right", "Left"];
    const pathStrings = sides.map((side) => {
      return baseFilename + "_" + side + typeOfFile;
    });
    return pathStrings;
  }

  function createMaterialArray(filename) {
    const imagePaths = pathStrings(filename);
    const skyboxMaterial = imagePaths.map((image) => {
      skyboxTexture = new THREE.TextureLoader().load(image);
      return new THREE.MeshBasicMaterial({
        map: skyboxTexture,
        side: THREE.BackSide,
      });
    });
    return skyboxMaterial;
  }

  const skyboxMaterial = createMaterialArray(imageSkybox);
  const geometrySkybox = new THREE.BoxGeometry(1000, 1000, 1000);
  skybox = new THREE.Mesh(geometrySkybox, skyboxMaterial);
  scene.add(skybox);

  camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(4, 3, -20);
  camera.rotation.set(0, Math.PI, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.id = "canvas";
  document.body.appendChild(renderer.domElement);

  // Lock pointer on click
  renderer.domElement.addEventListener("click", () => {
    renderer.domElement.requestPointerLock();
  });

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("mousemove", onMouseMove);
  //window.addEventListener('resize', onWindowResize);

  // Add lighting to the scene
  const ambientLight = new THREE.AmbientLight(0xffcccc, 0.8);
  scene.add(ambientLight);

  scene.add(createPlane());

  // Create the maze
  maze = generateMaze(MAZE_SIZE, MAZE_SIZE);

  // Make the maze have an entrance and exit
  maze[1][0] = 0;
  maze[2 * MAZE_SIZE - 1][2 * MAZE_SIZE] = 0;

  scene.add(createHedge());
  
  // Setup minimap
  setupMinimap();
  
  animate();
}

// New function to setup the minimap
function setupMinimap() {
  // Create a separate renderer for the minimap
  minimapRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  minimapRenderer.setSize(MINIMAP_SIZE, MINIMAP_SIZE);
  minimapRenderer.domElement.style.position = 'absolute';
  minimapRenderer.domElement.style.bottom = '20px';
  minimapRenderer.domElement.style.right = '20px';
  minimapRenderer.domElement.style.border = '2px solid white';
  minimapRenderer.domElement.style.borderRadius = '5px';
  document.body.appendChild(minimapRenderer.domElement);
  
  // Create a top-down orthographic camera for the minimap
  const mazeWidthInUnits = maze.length * WALL_WIDTH;
  const mazeHeightInUnits = maze[0].length * WALL_WIDTH;
  
  // Add padding to ensure entry and exit points are visible
  const padding = 20; // Extra padding around the maze edges
  
  minimapCamera = new THREE.OrthographicCamera(
    -mazeWidthInUnits / 2 - padding, 
    mazeWidthInUnits / 2 + padding, 
    mazeHeightInUnits / 2 + padding, 
    -mazeHeightInUnits / 2 - padding, 
    1, 
    1000
  );
  minimapCamera.position.set(mazeWidthInUnits / 2, 250, mazeHeightInUnits / 2);
  minimapCamera.lookAt(mazeWidthInUnits / 2, 0, mazeHeightInUnits / 2);
  
  // Create a player marker for the minimap
  const markerGeometry = new THREE.ConeGeometry(2, 4, 8);
  const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  playerMarker = new THREE.Mesh(markerGeometry, markerMaterial);
  playerMarker.rotation.x = Math.PI / 2;
  scene.add(playerMarker);
  
  // Add entry and exit point markers
  const entryGeometry = new THREE.SphereGeometry(1.5, 16, 16);
  const entryMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const entryMarker = new THREE.Mesh(entryGeometry, entryMaterial);
  entryMarker.position.set(1 * WALL_WIDTH, 0.5, 0);
  scene.add(entryMarker);
  
  const exitGeometry = new THREE.SphereGeometry(1.5, 16, 16);
  const exitMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const exitMarker = new THREE.Mesh(exitGeometry, exitMaterial);
  exitMarker.position.set((2 * MAZE_SIZE - 1) * WALL_WIDTH, 0.5, 2 * MAZE_SIZE * WALL_WIDTH);
  scene.add(exitMarker);
}

function createHedge() {
   // Count the number of walls in the maze
   let count = 0;
   for (let i = 0; i < maze.length; i++) {
     for (let j = 0; j < maze[i].length; j++) {
       if (maze[i][j] == 1) {
         count++;
       }
     }
   }
 
   const hedgeGeometry = new THREE.BoxGeometry(WALL_WIDTH, WALL_HEIGHT, WALL_WIDTH);
   const hedgeTexture = new THREE.TextureLoader().load("https://media.githubusercontent.com/media/Entropite/Three.js-Maze/master/public/Bush_Texture.jpg");
 
   // Make the texture repeat
   hedgeTexture.wrapS = THREE.RepeatWrapping;
   hedgeTexture.wrapT = THREE.RepeatWrapping;
   hedgeTexture.repeat.set(2, 2);
 
   const hedgeMaterial = new THREE.MeshStandardMaterial({map: hedgeTexture});
   
   const hedgeMesh = new THREE.InstancedMesh(hedgeGeometry, hedgeMaterial, count);
 
   const tempWall = new THREE.Object3D();
   let instanceCount = 0;
   for (let i = 0; i < maze.length; i++) {
     for (let j = 0; j < maze[i].length; j++) {
       if (maze[i][j] === 1) {
         tempWall.position.set(i * WALL_WIDTH, WALL_HEIGHT / 2, j * WALL_WIDTH);
         tempWall.updateMatrix();
         hedgeMesh.setMatrixAt(instanceCount, tempWall.matrix);
         instanceCount++;
       }
     }
   }
 
   hedgeMesh.instanceMatrix.needsUpdate = true;
   return hedgeMesh;
}

function createPlane() {
  const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
  const planeMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a3a2d,
    side: THREE.FrontSide,
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotateX(-Math.PI / 2);
  return plane;
}


function animate() {
  // Update player marker position for minimap
  updatePlayerMarker();
  
  skybox.rotation.y += 0.0001;
  renderer.render(scene, camera);
  
  // Render minimap
  minimapRenderer.render(scene, minimapCamera);
  
  requestAnimationFrame(animate);
}

// New function to update the player marker on the minimap
function updatePlayerMarker() {
  // Position the marker at the player's position (camera position)
  playerMarker.position.set(camera.position.x, 0.5, camera.position.z);
  
  // Rotate the marker to match player's direction
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  playerMarker.rotation.y = Math.atan2(-direction.x, -direction.z);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
  if (document.pointerLockElement == renderer.domElement) {
    camera.rotateY(-event.movementX * MOUSE_SENSITIVITY);
    //camera.rotateX(-event.movementY * MOUSE_SENSITIVITY);
  }
}

function onKeyDown(event) {
  const keyCode = event.code;

  // Get the direction that the camera is pointing in
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  direction.y = 0;

  const right = new THREE.Vector3();
  right.crossVectors(new THREE.Vector3(0, 1, 0), direction);

  switch (keyCode) {
    case "KeyW":
      // forwards
      camera.position.add(direction.multiplyScalar(SPEED));
      break;
    case "KeyS":
      // backwards
      camera.position.sub(direction.multiplyScalar(SPEED));
      break;
    case "KeyA":
      // left
      camera.position.add(right.multiplyScalar(SPEED));
      break;
    case "KeyD":
      // right
      camera.position.sub(right.multiplyScalar(SPEED));
      break;
  }
}

init();
