// This sectin contains some game constants. It is not super interesting
let SQUARESCOUNT = 9;


let ENTITY_WIDTH = 75;
let ENTITY_HEIGHT = 75;
let MAX_ENTITIES = 2;
let ENTITY_SPEED = 0.15;

let GAME_WIDTH = SQUARESCOUNT * 75;
let GAME_HEIGHT = SQUARESCOUNT * 75;

let FOODPOINT_SPEED = 0.25;
let FOOD_POINT_CHANCE = 6;
let FOOD_POINT_SCORE = 2000;

let BOX_COUNT = 7;

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
let imageFilenames = ['box.png', 'enemy1.png', 'enemy2.png', 'enemy3.png', 'enemy4.png', 'stars.png', 'player_up.png', 'player_down.png', 'player_right.png', 'player_left.png', 'restartBtn.png', 'food.png', 'scared.png', 'startBtn.png'];
let images = {};

imageFilenames.forEach(function (imgName) {
    var img = document.createElement('img');
    img.src = 'images/' + imgName;
    images[imgName] = img;
});


let soundFilenames = ['end', 'eat_point', 'background'];
let sounds = {};

soundFilenames.forEach(function (soundName) {
    let sound = new Audio('./sounds/' + soundName + '.mp3');
    sounds[soundName] = sound;
});



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

class Swipe {
    constructor(element) {
        this.xDown = null;
        this.yDown = null;
        this.element = typeof (element) === 'string' ? document.querySelector(element) : element;

        this.element.addEventListener('touchstart', function (evt) {
            this.xDown = evt.touches[0].clientX;
            this.yDown = evt.touches[0].clientY;
        }.bind(this), false);

    }

    onLeft(callback) {
        this.onLeft = callback;

        return this;
    }

    onRight(callback) {
        this.onRight = callback;

        return this;
    }

    onUp(callback) {
        this.onUp = callback;

        return this;
    }

    onDown(callback) {
        this.onDown = callback;

        return this;
    }

    handleTouchMove(evt) {
        if (!this.xDown || !this.yDown) {
            return;
        }

        var xUp = evt.touches[0].clientX;
        var yUp = evt.touches[0].clientY;

        this.xDiff = this.xDown - xUp;
        this.yDiff = this.yDown - yUp;

        if (Math.abs(this.xDiff) > Math.abs(this.yDiff)) { // Most significant.
            if (this.xDiff > 0) {
                this.onLeft();
            } else {
                this.onRight();
            }
        } else {
            if (this.yDiff > 0) {
                this.onUp();
            } else {
                this.onDown();
            }
        }

        // Reset values.
        this.xDown = null;
        this.yDown = null;
    }

    run() {
        this.element.addEventListener('touchmove', function (evt) {
            this.handleTouchMove(evt);
        }.bind(this), false);
    }
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
        let ox = this.x;
        let oy = this.y;

        if (direction === MOVE_LEFT) {
            if (this.x > 0)
                this.x = this.x - PLAYER_WIDTH;
            else
                this.x = GAME_WIDTH - PLAYER_WIDTH;
        }

        if (direction === MOVE_RIGHT) {
            if (this.x < GAME_WIDTH - PLAYER_WIDTH)
                this.x = this.x + PLAYER_WIDTH;
            else
                this.x = 0;
        }

        if (direction === MOVE_UP) {
            if (this.y >= PLAYER_HEIGHT)
                this.y = this.y - PLAYER_HEIGHT;
            else
                this.y = GAME_WIDTH - PLAYER_HEIGHT;
        }

        if (direction === MOVE_DOWN) {
            if (this.y < GAME_HEIGHT - PLAYER_HEIGHT)
                this.y = this.y + PLAYER_HEIGHT;
            else
                this.y = 0;
        }

