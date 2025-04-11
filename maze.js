let scene, camera, renderer, controls, clock, skybox, skyboxTexture, maze;
let minimapCamera, minimapRenderer, playerMarker;

const SPEED = 1;

const MOUSE_SENSITIVITY = 0.001;
const WALL_WIDTH = 5;
const WALL_HEIGHT = 8;
const MAZE_SIZE = 10;
const MINIMAP_SIZE = 200; // Size of the minimap in pixels
const PLAYER_RADIUS = 0.8; // Reduced from 1.5 for better maneuverability

function init() {
  scene = new THREE.Scene();

  // Creating the skybox
  const imageSkybox = "DaylightBox";

  function pathStrings(filename) {
    const pathBase =
      "https://media.githubusercontent.com/media/Entropite/Three.js-Maze/master/public/";
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
  const ambientLight = new THREE.AmbientLight(0xffcccc, 0.7);
  scene.add(ambientLight);

  scene.add(createPlane());

  createGrass();

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
  minimapRenderer.domElement.style.position = "absolute";
  minimapRenderer.domElement.style.bottom = "20px";
  minimapRenderer.domElement.style.right = "20px";
  minimapRenderer.domElement.style.border = "2px solid white";
  minimapRenderer.domElement.style.borderRadius = "5px";
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
  exitMarker.position.set(
    (2 * MAZE_SIZE - 1) * WALL_WIDTH,
    0.5,
    2 * MAZE_SIZE * WALL_WIDTH
  );
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

  const hedgeGeometry = new THREE.BoxGeometry(
    WALL_WIDTH,
    WALL_HEIGHT,
    WALL_WIDTH
  );
  const hedgeTexture = new THREE.TextureLoader().load(
    "https://media.githubusercontent.com/media/Entropite/Three.js-Maze/master/public/Bush_Texture.jpg"
  );

  // Make the texture repeat
  hedgeTexture.wrapS = THREE.RepeatWrapping;
  hedgeTexture.wrapT = THREE.RepeatWrapping;
  hedgeTexture.repeat.set(2, 2);

  const hedgeMaterial = new THREE.MeshStandardMaterial({ map: hedgeTexture });

  const hedgeMesh = new THREE.InstancedMesh(
    hedgeGeometry,
    hedgeMaterial,
    count
  );

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

  // Point light added as fairy lights
  const fairyLightGeometry = new THREE.SphereGeometry(0.2);
  const fairyLightMaterial = new THREE.MeshBasicMaterial({
    color: 0xffaa88,
    transparent: true,
    opacity: 0.8,
  });

  const fairyLightMesh = new THREE.InstancedMesh(
    fairyLightGeometry,
    fairyLightMaterial,
    count
  );
  let fairyLightInstance = 0;

  for (let i = 0; i < maze.length; i++) {
    for (let j = 0; j < maze[i].length; j++) {
      if (maze[i][j] === 0 && Math.random() < 0.1) {
        const light = new THREE.PointLight(0xffdd99, 2, 5);
        light.position.set(i * WALL_WIDTH, WALL_HEIGHT * 0.8, j * WALL_WIDTH);

        scene.add(light);

        tempWall.position.copy(light.position);
        tempWall.updateMatrix();
        fairyLightMesh.setMatrixAt(fairyLightInstance, tempWall.matrix);
        fairyLightInstance++;
      }
    }
  }

  hedgeMesh.add(fairyLightMesh);
  return hedgeMesh;
}

function createPlane() {
  const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
  // Adding a texture to the terrain
  const terrainTexture = new THREE.TextureLoader().load(
    "https://media.githubusercontent.com/media/Entropite/Three.js-Maze/master/public/GrassTerrain.jpg"
  );
  terrainTexture.wrapS = THREE.RepeatWrapping;
  terrainTexture.wrapT = THREE.RepeatWrapping;
  terrainTexture.repeat.set(2, 2);

  const planeMaterial = new THREE.MeshStandardMaterial({
    map: terrainTexture,
    side: THREE.FrontSide,
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotateX(-Math.PI / 2);
  return plane;
}

// Adding grass
function createGrass() {
  const grassCount = 9000000; // Number of grass blades
  const grassGeometry = new THREE.PlaneGeometry(0.01, 0.5);

  const grassMaterial = new THREE.MeshStandardMaterial({
    color: 0x006400,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8,
  });

  const grassMesh = new THREE.InstancedMesh(
    grassGeometry,
    grassMaterial,
    grassCount
  );

  const grassObject = new THREE.Object3D();

  // Plane area which would have grass
  const planeSize = 500;

  for (let i = 0; i < grassCount; i++) {
    grassObject.position.set(
      Math.random() * planeSize * 2 - planeSize, // x-axis randomizarion
      0.05, // y-axis randomizarion
      Math.random() * planeSize * 2 - planeSize // z-axis randomizarion
    );

    grassObject.rotation.y = Math.random() * Math.PI * 2; // random rotated appearance
    grassObject.updateMatrix();
    grassMesh.setMatrixAt(i, grassObject.matrix);
  }

  scene.add(grassMesh);
}

// Animate function to include minimap rendering
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

// Fixed collision detection function
function checkCollision(position) {
  // Expand search area to catch all potential walls
  const searchRadius = Math.ceil(PLAYER_RADIUS / WALL_WIDTH) + 1;

  // Calculate grid position
  const gridX = Math.floor(position.x / WALL_WIDTH);
  const gridZ = Math.floor(position.z / WALL_WIDTH);

  // Check all surrounding grid cells
  for (let i = gridX - searchRadius; i <= gridX + searchRadius; i++) {
    for (let j = gridZ - searchRadius; j <= gridZ + searchRadius; j++) {
      // Skip if outside maze bounds
      if (i < 0 || i >= maze.length || j < 0 || j >= maze[0].length) {
        continue;
      }

      // If this is a wall, check for collision
      if (maze[i][j] === 1) {
        // Wall boundaries
        const wallMinX = i * WALL_WIDTH - WALL_WIDTH / 2;
        const wallMaxX = i * WALL_WIDTH + WALL_WIDTH / 2;
        const wallMinZ = j * WALL_WIDTH - WALL_WIDTH / 2;
        const wallMaxZ = j * WALL_WIDTH + WALL_WIDTH / 2;

        // Find closest point on wall to player
        const closestX = Math.max(wallMinX, Math.min(position.x, wallMaxX));
        const closestZ = Math.max(wallMinZ, Math.min(position.z, wallMaxZ));

        // Calculate distance from player to closest point
        const dx = position.x - closestX;
        const dz = position.z - closestZ;
        const distanceSquared = dx * dx + dz * dz;

        // If distance is less than player radius, there's a collision
        if (distanceSquared < PLAYER_RADIUS * PLAYER_RADIUS) {
          return true;
        }
      }
    }
  }

  // No collision
  return false;
}

// Simpler wall-sliding algorithm
function getValidPosition(originalPos, newPos) {
  // If no collision at the new position, it's valid
  if (!checkCollision(newPos)) {
    return newPos;
  }

  // Try horizontal movement only
  const horizontalPos = originalPos.clone();
  horizontalPos.x = newPos.x;

  if (!checkCollision(horizontalPos)) {
    return horizontalPos;
  }

  // Try vertical movement only
  const verticalPos = originalPos.clone();
  verticalPos.z = newPos.z;

  if (!checkCollision(verticalPos)) {
    return verticalPos;
  }

  // Neither direction works, stay at original position
  return originalPos.clone();
}

function onKeyDown(event) {
  const keyCode = event.code;

  // Get the direction that the camera is pointing in
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  direction.y = 0;
  direction.normalize();

  const right = new THREE.Vector3();
  right.crossVectors(new THREE.Vector3(0, 1, 0), direction);
  right.normalize();

  // Store the original position
  const originalPos = camera.position.clone();
  let newPos = originalPos.clone();

  switch (keyCode) {
    case "KeyW":
      // forwards
      newPos.add(direction.clone().multiplyScalar(SPEED));
      break;
    case "KeyS":
      // backwards
      newPos.sub(direction.clone().multiplyScalar(SPEED));
      break;
    case "KeyA":
      // left
      newPos.add(right.clone().multiplyScalar(SPEED));
      break;
    case "KeyD":
      // right
      newPos.sub(right.clone().multiplyScalar(SPEED));
      break;
    default:
      return; // Not a movement key, exit early
  }

  // Get valid position with wall sliding
  const validPos = getValidPosition(originalPos, newPos);
  camera.position.copy(validPos);
}

// Maze generation function using Depth-First Search algorithm
function generateMaze(width, height) {
  // Initialize maze with all walls
  const maze = Array(width * 2 + 1)
    .fill()
    .map(() => Array(height * 2 + 1).fill(1));

  // Create a grid for the maze paths
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      maze[i * 2 + 1][j * 2 + 1] = 0;
    }
  }

  // DFS to carve paths
  const stack = [{ x: 0, y: 0 }];
  const visited = Array(width)
    .fill()
    .map(() => Array(height).fill(false));
  visited[0][0] = true;

  while (stack.length > 0) {
    const { x, y } = stack[stack.length - 1];

    // Get unvisited neighbors
    const neighbors = [];
    if (x > 0 && !visited[x - 1][y])
      neighbors.push({ x: x - 1, y: y, dir: "left" });
    if (x < width - 1 && !visited[x + 1][y])
      neighbors.push({ x: x + 1, y: y, dir: "right" });
    if (y > 0 && !visited[x][y - 1])
      neighbors.push({ x: x, y: y - 1, dir: "up" });
    if (y < height - 1 && !visited[x][y + 1])
      neighbors.push({ x: x, y: y + 1, dir: "down" });

    if (neighbors.length > 0) {
      // Choose random neighbor
      const neighbor = neighbors[Math.floor(Math.random() * neighbors.length)];

      // Remove wall between current cell and chosen neighbor
      switch (neighbor.dir) {
        case "left":
          maze[x * 2][y * 2 + 1] = 0;
          break;
        case "right":
          maze[x * 2 + 2][y * 2 + 1] = 0;
          break;
        case "up":
          maze[x * 2 + 1][y * 2] = 0;
          break;
        case "down":
          maze[x * 2 + 1][y * 2 + 2] = 0;
          break;
      }

      // Mark neighbor as visited and add to stack
      visited[neighbor.x][neighbor.y] = true;
      stack.push(neighbor);
    } else {
      // Backtrack
      stack.pop();
    }
  }

  return maze;
}

init();
