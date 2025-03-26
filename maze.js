let scene, camera, renderer, controls, clock, skyboxTexture;

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
  camera.position.set(0, 5, 20);
  camera.lookAt(5, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor(0x000000);

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.id = "canvas";
  document.body.appendChild(renderer.domElement);

  // Add first person controls
  controls = new THREE.FirstPersonControls(camera, renderer.domElement);
  controls.lookSpeed = 0.25;
  controls.movementSpeed = 10;
  controls.lookVertical = true;

  clock = new THREE.Clock();

  // Add lighting to the scene
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(-100, 200, 100);
  scene.add(directionalLight);

  scene.add(createPlane());
  scene.add(createWall(-10, 0, 10, 0));
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
  controls.update(clock.getDelta());
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

init();