        gameEngine.boxes.forEach(box => {
            if (isOverlap(box, this)) {
                this.x = ox;
                this.y = oy;
            }
        });
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

class Box extends Entity {
    constructor(xPos, yPos) {
        super(xPos * ENTITY_WIDTH, yPos * ENTITY_HEIGHT, images['box.png']);
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
    changeDirection() {
        let newDirection = '';
        if (this.direction == 'up')
            newDirection = 'right';
        if (this.direction == 'down')
            newDirection = 'left';
        if (this.direction == 'right')
            newDirection = 'down';
        if (this.direction == 'left')
            newDirection = 'up';
        if (this.x % 1 !== 0)
            this.x = Math.ceil(Math.round(this.x / ENTITY_WIDTH) * ENTITY_WIDTH);
        if (this.y % 1 !== 0)
            this.y = Math.ceil(Math.round(this.y / ENTITY_HEIGHT) * ENTITY_HEIGHT);
        this.direction = getRandomDirection();

    }
}
class Enemy extends FallingEntity {
    constructor(Pos) {
        super(images['enemy' + getRandomInt(1, 4).toString() + '.png'], Pos);
        // Each enemy should have a different speed
        this.speed = Math.random() / 2 + ENTITY_SPEED;
        this.scared = false;
    }
    changeScared(scared) {
        this.scared = scared;
        if (scared) {
            this.sprite = images['scared.png'];
        }
    }

}
class FoodPoint extends FallingEntity {
    constructor(Pos) {
        super(images['food.png'], Pos);
        //this.speed = Math.random() / 2 + FOODPOINT_SPEED;
        this.speed = FOODPOINT_SPEED;
    }
}


class RestartButton extends Entity {
    constructor() {
        super((GAME_WIDTH - RES_BTN_WIDTH) / 2, (GAME_HEIGHT - RES_BTN_WIDTH) / 2, images['restartBtn.png']);
        this.speed = 0;
    }
    ShowRestartButton(ctx) {
        this.render(ctx);
        sounds.background.pause();
        sounds.end.play();
        ctx.canvas.addEventListener('click', function (event) {
            location.reload();
        });
        document.addEventListener('keydown', (e) => {
            if (e.keyCode == 32)
                location.reload();
        });
    }
}

class StartButton extends Entity {
    constructor() {
        super((GAME_WIDTH - START_BTN_WIDTH) / 2, (GAME_HEIGHT - START_BTN_HEIGHT) / 2, images['startBtn.png']);
    }
}

class Engine {
    constructor(element) {
        this.level = 1;
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

    setupBoxes() {
        this.boxes = [];
        for (let i = 0; i < BOX_COUNT; i++) {
            let xpos = getRandomInt(1, SQUARESCOUNT - 2);
            let ypos = getRandomInt(1, SQUARESCOUNT - 2);
            if (xpos === Math.ceil((SQUARESCOUNT - 1) / 2) && ypos === Math.ceil((SQUARESCOUNT - 1) / 2)) {
                i--;
                continue;
            }
            this.boxes.push(new Box(xpos, ypos));
        }
    }

    // This method kicks off the game
    start() {
        // Setup the player
        this.player = new Player();
        this.setupFallingEntities();
        this.setupBoxes();
        this.restartButton = new RestartButton();
        this.score = 0;
        this.lastFrame = Date.now();
        let movePlayerLeft = () => {
            this.player.move(MOVE_LEFT);
        };
        movePlayerLeft = movePlayerLeft.bind(this);

        let movePlayerRight = () => {
            this.player.move(MOVE_RIGHT);
        };
        movePlayerRight = movePlayerRight.bind(this);

        let movePlayerUp = () => {
            this.player.move(MOVE_UP);
        };

        movePlayerUp = movePlayerUp.bind(this);

        let movePlayerDown = () => {
            this.player.move(MOVE_DOWN);
        };
        movePlayerDown = movePlayerDown.bind(this);

        var swiper = new Swipe(document);
        swiper.onLeft(movePlayerLeft);
        swiper.onRight(movePlayerRight);
        swiper.onUp(movePlayerUp);
        swiper.onDown(movePlayerDown);
        let keydownHandler = function (e) {
            if (e.keyCode === LEFT_ARROW_CODE) {
                movePlayerLeft();
            } else if (e.keyCode === RIGHT_ARROW_CODE) {
                movePlayerRight();
            } else if (e.keyCode === UP_ARROW_CODE) {
                movePlayerUp();
            } else if (e.keyCode === DOWN_ARROW_CODE) {
                movePlayerDown();
            } else if (e.keyCode === 32)
                location.reload();
        };
        keydownHandler = keydownHandler.bind(this);
        // Listen for keyboard left/right and update the player
        document.addEventListener('keydown', keydownHandler);
        swiper.run();
        sounds.background.play();
        this.gameLoop();
    }

    gameLoop() {
        // Check how long it's been since last frame
        var currentFrame = Date.now();
        var timeDiff = currentFrame - this.lastFrame;

        // Increase the score!
        this.score += timeDiff;

        //Increase Level
        if (this.score > this.level * 15000 && ENTITY_SPEED < 1) {
            MAX_ENTITIES += 1;
            ENTITY_SPEED += 0.05;
            this.level++;
        }


        // Call update on all enemies
        this.fallingEntities.forEach(function (entity) {
            entity.update(timeDiff);
        });


        // Draw everything!
        let renderEntity = function (entity) {
            entity.render(this.ctx);
        };
        renderEntity = renderEntity.bind(this);
        // draw the enemies
        this.ctx.drawImage(images['stars.png'], 0, 0);
        // draw the enemies
        this.fallingEntities.forEach(renderEntity);
        // draw the player
        this.player.render(this.ctx);
        //draw boxes
        this.boxes.forEach(renderEntity);

        // Check if any enemies should die
        this.fallingEntities.forEach((entity, entityIdx) => {
            if (entity.y > GAME_HEIGHT || entity.x > GAME_WIDTH || entity.x < -ENTITY_WIDTH || entity.y < -ENTITY_HEIGHT) {
                delete this.fallingEntities[entityIdx];
            }
        });

        this.setupFallingEntities();

        // Check if player is dead
        let hit = this.isPlayerDead();
        if (hit.hit) {
            if (hit.entity.scared) {
                sounds.eat_point.play();
                this.ctx.fillStyle = '#00ff00';
                this.score += FOOD_POINT_SCORE;
                delete this.fallingEntities[hit.index];
                this.ctx.fillText(this.score, 5, 30);
                // Set the time marker and redraw
                this.lastFrame = Date.now();
                requestAnimationFrame(this.gameLoop);
            } else {
                this.ctx.font = 'bold 30px Impact';
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillText(this.score + ' GAME OVER', 5, 30);
                this.restartButton.ShowRestartButton(this.ctx);
                return;
            }

        } else {
            // If player is not dead, then draw the score
            this.ctx.font = 'bold 30px Impact';
            this.ctx.fillStyle = '#ffffff';
            let pointEaten = this.EatenPoint();
            if (pointEaten.eaten) {
                sounds.eat_point.play();
                this.ctx.fillStyle = '#00ff00';
                this.score += FOOD_POINT_SCORE;
                delete this.fallingEntities[pointEaten.index];
                this.fallingEntities.forEach(entity => {
                    if (entity instanceof Enemy)
                        entity.changeScared(true);
                });
            }
            let boxHit = this.isHitBox();
            if (boxHit.hit) {
                boxHit.entity.changeDirection();
            }
            this.ctx.fillText(this.score, 5, 30);
            // Set the time marker and redraw
            this.lastFrame = Date.now();
            requestAnimationFrame(this.gameLoop);
        }
    }

    isHitBox() {
        let boxHit = {
            hit: false,
            box: undefined,
            entity: undefined
        };
        this.fallingEntities.forEach(entity => {
            this.boxes.forEach(box => {
                if (isOverlap(entity, box)) {
                    boxHit.hit = true;
                    boxHit.box = box;
                    boxHit.entity = entity;
                }
            });
        });
        return boxHit;
    }

    isPlayerDead() {
        // TODO: fix this function!
        let b = {
            hit: false,
            entity: undefined,
            index: undefined
        };
        this.fallingEntities.forEach((element, index) => {
            if (isOverlap(element, this.player) && element instanceof Enemy) {
                b.hit = true;
                b.entity = element;
                b.index = index;
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
    if (entity.y === player.y && entity.x + ENTITY_WIDTH > player.x && entity.x < player.x + PLAYER_WIDTH)
        return true;
    //direction top / bottom
    if (entity.y + ENTITY_HEIGHT > player.y && entity.y < player.y + PLAYER_HEIGHT && player.x === entity.x)
        return true;
    return false;
}




// This section will start the game
var gameEngine = new Engine(document.getElementById('app'));
gameEngine.start();