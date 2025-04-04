let scene, camera, renderer, controls, clock, skybox, skyboxTexture, maze;

const SPEED = 1;

const MOUSE_SENSITIVITY = 0.001;
const WALL_WIDTH = 5;
const WALL_HEIGHT = 8;
const MAZE_SIZE = 10;

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
  
  animate();
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
  skybox.rotation.y += 0.0001;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
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
