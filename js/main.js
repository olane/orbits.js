$(document).ready(function(){

    var ids = ['wrap'];
    DOM = {};
    for (var i = 0; i < ids.length; i++) {
        id = ids[i];
        DOM[id] = $('#' + id);
    }


    var scaleDistances = 20;
    var scaleSizes = 0.2;
    var paused = false;
    var previousTime = new Date().getTime();
    var simulationTime = 0;
    var simulationSpeed = 0.05;
    var lastParticleSpawn = new Date().getTime();

    
    var sunPos = new THREE.Vector3(0, 0, 0);

    var planets = [];

    var planetParams = new Array();

    var stats;

    var renderer, raycaster, projector;

    var mouse = new THREE.Vector2(), INTERSECTED;

    /*
    a = semimajor axis, AU
    e = eccentricity
    i = inclination, radians
    L = longitude of ascending node, degrees
    w = argument of perihelion, degrees
    T = time of perihelion passage, Julian date
    */
    planetParams[0] = {
        name: "Mercury",
        radius: 2.4,
        colour: 0xFFA500,
        a: 0.38709930, 
        e: 0.2056376, 
        i: 0.122250601, 
        L: 48.3194793, 
        w: 29.1527676, 
        T: 2454755.654
    }
    planetParams[1] = {
        name: "Venus",
        radius: 6,
        colour: 0xFCD59C,
        a: 0.72333601, 
        e: 0.0067730, 
        i: 0.0592470341, 
        L: 76.6548368, 
        w: 54.9478720, 
        T: 2454657.866
    }
    planetParams[2] = {
        name: "Earth",
        radius: 6.3,
        colour: 0x336699,
        a: 1.00000312, 
        e: 0.0167072, 
        i: -0.0000206140838, 
        L: 0.0000000, 
        w: 102.9667920, 
        T: 2454836.12
    }
    planetParams[3] = {
        name: "Mars",
        radius: 3.3,
        colour: 0xFFA500,
        a: 1.52371200, 
        e: 0.0934012, 
        i: 0.0322704258, 
        L: 49.5331933, 
        w: 286.5631954, 
        T: 2454254.482
    }
    planetParams[4] = {
        name: "Jupiter",
        radius: 10,
        colour: 0xFFB500,
        a: 5.20287655, 
        e: 0.0483743, 
        i: 0.0227631339, 
        L: 100.4923411, 
        w: 274.2552763, 
        T: 2451305.445
    }
    planetParams[5] = {
        name: "Saturn",
        radius: 9,
        colour: 0xFFC533,
        a: 9.53656333, 
        e: 0.0538159, 
        i: 0.0433917859, 
        L: 113.6364296, 
        w: 338.9247211, 
        T: 2452816.300
    }
    planetParams[6] = {
        name: "Uranus",
        radius: 7,
        colour: 0x5588BB,
        a: 19.1889880, 
        e: 0.0472535, 
        i: 0.0134812565, 
        L: 74.0207436, 
        w: 96.9702770, 
        T: 2439410.280
    }
    planetParams[7] = {
        name: "Neptune",
        radius: 7,
        colour: 0x6699CC,
        a: 30.0699464, 
        e: 0.0085951, 
        i: 0.030893642, 
        L: 131.7837677, 
        w: 273.1519618, 
        T: 2408052.845
    }
    planetParams[8] = {
        name: "Pluto",
        radius: 1.2,
        colour: 0x114477,
        a: 39.4820883, 
        e: 0.2488320, 
        i: 0.29914972, 
        L: 110.3028711, 
        w: 113.7623866, 
        T: 2447799.934
    }


    function init(){

        scene = new THREE.Scene();
        projector = new THREE.Projector();
        raycaster = new THREE.Raycaster();

        camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 10000);
        camera.rotation.order = 'XYZ';
        scene.add(camera);

        renderer = new THREE.WebGLRenderer({
            antialias: true
        });

        renderer.shadowMapEnabled = true;
        renderer.shadowMapSoft = true;

        onWindowResize();

        DOM.wrap.append(renderer.domElement);

        $('canvas').css({background : '#000'});

        populatePlanets();
        populateSun();
        updateCamera();


        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        stats.domElement.style.zIndex = 100;
        DOM.wrap.append( stats.domElement );

        document.addEventListener( 'mousemove', onDocumentMouseMove, false );
        window.addEventListener( 'resize', onWindowResize, false );

        populateParticles();
        
    }

    function onDocumentMouseMove( event ) {

        event.preventDefault();

        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    }

    function onWindowResize() {

        var border = 5;

        camera.aspect = (window.innerWidth - border) / (window.innerHeight - border);
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth - border, window.innerHeight - border);

    }

    var particleSystem;
    var particlePeriod = 100; //milliseconds
    var particleCount = 5000;
    var nextVictimParticle = 0; //index of the next particle to be repositioned

    function populateParticles(){

        // create the particle variables
        var pGeometry = new THREE.Geometry();
        var pMaterial = new THREE.ParticleSystemMaterial({
            color: 0xFFFFFF,
            size: 0.1
        });


        // now create the individual particles
        for (var p = 0; p < particleCount; p++) {

            // create a new particle inside the sun (not visible yet)
            var particle = sunPos;

            // add it to the geometry
            pGeometry.vertices.push(particle);
        }

        pGeometry.dynamic = true;

        // create the particle system
        particleSystem = new THREE.ParticleSystem(pGeometry, pMaterial);

        // add it to the scene
        scene.add(particleSystem);
    }


    function populatePlanets(){
        
        for(var i = 0; i < planetParams.length; i++){
            planets.push(new Planet(planetParams[i]));
        }

    }

    function populateSun(){
        var radius = 2;
        geometry = new THREE.SphereGeometry(radius, 100, 100);
        material = new THREE.MeshBasicMaterial({color: 0xFFFF00});

        mesh = new THREE.Mesh(geometry, material);
        
        scene.add(mesh);

        var sunLight = new THREE.PointLight();
        scene.add(sunLight);
        var light = new THREE.AmbientLight( 0x101010 );
        scene.add(light);
    }


    function updatePlanets(){
        for(var i = 0; i < planets.length; i++){
            planets[i].updatePlanet();
        }
    }

    function updateParticles(){
        for(var i = 0; i < planets.length; i++){
            //reposition a particle
            particleSystem.geometry.vertices[nextVictimParticle] = planets[i].mesh.position.clone();
            nextVictimParticle = (nextVictimParticle + 1) % (particleCount);
        }
        particleSystem.geometry.dynamic = true;
        particleSystem.geometry.verticesNeedUpdate = true;
    }


    var fov = 70;
    var cameraTilt = Math.PI/3;
    var cameraDistance = 120;
    var cameraRotation = 0;

    var cameraTiltMax = Math.PI - 0.01;
    var cameraTiltMin = 0.01;

    var cameraTiltAccel = 0.01;
    var cameraTiltSpeed = 0;
    var cameraTiltFriction = 0.15;

    var cameraDistAccel = 0.15;
    var cameraDistSpeed = 0;
    var cameraDistFriction = 0.05;
    var cameraMinDist = 5;

    var cameraRotationSpeed = 0;
    var cameraRotationFriction = 0.05;
    var cameraRotationAccel = 0.01;

    function updateCamera(x){

        // TILT
        cameraTilt += cameraTiltSpeed;
        cameraTiltSpeed *= (1-cameraTiltFriction);

        if(cameraTilt < cameraTiltMin) {
            cameraTilt = cameraTiltMin; 
            cameraTiltSpeed = 0;
        }
        else if(cameraTilt > cameraTiltMax) {
            cameraTilt = cameraTiltMax; 
            cameraTiltSpeed = 0;
        }

        //ROTATION
        cameraRotation += cameraRotationSpeed;
        cameraRotationSpeed *= (1-cameraRotationFriction);

        //DISTANCE
        cameraDistance += cameraDistSpeed;
        cameraDistSpeed *= (1-cameraDistFriction);

        if(cameraDistance < cameraMinDist ) {cameraDistance = cameraMinDist; cameraDistSpeed = 0;};

        camera.position.z = Math.cos(-cameraTilt) * cameraDistance;
        camera.position.y = Math.sin(-cameraTilt) * Math.sin(cameraRotation) * cameraDistance ;
        camera.position.x = Math.sin(-cameraTilt) * Math.cos(cameraRotation) * cameraDistance ;

        camera.up.set( 0, 0, 1 );
        camera.lookAt(sunPos);

        for(var i = 0; i < planets.length; i++){
            document.getElementById(planets[i].parameters.name).style.top = 
                        toXYCoords(planets[i].mesh.position).y + "px";

            document.getElementById(planets[i].parameters.name).style.left = 
                        toXYCoords(planets[i].mesh.position).x + "px";
        }
    };

    function run(time){

        var currentTime = new Date().getTime();
        var elapsedTime = currentTime - previousTime;
        previousTime = currentTime;


        requestAnimationFrame(run);

        render();

        if (!paused) { 
            particleSystem.geometry.verticesNeedUpdate = true;

            simulationTime += elapsedTime * simulationSpeed;

            if(currentTime - lastParticleSpawn > particlePeriod){
                lastParticleSpawn = currentTime;
                updateParticles();
            }
            updatePlanets();
        }

        updateCamera();

        stats.update();
    }

    function render(){
        renderer.render(scene, camera);
    };


    var Planet = function(parameterObj){

        this.parameters = parameterObj;

        this.mesh = addSphere(this.parameters.radius * scaleSizes, this.parameters.colour);

        this.textLabel = document.createElement('div');
        this.textLabel.style.position = 'absolute';
        this.textLabel.style.color = 'white';
        this.textLabel.id = this.parameters.name;
        this.textLabel.innerHTML = this.parameters.name;

        document.getElementsByTagName("body")[0].appendChild(this.textLabel);

        this.updatePlanet = function(){
            /*
            a = semimajor axis, AU
            e = eccentricity
            i = inclination, radians
            L = longitude of ascending node, degrees
            w = argument of perihelion, degrees
            T = time of perihelion passage, Julian date
            */
            var a = this.parameters.a;
            var e = this.parameters.e;
            var i = this.parameters.i;
            var L = this.parameters.L;
            var w = this.parameters.w;
            var T = this.parameters.T;

            //Find the period, P, of the orbit in days.
            var P = 365.256898326 * Math.pow(a, 1.5);

            //Find the mean anomaly, m, of the orbit at time 'simulationTime'.
            var m = 2 * Math.PI * (simulationTime - T) / P;

            //Adjust m to the interval [0, 2 pi).
            
            m = m % (2 * Math.PI);

            //Find the eccentric anomaly, u. (Danby's method is used here.)

            var U1 = m;
            
            var U0, F0, F1, F2, F3, D1, D2, D3;

            do{
                U0 = U1
                F0 = U0 - e * Math.sin(U0) - m
                F1 = 1 - e * Math.cos(U0)
                F2 = e * Math.sin(U0)
                F3 = e * Math.cos(U0)
                D1 = -F0 / F1
                D2 = -F0 / ( F1 + D1 * F2 / 2 )
                D3 = -F0 / ( F1 + D1 * F2 / 2 + Math.pow(D2, 2) * F3 / 6 )
                U1 = U0 + D3
            }
            while(Math.abs(U1-U0) < (0.000000000000001));
            
            var u = U1;
            
            //Find the canonical (triple prime) heliocentric position vector.
            
            var x3 = a * (Math.cos(u) - e);
            var y3 = a * Math.sin(u) * Math.sqrt(1 - Math.pow(e, 2));
            var z3 = 0;
            
            //Rotate the triple-prime position vector by the argument of the perihelion, w.
            
            var x2 = x3 * Math.cos(w) - y3 * Math.sin(w);
            var y2 = x3 * Math.sin(w) + y3 * Math.cos(w);
            var z2 = z3;
            
            //Rotate the double-prime position vector by the inclination, i.
            
            var x1 = x2;
            var y1 = y2 * Math.cos(i);
            var z1 = y2 * Math.sin(i);
            
            //Rotate the single-prime position vector by the longitude of the ascending node, L.
            
            var x0 = x1 * Math.cos(L) - y1 * Math.sin(L);
            var y0 = x1 * Math.sin(L) + y1 * Math.cos(L);
            var z0 = z1;

            x0 *= scaleDistances;
            y0 *= scaleDistances;
            z0 *= scaleDistances;

            this.mesh.position.x = x0;
            this.mesh.position.y = y0;
            this.mesh.position.z = z0;

        }


    };


    function addSphere(radius, colour){
        geometry = new THREE.SphereGeometry(radius, 50, 50);
        //material = new THREE.MeshBasicMaterial({color: colour});
        material = new THREE.MeshLambertMaterial( { color: colour, shininess: 40 }  ) 

        mesh = new THREE.Mesh(geometry, material);
        
        scene.add(mesh);

        return mesh;
    };

    function addLight(x, y, z, type){
        type = type || 'directional';
        var light;
        switch(type){
            case 'directional':
                light = new THREE.DirectionalLight(0xffffff, 0.5);
                light.position.set(x, y, z);
                light.castShadow = true;
                break;
            case 'ambient':
                light = new THREE.AmbientLight();
                break;
        }
        
        scene.add(light);
        return light;
    };

    function toXYCoords (pos) {
        camera.updateMatrixWorld();
        var vector = projector.projectVector(pos.clone(), camera);
        vector.x = (vector.x + 1)/2 * window.innerWidth;
        vector.y = -(vector.y - 1)/2 * window.innerHeight;
        return vector;
    }

    var bindInputs = function(){
        key('up', function(){
            cameraTiltSpeed -= cameraTiltAccel;
        });

        key('down', function(){
            cameraTiltSpeed += cameraTiltAccel;
        });

        key('left', function(){
            cameraRotationSpeed -= cameraRotationAccel;
        });

        key('right', function(){
            cameraRotationSpeed += cameraRotationAccel;
        });

        key('a', function(){
            cameraDistSpeed -= cameraDistAccel;
        });

        key('z', function(){
            cameraDistSpeed += cameraDistAccel;
        });

        key('p', function(){
            paused = !paused;
        });

        key(',', function(){
            simulationSpeed *= 0.9;
        });

        key('.', function(){
            simulationSpeed *= 1/0.9;
        });
    };
    bindInputs();


    init();
    run();

});
