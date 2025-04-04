let scene, camera, renderer, controls, clock, skybox, skyboxTexture, maze;

const SPEED = 1;
const MOUSE_SENSITIVITY = 0.001;
const WALL_WIDTH = 5;
const WALL_HEIGHT = 8;
const MAZE_SIZE = 10;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

function init() {
  scene = new THREE.Scene();

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

  renderer.domElement.addEventListener("click", () => {
    renderer.domElement.requestPointerLock();
  });

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
  document.addEventListener("mousemove", onMouseMove);

  const ambientLight = new THREE.AmbientLight(0xffcccc, 0.8);
  scene.add(ambientLight);

  scene.add(createPlane());

  maze = generateMaze(MAZE_SIZE, MAZE_SIZE);
  maze[1][0] = 0;
  maze[2 * MAZE_SIZE - 1][2 * MAZE_SIZE] = 0;

  scene.add(createHedge());

  animate();
}

function createHedge() {
  let count = 0;
  for (let i = 0; i < maze.length; i++) {
    for (let j = 0; j < maze[i].length; j++) {
      if (maze[i][j] == 1) count++;
    }
  }

  const hedgeGeometry = new THREE.BoxGeometry(WALL_WIDTH, WALL_HEIGHT, WALL_WIDTH);
  const hedgeTexture = new THREE.TextureLoader().load("https://media.githubusercontent.com/media/Entropite/Three.js-Maze/master/public/Bush_Texture.jpg");

  hedgeTexture.wrapS = THREE.RepeatWrapping;
  hedgeTexture.wrapT = THREE.RepeatWrapping;
  hedgeTexture.repeat.set(2, 2);

  const hedgeMaterial = new THREE.MeshStandardMaterial({ map: hedgeTexture });
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

function onKeyDown(event) {
  switch (event.code) {
    case "KeyW":
      moveForward = true;
      break;
    case "KeyS":
      moveBackward = true;
      break;
    case "KeyA":
      moveLeft = true;
      break;
    case "KeyD":
      moveRight = true;
      break;
  }
}

function onKeyUp(event) {
  switch (event.code) {
    case "KeyW":
      moveForward = false;
      break;
    case "KeyS":
      moveBackward = false;
      break;
    case "KeyA":
      moveLeft = false;
      break;
    case "KeyD":
      moveRight = false;
      break;
  }
}

function onMouseMove(event) {
  if (document.pointerLockElement == renderer.domElement) {
    camera.rotateY(-event.movementX * MOUSE_SENSITIVITY);
  }
}

function isWallAtPosition(x, z) {
  const i = Math.floor(x / WALL_WIDTH);
  const j = Math.floor(z / WALL_WIDTH);

  if (i < 0 || i >= maze.length || j < 0 || j >= maze[0].length) {
    return true;
  }

  return maze[i][j] === 1;
}

function animate() {
  requestAnimationFrame(animate);

  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  direction.y = 0;
  direction.normalize();

  const right = new THREE.Vector3();
  right.crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();

  const moveVector = new THREE.Vector3();

  if (moveForward) moveVector.add(direction);
  if (moveBackward) moveVector.sub(direction);
  if (moveLeft) moveVector.sub(right);
  if (moveRight) moveVector.add(right);

  if (moveVector.lengthSq() > 0) {
    moveVector.normalize().multiplyScalar(SPEED);

    const newX = camera.position.x + moveVector.x;
    const newZ = camera.position.z + moveVector.z;

    const buffer = 1.5;

    if (
      !isWallAtPosition(newX + buffer, newZ + buffer) &&
      !isWallAtPosition(newX - buffer, newZ + buffer) &&
      !isWallAtPosition(newX + buffer, newZ - buffer) &&
      !isWallAtPosition(newX - buffer, newZ - buffer)
    ) {
      camera.position.x = newX;
      camera.position.z = newZ;
    }
  }

  skybox.rotation.y += 0.0001;
  renderer.render(scene, camera);
}

init();
