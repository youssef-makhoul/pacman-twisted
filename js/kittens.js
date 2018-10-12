// This sectin contains some game constants. It is not super interesting
let GAME_WIDTH = 375;
let GAME_HEIGHT = 500;

let ENEMY_WIDTH = 75;
let ENEMY_HEIGHT = 72;
let MAX_ENEMIES = 3;
let ENEMY_SPEED = 0.25;

let PLAYER_WIDTH = 75;
let PLAYER_HEIGHT = 75;

let RES_BTN_WIDTH = 200;
let RES_BTN_HEIGHT = 182;

let FOODPOINT_WIDTH = 75;
let FOODPOINT_HEIGHT = 13;
let MAX_FOODPOINTS = 1;
let FOODPOINT_SPEED = 0.25;

// These two constants keep us from using "magic numbers" in our code
let LEFT_ARROW_CODE = 37;
let RIGHT_ARROW_CODE = 39;

// These two constants allow us to DRY
let MOVE_LEFT = 'left';
let MOVE_RIGHT = 'right';

// Preload game images
let imageFilenames = ['enemy1.png', 'enemy2.png', 'enemy3.png', 'enemy4.png', 'stars.png', 'player1.png', 'player2.png', 'restartBtn.png', 'food.png'];
let images = {};

imageFilenames.forEach(function (imgName) {
    var img = document.createElement('img');
    img.src = 'images/' + imgName;
    images[imgName] = img;
});

let gameEndSound = new Audio('./sounds/GameEnd.mp3');
let pointEatinSound = new Audio('./sounds/PointEaten.mp3');



function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}

// This section is where you will be doing most of your coding
class Entity {
    constructor(x, y, sprite) {
        this.x = x;
        this.y = y;
        this.sprite = sprite;
    }

    render(ctx) {
        ctx.drawImage(this.sprite, this.x, this.y);
    }
}
class Enemy extends Entity {
    constructor(xPos) {
        super(xPos, -ENEMY_HEIGHT, images['enemy' + getRandomInt(1, 4).toString() + '.png']);
        // Each enemy should have a different speed
        this.speed = Math.random() / 2 + ENEMY_SPEED;
    }
    update(timeDiff) {
        this.y = this.y + timeDiff * this.speed;
    }
}

class Player extends Entity {
    constructor() {
        super(2 * PLAYER_WIDTH, GAME_HEIGHT - PLAYER_HEIGHT, images['player1.png']);
    }

    // This method is called by the game engine when left/right arrows are pressed
    move(direction) {
        if (direction === MOVE_LEFT && this.x > 0) {
            this.x = this.x - PLAYER_WIDTH;
        } else if (direction === MOVE_RIGHT && this.x < GAME_WIDTH - PLAYER_WIDTH) {
            this.x = this.x + PLAYER_WIDTH;
        }
    }
}

class RestartButton extends Entity {
    constructor() {
        super((GAME_WIDTH - RES_BTN_WIDTH) / 2, (GAME_HEIGHT - RES_BTN_WIDTH) / 2, images['restartBtn.png']);
    }
    ShowRestartButton(ctx) {
        this.render(ctx);
        gameEndSound.play();
        ctx.canvas.addEventListener('click', function (event) {
            location.reload();
        });
    }
}

class FoodPoint extends Entity {
    constructor(xPos) {
        super(xPos, -ENEMY_HEIGHT, images['food.png']);
        // Each enemy should have a different speed
        this.speed = Math.random() / 2 + FOODPOINT_SPEED;
    }
    update(timeDiff) {
        this.y = this.y + timeDiff * this.speed;
    }
}



/*
This section is a tiny game engine.
This engine will use your Enemy and Player classes to create the behavior of the game.
The engine will try to draw your game at 60 frames per second using the requestAnimationFrame function
*/
class Engine {
    constructor(element) {
        // Setup the player
        this.player = new Player();

        // Setup enemies, making sure there are always three
        this.setupEnemies();
        this.setupFoodPoints();


        this.restartButton = new RestartButton();

        // Setup the <canvas> element where we will be drawing
        var canvas = document.createElement('canvas');
        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;
        element.appendChild(canvas);

        this.ctx = canvas.getContext('2d');

        // Since gameLoop will be called out of context, bind it once here.
        this.gameLoop = this.gameLoop.bind(this);
    }

    /*
     The game allows for 5 horizontal slots where an enemy can be present.
     At any point in time there can be at most MAX_ENEMIES enemies otherwise the game would be impossible
     */
    setupEnemies() {
        if (!this.enemies) {
            this.enemies = [];
        }

        while (this.enemies.filter(function () {
                return true;
            }).length < MAX_ENEMIES) {
            this.addEnemy();
        }
    }

    setupFoodPoints() {
        if (!this.foodPoints) {
            this.foodPoints = [];
        }

        while (this.foodPoints.filter(function () {
                return true;
            }).length < MAX_FOODPOINTS) {
            this.addFoodPoint();
        }
    }

    // This method finds a random spot where there is no enemy, and puts one in there
    addEnemy() {
        var enemySpots = GAME_WIDTH / ENEMY_WIDTH;

        var enemySpot;
        // Keep looping until we find a free enemy spot at random
        while (!enemySpot && this.enemies[enemySpot]) {
            enemySpot = Math.floor(Math.random() * enemySpots);
        }

        this.enemies[enemySpot] = new Enemy(enemySpot * ENEMY_WIDTH);
    }

