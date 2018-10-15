// This sectin contains some game constants. It is not super interesting
let SQUARESCOUNT = 9;


let ENTITY_WIDTH = 75;
let ENTITY_HEIGHT = 75;
let MAX_ENTITIES = 3;
let ENTITY_SPEED = 0.05;

let GAME_WIDTH = SQUARESCOUNT * 75;
let GAME_HEIGHT = SQUARESCOUNT * 75;

let FOODPOINT_SPEED = 0.25;
let FOOD_POINT_CHANCE = 6;
let FOOD_POINT_SCORE = 5000;

let PLAYER_WIDTH = 75;
let PLAYER_HEIGHT = 75;

let RES_BTN_WIDTH = 200;
let RES_BTN_HEIGHT = 182;


// These two constants keep us from using "magic numbers" in our code
let LEFT_ARROW_CODE = 37;
let RIGHT_ARROW_CODE = 39;
let UP_ARROW_CODE = 38;
let DOWN_ARROW_CODE = 40;

// These two constants allow us to DRY
let MOVE_LEFT = 'left';
let MOVE_RIGHT = 'right';
let MOVE_UP = 'up';
let MOVE_DOWN = 'down';
// Preload game images
let imageFilenames = ['enemy1.png', 'enemy2.png', 'enemy3.png', 'enemy4.png', 'stars.png', 'player_up.png', 'player_down.png', 'player_right.png', 'player_left.png', 'player2.png', 'restartBtn.png', 'food.png'];
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

