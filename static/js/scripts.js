// ---------------------------------------------
// scripts.js
// ---------------------------------------------

const contentDir = 'contents/';
const sections = ['top','meetme','publications','awards','blog','traveling','download'];

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
  document.querySelectorAll('#navbarResponsive .nav-link')
    .forEach(a => a.addEventListener('click', () => {
      if (getComputedStyle(toggler).display !== 'none') toggler.click();
    }));
}

// 2. 加载 config.yml
function loadConfig() {
  fetch(`${contentDir}config.yml`).then(r => r.text()).then(txt => {
    const cfg = jsyaml.load(txt);
    Object.entries(cfg).forEach(([id, html]) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    });
  }).catch(console.error);
}

// 3. 加载各板块 Markdown
function loadSections() {
  marked.use({ mangle:false, headerIds:false });
  sections.forEach(name => {
    const md = name==='traveling' ? 'map.md' : `${name}.md`;
    fetch(`${contentDir}${md}`)
      .then(r => r.ok ? r.text() : Promise.reject(r.status))
      .then(txt => {
        const html = marked.parse(txt);
        const id = name==='traveling' ? 'map-md' : `${name}-md`;
        const container = document.getElementById(id);
        if (container) {
          container.innerHTML = html;
          if (name==='traveling') initMap();
        }
      })
      .catch(err => console.error('加载 Markdown 失败:', err));
  });
}

// ---------------------------------------------
// 地图 & 照片 逻辑
// ---------------------------------------------

let chart;
let currentMode = 'china'; // 'china' or provincePinyin

// 照片数量 { 'cityCode-provPinyin': count }
const imageCounts = {
  '420100-hubei': 2,
  '440500-guangdong': 2,
  '445100-guangdong': 1,
  '530100-yunnan': 1
};

// 名称映射
const cityMap = { '420100':'武汉市','440500':'汕头市','445100':'潮州市','530100':'昆明市' };
const provMap = {
  '湖北':'hubei','广东':'guangdong','云南':'yunnan'
  // …补全需要的省
};

// 初始化地图
function initMap() {
  const dom = document.getElementById('map-container');
  chart = echarts.init(dom);

  // 点击响应
  chart.on('click', params => {
    if (currentMode === 'china') {
      const pinyin = provMap[params.name];
      if (pinyin) loadProvince(params.name, pinyin);
    } else {
      const city = params.name;
      const code = Object.keys(cityMap).find(k => cityMap[k] === city);
      const key = `${code}-${currentMode}`;
      showCity(key, code);
    }
  });

  loadChina();
}

// 加载全国
function loadChina() {
  currentMode = 'china';
  hideBackButton();

  fetch('map/china.json').then(r=>r.json()).then(geo => {
    echarts.registerMap('china', geo);
    const data = Object.keys(provMap).map(name => ({ name }));
    chart.setOption({
      tooltip:{ trigger:'item' },
      series:[{ type:'map', map:'china', roam:true, data }]
    });
  }).catch(err => console.error('加载全国地图失败:', err));
}

// 加载省级
function loadProvince(name, pinyin) {
  currentMode = pinyin;
  showBackButton();

  fetch(`map/province/${pinyin}.json`).then(r=>r.json()).then(geo => {
    echarts.registerMap(name, geo);
    chart.setOption({
      tooltip:{ trigger:'item' },
      series:[{ type:'map', map:name, roam:true, data:[] }]
    });
  }).catch(err => console.error('加载省级地图失败:', err));
}

// 显示/隐藏返回按钮
function showBackButton() {
  document.getElementById('backChinaBtn').style.display = '';
}
function hideBackButton() {
  document.getElementById('backChinaBtn').style.display = 'none';
  document.getElementById('backChinaBtn').onclick = loadChina;
}

// 弹出城市照片
function showCity(key, code) {
  const cnt = imageCounts[key] || 0;
  if (cnt === 0) {
    alert(cityMap[code] + ' 无照片');
    return;
  }
  const label = document.getElementById('cityGalleryModalLabel');
  const body  = document.getElementById('cityGalleryBody');
  label.innerText = cityMap[code] + ' 的照片';
  body.innerHTML = '';
  const [cityCode, pinyin] = key.split('-');
  for (let i = 1; i <= cnt; i++) {
    const img = document.createElement('img');
    img.src = `imgs/${cityCode}_${pinyin}_${i}.jpg`;
    body.appendChild(img);
  }
  new bootstrap.Modal(document.getElementById('cityGalleryModal')).show();
}
