//initialize global variables
var zdelta = 0;
var localThis = this;
var mixers = [];
var scope=this;
var refObject = this.referenceModel;
let cloudParticles =[];
let flesh , rain ,rainGeo =[] , rainCount =200000 ,sphereCamera;
//variables for miniMap
let cameraOrtho,insetWidth, insetHeight;

var scene,camera,renderer,mesh,controls, clock,portalParticles=[],smokeParticles=[];
var mapCamera, mapWidth = 256, mapHeight = 256, mapComposer;
var meshFloor;
var started=true;
var paused = false;
var info = true;
//Array that stores bullest
bullets = [];

//Pointer Locker
if ("pointerLockElement" in document || "mozPointerLockElement" in document || "webkitPointerLockElement" in document) {
	let element = document.body;
	//Setup pointer locking mechanisms
	let pointerlockchange = e => {
		if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
			controls.enabled = true;
		} else {
			controls.enabled = false;
		}
	};
	let pointerlockerror = e => {
	//alert("Pointer lock error!");
	};



	//Hook pointer lock state change events
	document.addEventListener("pointerlockchange", pointerlockchange, false);
	document.addEventListener("mozpointerlockchange", pointerlockchange, false);
	document.addEventListener("webkitpointerlockchange", pointerlockchange, false);
	document.addEventListener("pointerlockerror", pointerlockerror, false);
	document.addEventListener("mozpointerlockerror", pointerlockerror, false);
	document.addEventListener("webkitpointerlockerror", pointerlockerror, false);
	document.addEventListener("click", e => {
		//Ask the browser to lock the pointer
        if(!paused && started){
            element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
            element.requestPointerLock();
        }
	}, false);
} else {
	alert("Pointer lock error!");
}
//Execute when user clicks start
 var startBtn = document.getElementById('startBtn');
keyboard = {};

//Player array to store player
player = {
    height: 0.8,
    speed: 0.025,
	weapon: "pistol",
    coolDown: 0
};

//Bullet class for gun Bullets
class Bullet {
	//Constructor taking in positions and direction
    constructor (x, y, z, dir) {
        this.dir = dir;
        this.mesh = models.bullet.mesh.clone();
        this.ttl = 500;
        this.mesh.position.set(
            x - Math.sin(dir - Math.PI / 4) * 0.15,
            y - 0.025,
            z - Math.cos(dir - Math.PI / 4) * 0.15
        );
		this.mesh.rotation.x -= Math.PI / 2;
        this.mesh.rotation.y = dir;
        scene.add(this.mesh);
    }
		//Updating position
    update () {
        this.mesh.position.set(
            this.mesh.position.x - Math.sin(this.dir) * 0.1,
            this.mesh.position.y,
            this.mesh.position.z - Math.cos(this.dir) * 0.1
        );
        this.ttl--;
        if (this.ttl === 0) {
            scene.remove(this.mesh);
            bullets.splice(bullets.indexOf(this), 1);
        }
    }
}
//Variable to track loaded resources
resourcesLoaded = false;

//Array that stores all our models that we'll be using
models = {
    pineTree: {
        obj: "models/treePine.obj",
        mtl: "models/treePine.mtl",
        mesh: null,
		castShadow: false,
		receiveShadow: false
    },
	snowyPineTree: {
        obj: "models/treePineSnow.obj",
        mtl: "models/treePineSnow.mtl",
        mesh: null,
		castShadow: false,
		receiveShadow: false
    },
	snowTree: {
        obj: "models/treePineSnowed.obj",
        mtl: "models/treePineSnowed.mtl",
        mesh: null,
		castShadow: false,
		receiveShadow: false
    },
    bigRock: {
        obj: "models/rockFormationLarge.obj",
        mtl: "models/rockFormationLarge.mtl",
        mesh: null,
		castShadow: true,
		receiveShadow: false
    },
    lightPost: {
        obj: "models/lightpost.obj",
        mtl: "models/lightpost.mtl",
        mesh: null,
		castShadow: true,
		receiveShadow: false
    },
	pistol: {
		obj: "models/pistol.obj",
        mtl: "models/pistol.mtl",
        mesh: null,
		castShadow: false,
		receiveShadow: true
	},
    bullet: {
        obj: "models/bullet.obj",
        mtl: "models/bullet.mtl",
        mesh: null,
		castShadow: false,
		receiveShadow: false
    }
};
//Array to store Meshes
meshes = {};
//function that initiates sound
 playSoundGun=function(){
	 //Audio LOader to load Audio
   const audioLoader = new THREE.AudioLoader();
  audioLoader.load("m4a1_s.mp3", function(buffer) {
    sound.setBuffer( buffer );
    sound.setVolume(0.5);
    sound.play();
  });
const listener = new THREE.AudioListener();
const sound = new THREE.Audio( listener );
  var source = listener.context.createBufferSource();
  source.connect(listener.context.destination);
  source.start();
}
//window.addEventListener('touchstart', playSound);
document.addEventListener('click', function (e) {
    if(started){//If mouse keys are clicked then play sound
        playSoundGun();
    }
});

