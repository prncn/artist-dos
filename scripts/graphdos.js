const found_dom = document.getElementById('found-artists');

async function fetch_similars(artist) {
    const api_key = '74276898ee7faad0825b302a0abe5f07' 
    const main_url = 'https://ws.audioscrobbler.com/2.0/?'
    const limit = 10
    const autocorrect = 1;

    try {
        let data = await fetch(`${main_url}method=artist.getsimilar&limit=${limit}&artist=${artist}&api_key=${api_key}&autocorrect=${autocorrect}&format=json`)
        .then(resp => resp.json())
        .then(resp => resp.similarartists.artist);
        return data;
    } catch (error) {
        console.log(error);
    }
}

async function get_names(artist) {
    let names = [];
    await fetch_similars(artist)
    .then(resp => resp.forEach(item => {
        names.push(item.name)
    }))
    return names;
}

document.getElementById('search-btn').onclick = () => {
    let artist_key = document.getElementById('artist-key').value;
    document.getElementById('artist-key').value = '';
    found_dom.innerHTML = '';
    get_names(artist_key).then(names => {
        names.forEach(name => {
            found_dom.insertAdjacentHTML('beforeend', `<li>${name}</li>`);
        });
    })
}