const api_key = '74276898ee7faad0825b302a0abe5f07' 
const method = 'http://ws.audioscrobbler.com/2.0/?'

async function fetch_similars(artist) {
    try {
        let data = await fetch(method + `method=artist.getsimilar&artist=${artist}&api_key=${api_key}&format=json`)
        .then( resp => resp.json() )
        .then( resp => resp.similarartists.artist );
        return data;
    } catch (error) {
        console.log(error);
    }
}

async function log_similar(artist) {
    let found = [];
    fetch_similars(artist).then( data => {
        data.slice(0, 5).forEach( artist => {
            //console.log(artist.name)
            found.push(artist.name);
        });
        console.log(found);
    });
}

document.getElementById('search-btn').onclick = () => {
    let key = document.getElementById('artist-key').value;
    let found = document.getElementById('found-artists');
    //found.innerHTML = `${log_similar(key)}`
    log_similar(key);
}