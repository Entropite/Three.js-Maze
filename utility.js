class MinHeap {
    constructor() {
        this.heap = [];
    }

    isEmpty() {
        return this.heap.length === 0;
    }
    
    add(value) {
        
        let i = this.heap.length;
        this.heap.push(value);
        while(i > 0 && this.heap[this.getParent(i)] > value){
            this.swap(i, this.getParent(i));
            i = this.getParent(i);
        }
    }
    
    getNext() {
        if (this.heap.length === 0) {
            return null;
        }
        let i = 0
        this.swap(0, this.heap.length - 1);
        const min = this.heap.pop();

        while (true) {
            const left = this.getLeftChild(i);
            const right = this.getRightChild(i);
            if (left < this.heap.length && this.heap[left].valueOf() < this.heap[i].valueOf() && (right >= this.heap.length || this.heap[left].valueOf() < this.heap[right].valueOf())) {
                this.swap(i, left);
                i = left;
            } else if (right < this.heap.length && this.heap[right].valueOf() < this.heap[i].valueOf()) {
                this.swap(i, right);
                i = right;
            } else{
                break;
            }
        }

        return min;
    }

    swap(i, j) {
        const temp = this.heap[i];
        this.heap[i] = this.heap[j];
        this.heap[j] = temp;
    }

    getParent(i) {
        return Math.floor((i - 1) / 2);
    }

    getLeftChild(i) {
        return 2 * i + 1;
    }

    getRightChild(i) {
        return 2 * i + 2;
    }
}

class RandomNode {
    constructor(x, y, l, w) {
        this.x = x;
        this.y = y;
        this.edges = new Array(4);
        if (x > 0) {
            this.edges[0] = new Edge(x, y, x - 1, y, Math.random());
        }
        if (x < l - 1) {
            this.edges[1] = new Edge(x, y, x + 1, y, Math.random());
        }
        if (y > 0) {
            this.edges[2] = new Edge(x, y, x, y - 1, Math.random());
        }
        if (y < w - 1) {
            this.edges[3] = new Edge(x, y, x, y + 1, Math.random());
        }
    }
}

class Edge {
    constructor(i1, j1, i2, j2, weight) {
        this.i1 = i1;
        this.j1 = j1;
        this.i2 = i2;
        this.j2 = j2;
        this.weight = weight;
    }
    valueOf() {
        return this.weight;
    }
}

function generateMaze(l, w) {
    const nodes = new Array(l);

    for (let i = 0; i < l; i++) {
        nodes[i] = new Array(w);
        for (let j = 0; j < w; j++) {
            nodes[i][j] = new RandomNode(i, j, l, w);
        }
    }

    // Prim's algorithm
    const tree = []

    // Build a visited array
    const visited = new Array(l);
    for (let i = 0; i < l; i++){
        visited[i] = new Array(w);
        for (let j = 0; j < w; j++){
            visited[i][j] = false;
        }
    }

    const heap = new MinHeap();

    // Start at the top left corner
    visited[0][0] = true;
    // Add all edges from the starting node to the heap
    for (const edge of nodes[0][0].edges) {
        if (edge) {
            heap.add(edge);
        }
    }

    while (!heap.isEmpty()) {
        const edge = heap.getNext();
        
        // i1 to i2, j1 to j2
        const node = nodes[edge.i2][edge.j2];
        if (visited[edge.i2][edge.j2]) {
            continue;
        }
        visited[edge.i2][edge.j2] = true;
        tree.push(edge);
        
        // Add all edges from the new visited node
        for (const newEdge of node.edges) {
            if (newEdge) {
                heap.add(newEdge);
            }
        }
    }

    // Construct maze from tree
    const maze = new Array(l * 2 + 1);
    for (let i = 0; i < l * 2 + 1; i++) {
        maze[i] = new Array(w * 2 + 1);
        for (let j = 0; j < w * 2 + 1; j++) {
            if (i % 2 != 0 && j % 2 != 0) {
                maze[i][j] = 0;
            } else {
                maze[i][j] = 1;
            }
        }
    }

    for(const edge of tree) {
        const i = edge.i1 + edge.i2 + 1;
        const j = edge.j1 + edge.j2 + 1;
        maze[i][j] = 0;
    }

    
    return maze;
    
    
    
}
