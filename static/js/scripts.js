<script>
// =========================================================================
// SETUP: DATA MAPPING
// =========================================================================

// 1. Map city photos to their province and city codes.
// The key is 'province_pinyin-city_adcode'.
const images = {
  'hubei-420100': ['imgs/420100_wuhan_1.jpg', 'imgs/420100_wuhan_2.png'],
  'guangdong-440500': ['imgs/440500_shantou_1.jpg', 'imgs/440500_shantou_2.png'],
  'guangdong-445100': ['imgs/445100_chaozhou_1.jpg'],
  'yunnan-530100': ['imgs/530100_kunming_1.jpg']
  // When you add photos for a new city, add a new line here.
};

// 2. Map province Pinyin (used in folder names) to Chinese names (used in map data).
const provincePinyinToName = {
    "anhui": "安徽", "beijing": "北京", "chongqing": "重庆", "fujian": "福建", 
    "gansu": "甘肃", "guangdong": "广东", "guangxi": "广西", "guizhou": "贵州", 
    "hainan": "海南", "hebei": "河北", "heilongjiang": "黑龙江", "henan": "河南", 
    "hubei": "湖北", "hunan": "湖南", "jiangsu": "江苏", "jiangxi": "江西", 
    "jilin": "吉林", "liaoning": "辽宁", "neimenggu": "内蒙古", "ningxia": "宁夏", 
    "qinghai": "青海", "shandong": "山东", "shanghai": "上海", "shanxi": "山西", 
    "shanxi1": "陕西", "sichuan": "四川", "taiwan": "台湾", "tianjin": "天津", 
    "xizang": "西藏", "xinjiang": "新疆", "yunnan": "云南", "zhejiang": "浙江",
    "xianggang": "香港", "aomen": "澳门"
};

// =========================================================================
// INITIALIZATION
// =========================================================================

// 1. Initialize ECharts instances for the main map and the modal map.
const chinaChart = echarts.init(document.getElementById('map-container'));
const provinceChart = echarts.init(document.getElementById('province-map-container'));

// 2. Automatically determine which provinces and cities have photos from the 'images' object.
let provincesWithPhotos = [];
let citiesWithPhotos = {}; // Format: { "湖北": ["武汉市"], "广东": ["汕头市", "潮州市"] }

// This loop reads your 'images' object and prepares the data for coloring the map.
for (const key in images) {
    const [provPinyin, cityCode] = key.split('-');
    const provName = provincePinyinToName[provPinyin];

    if (provName && !provincesWithPhotos.includes(provName)) {
        provincesWithPhotos.push(provName);
    }
}

// =========================================================================
// ECHARTS FUNCTIONS
// =========================================================================

// A reusable function to generate map options.
function getMapOptions(mapName, dataToHighlight) {
    return {
        tooltip: { trigger: 'item', textStyle: { fontSize: 12 } },
        visualMap: {
            show: true,
            min: 0,
            max: 1,
            left: 'left',
            top: 'bottom',
            text: ['Visited', ''],
            calculable: false,
            inRange: {
                color: ['#87CEFA', '#1E90FF'] // Colors for highlighted areas
            },
            outOfRange: {
                color: '#E0E0E0' // Color for default areas
            }
        },
        series: [{
            type: 'map',
            map: mapName,
            roam: true, // Allows zoom and pan
            emphasis: { label: { show: true }, itemStyle: { areaColor: '#FFD700' } },
            data: dataToHighlight.map(name => ({ name: name, value: 1 }))
        }]
    };
}

// Function to load the main China map.
function loadChinaMap() {
    // **FIXED PATH**: Changed '/maps/china.json' to 'map/china.json'
    fetch('map/china.json')
        .then(res => {
            if (!res.ok) throw new Error('Could not find map/china.json. Check file path.');
            return res.json();
        })
        .then(geoJson => {
            echarts.registerMap('china', geoJson);
            // The map is now initialized with the provinces that have photos!
            const options = getMapOptions('china', provincesWithPhotos);
            chinaChart.setOption(options);
        })
        .catch(err => console.error("Error loading China map:", err));
}

// =========================================================================
// CLICK EVENT HANDLERS
// =========================================================================

// 1. When a province on the MAIN a map is clicked...
chinaChart.on('click', params => {
    const provinceName = params.name; // e.g., "湖北"
    const provincePinyin = Object.keys(provincePinyinToName).find(key => provincePinyinToName[key] === provinceName);

    if (!provincePinyin) {
        console.error(`Could not find pinyin for province: ${provinceName}`);
        return;
    }

    // **FIXED PATH**: Changed '/maps/province/...' to 'map/province/...'
    const provinceMapPath = `map/province/${provincePinyin}.json`;

    fetch(provinceMapPath)
        .then(res => {
            if (!res.ok) throw new Error(`Could not find province map: ${provinceMapPath}`);
            return res.json();
        })
        .then(provinceGeoJson => {
            echarts.registerMap(provinceName, provinceGeoJson);
            
            // TODO: In the future, you can add logic here to determine which cities have photos.
            // For now, it will show a blank province map ready for clicking.
            const provinceOptions = getMapOptions(provinceName, []); 
            provinceChart.setOption(provinceOptions);

            // Update the modal title and show it.
            document.getElementById('provinceMapModalLabel').innerText = `${provinceName} 省级地图`;
            const modal = new bootstrap.Modal(document.getElementById('provinceMapModal'));
            modal.show();
        })
        .catch(err => console.error("Error loading province map:", err));
});

// 2. When a city in the PROVINCE MODAL is clicked...
provinceChart.on('click', params => {
    alert(`You clicked on: ${params.name}`);
    // Here you can add the logic to show the photo gallery for the clicked city.
});

// =========================================================================
// START THE APPLICATION
// =========================================================================
loadChinaMap();

</script>