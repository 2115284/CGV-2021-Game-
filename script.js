


var scene,camera,renderer,mesh,controls,clock,portalParticles=[],smokeParticles=[];
var meshFloor;
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
		alert("Pointer lock error!");
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
		element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
		element.requestPointerLock();
	}, false);
} else {
	alert("Pointer lock error!");
}
 var startBtn = document.getElementById('startBtn');
keyboard = {};
player = {
    height: 0.8,
    speed: 0.025,
	weapon: "pistol",
    coolDown: 0
};


bullets = [];
class Bullet {
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
resourcesLoaded = false;
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
meshes = {};

 playSound=function(){
   const audioLoader = new THREE.AudioLoader();
  audioLoader.load("factory.ogg", function(buffer) {
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
window.addEventListener('touchstart', playSound);
document.addEventListener('click', playSound);

init = function () {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
    loadingManager = new THREE.LoadingManager();//loading manager to handle items loading
    console.log("Loading content ...")
    loadingManager.onLoad = onResourcesLoaded;
    scene.fog=new THREE.FogExp2(0x03544e,0.001);
    ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    pointLight = new THREE.PointLight(0xffffff, 0.5, 50);
    pointLight.position.set(8, 12, 8);
    pointLight.castShadow = true;
    pointLight.shadow.camera.near = 0.1;
    pointLight.shadow.camera.far = 25;
    scene.add(pointLight);//Point light to cast shadows



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

    skybox = new THREE.Mesh(
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

    scene.add(skybox);

    floor = new THREE.Mesh(
        new THREE.PlaneGeometry(1000, 1000, 10, 10),
        new THREE.MeshPhongMaterial({color:0xff0000})
    );
    floor.rotation.x -= Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);


		portalLight = new THREE.PointLight(0x062d89, 30, 6000, 1.7);
		portalLight.position.set(0,5200,0);
		scene.add(portalLight);
    particleSetup();
    _LoadAnimatedModel();
    controls = new THREE.PointerLockControls(camera);
	  scene.add(controls.getObject());
    controls.getObject().position.set(0, player.height, -4.5);
    controls.getObject().lookAt(new THREE.Vector3(0, player.height, 0));
    controls.getObject().rotation.y = Math.PI;


    renderer = new THREE.WebGLRenderer({ antialiasing: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setClearColor(scene.fog.color);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;
    document.body.appendChild(renderer.domElement);
    animate();
};


///Load Environment
loadEnvironment=function(LoadingManager){
	const game = this;
loader=new THREE.FBXLoader();
	loader.load( "/environment.fbx", function ( object ) {
		game.scene.add(object);
    object.scale.set(0.04,0.04,0.04);
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


	function particleSetup() {
	            let loader = new THREE.TextureLoader();
	            loader.load("./smoke-png-13194.png", function (texture){
	                portalGeo = new THREE.PlaneBufferGeometry(35,35);

	                portalMaterial = new THREE.MeshStandardMaterial({
	                    map:texture,
	                    transparent: true
	                });
	                smokeGeo = new THREE.PlaneBufferGeometry(10,10);

	                smokeMaterial = new THREE.MeshStandardMaterial({
	                    map:texture,
	                    transparent: true
	                });
	                for(let p=880;p>250;p--) {
	                    let particle = new THREE.Mesh(portalGeo,portalMaterial);
	                    particle.position.set(
	                        0.5 * p * Math.cos((4 * p * Math.PI) / 180),
	                        0.5 * p * Math.sin((4 * p * Math.PI) / 180),
	                        0.1 * p
	                    );
	                    particle.rotation.z = Math.random() *360;
	                    portalParticles.push(particle);

	                    scene.add(particle);
                        particle.rotation.x+=Math.PI/2;
											particle.position.set(0,50,0);
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
    if (resourcesLoaded == false) {
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
    requestAnimationFrame(animate);

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



		//this.renderer.render( this.scene, this.camera );



	//Position gun in front of player
	meshes["gun"].position.set(
		controls.getObject().position.x - Math.sin(controls.getObject().rotation.y - Math.PI / 4) * 0.3,
		controls.getObject().position.y - 0.1,
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
};

window.addEventListener("keydown", function (e) {
    keyboard[event.keyCode] = true;
});

window.addEventListener("keyup", function (e) {
    keyboard[event.keyCode] = false;
});

window.addEventListener("click", function (e) {
    if (player.coolDown == 0) {
        bullets.push(new Bullet(
            controls.getObject().position.x,
            controls.getObject().position.y,
            controls.getObject().position.z,
            controls.getObject().rotation.y
        ));
        player.coolDown = 10;
    }
});
window.addEventListener("resize", function (e) {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

init();
