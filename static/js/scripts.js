// ---------------------------------------------
// scripts.js
// ---------------------------------------------
const contentDir = 'contents/';
const sectionNames = ['top','meetme','publications','awards','blog','traveling','download'];

// 等待 DOM 完全加载
window.addEventListener('DOMContentLoaded', () => {
  setupNav();
  loadConfig();
  loadSections();
});

// 1. 导航滚动高亮 & 收起
function setupNav() {
  const nav = document.querySelector('#mainNav');
  if (nav) new bootstrap.ScrollSpy(document.body, { target:'#mainNav', offset:74 });

  const toggler = document.querySelector('.navbar-toggler');
  document.querySelectorAll('#navbarResponsive .nav-link')
    .forEach(link => link.addEventListener('click', () => {
      if (getComputedStyle(toggler).display !== 'none') toggler.click();
    }));
}

// 2. 加载 config.yml（JS-YAML）
function loadConfig() {
  fetch(`${contentDir}config.yml`)
    .then(res => res.text())
    .then(txt => {
      const cfg = jsyaml.load(txt);
      Object.entries(cfg).forEach(([id, html]) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
      });
    })
    .catch(console.error);
}

// 3. 加载 Markdown 各板块
function loadSections() {
  marked.use({ mangle:false, headerIds:false });
  sectionNames.forEach(name => {
    const md = name === 'traveling' ? 'map.md' : `${name}.md`;
    fetch(`${contentDir}${md}`)
      .then(res => {
        if (!res.ok) throw new Error(res.status);
        return res.text();
      })
      .then(markdown => {
        const html = marked.parse(markdown);
        const container = document.getElementById(
          name === 'traveling' ? 'map-md' : `${name}-md`
        );
        if (!container) return;
        container.innerHTML = html;
        if (name === 'traveling') initTravelMap();
      })
      .catch(err => console.error('加载 Markdown 失败：', err));
  });
}

// ---------------------------------------------
// 地图与图片逻辑
// ---------------------------------------------

let chinaChart, provinceChart;

// 图片数量：键格式 "省拼音-城市邮编"
const imageCounts = {
  'hubei-420100': 2,
  'guangdong-440500': 2,
  'guangdong-445100': 1,
  'yunnan-530100': 1
};

// 城市和省映射
const cityCodeToName = {
  '420100':'武汉市','440500':'汕头市','445100':'潮州市','530100':'昆明市'
};
const provinceNameToPinyin = {
  '北京':'beijing','天津':'tianjin','上海':'shanghai','重庆':'chongqing',
  '河北':'hebei','山西':'shanxi','辽宁':'liaoning','吉林':'jilin',
  '黑龙江':'heilongjiang','江苏':'jiangsu','浙江':'zhejiang','安徽':'anhui',
  '福建':'fujian','江西':'jiangxi','山东':'shandong','河南':'henan',
  '湖北':'hubei','湖南':'hunan','广东':'guangdong','海南':'hainan',
  '四川':'sichuan','贵州':'guizhou','云南':'yunnan','陕西':'shanxi1',
  '甘肃':'gansu','青海':'qinghai','台湾':'taiwan','内蒙古':'neimenggu',
  '广西':'guangxi','西藏':'xizang','宁夏':'ningxia','新疆':'xinjiang',
  '香港':'xianggang','澳门':'aomen'
};

// 预处理照片省份/城市列表
function processImageData() {
  const provinces = new Set(), cities = {};
  Object.keys(imageCounts).forEach(key => {
    const [pinyin, code] = key.split('-');
    const pname = Object.keys(provinceNameToPinyin)
                        .find(n => provinceNameToPinyin[n] === pinyin);
    const cname = cityCodeToName[code];
    if (pname && cname) {
      provinces.add(pname);
      (cities[pname] = cities[pname]||[]).push(cname);
    }
  });
  return { provinces: [...provinces], cities };
}
const processed = processImageData();

// 通用 ECharts 配置构建
function getMapOptions(mapName, data) {
  return {
    tooltip: { trigger:'item' },
    series: [{
      type:'map', map:mapName, roam:true,
      emphasis:{ label:{show:true}, itemStyle:{areaColor:'#FFD700'} },
      data: data.map(d => ({
        name:d.name,
        itemStyle:{ areaColor:'#1E90FF', borderColor:'#fff' }
      }))
    }]
  };
}

// 初始化全国地图
function initTravelMap() {
  const container = document.getElementById('map-container');
  const inline = document.getElementById('province-inline-container');
  if (!container) return;

  // 隐藏省级
  inline.classList.add('hidden');
  chinaChart = echarts.init(container);

  fetch('map/china.json')
    .then(r => r.json())
    .then(geo => {
      echarts.registerMap('china', geo);
      const data = processed.provinces.map(name => ({ name }));
      chinaChart.setOption(getMapOptions('china', data));

      // 点击省份
      chinaChart.off('click');
      chinaChart.on('click', params => {
        const prov = params.name;
        const pinyin = provinceNameToPinyin[prov];
        if (pinyin) renderProvinceMap(prov, pinyin);
      });
    })
    .catch(err => console.error('加载全国地图失败：', err));
}

// 渲染省级地图并绑定事件
function renderProvinceMap(name, pinyin) {
  fetch(`map/province/${pinyin}.json`)
    .then(r => r.json())
    .then(geo => {
      echarts.registerMap(name, geo);

      // 准备容器
      const inline = document.getElementById('province-inline-container');
      inline.classList.remove('hidden');
      if (chinaChart) chinaChart.dispose();
      provinceChart = echarts.init(inline);

      const data = (processed.cities[name] || []).map(n => ({ name:n }));
      provinceChart.setOption(getMapOptions(name, data));

      // 返回全国
      document.getElementById('backToChina').onclick = () => initTravelMap();

      // 城市点击
      provinceChart.off('click');
      provinceChart.on('click', p => {
        const city = p.name;
        const code = Object.keys(cityCodeToName)
                           .find(c => cityCodeToName[c] === city);
        const key = `${pinyin}-${code}`;
        const count = imageCounts[key] || 0;
        if (!count) return alert(`${city} 无照片`);

        // 填充并展示 Modal
        const label = document.getElementById('cityGalleryModalLabel');
        const body  = document.getElementById('cityGalleryBody');
        label.innerText = `${city} 的照片`;
        body.innerHTML  = '';
        for (let i = 1; i <= count; i++) {
          const img = document.createElement('img');
          img.src = `imgs/${code}_${pinyin}_${i}.jpg`;
          img.style.maxWidth = '90%';
          img.style.margin = '10px';
          body.appendChild(img);
        }
        new bootstrap.Modal(document.getElementById('cityGalleryModal')).show();
      });
    })
    .catch(err => console.error('加载省级地图失败：', err));
}
