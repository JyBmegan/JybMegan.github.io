<div id="mapContainer" style="width:100%;height:600px;margin:0 auto;"></div>
<div id="gallery"      style="margin:20px auto;text-align:center;"></div>

<script>
// —— 全局状态 ——  
let currentGeo = null;  // 存当前加载的 GeoJSON

// localStorage 里记录已访问省、市
const visited = {
  provinces: JSON.parse(localStorage.getItem('visitedProvinces') || '[]'),
  cities:     JSON.parse(localStorage.getItem('visitedCities')    || '{}')
};

// 初始化 ECharts 实例
const chart = echarts.init(document.getElementById('mapContainer'));

// 保存状态到 localStorage
function save() {
  localStorage.setItem('visitedProvinces', JSON.stringify(visited.provinces));
  localStorage.setItem('visitedCities',    JSON.stringify(visited.cities));
}

// 生成地图配置  
function optionForMap(mapName, highlighted, level) {
  return {
    title: {
      text: level === 'province'
            ? '中国 —— 点击省份标记已去过'
            : `${mapName} —— 点击城市/县标记已去过`,
      left: 'center'
    },
    tooltip: { trigger: 'item' },
    visualMap: {
      show: false,
      pieces: [{ value:1, label:'已去过', color:'#87CEFA' }],
      categories: ['visited']
    },
    series: [{
      type: 'map',
      map: mapName,
      roam: true,
      emphasis: { label: { show: true } },
      data: highlighted.map(n => ({ name: n, value: 1 }))
    }]
  };
}

// 加载并渲染中国地图  
function loadChina() {
  fetch('/maps/china.json')
    .then(r => r.json())
    .then(geo => {
      currentGeo = geo;
      echarts.registerMap('china', geo);
      chart.setOption(optionForMap('china', visited.provinces, 'province'));
    });
}

// 点击交互：省 → 市／县  
chart.on('click', params => {
  const name = params.name;
  if (!name) return;

  const currentMap = chart.getOption().series[0].map;

  // —— 在中国图上点击省份 ——  
  if (currentMap === 'china') {
    // 切换省份访问状态
    const pi = visited.provinces.indexOf(name);
    if (pi >= 0) visited.provinces.splice(pi,1);
    else visited.provinces.push(name);
    save();
    loadChina();  // 先重绘中国地图以保留高亮

    // 钻入省级地图（文件名：province/<省名小写>.json）
    const provFile = `${name.toLowerCase()}.json`;
    fetch(`/maps/province/${provFile}`)
      .then(r => r.json())
      .then(geo => {
        currentGeo = geo;
        echarts.registerMap(name, geo);
        chart.setOption(optionForMap(name, visited.cities[name]||[], 'city'));
      });
  }
  // —— 在省级图上点击市／县 ——  
  else {
    const prov = currentMap;
    visited.cities[prov] = visited.cities[prov] || [];
    const arr = visited.cities[prov];
    const ci = arr.indexOf(name);
    if (ci >= 0) arr.splice(ci,1);
    else arr.push(name);
    save();
    chart.setOption(optionForMap(prov, arr, 'city'));

    // 仅当新标记为“已去过”时弹出图集
    if (arr.includes(name)) showGallery(prov, name);
  }
});

// —— 图集映射 ——  
// key 格式：'省名小写–市级编码'  
const images = {
  'hubei–420100': [
    '/imgs/420100_wuhan_1.jpg',
    '/imgs/420100_wuhan_2.png'
  ],
  'guangdong–440500': [
    '/imgs/440500_shantou_1.jpg',
    '/imgs/440500_shantou_2.png',
    '/imgs/440500_shantou_3.png'
  ],
  'guangdong–445100': [
    '/imgs/445100_chaozhou_1.jpg',
    '/imgs/445100_chaozhou_2.png'
  ],
  'yunnan–530100': [
    '/imgs/530100_kunming_1.jpg'
  ]
  // …根据需要继续补充
};

// 可选：若要从市名自动映射到编码，可维护一张表
const cityCodeMap = {
  'Wuhan':    '420100',
  'Shantou':  '440500',
  'Chaozhou': '445100',
  'Kunming':  '530100'
  // …自己补全
};

// 显示图集  
function showGallery(prov, city) {
  // 先取编码：要么直接 cityCodeMap[city]，要么 city 本身就是编码
  const code = cityCodeMap[city] || city;
  const key = `${prov.toLowerCase()}–${code}`;
  const imgs = images[key] || [];
  document.getElementById('gallery').innerHTML =
    imgs.map(u => 
      `<img src="${u}" style="width:200px;margin:5px;
         border:1px solid #ccc;border-radius:4px;">`
    ).join('');
}

// 启动  
loadChina();
</script>
