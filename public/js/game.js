document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    // Escalar canvas para GBA (240x160) y mantener pixelado
    const GBA_WIDTH = 240;
    const GBA_HEIGHT = 160;
    canvas.width = GBA_WIDTH;
    canvas.height = GBA_HEIGHT;
    // El CSS se encarga del escalado visual al contenedor
    // ctx.imageSmoothingEnabled = false; // Redundante con image-rendering: pixelated pero no hace daño

    // --- ASSETS ---
    const assets = {
        playerSprite: new Image(),
        enemySprite: new Image(),
        background: new Image(),
        // ... más assets
    };
    let assetsLoaded = 0;
    const totalAssets = Object.keys(assets).length;

    function assetLoaded() {
        assetsLoaded++;
        if (assetsLoaded === totalAssets) {
            console.log("Todos los assets cargados");
            initGame(); // Iniciar el juego cuando todo esté cargado
        }
    }

    assets.playerSprite.onload = assetLoaded;
    assets.enemySprite.onload = assetLoaded;
    assets.background.onload = assetLoaded;

    // Rutas a tus assets (asegúrate que existan)
    assets.playerSprite.src = 'assets/images/player_sprite.png'; // Ejemplo: 64x64px
    assets.enemySprite.src = 'assets/images/enemy_sprite.png';   // Ejemplo: 64x64px
    assets.background.src = 'assets/images/background.png';     // Ejemplo: 240x110px (parte superior de la pantalla)

    // --- UI ELEMENTS ---
    const messageLog = document.getElementById('message-log');
    const playerHpDisplay = document.getElementById('player-hp');
    const playerMaxHpDisplay = document.getElementById('player-max-hp');
    const playerHpBar = document.getElementById('player-hp-bar');
    const enemyHpDisplay = document.getElementById('enemy-hp');
    const enemyMaxHpDisplay = document.getElementById('enemy-max-hp');
    const enemyHpBar = document.getElementById('enemy-hp-bar');
    const actionMenu = document.getElementById('action-menu');

    // --- GAME STATE ---
    let gameState = {
        player: {
            name: "Héroe",
            hp: 100,
            maxHp: 100,
            attack: 15,
            defense: 5,
            isDefending: false,
            sprite: assets.playerSprite,
            x: 50, y: GBA_HEIGHT - 50 - 32, // Posición del sprite (ajusta al tamaño de tu UI inferior)
            width: 32, height: 32 // Tamaño del sprite
        },
        enemy: {
            name: "Goblin",
            hp: 80,
            maxHp: 80,
            attack: 12,
            defense: 3,
            isDefending: false,
            sprite: assets.enemySprite,
            x: GBA_WIDTH - 50 - 32, y: GBA_HEIGHT - 50 - 32 - 20, // Un poco más arriba
            width: 32, height: 32
        },
        currentTurn: 'player', // 'player' o 'ai'
        gameOver: false,
        message: "¡Comienza la batalla!"
    };

    // --- GAME LOGIC FUNCTIONS ---
    function updateUI() {
        playerHpDisplay.textContent = gameState.player.hp;
        playerMaxHpDisplay.textContent = gameState.player.maxHp;
        playerHpBar.style.width = `${(gameState.player.hp / gameState.player.maxHp) * 100}%`;
        if (gameState.player.hp / gameState.player.maxHp < 0.3) playerHpBar.style.backgroundColor = 'red';
        else if (gameState.player.hp / gameState.player.maxHp < 0.6) playerHpBar.style.backgroundColor = 'orange';
        else playerHpBar.style.backgroundColor = 'green';


        enemyHpDisplay.textContent = gameState.enemy.hp;
        enemyMaxHpDisplay.textContent = gameState.enemy.maxHp;
        enemyHpBar.style.width = `${(gameState.enemy.hp / gameState.enemy.maxHp) * 100}%`;
        if (gameState.enemy.hp / gameState.enemy.maxHp < 0.3) enemyHpBar.style.backgroundColor = 'red';
        else if (gameState.enemy.hp / gameState.enemy.maxHp < 0.6) enemyHpBar.style.backgroundColor = 'orange';
        else enemyHpBar.style.backgroundColor = 'green';

        logMessage(gameState.message); // Actualiza el mensaje principal
        toggleActionMenu(gameState.currentTurn === 'player' && !gameState.gameOver);
    }

    function logMessage(text) {
        gameState.message = text; // Guardar el último mensaje
        // Para el messageLog, podríamos querer añadir mensajes en lugar de reemplazar
        const newMessage = document.createElement('p');
        newMessage.textContent = text;
        messageLog.appendChild(newMessage);
        messageLog.scrollTop = messageLog.scrollHeight; // Auto-scroll
    }

    function toggleActionMenu(show) {
        actionMenu.style.display = show ? 'flex' : 'none';
    }

    function attack(attacker, defender) {
        attacker.isDefending = false; // Si ataca, no está defendiendo
        let damage = attacker.attack - (defender.isDefending ? defender.defense * 2 : defender.defense);
        damage = Math.max(1, damage); // Asegurar al menos 1 de daño
        defender.hp = Math.max(0, defender.hp - damage);

        logMessage(`${attacker.name} ataca a ${defender.name} y causa ${damage} de daño.`);
        // Aquí podrías añadir una pequeña animación de "hit"
        // simpleHitAnimation(defender);
        checkGameOver();
    }

    function defend(character) {
        character.isDefending = true;
        logMessage(`${character.name} se prepara para defender.`);
    }

    function useItem(character) {
        // Lógica simple: poción de vida
        const healAmount = 20;
        character.hp = Math.min(character.maxHp, character.hp + healAmount);
        logMessage(`${character.name} usa una poción y recupera ${healAmount} HP.`);
        // Aquí podrías añadir un efecto visual de curación
    }

    function checkGameOver() {
        if (gameState.player.hp <= 0) {
            logMessage("¡Has sido derrotado! Fin del juego.");
            gameState.gameOver = true;
        } else if (gameState.enemy.hp <= 0) {
            logMessage(`¡Has derrotado a ${gameState.enemy.name}! ¡Victoria!`);
            gameState.gameOver = true;
        }
        if (gameState.gameOver) {
            toggleActionMenu(false);
        }
    }

    function nextTurn() {
        if (gameState.gameOver) return;

        // Resetear estado de defensa al final del turno si no fue la acción
        if (gameState.currentTurn === 'player' && !gameState.player.isDefendingThisTurn) {
            gameState.player.isDefending = false;
        }
        if (gameState.currentTurn === 'ai' && !gameState.enemy.isDefendingThisTurn) {
            gameState.enemy.isDefending = false;
        }
        gameState.player.isDefendingThisTurn = false; // Resetear para el proximo turno
        gameState.enemy.isDefendingThisTurn = false;


        gameState.currentTurn = (gameState.currentTurn === 'player') ? 'ai' : 'player';
        logMessage(`Turno de ${gameState.currentTurn === 'player' ? gameState.player.name : gameState.enemy.name}.`);

        if (gameState.currentTurn === 'ai') {
            setTimeout(aiTurn, 1000); // Dar un pequeño delay para la IA
        }
        updateUI();
    }

    function aiTurn() {
        if (gameState.gameOver) return;
        gameState.enemy.isDefending = false; // IA deja de defender al inicio de su turno

        // IA Estrategia Básica:
        const randomAction = Math.random();
        if (gameState.enemy.hp < gameState.enemy.maxHp * 0.3 && randomAction < 0.4) { // 40% chance de curar si está bajo de vida
            // Simular uso de item (si tienes un sistema de items para la IA)
            // Por ahora, vamos a hacer que defienda más si está bajo de vida
            defend(gameState.enemy);
            gameState.enemy.isDefendingThisTurn = true;

        } else if (randomAction < 0.25 && gameState.enemy.hp < gameState.enemy.maxHp * 0.7) { // 25% chance de defender
            defend(gameState.enemy);
            gameState.enemy.isDefendingThisTurn = true;
        } else { // Atacar
            attack(gameState.enemy, gameState.player);
        }
        updateUI(); // Actualizar UI después de la acción de la IA
        if (!gameState.gameOver) {
            nextTurn(); // Pasar al turno del jugador
        }
    }

    // --- EVENT LISTENERS FOR ACTIONS ---
    actionMenu.addEventListener('click', (event) => {
        if (gameState.currentTurn !== 'player' || gameState.gameOver) return;

        const action = event.target.dataset.action;
        gameState.player.isDefending = false; // Jugador deja de defender al inicio de su turno

        if (action === 'attack') {
            attack(gameState.player, gameState.enemy);
        } else if (action === 'defend') {
            defend(gameState.player);
            gameState.player.isDefendingThisTurn = true;
        } else if (action === 'item') {
            useItem(gameState.player);
            // Usar un item generalmente consume el turno
        }
        updateUI(); // Actualizar UI después de la acción del jugador
        if (!gameState.gameOver) {
            nextTurn(); // Pasar al turno de la IA
        }
    });


    // --- RENDERING ---
    function drawCharacter(character) {
        if (character.sprite && character.sprite.complete) { // Asegurarse que la imagen esté cargada
            // Simple "bobbing" animation
            const bobAmount = Math.sin(Date.now() / 300) * 2; // Mueve 2px arriba y abajo
            ctx.drawImage(character.sprite, character.x, character.y + bobAmount, character.width, character.height);
        } else {
            // Dibujar un placeholder si la imagen no carga
            ctx.fillStyle = 'grey';
            ctx.fillRect(character.x, character.y, character.width, character.height);
        }
    }

    function render() {
        // Limpiar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Dibujar fondo
        if (assets.background.complete) {
            // El fondo podría ser más pequeño que el canvas si solo cubre la parte superior
            // Para GBA, la UI suele estar en una ventana separada abajo.
            // Aquí asumimos que el fondo cubre donde están los sprites
            // Si tu UI está DENTRO del canvas, ajusta las Y de los personajes
            ctx.drawImage(assets.background, 0, 0, canvas.width, GBA_HEIGHT - 50); // Asumiendo que la UI tiene 50px de alto
        } else {
            ctx.fillStyle = '#332255'; // Un color de fondo placeholder
            ctx.fillRect(0, 0, canvas.width, GBA_HEIGHT - 50);
        }


        // Dibujar personajes
        drawCharacter(gameState.player);
        drawCharacter(gameState.enemy);

        // Podrías dibujar efectos de partículas, animaciones de ataque aquí

        requestAnimationFrame(render); // Bucle de renderizado
    }

    // --- INITIALIZATION ---
    function initGame() {
        document.getElementById('player-name').textContent = gameState.player.name;
        document.getElementById('enemy-name').textContent = gameState.enemy.name;
        updateUI();
        render(); // Iniciar el bucle de renderizado
    }

    // No llames a initGame() aquí directamente, espera a que los assets carguen.
    // assetLoaded() llamará a initGame().
});