    addFoodPoint() {
        var foodPoints = GAME_WIDTH / FOODPOINT_WIDTH;

        var FoodSpot;
        // Keep looping until we find a free enemy spot at random
        while (!FoodSpot && this.foodPoints[FoodSpot]) {
            FoodSpot = Math.floor(Math.random() * foodPoints);
        }

        this.foodPoints[FoodSpot] = new FoodPoint(FoodSpot * FOODPOINT_WIDTH);
    }

    // This method kicks off the game
    start() {
        this.score = 0;
        this.lastFrame = Date.now();
        let keydownHandler = function (e) {
            if (e.keyCode === LEFT_ARROW_CODE) {
                this.player.move(MOVE_LEFT);
            } else if (e.keyCode === RIGHT_ARROW_CODE) {
                this.player.move(MOVE_RIGHT);
            }
        };
        keydownHandler = keydownHandler.bind(this);
        // Listen for keyboard left/right and update the player
        document.addEventListener('keydown', keydownHandler);

        this.gameLoop();
    }

    /*
    This is the core of the game engine. The `gameLoop` function gets called ~60 times per second
    During each execution of the function, we will update the positions of all game entities
    It's also at this point that we will check for any collisions between the game entities
    Collisions will often indicate either a player death or an enemy kill

    In order to allow the game objects to self-determine their behaviors, gameLoop will call the `update` method of each entity
    To account for the fact that we don't always have 60 frames per second, gameLoop will send a time delta argument to `update`
    You should use this parameter to scale your update appropriately
     */
    gameLoop() {
        // Check how long it's been since last frame
        var currentFrame = Date.now();
        var timeDiff = currentFrame - this.lastFrame;

        // Increase the score!
        this.score += timeDiff;

        // Call update on all enemies
        this.enemies.forEach(function (enemy) {
            enemy.update(timeDiff);
        });

        //Call update on all foodPoints
        this.foodPoints.forEach(function (foodPoint) {
            foodPoint.update(timeDiff);
        });

        // Draw everything!
        this.ctx.drawImage(images['stars.png'], 0, 0); // draw the star bg
        let renderEnemy = function (enemy) {
            enemy.render(this.ctx);
        };
        renderEnemy = renderEnemy.bind(this);
        this.enemies.forEach(renderEnemy); // draw the enemies


        let renderFoodPoints = function (foodPoint) {
            foodPoint.render(this.ctx);
        };
        renderFoodPoints = renderFoodPoints.bind(this);
        this.foodPoints.forEach(renderFoodPoints); // draw the FoodPoints

        this.player.render(this.ctx); // draw the player

        // Check if any enemies should die
        this.enemies.forEach((enemy, enemyIdx) => {
            if (enemy.y > GAME_HEIGHT) {
                delete this.enemies[enemyIdx];
            }
        });
        this.setupEnemies();

        // Check if any foodpoint should die
        this.foodPoints.forEach((foodpoint, foodpointIdx) => {
            if (foodpoint.y > GAME_HEIGHT) {
                delete this.foodPoints[foodpointIdx];
            }
        });
        this.setupFoodPoints();

        // Check if player is dead
        if (this.isPlayerDead()) {
            // If they are dead, then it's game over!
            this.ctx.font = 'bold 30px Impact';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(this.score + ' GAME OVER', 5, 30);
            this.restartButton.ShowRestartButton(this.ctx);
            return;

        } else {
            // If player is not dead, then draw the score
            this.ctx.font = 'bold 30px Impact';
            this.ctx.fillStyle = '#ffffff';
            let pointEaten = this.EatenPoint();
            if (pointEaten.eaten) {
                pointEatinSound.play();
                this.ctx.fillStyle = '#00ff00';
                this.score += 2000;
                delete this.foodPoints[pointEaten.index];
            }
            this.ctx.fillText(this.score, 5, 30);
            // Set the time marker and redraw
            this.lastFrame = Date.now();
            requestAnimationFrame(this.gameLoop);
        }
    }


    isPlayerDead() {
        // TODO: fix this function!
        let b = false;
        this.enemies.forEach(element => {
            if (isOverlap(element, this.player)) {
                b = true;
            }
        });
        return b;
    }
    EatenPoint() {
        let foodPoint = {
            eaten: false,
            index: 0
        };
        this.foodPoints.forEach((element, index) => {
            if (isOverlap(element, this.player)) {
                foodPoint.eaten = true;
                foodPoint.index = index;
            }
        });
        return foodPoint;
    }
}

let isOverlap = (entity, player) => {
    if (entity.y + ENEMY_HEIGHT >= player.y && player.x === entity.x)
        return true;
    return false;
};



// This section will start the game
var gameEngine = new Engine(document.getElementById('app'));
gameEngine.start();

let bb = false;
let changePlayerImage = () => {
    if (bb) {
        gameEngine.player.sprite = images['player1.png'];
        bb = false;
    } else {
        gameEngine.player.sprite = images['player2.png'];
        bb = true;
    }
    setTimeout(changePlayerImage, 200);
};
changePlayerImage();