init = function () {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
    loadingManager = new THREE.LoadingManager();//loading manager to handle items loading

    console.log("Loading content ...")
		//Setting up miniMap
    loadingManager.onLoad = onResourcesLoaded;
    cameraOrtho = new THREE.OrthographicCamera( - 0.5, 0.5 , 0.5, -0.5,  0.01, 10 );
    camera.add( cameraOrtho );

    scene.fog=new THREE.FogExp2(0x03544e,0.001);
    ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);
//Adding a PointLight to our Scene
    pointLight = new THREE.PointLight(0xffffff, 0.5, 50);
    pointLight.position.set(8, 12, 8);
    pointLight.castShadow = true;
    pointLight.shadow.camera.near = 0.1;
    pointLight.shadow.camera.far = 25;
    scene.add(pointLight);//Point light to cast shadows

    document.getElementById("info14").style.display = "none";


    //Load in all models
    for (let _key in models) {
        (function (key){
            let mtlLoader = new THREE.MTLLoader(loadingManager);
            mtlLoader.load(models[key].mtl, function (materials) {
                materials.preload();
                let objLoader = new THREE.OBJLoader(loadingManager);
                objLoader.setMaterials(materials);
                objLoader.load(models[key].obj, function (mesh) {
                    mesh.traverse(function (node) {
                        if (node instanceof THREE.Mesh) {
                            node.castShadow = models[key].castShadow;
                            node.receiveShadow = models[key].receiveShadow;
                        }
                    });
                    models[key].mesh = mesh;
                });
            });
        })(_key);
    }
//Initialize our skybox that represents environment
    skybox = new THREE.Mesh(
			//Using a CubeGeometry/CubeMap for SkyBox
        new THREE.CubeGeometry(1000, 1000, 1000),
        new THREE.MeshFaceMaterial([
            new THREE.MeshBasicMaterial({
                map: new THREE.TextureLoader(loadingManager).load('img/hot_ft.png'),
                side: THREE.DoubleSide
            }),
            new THREE.MeshBasicMaterial({
                map: new THREE.TextureLoader(loadingManager).load('img/hot_bk.png'),
                side: THREE.DoubleSide
            }),
            new THREE.MeshBasicMaterial({
                map: new THREE.TextureLoader(loadingManager).load('img/hot_up.png'),
                side: THREE.DoubleSide
            }),
            new THREE.MeshBasicMaterial({
                map: new THREE.TextureLoader(loadingManager).load('img/hot_dn.png'),
                side: THREE.DoubleSide
            }),
            new THREE.MeshBasicMaterial({
                map: new THREE.TextureLoader(loadingManager).load('img/hot_rt.png'),
                side: THREE.DoubleSide
            }),
            new THREE.MeshBasicMaterial({
                map: new THREE.TextureLoader(loadingManager).load('img/hot_lf.png'),
                side: THREE.DoubleSide
            })
        ])
    );

    scene.add(skybox);//Adding skybox to our Scene




//Adiing a floor of PlaneGeometry
    floor = new THREE.Mesh(
        new THREE.PlaneGeometry(1000, 1000, 10, 10),
        new THREE.MeshPhongMaterial({color:0xff0000})
    );
		//Flipping it horizontally
    floor.rotation.x -= Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

