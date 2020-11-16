const found_dom = document.getElementById('found-artists'); // HTML list of displayed artists
const search_dom = document.getElementById('artist-key'); // HTML search box
let origin_name;    // corrected name of artist

/**
 * Fetches LastFM API's artist.getSimilar method
 * and returns artist objects.
 * @param {*} artist 
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
 * @param {*} artist 
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