const found_dom = document.getElementById('found-artists'); // HTML list of displayed artists
const search_doma = document.getElementById('artist-keya'); // HTML search box
const search_domb = document.getElementById('artist-keyb');
const result_dom = document.getElementById('results-loader');
let entry_counter = 0;


/**
 * Load in data from cache on page load.
 */
async function load_cache(){
    let response = await fetch('scripts/data_cache.json');
    cache_json = await response.json();
    return cache_json;
}


load_cache().then(resp => {
    class artistData {
        constructor(obj){
            Object.assign(this, obj)
        }
        
        async get_names() {
            let names = [];
            let items = await this.list;
            for(let item of items){
                names.push(item.name);
            }
            return names;
        }
        
        async get_matches() {
        let match_rates = [];
        let items = await this.list;
        for(let item of items){
            match_rates.push(item.match);
        }
        return match_rates;
    }
};


let DATA_CACHE = resp;
for(let i=0; i<DATA_CACHE.length; i++){
    DATA_CACHE[i] = new artistData(DATA_CACHE[i])
}

/**
 * Check if cache contains node.
 * @param {String} node current artistData
 */
function is_cached(node) {
    for(let i=0; i<DATA_CACHE.length; i++){
        if(DATA_CACHE[i].origin === node)
            return i;
    }
    return -1;
}

search_doma.placeholder = DATA_CACHE[Math.floor(Math.random() * DATA_CACHE.length)].origin;
search_domb.placeholder = DATA_CACHE[Math.floor(Math.random() * DATA_CACHE.length)].origin;


/**
 * Fetches LastFM API's artist.getSimilar method
 * and returns artist objects.
 * @param {string} artist    search box input
 */
async function fetch_similars(artist) {
    const api_key = '74276898ee7faad0825b302a0abe5f07' 
    const endpoint = 'https://ws.audioscrobbler.com/2.0/?'
    const limit = 15;
    const autocorrect = 1;
    let artist_data = new artistData();
    
    try {
        let data = await fetch(`${endpoint}method=artist.getsimilar&limit=${limit}&artist=${artist}&api_key=${api_key}&autocorrect=${autocorrect}&format=json`)
        data = await data.json();
        artist_data.origin = await data.similarartists["@attr"].artist;
        let similars_data = await data.similarartists.artist.filter(x => !x.name.includes("&"));
        artist_data.list = [];
        for(let item of similars_data){
            artist_data.list.push({"name": item.name, "match": item.match});
        }
        return artist_data;
    } catch (error) {
        console.log(error);
    }
}


/**
 * Callback funcion when search button is clicked.
 * Execute path functions and render results to HTML.
 */
async function render_artists() {
    
    pos.clear();
    let artistkey_a = search_doma.value;
    let artistkey_b = search_domb.value;
    if(artistkey_a === '' || artistkey_b === '')
    return 
    document.getElementById('search-btn').classList.remove('mx-sm-2');
    document.getElementById("graph-container").innerHTML = '';
    found_dom.innerHTML = '';
    result_dom.classList.add('logo-bm');
    bodymovin.loadAnimation({
        container: document.getElementsByClassName('logo-bm')[0],
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'assets/loading.json'
    });
    
    artistkey_a = await fetch_similars(artistkey_a);
    artistkey_a = artistkey_a.origin;
    artistkey_b = await fetch_similars(artistkey_b);
    artistkey_b = artistkey_b.origin;

    const t0 = performance.now();
    const [seperation_path, match_rate] = await bidirect_search(artistkey_a, artistkey_b);
    const t1 = performance.now();

    // console.log(seperation_path);
    result_dom.classList.remove('logo-bm');
    result_dom.removeChild(result_dom.getElementsByTagName('svg')[0]);
    found_dom.innerHTML = '';
    for(let name of seperation_path){
        found_dom.insertAdjacentHTML('beforeend', `<li>${name}</li>`);
    }
    found_dom.insertAdjacentHTML('beforeend', `<br><strong>Match Rate: ${(match_rate*100).toFixed(1)}%</strong>`);
    found_dom.insertAdjacentHTML('beforeend', `<p style="color: var(--prime-color)">${((t1 - t0)/1000).toFixed(2)} seconds. ${entry_counter} entries</p>`);
    // document.getElementById("graph-container").innerHTML = '';
    render_seperationpath(seperation_path);
    document.getElementById('search-btn').classList.add('mx-sm-2');
}
document.getElementById('search-btn').onclick = render_artists;


/**
 * Used to download current DATA_CACHE to prepare for JSON file. 
 * Not for deployment.
 */
function download_cache(){
    let cache_string = [];
    for(let item of DATA_CACHE){
        cache_string.push(JSON.stringify(item));
    }

    let a = document.createElement('a');
    a.href = "data:application/octet-stream,"+encodeURIComponent(cache_string);
    a.download = 'data_cache.json';
    a.click();
}


/**
 * Return DOM of given node string (artist name), or null if it is not rendered.
 * @param {String} node 
 */
function find_renderednode(node){
    let nodes = document.getElementsByClassName('rendered-node');
    for(let i=0; i<nodes.length; i++){
        if(nodes[i].innerText === node){
            return nodes[i];
        }
    }
    return null;
}


const graph_container = document.getElementById("graph-container");
var fullWidth = graph_container.clientWidth;
var fullHeight = graph_container.clientHeight; 
let xpos = 500;
let ypos = 500;
let pos = new Set();

/**
 * Render artistData name to random position on HTML body.
 * @param {String} node 
 * @param {String} parent 
 */
function render_randomnode(node, parent){
    let nodes = document.getElementsByClassName('rendered-node');
    const elem = document.createElement("div");
    elem.id = nodes.length;
    elem.classList.add('rendered-node');
    elem.innerText = node;
    var rsgn = () => Math.round(Math.random()) ? 1 : -1;
    xpos = Math.round(rsgn() * (Math.round(Math.random() * fullWidth)* 0.25 + xpos * 0.75)); 
    ypos = Math.round(rsgn() * (Math.round(Math.random() * fullHeight)* 0.25 + ypos * 0.75));

    if(pos.has(xpos)){
        while(pos.has(xpos)){
            xpos = xpos + 100;
            ypos = rsgn() * (Math.round(Math.random() * fullHeight)* 0.25 + ypos * 0.75);
        }
    } else {
        pos.add(xpos);
    }

    elem.style.left = xpos + "px";
    elem.style.top = ypos + "px";
    graph_container.appendChild(elem);

    if(parent !== null){
        let parent_elem = find_renderednode(parent);
        if(parent_elem !== null){
            render_edge(elem, parent_elem, "var(--gray-fade)");
        }
    }

    return elem;
}


/**
 * Render edge between two given nodes. 
 * @param {DOM} nodea 
 * @param {DOPM} nodeb 
 * @param {String} color 
 */
function render_edge(nodea, nodeb, color){
    graph_container.insertAdjacentHTML('beforeend', 
        `<svg class="edge-svg" width="${window.innerWidth}"height="${window.innerHeight}">
        <line x1="${nodea.style.left}" y1="${nodea.style.top}" x2="${nodeb.style.left}" y2="${nodeb.style.top}" stroke="${color}"/>
        </svg>`)
}

document.getElementById('hide-edge-btn').onclick = () => {
    const alledges = document.getElementsByClassName('edge-svg');
    if(alledges.length === 0){
        return;
    }
    if(alledges[0].classList.length > 1){
        for(let i=0; i<alledges.length; i++){
            alledges[i].classList.remove('hide-edges');
        }
    } else {
        for(let i=0; i<alledges.length; i++){
            alledges[i].classList.add('hide-edges');
        }
    }
}

/**
 * Highlight seperation path in render.
 * @param {Array of artistData} seperation_path path from source to destination
 */
function render_seperationpath(seperation_path){
    let predegree;
    for(let i=0; i<seperation_path.length; i++){
        let degree = find_renderednode(seperation_path[i]);
        if(degree === null){
            degree = render_randomnode(seperation_path[i], null);
        }

        degree.style.zIndex = 5;
        degree.style.color = "red";
        if(i > 0) render_edge(degree, predegree, "red");
        predegree = degree;
    }
}


/**
 * Checks if there is an intersection between neighbor nodes of node A neighbors of B.
 * Bi-directional BFS graph search.
 * @param {String} artist_a     first artist
 * @param {String} artist_b     second artist
 */
async function bidirect_search(artist_a, artist_b) {
    entry_counter = 0;
    let nodes_a = [artist_a];
    let nodes_b = [artist_b];
    let matches_a = ["1"];
    let matches_b = ["1"];
    const max_distance = 15;
    let distance = 1;
    let visited_a = new Set();
    let visited_b = new Set();
    let preds_a = [];
    let preds_b = [];


    while(distance < max_distance){
        if(distance === max_distance - 1)
            console.log(`Over ${max_distance - 1} degrees.`);

        [nodes_a, preds_a, visited_a, matches_a] = await update_bfs(nodes_a, preds_a, visited_a, matches_a);
        entry_counter += nodes_a.length;
        if(nodes_a.some(n => nodes_b.includes(n))){         // Check if intersection between node B and node A neighbors
            let inters = nodes_a.filter(n => nodes_b.includes(n))[0];
           
            let path = trace_path(nodes_a, preds_a, nodes_b, preds_b, inters, artist_a, artist_b);
            let match_rate = get_matchrate(path, nodes_a, matches_a) / distance;

            return [path, match_rate];
        } 
        distance += 1;
        
        [nodes_b, preds_b, visited_b, matches_b] = await update_bfs(nodes_b, preds_b, visited_b, matches_b);
        entry_counter += nodes_b.length;
        if(nodes_b.some(n => nodes_a.includes(n))){         // Check if intersection between node A and node B neighbors
            let inters = nodes_b.filter(n => nodes_a.includes(n))[0];
            
            let path = trace_path(nodes_a, preds_a, nodes_b, preds_b, inters, artist_a, artist_b);
            let match_rate = get_matchrate(path, nodes_b, matches_b) / distance;
            
            return [path, match_rate];
        }     
        distance += 1;
    }
}


/**
 * Increase size of BFS search zone.
 * @param {Array of String} nodes      list of total BFS area 
 * @param {Array of Int} preds         list of predecessors
 * @param {Set of String} visited      nodes that have already been discovered
 * @param {Array of Float} match_rates   match rates corresponding to nodes list
 */
async function update_bfs(nodes, preds, visited, matches){
    let n = 1;
    for (let node of nodes){
        found_dom.innerHTML = node;
        if(visited.has(node)) continue;
        
        let cached = is_cached(node); 
        let data;
        if(cached !== -1){
            data = DATA_CACHE[cached];
        } else {
            data = await fetch_similars(node);
            DATA_CACHE.push(data);
        }
        let adjacents = await data.get_names();

        /**
         * Edge rendering block
         */
        let node_doms = document.getElementsByClassName('rendered-node');
        if(node_doms.length <= 200 || node_doms.length >= 200 + n){
            if(node_doms.length >= 200 + n){
                n *= 1.4;
            }
            render_randomnode(node, null);
            for(let adjacent of adjacents){
                let adj_dom = find_renderednode(adjacent);
                if(adj_dom === null){
                    render_randomnode(adjacent, node);
                } else {
                    let parent_dom = find_renderednode(node);
                    render_edge(adj_dom, parent_dom,"var(--gray-fade)");
                }
            }
        }        

        let match_entry = await data.get_matches();
        nodes = nodes.concat(adjacents);
        matches = matches.concat(match_entry);
        preds[nodes.indexOf(node)] = nodes.length;
        visited.add(node);
    }
    
    return [nodes, preds, visited, matches];
}


/**
 * Returns the parent node of a given child node.
 * @param {Array of String} nodes  list of total BFS area 
 * @param {Array of String} preds  list of predecessors
 * @param {String} child            child node of which the parent will be searched
 */
function get_parent(nodes, preds, child) {
    let child_index = nodes.indexOf(child);
    if(child_index === -1) 
        throw `Index of child ${child} does not exist.`
    let parent_range = preds.find(x => x > child_index);
    let parent_index = preds.indexOf(parent_range);
    let parent = nodes[parent_index];
    
    return parent;
}


/**
 * Traces back path from destination to intersection node, from intersection to source node, then concatenates.
 * @param {Array of String} nodes_a    list of total BFS area of source a
 * @param {Array of Int} preds_a       list of predecessors of source a
 * @param {Array of String} nodes_b    list of total BFS area of destination b
 * @param {Array of Int} preds_b       list of predecessors of destination b
 * @param {String} inters               intersecting node 
 * @param {String} artist_a             source node
 * @param {String} artist_b             destination node
 */
function trace_path(nodes_a, preds_a, nodes_b, preds_b, inters, artist_a, artist_b) {
    let path = [];
    let left_path = [];
    let source_inters = inters;
    
    while(inters !== artist_a){
        let temp = get_parent(nodes_a, preds_a, inters);
        if(!temp)
        throw `Cannot find parent of ${inters}.`
        inters = temp;
        left_path.push(inters);
    }
    path = path.concat(left_path.reverse());
    
    inters = source_inters;
    path.push(inters);
    while(inters !== artist_b){
        let temp = get_parent(nodes_b, preds_b, inters);
        if(!temp)
        throw `Cannot find parent of ${inters}.`
        inters = temp;
        path.push(inters);
    }
    return path;
}


/**
 * Calculate smallest match rate based on list of all match rates.
 * @param {Array of artistData} path    path from source to destination
 * @param {Array of String} nodes      list of predecessors
 * @param {Array of Int} matches       match rates corresponding to nodes list
 */
function get_matchrate(path, nodes, matches) {
    let match_list = [];
    for(let item of path){
        let child_index = nodes.indexOf(item);
        let match_rate = matches[child_index];
        if(match_rate === undefined)
            continue;
        match_list.push(parseFloat(match_rate, 10));
    }
    return Math.min(...match_list);
}

})