class ShooterGame {
    constructor() {
        // Configuración básica
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.clock = new THREE.Clock();
        
        // Estado del juego
        this.gameStarted = false;
        this.score = 0;
        this.difficulty = 1;
        
        // Configuración del jugador
        this.player = {
            health: 100,
            ammo: 100,
            powerups: [],
            accuracy: 0,
            shotsHit: 0,
            shotsFired: 0
        };

        // Arrays para gestionar objetos del juego
        this.projectiles = [];
        this.targets = [];
        this.powerups = [];

        // Referencias DOM
        this.hudElement = document.getElementById('hud');
        this.scoreElement = document.getElementById('score');
        this.accuracyElement = document.getElementById('accuracy');
        this.levelElement = document.getElementById('level');
        this.startMenu = document.getElementById('startMenu');
        this.crosshair = document.querySelector('.crosshair');

        // Inicialización
        this.setupScene();
        this.setupLighting();
        this.setupControls();
        this.setupEventListeners();
    }

    setupScene() {
        // Configurar renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.getElementById('gameContainer').appendChild(this.renderer.domElement);
        
        // Configurar cámara
        this.camera.position.set(0, 2, 5);
        
        // Crear suelo
        const floorGeometry = new THREE.PlaneGeometry(50, 50);
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x444444,
            metalness: 0.5,
            roughness: 0.5
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Crear paredes
        this.createWalls();
    }

    createWalls() {
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
        const wallGeometry = new THREE.BoxGeometry(50, 10, 1);

        // Pared trasera
        const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
        backWall.position.set(0, 3, -25);
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        this.scene.add(backWall);

        // Pared izquierda
        const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.set(-25, 3, 0);
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        this.scene.add(leftWall);

        // Pared derecha
        const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.set(25, 3, 0);
        rightWall.castShadow = true;
        rightWall.receiveShadow = true;
        this.scene.add(rightWall);
    }

    setupLighting() {
        // Luz ambiental
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        // Luz direccional principal
        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(10, 10, 10);
        mainLight.castShadow = true;
        this.scene.add(mainLight);

        // Configurar sombras
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 50;
    }

    setupControls() {
        this.controls = new THREE.PointerLockControls(this.camera, document.body);
        
        // Configurar controles de movimiento
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;
        
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();

        // Evento para iniciar el juego
        document.getElementById('startButton').addEventListener('click', () => {
            this.controls.lock();
        });

        this.controls.addEventListener('lock', () => {
            this.startGame();
        });

        this.controls.addEventListener('unlock', () => {
            if (this.gameStarted) {
                this.pauseGame();
            }
        });
    }

    setupEventListeners() {
        // Eventos de teclado
        document.addEventListener('keydown', (event) => {
            if (!this.gameStarted) return;
            
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = true;
                    break;
                case 'Space':
                    if (this.canJump) {
                        this.velocity.y += 350;
                        this.canJump = false;
                    }
                    break;
            }
        });

        document.addEventListener('keyup', (event) => {
            if (!this.gameStarted) return;
            
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = false;
                    break;
            }
        });

        // Evento de disparo
        document.addEventListener('click', () => {
            if (!this.gameStarted) return;
            this.shoot();
        });

        // Evento de redimensión de ventana
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    shoot() {
        if (!this.gameStarted) return;

        const projectileGeometry = new THREE.SphereGeometry(0.1);
        const projectileMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
        
        projectile.position.copy(this.camera.position);
        
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        
        projectile.velocity = direction.multiplyScalar(1.5);
        
        this.scene.add(projectile);
        this.projectiles.push({
            mesh: projectile,
            velocity: projectile.velocity.clone(),
            timeAlive: 0
        });
        
        this.player.shotsFired++;
        this.updateAccuracy();
    }

    createTarget() {
        const size = 1 / this.difficulty;
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        const target = new THREE.Mesh(geometry, material);
        
        target.position.set(
            (Math.random() - 0.5) * 40,
            Math.random() * 5 + 1,
            (Math.random() - 0.5) * 40
        );
        
        target.movePattern = Math.floor(Math.random() * 3);
        target.moveSpeed = 0.5 + (this.difficulty * 0.2);
        
        target.castShadow = true;
        this.scene.add(target);
        this.targets.push(target);
    }

    updateTargets(delta) {
        this.targets.forEach(target => {
            const time = this.clock.getElapsedTime();
            
            switch(target.movePattern) {
                case 0: // Horizontal
                    target.position.x = Math.sin(time * target.moveSpeed) * 5 + target.position.x;
                    break;
                case 1: // Circular
                    const radius = 5;
                    target.position.x = Math.cos(time * target.moveSpeed) * radius;
                    target.position.z = Math.sin(time * target.moveSpeed) * radius;
                    break;
                case 2: // Zigzag
                    target.position.x += Math.sin(time * 2) * 0.1;
                    target.position.y += Math.cos(time * 3) * 0.05;
                    break;
            }
        });
    }

    checkCollisions() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            for (let j = this.targets.length - 1; j >= 0; j--) {
                const target = this.targets[j];
                const distance = projectile.mesh.position.distanceTo(target.position);
                
                if (distance < 0.5) {
                    this.handleHit(target, j);
                    this.scene.remove(projectile.mesh);
                    this.projectiles.splice(i, 1);
                    this.player.shotsHit++;
                    this.updateAccuracy();
                    this.updateScore(10 * this.difficulty);
                    break;
                }
            }
        }
    }

    handleHit(target, index) {
        this.scene.remove(target);
        this.targets.splice(index, 1);
        
        // Crear efecto de explosión
        this.createExplosion(target.position);
        
        // Crear nuevo objetivo si hay pocos
        if (this.targets.length < 3) {
            this.createTarget();
        }
    }

    createExplosion(position) {
        const particleCount = 20;
        const geometry