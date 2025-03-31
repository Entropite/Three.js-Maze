let scene, camera, renderer, controls, clock, skyboxTexture;

const SPEED = 2;

const MOUSE_SENSITIVITY = 0.001;
const WALL_WIDTH = 5;
const WALL_HEIGHT = 8;

function init() {
  scene = new THREE.Scene();

  // Creating the skybox
  const imageSkybox = "DaylightBox";

  function pathStrings(filename) {
    const pathBase = "./public/";
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
  const skybox = new THREE.Mesh(geometrySkybox, skyboxMaterial);
  scene.add(skybox);

  camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 2, 0);
  camera.rotation.set(0, 0, 0);
  //camera.lookAt(,0,0)

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
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(-100, 200, 100);
  scene.add(directionalLight);

  const ambientLight = new THREE.AmbientLight(0xffcccc, 0.2);
  scene.add(ambientLight);

  scene.add(createPlane());
  scene.add(createWall(-10, -50, 10, -50));
  animate();
}

function createWall(fromX, fromZ, toX, toZ) {
  const wallGeometry = new THREE.BoxGeometry(
    Math.abs(toX - fromX),
    WALL_HEIGHT,
    WALL_WIDTH
  );
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xaaff33 });
  const wall = new THREE.Mesh(wallGeometry, wallMaterial);
  wall.position.set((fromX + toX) / 2, WALL_HEIGHT / 2, (fromZ + toZ) / 2);

  return wall;
}

function createPlane() {
  const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
  const planeMaterial = new THREE.MeshStandardMaterial({
    color: 0x565a5d,
    side: THREE.FrontSide,
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotateX(-Math.PI / 2);
  return plane;
}

function animate() {
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
    // camera.rotateX(-event.movementY * MOUSE_SENSITIVITY);
  }
}

function onKeyDown(event) {
  const keyCode = event.code;

  // Get the direction that the camera is pointing in
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);

  // The rightward direction will be perpindicular to both the camera direction and the vertical direction
  // Right hand rule: index finger = camera direction, thumb = vertical direction, perpindicular cross product = middle finger
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
