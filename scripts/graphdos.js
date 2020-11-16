const found_dom = document.getElementById('found-artists'); // HTML list of displayed artists
const search_dom = document.getElementById('artist-key'); // HTML search box
let origin_name;    // corrected name of artist

/**
 * Fetches LastFM API's artist.getSimilar method
 * and returns artist objects.
 * @param {string} artist    search box input
 */
async function fetch_similars(artist) {
    const api_key = '74276898ee7faad0825b302a0abe5f07' 
    const main_url = 'https://ws.audioscrobbler.com/2.0/?'
    const limit = 10
    const autocorrect = 1;

    try {
        let data = await fetch(`${main_url}method=artist.getsimilar&limit=${limit}&artist=${artist}&api_key=${api_key}&autocorrect=${autocorrect}&format=json`)
        data = await data.json();
        origin_name = await data.similarartists["@attr"].artist;
        data = await data.similarartists.artist;
        return data;
    } catch (error) {
        console.log(error);
    }
}

/**
 * Filter fetch_similars object list to artists' names.
 * @param {string} artist   search box input
 */
async function get_names(artist) {
    let names = [];
    let data = await fetch_similars(artist);
    for(item of data){
        if(item.name.includes(origin_name)){
            console.log(`duplicate at ${item.name} (from ${origin_name})`);
        }
        else{
            names.push(item.name)
        }
    }
    return names;
}

/**
 * Callback funcion when search button is clicked.
 */
async function render_artists() {
    artist_key = search_dom.value;
    search_dom.value = '';
    found_dom.innerHTML = '';
    
    let names = await get_names(artist_key);
    found_dom.insertAdjacentHTML('beforeend', `<strong>${origin_name}:<strong>`);
    for(name of names){
        found_dom.insertAdjacentHTML('beforeend', `<li>${name}</li>`);
    }
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
    const max_distance = 15;
    let distance = 1;

    while(distance < max_distance){
        for (node of nodes_a){
            entry = await get_names(node);
            nodes_a = entry.concat(nodes_a);
        }
        if(nodes_a.some(n => nodes_b.includes(n))){ // Check if intersection between node B and node A neighbors
            return distance;
        } 
        
        distance += 1;
        
        for (node of nodes_b){
            entry = await get_names(node);
            nodes_b = entry.concat(nodes_b);
        }
        if(nodes_b.some(n => nodes_a.includes(n))){ // Check if intersection between node A and node B neighbors
            return distance;
        }
        
        distance += 1;
    }
}
bidirect_search("Drake", "Rich Brian").then(console.log); // Should return distance 3