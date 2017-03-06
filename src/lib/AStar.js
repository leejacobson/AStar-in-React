class GridCell {
  constructor(properties = {}) {
    this.properties = properties;
  }

  setProperty(properties = {}) {
    Object.assign(this.properties, properties);
  }

  getProperty(property) {
    return this.properties[property];
  }

  removeProperty(properties = []) {
    for(let property of properties) {
      delete this.properties[property];
    }
  }
}

export class SearchGrid {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    let numCells = width * height;
    this.cells = Array(numCells);
    for (let i=0; i<numCells; i++) {
      this.cells[i] = new GridCell();
    }
  }

  findCell(property) {
    for(let i in this.cells) {
      if (this.cells[i].getProperty(property)) {
        return parseInt(i, 10);
      }
    }
  }
  
  removeAll(property) {
    for(let i in this.cells) {
      if (this.cells[i].properties[property]) {
        this.cells[i].removeProperty([property]);
      }
    }
  }

  neighbourCell(cell, direction) {
    let neighbourCell;
    switch(direction) {
      case "left":
        neighbourCell = cell - 1;
        if (((neighbourCell+1) % this.width) === 0) {
          return null;
        }
        break;
      case "up":
        neighbourCell = cell - this.width;
        break;
      case "right":
        neighbourCell = cell + 1;
        if ((neighbourCell % this.width) === 0) {
          return null;
        }
        break;
      case "down":
        neighbourCell = cell + this.width;
        break;
      default:
        neighbourCell = null;
    }

    if (neighbourCell < 0 || neighbourCell >= (this.width * this.height)) {
      return null;
    }

    return neighbourCell;
  }
  
  distanceHeuristic(cellA, cellB) {
    let xDistance = Math.abs(Math.floor(cellA / this.width) - Math.floor(cellB / this.width));
    let yDistance = Math.abs((cellA % this.width) - (cellB % this.width));

    return xDistance + yDistance;
  }
}

export class Agent {
  constructor(grid) {
    this.grid = grid;
    this.reset();
  }
  
  reset() {
    this.currentCell = null;
    this.goalCell = null;
    this.steps = 0;

    this.path = [];
    this.openList = [];
    this.closedList = [];
    this.cellData = {};
  }

  run() {
    while(this.step());
  }

  init() {
    this.reset();
    
    this.currentCell = this.grid.findCell('startPosition');
    this.goalCell = this.grid.findCell('goalPosition');
    this.closedList = [this.currentCell];
    this.cellData = {
      [this.currentCell]: {
        g: 0,
        f: this.grid.distanceHeuristic(this.currentCell, this.goalCell)
      }
    };
  }

  step() {
    this.steps++;

    if (this.currentCell == null) {
      this.init();
    }

    if (this.currentCell === this.goalCell) {
      return false;
    }

    this.updateOpenList();

    if (this.openList.length === 0) {
      return false;
    }

    this.makeNextMove();
    return true;
  }

  updateOpenList() {
    let neighbourDirections = ['left', 'up', 'right', 'down'];
    if (this.steps % 2 === 0) {
      neighbourDirections.reverse();
    }

    neighbourDirections.forEach((direction) => {
      let neighbourCell = this.grid.neighbourCell(this.currentCell, direction);

      if (neighbourCell == null || this.grid.cells[neighbourCell].getProperty('wall')) {
        return;
      }

      if (this.closedList.indexOf(neighbourCell) === -1) {
        if (this.openList.indexOf(neighbourCell) === -1) {
          this.openList.push(neighbourCell);
        }

        let neighbourG = this.cellData[this.currentCell].g + 1;
        let neighbourF = this.grid.distanceHeuristic(neighbourCell, this.goalCell) + neighbourG;
        
        if (this.cellData[neighbourCell] === undefined || neighbourG < this.cellData[neighbourCell].g) {
          this.cellData[neighbourCell] = {
            g: neighbourG,
            f: neighbourF,
            from: this.currentCell
          };
        }
      }
    });
  }

  makeNextMove() {
    let bestNeighbour = null;
    for (let i=this.openList.length; i>=0; i--) {
      let openListCell = this.openList[i];
      if (bestNeighbour == null || this.cellData[openListCell].f < this.cellData[bestNeighbour].f) {
        bestNeighbour = openListCell;
      }
    }
    this.currentCell = bestNeighbour;
    this.closedList.push(this.currentCell);
    let index = this.openList.indexOf(this.currentCell);
    this.openList.splice(index, 1);

    this.checkForGoal();
  }

  checkForGoal() {
    if (this.currentCell === this.goalCell) {
      let pathCell = this.currentCell;
      while(this.cellData[pathCell].from) {
        pathCell = this.cellData[pathCell].from;
        this.path.push(pathCell);
      }
    }
  }
}