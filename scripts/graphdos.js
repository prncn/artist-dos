const found_dom = document.getElementById('found-artists');
let origin_name;

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

async function get_names(artist) {
    let names = [];
    await fetch_similars(artist)
    .then(resp => resp.forEach(item => {
        if(item.name.includes(origin_name)){
            console.log("duplicate at " + item.name);
        }
        else{
            names.push(item.name)
        }
    }))
    return names;
}

document.getElementById('search-btn').onclick = () => {
    let artist_key = document.getElementById('artist-key').value;
    document.getElementById('artist-key').value = '';
    found_dom.innerHTML = '';
    get_names(artist_key).then(names => {
        found_dom.insertAdjacentHTML('beforeend', `<strong>${origin_name}:<strong>`);
        names.forEach(name => {
            found_dom.insertAdjacentHTML('beforeend', `<li>${name}</li>`);
        });
    })
}