function getRandomDirection() {
    let dirNum = getRandomInt(1, 4);
    if (dirNum == 2)
        return 'right';
    if (dirNum == 3)
        return 'left';
    if (dirNum == 4)
        return 'down';
    return 'up';

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
class Player extends Entity {
    constructor() {
        super(4 * PLAYER_WIDTH, GAME_HEIGHT - 5 * PLAYER_HEIGHT, images['player_right.png']);
    }

    // This method is called by the game engine when left/right arrows are pressed
    move(direction) {
        if (direction === MOVE_LEFT && this.x > 0) {
            this.x = this.x - PLAYER_WIDTH;
        } else if (direction === MOVE_RIGHT && this.x < GAME_WIDTH - PLAYER_WIDTH) {
            this.x = this.x + PLAYER_WIDTH;
        } else if (direction === MOVE_UP && this.y >= PLAYER_HEIGHT) {
            this.y = this.y - PLAYER_HEIGHT;
        } else if (direction === MOVE_DOWN && this.y < GAME_HEIGHT - PLAYER_HEIGHT) {
            this.y = this.y + PLAYER_HEIGHT;
        }
        this.changePlayerImage(direction);
    }
    changePlayerImage(direction) {
        if (direction == MOVE_LEFT)
            this.sprite = images['player_left.png'];
        if (direction == MOVE_RIGHT)
            this.sprite = images['player_right.png'];

        if (direction == MOVE_UP)
            this.sprite = images['player_up.png'];

        if (direction == MOVE_DOWN)
            this.sprite = images['player_down.png'];

    }
}


class FallingEntity extends Entity {
    constructor(sprite, Pos) {
        super(0, 0, sprite);
        this.direction = getRandomDirection();
        if (this.direction == 'left') {
            this.x = -ENTITY_WIDTH;
            this.y = Pos * ENTITY_WIDTH;
        } else if (this.direction == 'right') {
            this.x = GAME_WIDTH;
            this.y = Pos * ENTITY_HEIGHT;
        } else if (this.direction == 'up') {
            this.x = Pos * ENTITY_WIDTH;
            this.y = -ENTITY_HEIGHT;
        } else if (this.direction == 'down') {
            this.x = Pos * ENTITY_WIDTH;
            this.y = GAME_HEIGHT;
        }
    }
    update(timeDiff) {
        //this.y = this.y + timeDiff * this.speed;
        if (this.direction == 'left') {
            this.x = this.x + timeDiff * this.speed;
        } else if (this.direction == 'right') {
            this.x = this.x - (timeDiff * this.speed);
        } else if (this.direction == 'up') {
            this.y = this.y + timeDiff * this.speed;
        } else if (this.direction == 'down') {
            this.y = this.y - timeDiff * this.speed;
        }
    }
}
class Enemy extends FallingEntity {
    constructor(Pos) {
        super(images['enemy' + getRandomInt(1, 4).toString() + '.png'], Pos);
        // Each enemy should have a different speed
        this.speed = Math.random() / 2 + ENTITY_SPEED;
    }

}
class FoodPoint extends FallingEntity {
    constructor(Pos) {
        super(images['food.png'], Pos);
        this.speed = Math.random() / 2 + FOODPOINT_SPEED;
    }
}


class RestartButton extends Entity {
    constructor() {
        super((GAME_WIDTH - RES_BTN_WIDTH) / 2, (GAME_HEIGHT - RES_BTN_WIDTH) / 2, images['restartBtn.png']);
        this.speed = 0;
    }
    ShowRestartButton(ctx) {
        this.render(ctx);
        gameEndSound.play();
        ctx.canvas.addEventListener('click', function (event) {
            location.reload();
        });
    }
}

class Engine {
    constructor(element) {
        this.level = 1;
        // Setup the player
        this.player = new Player();

        this.setupFallingEntities();
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
    setupFallingEntities() {
        if (!this.fallingEntities) {
            this.fallingEntities = [];
        }

        while (this.fallingEntities.filter(function () {
                return true;
            }).length < MAX_ENTITIES) {
            this.addFallingEntity();
        }
    }

    // This method finds a random spot where there is no enemy, and puts one in there
    addFallingEntity() {
        var entitySpot;
        // Keep looping until we find a free enemy spot at random
        while (entitySpot === false || this.fallingEntities[entitySpot]) {
            entitySpot = getRandomInt(1, 9);
        }
        if (getRandomInt(1, FOOD_POINT_CHANCE) == 1)
            this.fallingEntities[entitySpot] = new FoodPoint(entitySpot);
        else
            this.fallingEntities[entitySpot] = new Enemy(entitySpot);
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
            } else if (e.keyCode === UP_ARROW_CODE) {
                this.player.move(MOVE_UP);
            } else if (e.keyCode === DOWN_ARROW_CODE) {
                this.player.move(MOVE_DOWN);
            }
        };
        keydownHandler = keydownHandler.bind(this);
        // Listen for keyboard left/right and update the player
        document.addEventListener('keydown', keydownHandler);

        this.gameLoop();
    }

    gameLoop() {
        // Check how long it's been since last frame
        var currentFrame = Date.now();
        var timeDiff = currentFrame - this.lastFrame;

        // Increase the score!
        this.score += timeDiff;

        if (this.score > this.level * 15000 && ENTITY_SPEED < 1 ){
            MAX_ENTITIES+=1;
            ENTITY_SPEED += 0.05;
            this.level++;
        }


        // Call update on all enemies
        this.fallingEntities.forEach(function (entity) {
            entity.update(timeDiff);
        });


        // Draw everything!
        this.ctx.drawImage(images['stars.png'], 0, 0); // draw the star bg
        let renderEntity = function (entity) {
            entity.render(this.ctx);
        };
        renderEntity = renderEntity.bind(this);
        this.fallingEntities.forEach(renderEntity); // draw the enemies

        this.player.render(this.ctx); // draw the player

        // Check if any enemies should die
        this.fallingEntities.forEach((entity, entityIdx) => {
            if (entity.y > GAME_HEIGHT || entity.x > GAME_WIDTH || entity.x < -ENTITY_WIDTH || entity.y < -ENTITY_HEIGHT) {
                delete this.fallingEntities[entityIdx];
            }
        });

        this.setupFallingEntities();

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
                this.score += FOOD_POINT_SCORE;
                delete this.fallingEntities[pointEaten.index];
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
        this.fallingEntities.forEach(element => {
            if (isOverlap(element, this.player) && element instanceof Enemy) {
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
        this.fallingEntities.forEach((element, index) => {
            if (isOverlap(element, this.player) && element instanceof FoodPoint) {
                foodPoint.eaten = true;
                foodPoint.index = index;
            }
        });
        return foodPoint;
    }
}

let isOverlap = (entity, player) => {
    //direction left / right
    if (entity.y == player.y && entity.x + ENTITY_WIDTH >= player.x && entity.x <= player.x + PLAYER_WIDTH)
        return true;
    //direction top / bottom
    if (entity.y + ENTITY_HEIGHT >= player.y && entity.y <= player.y + PLAYER_HEIGHT && player.x === entity.x)
        return true;
    return false;
};



// This section will start the game
var gameEngine = new Engine(document.getElementById('app'));
gameEngine.start();