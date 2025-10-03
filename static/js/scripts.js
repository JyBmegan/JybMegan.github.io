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
  '320500-jiangsu': 2,
  '330100-zhejiang': 1,
  '330200-zhejiang': 5,
  '341800-anhui': 1,
  '350200-fujian': 2,
  '370200-shandong': 3,
  '420100-hubei': 4,
  '440500-guangdong': 7,
  '445100-guangdong': 4,
  '500103-chongqing':  4,
  '500109-chongqing': 1,
  '530100-yunnan': 2,
  '530700-yunnan': 5,
  '532900-yunnan': 4,
  '152500-neimenggu': 4,
  '130300-hebei': 2,
  '341000-anhui': 3


};

// 省中⇄拼映射
const provMap = { 
'湖北省':'hubei',
'广东省':'guangdong', 
'云南省':'yunnan' , 
'江苏省':'jiangsu', 
'浙江省':'zhejiang', 
'重庆市':'chongqing', 
'山东省':'shandong',
'福建省':'fujian',
'安徽省':'anhui',
'内蒙古自治区':'neimenggu',
'河北省':'hebei'

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
	'341000':'黄山市'
}
// 有照片的省份中文名列表
const provincesWithPhotos = Array.from(
  new Set(Object.keys(imageCounts).map(k => k.split('-')[1]))
).map(py => Object.keys(provMap).find(name => provMap[name] === py));

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
        tooltip: { trigger:'item' },
        series:[{
          type:'map', map:'china', roam:true,
          emphasis:{ label:{show:true}, itemStyle:{areaColor:'#FFD700'} },
          data: provincesWithPhotos.map(name=>({
            name,
            itemStyle: { areaColor:'#FF7F50', borderColor:'#fff' }
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
        itemStyle: { areaColor: '#FF7F50', borderColor: '#fff' }
      }));

      // 4. 更新图表：高亮这些城市
      chart.setOption({
        tooltip: { trigger: 'item' },
	series: [{
  	type: 'map',
  	map: name,
  	layoutCenter: ['50%', '50%'],
  	layoutSize: '85%',
       center: geo.features[0].properties.cp || [104, 35], // geoJSON 里的 cp 是中心点
	zoom: 1.2,
  	roam: true,
  	emphasis: {
    		label: { show: true },
    		itemStyle: { areaColor: '#FFD700' }
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
