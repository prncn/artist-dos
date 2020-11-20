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
    currpred = 0;
    prevpred = 0;
    parent = 0;
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
    render_markpath(seperation_path);
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
 * Render artistData name to random position on HTML body.
 * @param {String} node 
 */
const graph_container = document.getElementById("graph-container");
var fullWidth = graph_container.clientWidth;
var fullHeight = graph_container.clientHeight; 

let xpos = 500;
let ypos = 500;
let pos = new Set();
function render_randomnode(node){
    var maxwidth = window.innerWidth;
    var maxheight = window.innerHeight;

    const elem = document.createElement("div");
    elem.classList.add('rendered-node');
    elem.innerText = node;
    var rsgn = () => Math.round(Math.random()) ? 1 : -1;
    xpos = Math.round(rsgn() * (Math.round(Math.random() * fullWidth)* 0.25 + xpos * 0.75)); 
    ypos = Math.round(rsgn() * (Math.round(Math.random() * fullHeight)* 0.25 + ypos * 0.75));

    if(pos.has(xpos)){
        // console.log("detected");
        while(pos.has(xpos)){
            xpos = xpos + 100;
            ypos = rsgn() * (Math.round(Math.random() * fullHeight)* 0.25 + ypos * 0.75);
        }
    } else {
        // console.log("not detected");
        pos.add(xpos);
    }
    elem.style.left = xpos + "px";
    elem.style.top = ypos + "px";

    graph_container.appendChild(elem);
}


/**
 * Highlight seperation path in render.
 * @param {Array of artistData} seperation_path path from source to destination
 */
function render_markpath(seperation_path){
    let nodes = document.getElementsByClassName('rendered-node');
    let parentx = 0;
    let parenty = 0;
    for(let j=0; j<seperation_path.length; j++){
        for(let i=0; i<nodes.length; i++){
            if(nodes[i].innerText === seperation_path[j]){
                nodes[i].style.zIndex = 5;
                nodes[i].style.color = "red";
                // nodes[i].style.backgroundColor = "white";
                if(j > 0)
                graph_container.insertAdjacentHTML('beforeend', 
                    `<svg style="position: absolute;" width="${window.innerWidth}"height="${window.innerHeight}">
                    <line x1="${nodes[i].style.left}" y1="${nodes[i].style.top}" x2="${parentx}" y2="${parenty}" stroke="red"/>
                    </svg>`)
                parentx = nodes[i].style.left;
                parenty = nodes[i].style.top;
            }
        }
    }
}


/**
 * Render edges between non seperation path nodes. (Unused, looks weird)
 * @param {Array of Int} preds 
 */
function render_edges(preds){
    currpred = preds[0];
    if(currpred !== prevpred)
        parent++;
    let nodes = document.getElementsByClassName('rendered-node');
    if(nodes.length < 2)
        return;
    let i = nodes.length - 1;
    graph_container.insertAdjacentHTML('beforeend', 
        `<svg style="position: absolute;" width="${window.innerWidth}"height="${window.innerHeight}">
        <line x1="${nodes[i].style.left}" y1="${nodes[i].style.top}" x2="${nodes[parent].style.left}" y2="${nodes[parent].style.top}" stroke="gray"/>
        </svg>`)
    prevpred = currpred;
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
        // console.log(visited_a, visited_b);
        if(nodes_a.some(n => nodes_b.includes(n))){         // Check if intersection between node B and node A neighbors
            let inters = nodes_a.filter(n => nodes_b.includes(n))[0];
            render_randomnode(inters);
            let path = trace_path(nodes_a, preds_a, nodes_b, preds_b, inters, artist_a, artist_b);
            let match_rate = get_matchrate(path, nodes_a, matches_a) / distance;

            return [path, match_rate];
        } 
        distance += 1;
        
        [nodes_b, preds_b, visited_b, matches_b] = await update_bfs(nodes_b, preds_b, visited_b, matches_b);
        distance += 1;
        if(nodes_b.some(n => nodes_a.includes(n))){         // Check if intersection between node A and node B neighbors
            let inters = nodes_b.filter(n => nodes_a.includes(n))[0];
            render_randomnode(inters);
            let path = trace_path(nodes_a, preds_a, nodes_b, preds_b, inters, artist_a, artist_b);
            let match_rate = get_matchrate(path, nodes_b, matches_b) / distance;
            
            return [path, match_rate];
        }     
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
    for (let node of nodes){
        entry_counter += 1;
        found_dom.innerHTML = node;
        // console.log(node);
        if(visited.has(node))
            continue;
        render_randomnode(node);
        // render_edges(preds);

        let cached = is_cached(node); 
        let data;
        if(cached !== -1){
            data = DATA_CACHE[cached];
        } else {
            data = await fetch_similars(node);
            DATA_CACHE.push(data);
        }
        let entry = await data.get_names();
        let match_entry = await data.get_matches();
        nodes = nodes.concat(entry);
        matches = matches.concat(match_entry);
        preds[nodes.indexOf(node)] = nodes.length;
        visited.add(node);
    }
    // console.log(preds);
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
    
    // console.log(nodes, preds);
    // console.log(child_index, parent_range);
    // console.log(parent_index, parent);
    
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
    // console.log(match_list);
    return Math.min(...match_list);
}

})