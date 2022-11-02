












window.onload = function init()
{
	const canvas = document.getElementById( "gl-canvas" );
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	const renderer = new THREE.WebGLRenderer({canvas});
	renderer.setSize(canvas.width,canvas.height);

	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0xffffff);

	camera = new THREE.PerspectiveCamera(75,canvas.width / canvas.height,0.1, 1000);
	// camera.rotation.y = 45/180*Math.PI;
	camera.position.x = 300;
	camera.position.y = 50;
	camera.position.z = 0;

	const controls = new THREE.OrbitControls(camera, renderer.domElement);

	//2 - lignt 1
	// hlight = new THREE.AmbientLight (0x404040,10);
	hlight = new THREE.AmbientLight (0x1c1c1c,10);
	scene.add(hlight);

	//2 - lignt 2
	// light = new THREE.PointLight(0xc4c4c4,10);
	light = new THREE.PointLight(0x4c4c4c,10);
	light.position.set(0,3000,0);
	scene.add(light);

	//2 - lignt 3
	// light2 = new THREE.DirectionalLight(0xffffff, 8);
	light2 = new THREE.DirectionalLight(0xffffff, 8);
	light2.position.set(200,200,200);
	scene.add(light2);

	//==========================================================================
	//1 - render 3D model
	const loader = new THREE.GLTFLoader();
	loader.load('./medieval_modular_city_realistic/scene.gltf', function(gltf){
	  car = gltf.scene.children[0];
	  car.scale.set(4,4,4);
	  scene.add(gltf.scene);
	  animate();
	}, undefined, function (error) {
		console.error(error);
	});

	// const loader2 = new THREE.GLTFLoader();
	// loader2.load('./glTF/Archery_FirstAge_Level2.gltf', function(gltf){
	//   car = gltf.scene.children[0];
	//   car.scale.set(4,4,4);
	//   scene.add(gltf.scene);
	//   animate();
	// }, undefined, function (error) {
	// 	console.error(error);
	// });

	// const loader3 = new THREE.GLTFLoader();
	// loader3.load('./glTF/Archery_FirstAge_Level3.gltf', function(gltf){
	//   car = gltf.scene.children[0];
	//   car.scale.set(4,4,4);
	//   scene.add(gltf.scene);
	//   animate();
	// }, undefined, function (error) {
	// 	console.error(error);
	// });

	// const loader4 = new THREE.GLTFLoader();
	// loader4.load('./glTF/Archery_SecondAge_Level1.gltf', function(gltf){
	//   car = gltf.scene.children[0];
	//   car.scale.set(4,4,4);
	//   scene.add(gltf.scene);
	//   animate();
	// }, undefined, function (error) {
	// 	console.error(error);
	// });

	// const loader5 = new THREE.GLTFLoader();
	// loader5.load('./glTF/Archery_SecondAge_Level2.gltf', function(gltf){
	//   car = gltf.scene.children[0];
	//   car.scale.set(4,4,4);
	//   scene.add(gltf.scene);
	//   animate();
	// }, undefined, function (error) {
	// 	console.error(error);
	// });

	// const loader6 = new THREE.GLTFLoader();
	// loader6.load('./glTF/Archery_SecondAge_Level3.gltf', function(gltf){
	//   car = gltf.scene.children[0];
	//   car.scale.set(4,4,4);
	//   scene.add(gltf.scene);
	//   animate();
	// }, undefined, function (error) {
	// 	console.error(error);
	// });
	// //--------------------------------------------------------------------------
	// const loader7 = new THREE.GLTFLoader();
	// loader7.load('./glTF/Archery_SecondAge_Level3.gltf', function(gltf){
	//   car = gltf.scene.children[0];
	//   car.scale.set(4,4,4);
	//   scene.add(gltf.scene);
	//   animate();
	// }, undefined, function (error) {
	// 	console.error(error);
	// });

	// const loader8 = new THREE.GLTFLoader();
	// loader8.load('./glTF/Archery_SecondAge_Level3.gltf', function(gltf){
	//   car = gltf.scene.children[0];
	//   car.scale.set(4,4,4);
	//   scene.add(gltf.scene);
	//   animate();
	// }, undefined, function (error) {
	// 	console.error(error);
	// });

	// const loader9 = new THREE.GLTFLoader();
	// loader9.load('./glTF/Archery_SecondAge_Level3.gltf', function(gltf){
	//   car = gltf.scene.children[0];
	//   car.scale.set(4,4,4);
	//   scene.add(gltf.scene);
	//   animate();
	// }, undefined, function (error) {
	// 	console.error(error);
	// });

	// const loader10 = new THREE.GLTFLoader();
	// loader10.load('./glTF/Archery_SecondAge_Level3.gltf', function(gltf){
	//   car = gltf.scene.children[0];
	//   car.scale.set(4,4,4);
	//   scene.add(gltf.scene);
	//   animate();
	// }, undefined, function (error) {
	// 	console.error(error);
	// });

	// const loader11 = new THREE.GLTFLoader();
	// loader11.load('./glTF/Archery_SecondAge_Level3.gltf', function(gltf){
	//   car = gltf.scene.children[0];
	//   car.scale.set(4,4,4);
	//   scene.add(gltf.scene);
	//   animate();
	// }, undefined, function (error) {
	// 	console.error(error);
	// });

	// const loader12 = new THREE.GLTFLoader();
	// loader12.load('./glTF/Archery_SecondAge_Level3.gltf', function(gltf){
	//   car = gltf.scene.children[0];
	//   car.scale.set(4,4,4);
	//   scene.add(gltf.scene);
	//   animate();
	// }, undefined, function (error) {
	// 	console.error(error);
	// });




	//--------------------------------------------------------------------------

	
	//==========================================================================


	//3 - rotation with x-axis
	function animate(time) {
		const speed = 1

		time *= 0.001;  // convert time to seconds
		const rot = time * speed;
		// car.rotation.x = rot;
	
	   renderer.render(scene,camera);
	   requestAnimationFrame(animate);
	}

}



function render(time) {
    time *= 0.001;  // convert time to seconds

    cubes.forEach((cube, ndx) => {
      const speed = 1 + ndx * .1;
      const rot = time * speed;
      cube.rotation.x = rot;
      cube.rotation.y = rot;
    });

    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }

