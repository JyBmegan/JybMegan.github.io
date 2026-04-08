// ---------------------------------------------
// scripts.js
// ---------------------------------------------

const contentDir = 'contents/';
const sections = ['top','meetme','publications','awards','blog','traveling','download','contact'];

window.addEventListener('DOMContentLoaded', () => {
  initNav();
  loadConfig();
  loadSections();
});

// 1. 导航滚动高亮 & 收起
function initNav() {
  const nav = document.querySelector('#mainNav');
  if (nav) new bootstrap.ScrollSpy(document.body, { target:'#mainNav', offset:74 });
  const toggler = document.querySelector('.navbar-toggler');
  document.querySelectorAll('#navbarResponsive .nav-link').forEach(a =>
    a.addEventListener('click', () => {
      if (getComputedStyle(toggler).display !== 'none') toggler.click();
    })
  );
}

// 2. 加载 config.yml
function loadConfig() {
  fetch(`${contentDir}config.yml`)
    .then(r => r.text())
    .then(txt => {
      const cfg = jsyaml.load(txt);
      Object.entries(cfg).forEach(([id, html]) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
      });
    })
    .catch(console.error);
}

// 3. 加载各板块 Markdown

function loadSections() {
  marked.use({ mangle:false, headerIds:false });
  sections.forEach(name => {
    const isTravelingSection = (name === 'traveling');
    const md = isTravelingSection ? 'map.md' : `${name}.md`;
    fetch(`${contentDir}${md}`)
      .then(r => r.ok ? r.text() : Promise.reject(r.status))
      .then(txt => {
        // 如果是 traveling 板块，内容本身就是 HTML，无需解析。
        // 否则，使用 marked 解析 Markdown。
        const html = isTravelingSection ? txt : marked.parse(txt);
        
        const id = isTravelingSection ? 'map-md' : `${name}-md`;
        const container = document.getElementById(id);
        if (container) {
          container.innerHTML = html;
          // 初始化地图的调用保持不变
          if (isTravelingSection) initMap();
        }
      })
      .catch(err => console.error(`加载 ${md} 失败:`, err)); // 优化了错误输出
  });
}

// ---------------------------------------------
// 地图 & 照片 逻辑
// ---------------------------------------------
let chart, currentMode = 'china';

// 照片计数 { 'cityCode-provPinyin': count }
const imageCounts = {
  '110101-beijing': 2,
  '110108-beijing': 1,
  '130300-hebei': 2,
  '130600-hebei': 5,
  '152500-neimenggu': 4,
  '220600-jilin': 6,
  '310115-shanghai': 4,
  '310118-shanghai': 1,
  '320100-jiangsu': 5,
  '320200-jiangsu': 3,
  '320500-jiangsu': 2,
  '320700-jiangsu': 4,
  '321000-jiangsu':5,
  '330100-zhejiang': 2,
  '330200-zhejiang': 5,
  '330400-zhejiang': 4,
  '341000-anhui': 3,
  '341800-anhui': 1,
  '350200-fujian': 2,
  '361100-jiangxi': 1,
  '370200-shandong': 3,
  '420100-hubei': 4,
  '430100-hunan': 7,
  '440100-guangdong': 3,
  '440500-guangdong': 7,
  '445100-guangdong': 4,
  '450100-guangxi': 2,
  '450600-guangxi': 9,
  '460200-hainan': 2,
  '500103-chongqing':  4,
  '500108-chongqing': 1,
  '500109-chongqing': 1,
  '530100-yunnan': 2,
  '530700-yunnan': 5,
  '532900-yunnan': 4,
  '810005-xianggang': 2,
  '810010-xianggang': 1,
  '820002-aomen': 2



};

// 省中⇄拼映射
const provMap = { 
'湖北':'hubei',
'广东':'guangdong', 
'云南':'yunnan' , 
'江苏':'jiangsu', 
'浙江':'zhejiang', 
'重庆':'chongqing', 
'山东':'shandong',
'福建':'fujian',
'安徽':'anhui',
'内蒙古':'neimenggu',
'河北':'hebei',
'吉林':'jilin',
'海南':'hainan',
'上海':'shanghai',
'广西':'guangxi',
'江西':'jiangxi',
'北京':'beijing',
'湖南':'hunan',
'澳门':'aomen',
'香港':'xianggang'

};

// 城市编码⇄名映射
const cityMap = { 
	'420100':'武汉市',
	'440500':'汕头市',
	'445100':'潮州市',
	'530100':'昆明市', 
	'320500':'苏州市', 
	'330200':'宁波市', 
	'500100':'重庆市', 
	'370200':'青岛市', 
	'530700':'丽江市', 
	'532900':'大理白族自治州', 
	'500103':'渝中区', 
	'500109':'北碚区',
	'330100':'杭州市',
	'341800':'宣城市',
	'350200':'厦门市',
	'152500':'锡林郭勒盟',
	'130300':'秦皇岛市',
  '130600':'保定市',
	'341000':'黄山市',
	'220600':'白山市',
	'460200':'三亚市',
	'330400':'嘉兴市',
	'310115':'浦东新区',
	'450600':'防城港市',
	'361100':'上饶市',
	'320700':'连云港市',
	'321000':'扬州市',
	'500108':'南岸区',
	'320200':'无锡市',
	'450100':'南宁市',
	'320100':'南京市',
	'310118':'青浦区',
	'110108':'海淀区',
	'110101':'东城区',
  '430100':'长沙市',
  '820002':'花王堂区',
  '440100':'广州市',
  '810005':'油尖旺区',
  '810010':'荃湾区'
	
	
}
// 有照片的省份中文名列表
const provincesWithPhotos = Array.from(
  new Set(Object.keys(imageCounts).map(k => k.split('-')[1]))
).map(py => Object.keys(provMap).find(name => provMap[name] === py));

const citiesWithPhotos = Object.keys(imageCounts).map(key => {
    const code = key.split('-')[0];
    return cityMap[code] || code; // 如果在映射表里找不到，就兜底显示 code
});

// 初始化地图
function initMap() {
  const dom = document.getElementById('map-container');
  chart = echarts.init(dom);

  chart.on('click', params => {
    if (currentMode === 'china') {
      const py = provMap[params.name];
      if (py) loadProvince(params.name, py);
    } else {
      const code = Object.keys(cityMap).find(c => cityMap[c] === params.name);
      showCityPhotos(code, `${code}-${currentMode}`);
    }
  });

  loadChina();
  initStats();
}

// 加载全国并高亮
function loadChina() {
  currentMode = 'china';
  document.getElementById('backChinaBtn').style.display = 'none';

fetch('map/china.json')
    .then(r => r.json())
    .then(geo => {
      echarts.registerMap('china', geo);
      chart.setOption({
        tooltip: { 
          trigger:'item',
          formatter: function(params) {
            const pinyin = provMap[params.name];
            // 计算该省份下所有城市的照片总数
            const total = Object.keys(imageCounts)
              .filter(k => k.endsWith(`-${pinyin}`))
              .reduce((sum, k) => sum + imageCounts[k], 0);
            return `${params.name}<br/>Photos: ${total}`;
          }
        },
        series:[{
          type:'map', map:'china', roam:true,
          emphasis:{ label:{show:false}, itemStyle:{areaColor:'#8badc4'} },
          selectedMode: {
            itemStyle: {areaColor:'#405462'}
          },
          data: provincesWithPhotos.map(name=>({
            name,
            itemStyle: { areaColor:'#1c4c6d', borderColor:'#fff' }
          }))
        }]
      });
    })
    .catch(err => console.error('加载全国地图失败:', err));
}

