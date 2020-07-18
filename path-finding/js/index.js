const PIXEL_SIZE = 5;
const MAP_WIDTH = 16;
const MAP_HEIGHT = 16;
const BLOCK_SIZE = 6*PIXEL_SIZE;
const PADDING_SIZE = 2*PIXEL_SIZE;

const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

var shiftPressed = false, ctrlPressed = false;

var nodes = [];
var startNode;
var endNode;

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
canvas.addEventListener('click', function(e) {
    var point = collides(nodes, e.offsetX, e.offsetY);
    if(point) {
        if(shiftPressed)
            startNode = nodes[point[1]*MAP_WIDTH + point[0]]
        else if(ctrlPressed)
            endNode = nodes[point[1]*MAP_WIDTH + point[0]]
        else
            nodes[point[1]*MAP_WIDTH + point[0]].bObstacle = !nodes[point[1]*MAP_WIDTH + point[0]].bObstacle;
    } 
}, false);

function collides(rects, x, y) {
    var isCollision = false;
    for (var i in rects) {
        var left = rects[i].x*(BLOCK_SIZE+2*PADDING_SIZE), 
            right = rects[i].x*(BLOCK_SIZE+2*PADDING_SIZE)+(BLOCK_SIZE+2*PADDING_SIZE),
            top = rects[i].y*(BLOCK_SIZE+2*PADDING_SIZE), 
            bottom = rects[i].y*(BLOCK_SIZE+2*PADDING_SIZE)+(BLOCK_SIZE+2*PADDING_SIZE);
        if(right >= x && left <= x && bottom >= y && top <= y && rects[i] != startNode && rects[i] != endNode)
            isCollision = [rects[i].x, rects[i].y]
    }
    return isCollision;
}

function keyDownHandler(e) {
    if(e.key == "Shift") shiftPressed = true;
    if(e.key == "Control") ctrlPressed = true;
}

function keyUpHandler(e) {
    if(e.key == "Shift") shiftPressed = false;
    if(e.key == "Control") ctrlPressed = false;
}

class Node {
    constructor() {
        this.bObstacle = false;
        this.bVisited = false;
        this.fGlobalGoal;
        this.fLocalGoal;
        this.x;
        this.y;
        this.vecNeighbours = [];
        this.parent;
    }
}

/*  =========================

          Draw begin

    =========================  */

function drawConnections(node) {
    context.save();
    context.fillStyle = "blue";
    context.translate((node.x+1)*(BLOCK_SIZE+2*PADDING_SIZE)-(BLOCK_SIZE+PADDING_SIZE)+0.5*BLOCK_SIZE, 
                      (node.y+1)*(BLOCK_SIZE+2*PADDING_SIZE)-(BLOCK_SIZE+PADDING_SIZE)+0.5*BLOCK_SIZE);
    for(var i in node.vecNeighbours) {
        // Neighbour on the down
        if(node.vecNeighbours[i] - nodes.indexOf(node) == 16) {
            context.fillRect(-0.5*PADDING_SIZE, 0, 2*PIXEL_SIZE, 7*PIXEL_SIZE);
        }
        // Neighbour on the right
        else if(node.vecNeighbours[i] - nodes.indexOf(node) == 1) {
            context.fillRect(0, -0.5*PADDING_SIZE, 7*PIXEL_SIZE, 2*PIXEL_SIZE);
        }
    }
    context.restore();
}

function drawNode(node, color) {
    context.save();
    if(!node.bObstacle) context.fillStyle = color;
    else context.fillStyle = "gray";
    context.translate(node.x*(BLOCK_SIZE + 2*PADDING_SIZE) + PADDING_SIZE, 
                      node.y*(BLOCK_SIZE + 2*PADDING_SIZE) + PADDING_SIZE);
    context.fillRect(0, 0, BLOCK_SIZE, BLOCK_SIZE);
    context.restore();
}

function drawPath() {
    if(nodes.indexOf(endNode) != null) {
        var p = nodes.indexOf(endNode);
        while(nodes[p].parent != null) {
            context.save();
            context.fillStyle = "yellow";
            context.translate((nodes[p].x+1)*(BLOCK_SIZE+2*PADDING_SIZE)-(BLOCK_SIZE+PADDING_SIZE)+0.5*BLOCK_SIZE, 
                          (nodes[p].y+1)*(BLOCK_SIZE+2*PADDING_SIZE)-(BLOCK_SIZE+PADDING_SIZE)+0.5*BLOCK_SIZE);
            // Parent on the up
            if(nodes[p].parent - p == -16) {
                context.fillRect(-0.5*PADDING_SIZE, 0, 2*PIXEL_SIZE, -11*PIXEL_SIZE);
            }
            // Parent on the down
            else if(nodes[p].parent - p == 16) {
                context.fillRect(-0.5*PADDING_SIZE, 0, 2*PIXEL_SIZE, 11*PIXEL_SIZE);
            }
            // Parent on the left
            else if(nodes[p].parent - p == -1) {
                context.fillRect(0, -0.5*PADDING_SIZE, -11*PIXEL_SIZE, 2*PIXEL_SIZE);
            }
            // Parent on the right
            else if(nodes[p].parent - p == 1) {
                context.fillRect(0, -0.5*PADDING_SIZE, 11*PIXEL_SIZE, 2*PIXEL_SIZE);
            }
            p = nodes[p].parent;
            context.restore();
        }
    }
}

