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
            attack: 30,
            defense: 8,
            isDefending: false,
            sprite: assets.playerSprite,
            x: 50, 
            y: GBA_HEIGHT - 5 - 32, // Posición del sprite (ajusta al tamaño de tu UI inferior)
            width: 32, 
            height: 32 // Tamaño del sprite
        },
        enemy: {
            name: "David",
            hp: 80,
            maxHp: 80,
            attack: 30,
            defense: 10,
            isDefending: false,
            sprite: assets.enemySprite,
            x: GBA_WIDTH - 50 - 32, 
            y: GBA_HEIGHT - 10 - 32 - 20, // Un poco más arriba
            width: 32, 
            height: 32
        },
        currentTurn: 'player', // 'player' o 'ai'
        gameOver: false,
        message: "¡Comienza la batalla!",
        potionsUsed: 0 // Contador de pociones usadas
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

        toggleActionMenu(gameState.currentTurn === 'player' && !gameState.gameOver);
    }

    function logMessage(text) {
        console.log(`logMessage llamada con: "${text}"`);
        gameState.message = text; // Guardar el último mensaje

        const newMessage = document.createElement('p');
        newMessage.textContent = text;
        messageLog.appendChild(newMessage);
        messageLog.scrollTop = messageLog.scrollHeight; // Auto-scroll
        
        // Llama a la función para animar el texto
        typeText(newMessage, text, 50); // Ajusta la velocidad con el tercer parámetro
    }

    function toggleActionMenu(show) {
        actionMenu.style.display = show ? 'flex' : 'none';
    }

    function attack(attacker, defender) {
        attacker.isDefending = false; // Si ataca, no está defendiendo
        let damage = attacker.attack - (defender.isDefending ? defender.defense * 2 : defender.defense);
        damage = Math.max(1, damage); // Asegurar al menos 1 de daño

        console.log(`${attacker.name} ataca a ${defender.name}`);
        console.log(`  ${attacker.name} attack: ${attacker.attack}`);
        console.log(`  ${defender.name} defense: ${defender.defense}`);
        console.log(`  Damage before Math.max: ${damage}`);

        damage = Math.max(1, damage); // Asegurar al menos 1 de daño

        console.log(`  Damage after Math.max: ${damage}`);
        console.log(`  ${defender.name} HP before attack: ${defender.hp}`);

        defender.hp = Math.max(0, defender.hp - damage);

        console.log(`  ${defender.name} HP after attack: ${defender.hp}`);

        logMessage(`${attacker.name} ataca a ${defender.name} y causa ${damage} de daño.`);        // Aquí podrías añadir una pequeña animación de "hit"
        // simpleHitAnimation(defender);
        checkGameOver();
    }

    function defend(character) {
        character.isDefending = true;
        logMessage(`${character.name} se prepara para defender.`);    
    }

    function useItem(character) {
    if (gameState.potionsUsed >= 2) {
        logMessage(`${character.name} ya no puede usar más pociones.`);
        return; // Salir de la función si ya usó 2 pociones
    }

    // Lógica para usar una poción
    const healAmount = 20;
    character.hp = Math.min(character.maxHp, character.hp + healAmount);
    gameState.potionsUsed++; // Incrementar el contador de pociones usadas
    logMessage(`${character.name} usa una poción y recupera ${healAmount} HP.`);
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
        gameState.player.isDefendingThisTurn = false; // Resetear para el próximo turno
        gameState.enemy.isDefendingThisTurn = false;

        // Cambiar turno
        gameState.currentTurn = (gameState.currentTurn === 'player') ? 'ai' : 'player';
        console.log(`Turno actual: ${gameState.currentTurn}`);

        // Solo muestra el mensaje de turno si no es el turno del jugador
        if (gameState.currentTurn === 'ai') {
            logMessage(`Turno de ${gameState.enemy.name}.`);
            setTimeout(aiTurn, 1000); // Dar un pequeño delay para la IA
        } else {
            logMessage(`Turno de ${gameState.player.name}.`);
        }
        updateUI();
    }

    function aiTurn() {
        if (gameState.gameOver || gameState.currentTurn !== 'ai') return; // Asegurarse de que sea el turno de la IA

        gameState.enemy.isDefending = false; // IA deja de defender al inicio de su turno

        // IA Estrategia Avanzada:
        const playerHpPercentage = gameState.player.hp / gameState.player.maxHp;
        const enemyHpPercentage = gameState.enemy.hp / gameState.enemy.maxHp;

        // Decidir acción basada en la situación
        if (enemyHpPercentage < 0.3 && gameState.potionsUsed < 2) {
            // Si la IA está en peligro y puede usar pociones, prioriza curarse
            useItem(gameState.enemy);
        } else if (playerHpPercentage < 0.3 && Math.random() < 0.6) {
            // Si el jugador está débil, hay un 60% de probabilidad de atacar agresivamente
            attack(gameState.enemy, gameState.player);
        } else if (enemyHpPercentage < 0.5 && Math.random() < 0.5) {
            // Si la IA está por debajo del 50% de vida, hay un 50% de probabilidad de defender
            defend(gameState.enemy);
            gameState.enemy.isDefendingThisTurn = true;
        } else if (Math.random() < 0.7) {
            // En la mayoría de los casos, la IA atacará
            attack(gameState.enemy, gameState.player);
        } else {
            // En otros casos, la IA se defiende
            defend(gameState.enemy);
            gameState.enemy.isDefendingThisTurn = true;
        }

        updateUI(); // Actualizar UI después de la acción de la IA

        if (!gameState.gameOver) {
            setTimeout(nextTurn, 3000);
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
        }
        updateUI(); // Actualizar UI después de la acción del jugador

        // Cambiar turno solo después de que el jugador haya realizado su acción
        if (!gameState.gameOver) {
            setTimeout(nextTurn, 3000);
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
            ctx.drawImage(assets.background, 0, 0, canvas.width, GBA_HEIGHT - 0); // Asumiendo que la UI tiene 50px de alto
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
        // Solicitar el nombre del jugador
        const playerName = prompt("Por favor, ingresa tu nombre:", "");
        gameState.player.name = playerName || "Héroe"; // Si no ingresa nada, usar "Héroe" como predeterminado

        document.getElementById('player-name').textContent = gameState.player.name;
        document.getElementById('enemy-name').textContent = gameState.enemy.name;
        
        updateUI();
        render(); // Iniciar el bucle de renderizado
    }

    // No llames a initGame() aquí directamente, espera a que los assets carguen.
    // assetLoaded() llamará a initGame().
});

function typeText(element, text, speed = 50) {
    element.textContent = ""; // Limpia el contenido previo
    let index = 0;

    function type() {
        if (index < text.length) {
            element.textContent += text[index];
            index++;
            setTimeout(type, speed); // Controla la velocidad de escritura
        }
    }

    type();
}