// 加载省级
// 加载省级
function loadProvince(name, pinyin) {
  currentMode = pinyin;
  const btn = document.getElementById('backChinaBtn');
  btn.style.display = ''; 
  btn.onclick = loadChina;

  fetch(`map/province/${pinyin}.json`)
    .then(r => r.json())
    .then(geo => {
      // 1. 注册该省的 map
      echarts.registerMap(name, geo);

      // 2. 找出这个省里有照片的所有城市 code
      const cityCodes = Object
        .keys(imageCounts)
        .filter(k => k.endsWith(`-${pinyin}`))
        .map(k => k.split('-')[0]);

      // 3. 构造 ECharts 要用的 data：把城市中文名和样式打平
      const cityData = cityCodes.map(code => ({
        name: cityMap[code],
        itemStyle: { areaColor: '#1c4c6d', borderColor: '#fff' }
      }));

      // 4. 更新图表：高亮这些城市
      chart.setOption({
        tooltip: { 
          trigger: 'item',
          // 🌟 核心修复：显示具体城市的照片数
          formatter: function(params) {
            // 在映射表里根据名字找对应的 code-pinyin 键
            const key = Object.keys(imageCounts).find(k => cityMap[k.split('-')[0]] === params.name && k.endsWith(`-${pinyin}`));
            const count = imageCounts[key] || 0;
            return `${params.name}<br/>Photos: ${count}`;
          }
        },
	series: [{
  	type: 'map',
  	map: name,
  	layoutCenter: ['50%', '50%'],
  	layoutSize: '85%',
       center: geo.features[0].properties.cp || [104, 35], // geoJSON 里的 cp 是中心点
	zoom: 1.2,
  	roam: true,
  	emphasis: {
    		label: { show: false },
    		itemStyle: { areaColor: '#6c9bc5' }
  	},
    // selectedMode: 'single',
    select:{
      itemStyle:{areaColor: '#405462'}
    },
  	data: cityData
}]

      });
    })
    .catch(err => console.error('加载省级地图失败:', err));
}


// 弹出城市照片
function showCityPhotos(code, key) {
  const cnt = imageCounts[key] || 0;
  if (cnt === 0) {
    return alert((cityMap[code]||'') + ' 无照片');
  }
  const label = document.getElementById('cityGalleryModalLabel');
  const body  = document.getElementById('cityGalleryBody');
  label.innerText = cityMap[code] + ' 的照片';
  body.innerHTML = '';
  const [cityCode, pinyin] = key.split('-');
  for (let i=1; i<=cnt; i++) {
    const img = document.createElement('img');
    img.src = `imgs/${cityCode}_${pinyin}_${i}.jpg`;
    img.style.maxWidth='90%'; img.style.margin='10px';
    body.appendChild(img);
  }
  new bootstrap.Modal(document.getElementById('cityGalleryModal')).show();
}

// ---------------------------------------------
// 悬浮统计面板逻辑
// ---------------------------------------------

// 将数据填入右下角悬浮窗
function initStats() {
    const provCountSpan = document.getElementById('stat-prov-count');
    const cityCountSpan = document.getElementById('stat-city-count');
    
    if(provCountSpan) provCountSpan.innerText = provincesWithPhotos.length;
    if(cityCountSpan) cityCountSpan.innerText = citiesWithPhotos.length;
}

// 渲染并显示详情 Modal (挂载到 window 以便 HTML 中的 onclick 能调用)
window.showStatsModal = function() {
    const body = document.getElementById('statsModalBody');
    
    // 生成 Badge 样式的 HTML 列表
    const generateBadges = (arr) => arr.map(item => 
        `<span style="background-color: #f0f4f8; color: #1c4c6d; padding: 6px 12px; 
               border-radius: 20px; font-size: 0.9rem; border: 1px solid #cce0ef; 
               box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            ${item}
        </span>`
    ).join('');

    body.innerHTML = `
        <h6 style="color:#1c4c6d; font-weight:bold; border-bottom: 2px solid #eee; padding-bottom: 8px; margin-bottom: 15px;">
            Provinces (${provincesWithPhotos.length})
        </h6>
        <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom: 30px;">
            ${generateBadges(provincesWithPhotos)}
        </div>
        
        <h6 style="color:#1c4c6d; font-weight:bold; border-bottom: 2px solid #eee; padding-bottom: 8px; margin-bottom: 15px;">
            Cities (${citiesWithPhotos.length})
        </h6>
        <div style="display:flex; flex-wrap:wrap; gap:10px;">
            ${generateBadges(citiesWithPhotos)}
        </div>
    `;
    
    // 弹出 Modal
    new bootstrap.Modal(document.getElementById('statsModal')).show();
};
