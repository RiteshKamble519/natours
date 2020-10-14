//'dataset.locations' is received from map section from base.pug

export const displayMap = (locations) => {
    //Mapbox code
    mapboxgl.accessToken = 'pk.eyJ1Ijoicml0ZXNoa2FtYmxlNTE5IiwiYSI6ImNrZG43NjVqbTA4NHczMGxibWc2Znd2enEifQ._6Y-cHZeYlYXAOw2bHFVmw';
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/riteshkamble519/ckdn7xmmc3sz61imwin1pj0mh',
        scrollZoom: false
        // center: [-118.11, 34.11],
        // zoom: 4
    });

    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach(loc => {
        //Create Marker
        const el = document.createElement('div');
        el.className = 'marker';

        //Add Marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom' //Says marker bottom will exactly point at given coordinates
        })
            .setLngLat(loc.coordinates)
            .addTo(map);

        //Add Popup
        new mapboxgl.Popup({
            offset: 30 //Makes sure location marker and popup does not overlap
        })
            .setLngLat(loc.coordinates)
            .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
            .addTo(map)


        //Extend map bounds to include current location
        bounds.extend(loc.coordinates);

    });

    //fitBounds make sure that when we load all the locations are present in the window where the map is clearly visible 
    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100
        }
    })
}