//Adding a portalLight
		portalLight = new THREE.PointLight(0x062d89, 30, 6000, 1.7);
		portalLight.position.set(0,5200,0);
		scene.add(portalLight);
    particleSetup();
    _LoadAnimatedModel();
  /*  loadModel('fbx_models/girl.fbx')
    loadModel('fbx_models/Thriller Idle.fbx')
    loadModel1('fbx_models/Zombie biting.fbx')
    loadModel1('fbx_models/dancer.fbx')
    loadModel2('fbx_models/Walking.fbx')
    loadModel2('fbx_models/Zombie Run.fbx')
    loadModel1('fbx_models/girl.fbx')
    loadModel4('fbx_models/Walking.fbx')
    loadModel2('fbx_models/Zombie Run.fbx')
    loadModel4('fbx_models/Walking.fbx')
    loadModel4('fbx_models/Zombie biting.fbx')
*/



//Adding a flash for rain
    flesh= new THREE.PointLight(0x062d89,30,500,1.7);
    flesh.position.set(200,300,100);
    scene.add(flesh);
//Adding a portlight
      portalLight = new THREE.PointLight(0x062d89, 30, 6000, 1.7);
      portalLight.position.set(0,5200,0);
      scene.add(portalLight);
//Rain Geometry a vector3
    rainGeo = new THREE.Geometry();
    for(let i =0;i<rainCount;i++){
			//Randomly assign raindrops
      rainDrop = new THREE.Vector3(
        Math.random()*400 - 200,
        Math.random()*500 - 250,
        Math.random()*400 - 200
      );
			//RainDrop Velocuty
      rainDrop.velocity = {};
      rainDrop.velocity = 0;
    rainGeo.vertices.push(rainDrop);
    }
    rainMaterial = new THREE.PointsMaterial({
      color:0xaaaaaa,
      size:0.1,
      transparent:true,
    });
    rain = new THREE.Points(rainGeo,rainMaterial);
    scene.add(rain);

  /*  let loader = new THREE.TextureLoader();
    loader.load("smoke-png-13194.png",function(texture){

      cloudGeo = new THREE.PlaneBufferGeometry(10000,10000);
      cloudMaterial = new THREE.MeshLambertMaterial({
        map:texture,
        transparent: true
      });
      //Randomly adding cloud to the scene

      for(let p=0;p<25;p++){
        let cloud = new THREE.Mesh(cloudGeo,cloudMaterial);
        cloud.position.set(
          Math.random()*800 - 400,
          500,
          Math.random()*500-450,
        );
        cloud.rotation.x =1.16;
        cloud.rotation.y=-0.12;
        cloud.rotation.z=Math.random()*360;
        cloud.material.opacity =0.6;
        cloudParticles.push(cloud);
        scene.add(cloud);
      }

    });*/



//initializing PointerLock Controls
    controls = new THREE.PointerLockControls(camera);
  	scene.add(controls.getObject());
    controls.getObject().position.set(0, player.height, -4.5);
    controls.getObject().lookAt(new THREE.Vector3(0, player.height, 0));
    controls.getObject().rotation.y = Math.PI;

