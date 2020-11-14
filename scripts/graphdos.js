const api_key = '74276898ee7faad0825b302a0abe5f07' 
const method = 'https://ws.audioscrobbler.com/2.0/?'

async function fetch_similars(artist) {
    try {
        let data = await fetch(method + `method=artist.getsimilar&artist=${artist}&api_key=${api_key}&format=json`)
        .then(resp => resp.json())
        .then(resp => resp.similarartists.artist);
        return data;
    } catch (error) {
        console.log(error);
    }
}

async function log_similar(artist) {
    let found = [];
    fetch_similars(artist).then(data => {
        data.slice(0, 5).forEach(artist => {
            console.log(artist.name)
            found.push(artist.name);
            document.getElementById('found-artists').insertAdjacentHTML('beforeend', `${artist.name}<br>`);
        });
        console.log(found);
        return found;
    });
}

document.getElementById('search-btn').onclick = () => {
    let key = document.getElementById('artist-key').value;
    let found_dom = document.getElementById('found-artists');
    /*
    found_dom.innerHTML = '';
    log_similar(key).forEach(artist => {
        found_dom.insertAdjacentHTML('beforeend', `<li>${artist}<li>`)
    });
    */
   document.getElementById('found-artists').innerHTML = '';
   log_similar(key);
}