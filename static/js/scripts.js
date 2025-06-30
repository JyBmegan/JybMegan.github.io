// ---------------------------------------------
// scripts.js
// ---------------------------------------------

const content_dir = 'contents/';
const config_file = 'config.yml';
const section_names = ['top', 'meetme', 'publications', 'awards', 'blog', 'traveling', 'download'];

window.addEventListener('DOMContentLoaded', () => {
  // 1. Bootstrap ScrollSpy
  const mainNav = document.querySelector('#mainNav');
  if (mainNav) {
    new bootstrap.ScrollSpy(document.body, { target: '#mainNav', offset: 74 });
  }

  // 2. 收起响应式菜单
  const navbarToggler = document.querySelector('.navbar-toggler');
  document.querySelectorAll('#navbarResponsive .nav-link').forEach(item => {
    item.addEventListener('click', () => {
      if (window.getComputedStyle(navbarToggler).display !== 'none') {
        navbarToggler.click();
      }
    });
  });

  // 3. 加载 config.yml
  fetch(content_dir + config_file)
    .then(res => res.text())
    .then(text => {
      const data = jsyaml.load(text);
      Object.entries(data).forEach(([id, html]) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
      });
    })
    .catch(console.error);

  // 4. 用 marked 加载各板块 Markdown
  marked.use({ mangle: false, headerIds: false });
  section_names.forEach(name => {
    const md = name === 'traveling' ? 'map.md' : `${name}.md`;
    fetch(content_dir + md)
      .then(res => {
        if (!res.ok) throw new Error(`无法加载 ${md}，状态 ${res.status}`);
        return res.text();
      })
      .then(txt => {
        const html = marked.parse(txt);
        const container = document.getElementById(name === 'traveling' ? 'map-md' : `${name}-md`);
        if (!container) {
          console.warn(`找不到容器 #${name}-md`);
          return;
        }
        container.innerHTML = html;
        if (name === 'traveling') initTravelMap();
      })
      .catch(err => console.error('加载 Markdown 失败：', err));
  });

  // ----- 地图 & 图片功能 -----

  let chinaChart = null;
  let provinceChart = null;

  // 照片数据 & 映射
  const imagesByCode = {
    'hubei-420100': ['imgs/420100_wuhan_1.jpg', 'imgs/420100_wuhan_2.png'],
    'guangdong-440500': ['imgs/440500_shantou_1.jpg', 'imgs/440500_shantou_2.png'],
    'guangdong-445100': ['imgs/445100_chaozhou_1.jpg'],
    'yunnan-530100': ['imgs/530100_kunming_1.jpg']
  };
  const cityCodeToName = {
    '420100': '武汉市',
    '440500': '汕头市',
    '445100': '潮州市',
    '530100': '昆明市'
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

  function processImageData() {
    const provs = new Set(), cities = {};
    for (let key in imagesByCode) {
      const [pinyin, code] = key.split('-');
      const name = Object.keys(provinceNameToPinyin).find(n => provinceNameToPinyin[n] === pinyin);
      const cname = cityCodeToName[code];
      if (name && cname) {
        provs.add(name);
        cities[name] = cities[name]||[];
        cities[name].push(cname);
      }
    }
    return { provinces: [...provs], cities };
  }
  const processed = processImageData();

  function getMapOptions(mapName, highlightData) {
    return {
      tooltip: { trigger: 'item' },
      series: [{
        type: 'map',
        map: mapName,
        roam: true,
        emphasis: { label: { show: true }, itemStyle: { areaColor: '#FFD700' } },
        data: highlightData.map(n => ({
          name: n.name,
          itemStyle: { areaColor: '#1E90FF', borderColor: '#fff' }
        }))
      }]
    };
  }

  function renderProvinceMap(provName, provPinyin) {
    fetch(`map/province/${provPinyin}.json`)
      .then(r => r.json())
      .then(geo => {
        echarts.registerMap(provName, geo);
        const container = document.getElementById('province-inline-container');
        container.style.display = 'block';
        provinceChart = echarts.init(container);
        const data = (processed.cities[provName]||[]).map(n=>({name:n}));
        provinceChart.setOption(getMapOptions(provName, data));

        // 点击城市时弹出照片
        provinceChart.off('click');
        provinceChart.on('click', params => {
          const city = params.name;
          const code = Object.keys(cityCodeToName).find(c=>cityCodeToName[c]===city);
          const key = `${provPinyin}-${code}`;
          const pics = imagesByCode[key] || [];
          if (!pics.length) {
            alert(`${city} 无照片`);
            return;
          }
          const lbl = document.getElementById('cityGalleryModalLabel');
          const body = document.getElementById('cityGalleryBody');
          lbl.innerText = `${city} 的照片`;
          body.innerHTML = '';
          pics.forEach(p=>{
            const img = document.createElement('img');
            img.src = p; img.style.maxWidth='90%'; img.style.margin='10px';
            body.appendChild(img);
          });
          new bootstrap.Modal(document.getElementById('cityGalleryModal')).show();
        });
      })
      .catch(e => console.error('加载省级地图失败：', e));
  }

  function initTravelMap() {
    const c = document.getElementById('map-container');
    const p = document.getElementById('province-inline-container');
    if (!c || !p) return;
    chinaChart = echarts.init(c);
    fetch('map/china.json')
      .then(r=>r.json())
      .then(geo=> {
        echarts.registerMap('china', geo);
        const data = processed.provinces.map(n=>({name:n}));
        chinaChart.setOption(getMapOptions('china', data));
      })
      .catch(e=>console.error('加载全国地图失败：', e));

    chinaChart.on('click', params=> {
      const prov = params.name;
      const py = provinceNameToPinyin[prov];
      if (py) renderProvinceMap(prov, py);
    });
  }
});
