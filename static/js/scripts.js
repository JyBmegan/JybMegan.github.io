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

function initNav() {
  const nav = document.querySelector('#mainNav');
  if (nav) new bootstrap.ScrollSpy(document.body, { target:'#mainNav', offset:74 });
  const toggler = document.querySelector('.navbar-toggler');
  document.querySelectorAll('#navbarResponsive .nav-link')
    .forEach(a => a.addEventListener('click', () => {
      if (getComputedStyle(toggler).display !== 'none') toggler.click();
    }));
}

function loadConfig() {
  fetch(`${contentDir}config.yml`).then(r => r.text()).then(txt => {
    const cfg = jsyaml.load(txt);
    Object.entries(cfg).forEach(([id, html]) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    });
  }).catch(console.error);
}

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
      .catch(err => console.error('加载 Markdown 失败', err));
  });
}

// ---------------------------------------------
// 地图 & 照片
// ---------------------------------------------

let chart;      // 当前 ECharts 实例
let isChina = true; // 当前显示全国还是省级

// 配置照片：每项是 城市邮编-省拼音: 照片数量
const imageCounts = {
  '420100-hubei': 2,
  '440500-guangdong': 2,
  '445100-guangdong': 1,
  '530100-yunnan': 1
};

// 地图名称映射
const cityNameMap = { '420100':'武汉市','440500':'汕头市','445100':'潮州市','530100':'昆明市' };
const provMap = {
  '湖北':'hubei','广东':'guangdong','云南':'yunnan'
  // …补全其他省
};

function initMap() {
  const dom = document.getElementById('map-container');
  chart = echarts.init(dom);
  loadChina();
  chart.on('click', params => {
    if (isChina) {
      const prov = params.name;
      const py = provMap[prov];
      if (py) loadProvince(prov, py);
    } else {
      const city = params.name;
      const code = Object.keys(cityNameMap).find(k=>cityNameMap[k]===city);
      const key = `${code}-${getCurrentProvPinyin()}`;
      showCityPhotos(code, key);
    }
  });
}

function loadChina() {
  isChina = true;
  fetch('map/china.json').then(r=>r.json()).then(geo => {
    echarts.registerMap('china', geo);
    const provinces = Object.keys(provMap).map(n=>({ name:n }));
    chart.setOption({ 
      tooltip:{trigger:'item'},
      series:[{ type:'map', map:'china', roam:true, data:provinces }]
    });
  });
}

function loadProvince(name, pinyin) {
  isChina = false;
  fetch(`map/province/${pinyin}.json`).then(r=>r.json()).then(geo => {
    echarts.registerMap(name, geo);
    chart.setOption({
      tooltip:{trigger:'item'},
      series:[{ type:'map', map:name, roam:true, data:[] }]
    });
    // 添加“← 返回全国”按钮
    addBackButton();
  });
}

function addBackButton() {
  // 插入一个浮在图上的小按钮
  const dom = chart.getDom();
  let btn = document.getElementById('backChinaBtn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'backChinaBtn';
    btn.innerText = '← 全国';
    btn.style = 'position:absolute; top:10px; left:10px; z-index:10;';
    btn.className = 'btn btn-secondary btn-sm';
    dom.appendChild(btn);
    btn.addEventListener('click', loadChina);
  }
}

function getCurrentProvPinyin() {
  // 读取当前地图名称
  const opt = chart.getOption();
  return provMap[opt.series[0].map];
}

function showCityPhotos(code, key) {
  const cnt = imageCounts[key] || 0;
  if (cnt===0) {
    alert(cityNameMap[code] + ' 无照片');
    return;
  }
  const label = document.getElementById('cityGalleryModalLabel');
  const body  = document.getElementById('cityGalleryBody');
  label.innerText = cityNameMap[code] + ' 的照片';
  body.innerHTML = '';
  const [cityCode, pinyin] = key.split('-');
  for (let i=1; i<=cnt; i++) {
    const img = document.createElement('img');
    img.src = `imgs/${cityCode}_${pinyin}_${i}.jpg`;
    body.appendChild(img);
  }
  new bootstrap.Modal(document.getElementById('cityGalleryModal')).show();
}
