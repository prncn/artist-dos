const found_dom = document.getElementById('found-artists'); // HTML list of displayed artists
const search_dom = document.getElementById('artist-key'); // HTML search box


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
 */
async function render_artists() {
    artist_key = search_dom.value;
    search_dom.value = '';
    found_dom.innerHTML = '';
    let artist_data = await fetch_similars(artist_key);
    let names = await artist_data.get_names();

    found_dom.insertAdjacentHTML('beforeend', `<strong>${artist_data.origin}:<strong>`);
    for(let name of names){
        found_dom.insertAdjacentHTML('beforeend', `<li>${name}</li>`);
    }
    await bidirect_search(artist_data.origin, "Rich Brian");
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
    const max_distance = 8;
    let distance = 0;
    let visited_a = new Set();
    let visited_b = new Set();
    let preds_a = [];
    let preds_b = [];


    while(distance < max_distance){
        // console.log(nodes_a, nodes_b);
        if(distance == max_distance - 1)
            console.log(`Over ${max_distance - 1} degrees.`)

        for (let node of nodes_a){
            if(visited_a.has(node))
                continue;
            data = await fetch_similars(node);
            entry = await data.get_names();
            nodes_a = nodes_a.concat(entry);
            preds_a[nodes_a.indexOf(node)] = nodes_a.length;
            visited_a.add(node);
        }
        if(nodes_a.some(n => nodes_b.includes(n))){ // Check if intersection between node B and node A neighbors
            let inters = nodes_a.filter(n => nodes_b.includes(n))[0];
            let path = trace_path(nodes_a, preds_a, nodes_b, preds_b, inters, artist_a, artist_b);
            console.log(path);
            // console.log(distance);
            return distance;
        } 
        distance += 1;
        
        for (let node of nodes_b){
            if(visited_b.has(node))
                continue;
            data = await fetch_similars(node);
            entry = await data.get_names();
            nodes_b = nodes_b.concat(entry);
            preds_b[nodes_b.indexOf(node)] = nodes_b.length;
            visited_b.add(node);
        }
        if(nodes_b.some(n => nodes_a.includes(n))){ // Check if intersection between node A and node B neighbors
            let inters = nodes_b.filter(n => nodes_a.includes(n))[0];
            let path = trace_path(nodes_a, preds_a, nodes_b, preds_b, inters, artist_a, artist_b);
            console.log(path);
            // console.log(distance);
            return distance;
        }     
        distance += 1;
    }
}


/**
 * Returns the parent node of a given child node.
 * @param {array of strings} nodes  list of total BFS area 
 * @param {array of strings} preds  list of predecessors
 * @param {string} child            child node of which the parent will be searched
 */
function get_parent(nodes, preds, child){
    let inters_index = nodes.indexOf(child);
    if(inters_index === -1){
        console.log(`ERROR child ${child} not found in nodes`);
        return false;
    }
    let parent_range = preds.find(x => x >= inters_index);
    let parent_index = preds.indexOf(parent_range);
    let parent = nodes[parent_index];

    console.log(child, inters_index, parent_range, preds);
    
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
function trace_path(nodes_a, preds_a, nodes_b, preds_b, inters, artist_a, artist_b){
    let path = [];
    let left_path = [];
    let source_inters = inters;

    while(inters !== artist_a){
        let temp = get_parent(nodes_a, preds_a, inters);
        if(!temp) return false;
        inters = temp;
        left_path.push(inters);
    }
    path = path.concat(left_path.reverse());

    inters = source_inters;
    path.push(inters);
    while(inters !== artist_b){
        let temp = get_parent(nodes_b, preds_b, inters);
        if(!temp) return false;
        inters = temp;
        path.push(inters);
    }
    return path;
}