//Rendering scene
    renderer = new THREE.WebGLRenderer({ antialiasing: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setClearColor(scene.fog.color);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;
    document.body.appendChild(renderer.domElement);
    animate();
};


///Load Environment
function loadEnvironment(LoadingManager){
	const game = this;
loader=new THREE.FBXLoader();
	loader.load( "environment.fbx", function ( object ) {
		game.scene.add(object);
    object.scale.set(0.01,0.01,0.01);
		object.receiveShadow = true;
		object.name = "Environment";

		object.traverse( function ( child ) {
			if ( child.isMesh ) {
				if (child.name.includes('main')){
					child.castShadow = true;
					child.receiveShadow = true;
				}else if (child.name.includes('proxy')){
					child.material.visible = false;
				}

			}
		} );

		game.loadNextAnim(loader);
	} );
}


//

onResourcesLoaded = function () {
    console.log("Content loaded!");
    document.getElementById("load-screen").classList.add("hidden");
    resourcesLoaded = true;

	//Player gun
	meshes["gun"] = models[player.weapon].mesh.clone();
	meshes["gun"].scale.set(3, 3, 3);
	scene.add(meshes["gun"]);

    meshes["lightPost"] = models.lightPost.mesh.clone();
    scene.add(meshes["lightPost"]);
    lightPost = new THREE.PointLight(0xffffff, 0.3, 5);
    lightPost.position.set(0, 3, 0);
    lightPost.castShadow = true;
    lightPost.shadow.camera.near = 0.1;
    lightPost.shadow.camera.far = 25;
    scene.add(lightPost);

    meshes["bigRock1"] = models.bigRock.mesh.clone();
    meshes["bigRock1"].position.set(2, 0, -3);
    scene.add(meshes["bigRock1"]);
    meshes["bigRock2"] = models.bigRock.mesh.clone();
    meshes["bigRock2"].position.set(-2, 0, 3);
    meshes["bigRock2"].rotation.y += Math.PI;
    scene.add(meshes["bigRock2"]);
    loadEnvironment();

	}

//Setting up particles for portal
	function particleSetup() {
	            let loader = new THREE.TextureLoader();//Texture Loader
	            loader.load("./smoke-png-13194.png", function (texture){
	                portalGeo = new THREE.PlaneBufferGeometry(35,35);

	                portalMaterial = new THREE.MeshStandardMaterial({
	                    map:texture,
	                    transparent: true
	                });
	                smokeGeo = new THREE.PlaneBufferGeometry(10,10);//Plane buffer for particles

	                smokeMaterial = new THREE.MeshStandardMaterial({
	                    map:texture,
	                    transparent: true
	                });
	                for(let p=880;p>250;p--) {
	                    let particle = new THREE.Mesh(portalGeo,portalMaterial);//Create Particle Mesh
	                    particle.position.set(
	                        0.5 * p * Math.cos((4 * p * Math.PI) / 180),
	                        0.5 * p * Math.sin((4 * p * Math.PI) / 180),
	                        0.1 * p
	                    );
	                    particle.rotation.z = Math.random() *360;
	                    portalParticles.push(particle);

	                    scene.add(particle);
                        particle.rotation.x+=Math.PI/2;
											particle.position.set(0,50,-50);
	                }
	                for(let p=0;p<40;p++) {
	                    let particle = new THREE.Mesh(smokeGeo,smokeMaterial);
	                    particle.position.set(
	                        Math.random() * 1000-500,
	                        Math.random() * 400-200,
	                        25
	                    );
	                    particle.rotation.z = Math.random() *360;
	                    particle.material.opacity = 0.6;
	                    portalParticles.push(particle);
	                    scene.add(particle);
											particle.position.set(0,90,0);
	                }
	                clock = new THREE.Clock();
	                animate();

	            });
	        }


            function loadModel(file) {
                var loader = new THREE.FBXLoader();
                loader.load(file, function (object) {
                  object.mixer = new THREE.AnimationMixer(object);
                  object.scale.multiplyScalar(0.005);
                  mixers.push(object.mixer);
                  var action = object.mixer.clipAction(object.animations[0]);
                  action.play();
                  object.traverse(function (child) {
                    if (child.isMesh) {
                      child.castShadow = true;
                      child.receiveShadow = true;
                    }
                  });

                 for(let p=0;p<20000;p++){
                  object.position.set(-10,
                  0,
                  Math.random(),

                  );
                  object.rotation.x =0;
          object.rotation.y= Math.random();
          object.rotation.z=0;
          scene.add(object);
                 }

                  object.updateMatrix();
                });

              }

              function loadModel1(file1) {
                var loader = new THREE.FBXLoader();
                loader.load(file1, function (object) {
                  object.mixer = new THREE.AnimationMixer(object);
                  object.scale.multiplyScalar(0.005);
                  mixers.push(object.mixer);
                  var action = object.mixer.clipAction(object.animations[0]);
                  action.play();
                  object.traverse(function (child) {
                    if (child.isMesh) {
                      child.castShadow = true;
                      child.receiveShadow = true;
                    }
                  });
                  scene.add(object);
                  object.position.x = -8;
                  object.position.z = 1.5;
                  object.rotation.set( 0.0, 3.5, 0.0 );
                  //object.position.z += speed * delta;
                  object.updateMatrix();
                });

              }

              function loadModel2(file2) {
                var loader = new THREE.FBXLoader();
                loader.load(file2, function (object) {
                  object.mixer = new THREE.AnimationMixer(object);
                  object.scale.multiplyScalar(0.005);
                  mixers.push(object.mixer);
                  var action = object.mixer.clipAction(object.animations[0]);
                  action.play();
                  object.traverse(function (child) {
                    if (child.isMesh) {
                      child.castShadow = true;
                      child.receiveShadow = true;
                    }
                  });
                  scene.add(object);
                  object.position.x = -9;
                  object.position.z = 1.7;
                  object.rotation.set( 0.0, 3.5, 0.0 );
                  //object.position.z += speed * delta;
                  object.updateMatrix();
                });

              }

              function loadModel4(file4) {
                var loader = new THREE.FBXLoader();
                loader.load(file4, function (object) {
                  object.mixer = new THREE.AnimationMixer(object);
                  object.scale.multiplyScalar(0.005);
                  mixers.push(object.mixer);
                  var action = object.mixer.clipAction(object.animations[0]);
                  action.play();
                  object.traverse(function (child) {
                    if (child.isMesh) {
                      child.castShadow = true;
                      child.receiveShadow = true;
                    }
                  });
                  scene.add(object);
                  object.position.x = -7.5;
                  object.rotation.set( 0.0, 3.5, 0.0 );
                  //object.position.z += speed * delta;
                  object.updateMatrix();
                });

              }

          _LoadAnimatedModel=function() {
              const loader = new THREE.FBXLoader();

              loader.load('mremireh_o_desbiens.fbx', (fbx) => {
                fbx.scale.setScalar(0.1);
                fbx.traverse(c => {
                  c.castShadow = true;
                });

                const params = {
                  target: fbx,
                  camera: this._camera,
                }

                const anim = new FBXLoader();

                anim.load('./models/punch.fbx', (anim) => {
                  const m = new THREE.AnimationMixer(fbx);
                  this._mixers.push(m);
                  const idle = m.clipAction(anim.animations[0]);
                  idle.play();
                });
                this._scene.add(fbx);
                fbx.position.set(0,0,0);
              });
            }


animate = function () {


    cloudParticles.forEach(p => {
        p.rotation.z -=0.002;
      });


      if(Math.random() > 0.93 || flesh.power >100){
        if(flesh.power <100)
        flesh.position.set(
          Math.random()*400,
          300 + Math.random()*200,
          100
        );
        flesh.power = 60 + Math.random()*500;
      }



     rainGeo.vertices.forEach(p =>{
        p.velocity -= 0.1 + Math.random()*0.1;
        p.y += p.velocity;
        if(p.y<-200){
          p.y =200;
          p.velocity = 0;
        }
      } );
      rainGeo.verticesNeedUpdate = true;



    if (resourcesLoaded == false && !paused) {
        requestAnimationFrame(animate);
        return;
    }
		let delta = clock.getDelta();
	            portalParticles.forEach(p => {
	                p.rotation.z -= delta *1.5;
	            });
	            smokeParticles.forEach(p => {
	                p.rotation.z -= delta *0.2;
	            });
	            if(Math.random() > 0.9) {
	                portalLight.power =350 + Math.random()*500;
	            }

                if(!paused){
                    requestAnimationFrame(animate);
                }

                if (mixers.length > 0) {
                    zdelta = clock.getDelta();
                    for (var i = 0; i < mixers.length; i++) {

                      mixers[i].update(delta);
                      //object.position.z += speed * delta;
                     }

                  }

    for (let bullet of bullets) {
        bullet.update();
    }
    if (keyboard[87]) { //W key
        controls.getObject().position.x -= Math.sin(controls.getObject().rotation.y) * player.speed;
        controls.getObject().position.z -= Math.cos(controls.getObject().rotation.y) * player.speed;
    }
    if (keyboard[83]) { //S key
        controls.getObject().position.x += Math.sin(controls.getObject().rotation.y) * player.speed / 2;
        controls.getObject().position.z += Math.cos(controls.getObject().rotation.y) * player.speed / 2;
    }
    if (keyboard[65]) { //A key
        controls.getObject().position.x += Math.sin(controls.getObject().rotation.y - Math.PI / 2) * player.speed / 2;
        controls.getObject().position.z += Math.cos(controls.getObject().rotation.y - Math.PI / 2) * player.speed / 2;
    }
    if (keyboard[68]) { //D key
        controls.getObject().position.x += Math.sin(controls.getObject().rotation.y + Math.PI / 2) * player.speed / 2;
        controls.getObject().position.z += Math.cos(controls.getObject().rotation.y + Math.PI / 2) * player.speed / 2;
    }

    if(keyboard[67]){//C key

    }
skybox.rotation.y += 0.001;

	//Position gun in front of player
	meshes["gun"].position.set(
		controls.getObject().position.x - Math.sin(controls.getObject().rotation.y - Math.PI / 4) * 0.3,
		controls.getObject().position.y - 0.1+Math.sin(delta)*0.04,
		controls.getObject().position.z - Math.cos(controls.getObject().rotation.y - Math.PI / 4) * 0.3
	);
	meshes["gun"].rotation.y = controls.getObject().rotation.y + Math.PI;
    meshes["gun"].rotation.x = controls.getObject().rotation.x;
    meshes["gun"].rotation.z = controls.getObject().rotation.z;
    if (player.coolDown > 0) {
        player.coolDown--;
    }
    if (keyboard[16]) {
        controls.getObject().position.y = player.height / 2;
        player.speed = 0.0125;
    } else {
        controls.getObject().position.y = player.height;
        player.speed = 0.025;
    }


    renderer.render(scene, camera);
    renderer.setClearColor( 0x000000 );

     renderer.setViewport( 0, 0, window.innerWidth, window.innerHeight );

     renderer.render( scene, camera );

     renderer.setClearColor( 0x333333 );

     renderer.clearDepth();

    	renderer.setScissorTest( true );

     renderer.setScissor( 16, window.innerHeight - insetHeight - 16, insetWidth, insetHeight );
     renderer.setViewport( 16, window.innerHeight - insetHeight - 16, insetWidth, insetHeight );

   	renderer.render( scene, cameraOrtho );

     renderer.setScissorTest( false );

};




window.addEventListener("keydown", function (e) {
    console.log("keyboardown"+e.keyCode);
    keyboard[event.keyCode] = true;
    /*if (e.keyCode==87) { //W key
        controls.getObject().position.x -= Math.sin(controls.getObject().rotation.y) * player.speed;
        controls.getObject().position.z -= Math.cos(controls.getObject().rotation.y) * player.speed;
    }
    if (e.keyCode==83) { //S key
        controls.getObject().position.x += Math.sin(controls.getObject().rotation.y) * player.speed / 2;
        controls.getObject().position.z += Math.cos(controls.getObject().rotation.y) * player.speed / 2;
    }
    if (keyboard[65]) { //A key
        controls.getObject().position.x += Math.sin(controls.getObject().rotation.y - Math.PI / 2) * player.speed / 2;
        controls.getObject().position.z += Math.cos(controls.getObject().rotation.y - Math.PI / 2) * player.speed / 2;
    }
    if (keyboard[68]) { //D key
        controls.getObject().position.x += Math.sin(controls.getObject().rotation.y + Math.PI / 2) * player.speed / 2;
        controls.getObject().position.z += Math.cos(controls.getObject().rotation.y + Math.PI / 2) * player.speed / 2;
    }*/
});

window.addEventListener("keyup", function (e) {

    console.log("keyboarda"+e.keyCode);
    //EventListener for the [P] key which pauses or resumes the game depending on its state.
    if(e.keyCode==80){
        console.log("keyboarda"+e.keyCode);
        if(paused && started){
            //animate=true;
            document.getElementById("pauseMenu").style.display = "none";
            document.getElementById("pause").classList.remove("hidden");
            document.getElementById("info14").style.display = "block";
            document.getElementById("pause").style.cursor = "default";
            console.log("keyboard[76]"+keyboard[80]);
            console.log("keyboard[9009]"+keyboard[80]);
            //document.getElementById("pauseMenu").style.display = "none";
            paused = false;
            requestAnimationFrame(animate);
            //animate();
            //init();
        }else if(!paused && started){

            document.getElementById("pauseMenu").style.display = "block";
            document.getElementById("close").style.display = "none";
            document.getElementById("info1").style.display = "none";
            document.getElementById("info14").style.display = "none";
            document.getElementById("pause").classList.add("hidden");

            paused = true;
        }
    }

    //EventListener when the [C] key is pressed which closes and opens the game info depending on its state.
    if(e.keyCode==67){
        console.log("keyboarda"+e.keyCode);
        if(info && started){

             document.getElementById("info14").style.display = "block";
             document.getElementById("info1").style.display = "none";
             document.getElementById("close").style.display = "none";

            info = false;

        }else if(!info && started){

            document.getElementById("info14").style.display = "none";
            document.getElementById("info1").style.display = "block";
            document.getElementById("close").style.display = "block";

            info = true;
        }
    }
    keyboard[event.keyCode] = false;
});


window.addEventListener("click", function (e) {
    if(!paused && started){
    if (player.coolDown == 0) {
        bullets.push(new Bullet(
            controls.getObject().position.x,
            controls.getObject().position.y,
            controls.getObject().position.z,
            controls.getObject().rotation.y
        ));
        player.coolDown = 10;
    }
}
});
window.addEventListener("resize", function (e) {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    insetWidth = window.innerHeight / 4;
  insetHeight = window.innerHeight / 4;

 cameraOrtho.aspect = insetWidth / insetHeight;
 cameraOrtho.updateProjectionMatrix();

});

//Pausing the game anytime during play.
pauseGame = function(){

    document.getElementById("pauseMenu").style.display = "block";
    document.getElementById("close").style.display = "none";
    document.getElementById("info1").style.display = "none";
    document.getElementById("info14").style.display = "none";
    document.getElementById("pause").classList.add("hidden");
    paused = true;
}

//Resuming the game after pausing it
resumeGame = function(){

    //animate=true;
    document.getElementById("pauseMenu").style.display = "none";
    document.getElementById("info14").style.display = "block";
    document.getElementById("pause").classList.remove("hidden");
    console.log("keyboard[76]"+keyboard[80]);
    console.log("keyboard[76]"+keyboard[80]);
    //document.getElementById("pauseMenu").style.display = "none";
    paused = false;
    requestAnimationFrame(animate);
    //animate();
    //init();
}

//restarting the game from any position during gameplay
restartGame = function(){
    window.location.reload();
}

//Starting the game from start menu
startGame = function(){

    document.getElementById("startScreen1").classList.add("hidden");
    document.getElementById("pause").classList.remove("hidden");
   // document.getElementById("info1").classList.remove("hidden");
    //init();
    //requestAnimationFrame(animate);
    started =true;
}

//Quits the game and goes back to Start Menu
quitGame = function(){


    location.href="index.html"
   /* console.log("clear Render")
    paused = true;

	scene.add(controls.getObject());
    controls.getObject().position.set(0, player.height, -4.5);
    controls.getObject().lookAt(new THREE.Vector3(0, player.height, 0));
    controls.getObject().rotation.y = Math.PI;


    renderer.render(scene,camera)


*/

    //skybox.dispose()
    //var obj = renderer.getSize();
    /*while(scene.children.length > 0){
        scene.remove(scene.children[0]);
    }

    scene.clear();*/

    //init();
    //requestAnimationFrame(animate);


    /*
    var to_remove = [];

    scene.traverse ( function( child ) {
        if ( child instanceof THREE.Mesh && !child.userData.keepMe === true ) {
            to_remove.push( child );
         }
    } );

    for ( var i = 0; i < to_remove.length; i++ ) {
        scene.remove( to_remove[i] );
    }
    */


}
//function for quit confirmation
confirmQuit = function(){
    document.getElementById("quitMenu").style.display = "block";
    document.getElementById("pauseMenu").style.display = "none";

}

//Function called when user decides not to quit the game...
cancelQuit = function(){
    document.getElementById("quitMenu").style.display = "none";
    document.getElementById("pauseMenu").style.display = "block";
}

//Closing the information overlay
closeInfo = function(){

    document.getElementById("close").style.display = "none";
    document.getElementById("info1").style.display = "none";
    document.getElementById("info14").style.display = "block";

}
//Opening information overlay
gameInfo = function(){
    document.getElementById("info14").style.display = "none";
    document.getElementById("info1").style.display = "block";
    document.getElementById("close").style.display = "block";
}
/*var gameObj = "Hey gamer, welcome to Shooter. The game objective is" +
 "pretty simple, Kill the zombies before they kill you. Yes, that simple." +
  "Here is how it goes, the zombies will come your way, whether you decide " +
  "to run, hide or I don't know what, they will find you and they will kill you." +
  "The more you run, the more zombies there'll be and trust me you don't wanna deal" +
  "with hundreds and hundres of zombies, so kill as much as you can as quickly as you can" +
  "under the specified time period";*/
init();
