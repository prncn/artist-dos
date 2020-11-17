const found_dom = document.getElementById('found-artists'); // HTML list of displayed artists
const search_doma = document.getElementById('artist-keya'); // HTML search box
const search_domb = document.getElementById('artist-keyb');
const result_dom = document.getElementById('results-loader');

/**
 * Object describing artist data from LastFM API call.
 */
class artistData {
    /**
     * Getter for raw artists' names. Used for rendering.
     * @param {string} artist   search box input
     */
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

/**
 * Fetches LastFM API's artist.getSimilar method
 * and returns artist objects.
 * @param {string} artist    search box input
 */
async function fetch_similars(artist) {
    const api_key = '74276898ee7faad0825b302a0abe5f07' 
    const main_url = 'https://ws.audioscrobbler.com/2.0/?'
    const limit = 10;
    const autocorrect = 1;
    artist_data = new artistData;

    try {
        let data = await fetch(`${main_url}method=artist.getsimilar&limit=${limit}&artist=${artist}&api_key=${api_key}&autocorrect=${autocorrect}&format=json`)
        data = await data.json();
        artist_data.origin = await data.similarartists["@attr"].artist;
        artist_data.list = await data.similarartists.artist.filter(x => !x.name.includes("&"));
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
    let artistkey_a = search_doma.value;
    let artistkey_b = search_domb.value;
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

    const [seperation_path, match_rate] = await bidirect_search(artistkey_a, artistkey_b);
    console.log(seperation_path);
    result_dom.classList.remove('logo-bm');
    result_dom.removeChild(result_dom.getElementsByTagName('svg')[0]);
    found_dom.innerHTML = '';
    for(let name of seperation_path){
        found_dom.insertAdjacentHTML('beforeend', `<li>${name}</li>`);
    }
    found_dom.insertAdjacentHTML('beforeend', `<br><strong>Match Rate: ${(match_rate*100).toFixed(1)}%</strong>`);
}
document.getElementById('search-btn').onclick = render_artists;


/**
 * Checks if there is an intersection between neighbor nodes of node A neighbors of B.
 * Bi-directional BFS graph search.
 * @param {string} artist_a     first artist
 * @param {string} artist_b     second artist
 */
async function bidirect_search(artist_a, artist_b) {
    let nodes_a = [artist_a];
    let nodes_b = [artist_b];
    let matches_a = ["1"];
    let matches_b = ["1"];
    const max_distance = 15;
    let distance = 0;
    let visited_a = new Set();
    let visited_b = new Set();
    let preds_a = [];
    let preds_b = [];


    while(distance < max_distance){
        if(distance === max_distance - 1)
            console.log(`Over ${max_distance - 1} degrees.`);

        [nodes_a, preds_a, visited_a, matches_a] = await update_bfs(nodes_a, preds_a, visited_a, matches_a);
        if(nodes_a.some(n => nodes_b.includes(n))){         // Check if intersection between node B and node A neighbors
            let inters = nodes_a.filter(n => nodes_b.includes(n))[0];
            let path = trace_path(nodes_a, preds_a, nodes_b, preds_b, inters, artist_a, artist_b);
            let match_rate = get_matchrate(path, nodes_a, matches_a);

            return [path, match_rate];
        } 
        distance += 1;
        
        [nodes_b, preds_b, visited_b, matches_b] = await update_bfs(nodes_b, preds_b, visited_b, matches_b);
        if(nodes_b.some(n => nodes_a.includes(n))){         // Check if intersection between node A and node B neighbors
            let inters = nodes_b.filter(n => nodes_a.includes(n))[0];
            let path = trace_path(nodes_a, preds_a, nodes_b, preds_b, inters, artist_a, artist_b);
            let match_rate = get_matchrate(path, nodes_b, matches_b);
            
            return [path, match_rate];
        }     
        distance += 1;
    }
}


/**
 * Increase size of BFS search zone.
 * @param {array of strings} nodes      list of total BFS area 
 * @param {array of nums} preds         list of predecessors
 * @param {set of strings} visited      nodes that have already been discovered
 * @param {array of nums} match_rates   match rates corresponding to nodes list
 */
async function update_bfs(nodes, preds, visited, matches){
    for (let node of nodes){
        found_dom.innerHTML = node;
        console.log(node);
        if(visited.has(node))
            continue;
        let data = await fetch_similars(node);
        let entry = await data.get_names();
        let match_entry = await data.get_matches();
        nodes = nodes.concat(entry);
        matches = matches.concat(match_entry);
        preds[nodes.indexOf(node)] = nodes.length;
        visited.add(node);
    }
    return [nodes, preds, visited, matches];
}


/**
 * Returns the parent node of a given child node.
 * @param {array of strings} nodes  list of total BFS area 
 * @param {array of strings} preds  list of predecessors
 * @param {string} child            child node of which the parent will be searched
 */
function get_parent(nodes, preds, child) {
    let child_index = nodes.indexOf(child);
    if(child_index === -1) 
    throw `Index of child ${child} does not exist.`
    let parent_range = preds.find(x => x >= child_index);
    let parent_index = preds.indexOf(parent_range);
    let parent = nodes[parent_index];
    
    
    return parent;
}


/**
 * Traces back path from destination to intersection node, from intersection to source node, then concatenates.
 * @param {array of strings} nodes_a    list of total BFS area of source a
 * @param {array of nums} preds_a       list of predecessors of source a
 * @param {array of strings} nodes_b    list of total BFS area of destination b
 * @param {array of nums} preds_b       list of predecessors of destination b
 * @param {string} inters               intersecting node 
 * @param {string} artist_a             source node
 * @param {string} artist_b             destination node
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
 * @param {array of artistData} path    path from source to destination
 * @param {array of strings} nodes      list of predecessors
 * @param {array of nums} matches       match rates corresponding to nodes list
 */
function get_matchrate(path, nodes, matches){
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