function draw() {
    for(var x = 0; x < MAP_WIDTH; x++) {
        for(var y = 0; y < MAP_HEIGHT; y++) {
            drawConnections(nodes[y*MAP_WIDTH + x]);
            if(nodes[y*MAP_WIDTH + x].bVisited)
                drawNode(nodes[y*MAP_WIDTH + x], "blue");
            else
                drawNode(nodes[y*MAP_WIDTH + x], "darkblue");
        }
    }
    drawNode(startNode, "green");
    drawNode(endNode, "red");
    Solve_AStar();
    drawPath();
}

/*  =========================

          Draw end

    =========================  */

function Solve_AStar() {
    for(var x = 0; x < MAP_WIDTH; x++) {
        for(var y = 0; y < MAP_HEIGHT; y++) {
            nodes[y*MAP_WIDTH + x].bVisited = false;
            nodes[y*MAP_WIDTH + x].fGlobalGoal = Infinity;
            nodes[y*MAP_WIDTH + x].fLocalGoal = Infinity;
            nodes[y*MAP_WIDTH + x].parent = null;
        }
    }
    var distance = function(a, b) {
        return Math.sqrt((a.x - b.x)*(a.x - b.x)+(a.y - b.y)*(a.y - b.y));
    }
    var heuristic = function(a, b) {
        return distance(a, b)
    }
    // Setup start
    var currentNode = startNode;
    startNode.fLocalGoal = 0.0;
    startNode.fGlobalGoal = heuristic(startNode, endNode);

    var listNotTestedNodes = [];
    listNotTestedNodes.push(startNode);

    while(listNotTestedNodes.length && currentNode != endNode) {
        listNotTestedNodes.sort(function(a, b) { return a - b });
        while(listNotTestedNodes.length && listNotTestedNodes[0].bVisited)
            listNotTestedNodes.shift();
        if (!listNotTestedNodes.length)
            break;
        currentNode = listNotTestedNodes[0];
        currentNode.bVisited = true;
        for(var nodeNeighbour in currentNode.vecNeighbours) {
            var spNode = currentNode.vecNeighbours[nodeNeighbour]
            if(!nodes[spNode].bVisited && nodes[spNode].bObstacle == false)
                listNotTestedNodes.push(nodes[spNode]);
            var fPossiblyLowerGoal = currentNode.fLocalGoal + distance(currentNode, nodes[spNode]);
            if(fPossiblyLowerGoal < nodes[spNode].fLocalGoal) {
                nodes[spNode].parent = nodes.indexOf(currentNode);
                nodes[spNode].fLocalGoal = fPossiblyLowerGoal;

                nodes[spNode].fGlobalGoal = nodes[spNode].fLocalGoal + heuristic(nodes[spNode], endNode);
            }
        }
    }
}

for(var i = 0; i < MAP_WIDTH*MAP_HEIGHT; i++)
    nodes[i] = new Node();

for(var x = 0; x < MAP_WIDTH; x++) {
    for(var y = 0; y < MAP_HEIGHT; y++) {
        nodes[y*MAP_WIDTH + x].x = x;
        nodes[y*MAP_WIDTH + x].y = y;
        nodes[y*MAP_WIDTH + x].bObstacle = false;
        nodes[y*MAP_WIDTH + x].parent = null;
        nodes[y*MAP_WIDTH + x].bVisited = false;
    }
}
// Find neighbours for each node.
for(var x = 0; x < MAP_WIDTH; x++) {
    for(var y = 0; y < MAP_HEIGHT; y++) {
        if(y>0)
            nodes[y*MAP_WIDTH + x].vecNeighbours.push(nodes.indexOf(nodes[(y - 1) * MAP_WIDTH + (x + 0)]));
        if(y<MAP_HEIGHT-1)
            nodes[y*MAP_WIDTH + x].vecNeighbours.push(nodes.indexOf(nodes[(y + 1) * MAP_WIDTH + (x + 0)]));
        if (x>0)
            nodes[y*MAP_WIDTH + x].vecNeighbours.push(nodes.indexOf(nodes[(y + 0) * MAP_WIDTH + (x - 1)]));
        if(x<MAP_WIDTH-1)
            nodes[y*MAP_WIDTH + x].vecNeighbours.push(nodes.indexOf(nodes[(y + 0) * MAP_WIDTH + (x + 1)]));
        
    }
}

startNode = nodes[1*MAP_WIDTH + 2];
endNode = nodes[12*MAP_WIDTH + 5];

setInterval(draw, 1000/30);