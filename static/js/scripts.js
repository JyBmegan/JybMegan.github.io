// ---------------------------------------------
// scripts.js
// ---------------------------------------------
let chart = null;
let provinceChart = null;
let currentLevel = '';
let currentProvincePinyin = '';

const content_dir = 'contents/';
const config_file = 'config.yml';
const section_names = ['top', 'meetme', 'publications', 'awards', 'blog', 'traveling', 'download'];

window.addEventListener('DOMContentLoaded', event => {
    // =============================================
    // 1. Activate Bootstrap scrollspy on the main nav element
    // =============================================
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            offset: 74,
        });
    }

    // =============================================
    // 2. Collapse responsive navbar when toggler is visible
    // =============================================
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    responsiveNavItems.forEach(responsiveNavItem => {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

    // =============================================
    // 3. Load config.yml via jsyaml
    // =============================================
    fetch(content_dir + config_file)
        .then(response => response.text())
        .then(text => {
            const yml = jsyaml.load(text);
            Object.keys(yml).forEach(key => {
                try {
                    document.getElementById(key).innerHTML = yml[key];
                } catch {
                    console.log("Unknown id and value: " + key + "," + yml[key].toString());
                }
            });
        })
        .catch(error => console.log(error));

    // =============================================
    // 4. 用 marked.js 加载每个板块的 Markdown (top, meetme, ... traveling, download)
    // =============================================
    marked.use({ mangle: false, headerIds: false });
    section_names.forEach((name, idx) => {
        // 4.1 决定 fetch 哪个 Markdown 文件
        let mdFileName;
        if (name === 'traveling') {
            // “traveling” 板块对应的是 contents/map.md
            mdFileName = 'map.md';
        } else {
            mdFileName = name + '.md';
        }

        fetch(content_dir + mdFileName)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`无法加载 ${mdFileName}，状态码 ${response.status}`);
                }
                return response.text();
            })
            .then(markdown => {
                const html = marked.parse(markdown);

                if (name === 'traveling') {
                    // 把 map.md 渲染到 id="map-md" 里
                    const container = document.getElementById('map-md');
                    if (container) {
                        container.innerHTML = html;
                    } else {
                        console.error('找不到 <div id="map-md">，请检查 index.html');
                    }
                    // Markdown 内容插好后，初始化地图
                    initTravelMap();
                } else {
                    // 其他板块按 <div id="{name}-md"> 插入
                    const container = document.getElementById(name + '-md');
                    if (container) {
                        container.innerHTML = html;
                    } else {
                        console.warn(`找不到 <div id="${name}-md">，请检查 index.html`);
                    }
                }
            })
            .then(() => {
                // MathJax 渲染——如果你有公式需要排版
                // 如果暂不使用公式，也可注释掉这一行
               // MathJax.typeset();
            })
            .catch(error => {
                console.error('加载 Markdown 失败：', error);
            });
    });

    // =============================================
    // 以下为地图及图片弹层相关函数
    // =============================================

    // 全局变量：ECharts 实例、当前层级（country 或 province）、当前省拼音
    let chart = null;
    let currentLevel = 'country';
    let currentProvincePinyin = '';

    // 模拟哪些地级市有图片（adcode → true/false）
    // 当你往 imgs/ 里新增新城市图片时，只要把对应的 adcode 加上 true 即可
    const uploadCityStatus = {
        "420100": true,   // 武汉市
        "440500": true,   // 汕头市
        "445100": true,   // 潮州市
        "530100": true,   // 昆明市
        // …… 如有新城市，继续在此添加
    };

    // （可选）模拟哪些省有图片，如果要给省上色，可使用此对象。
    // 如果不需要省级上色，可将所有 value = false，或取消 visualMap。
    const uploadProvinceStatus = {
        "hubei": true,
        "guangdong": true,
        "yunnan": true,
        // …… 如有新省，继续在此添加
    };

 // -----------------------------
// 省份中文→拼音的映射表
// （一定要和 map/province 目录下的文件名完全一致）
// -----------------------------
const provinceNameToPinyin = {
    "北京": "beijing",
    "天津": "tianjin",
    "上海": "shanghai",
    "重庆": "chongqing",
    "河北": "hebei",
    "山西": "shanxi",
    "辽宁": "liaoning",
    "吉林": "jilin",
    "黑龙": "heilongjiang",
    "江苏": "jiangsu",
    "浙江": "zhejiang",
    "安徽": "anhui",
    "福建": "fujian",
    "江西": "jiangxi",
    "山东": "shandong",
    "河南": "henan",
    "湖北": "hubei",
    "湖南": "hunan",
    "广东": "guangdong",
    "海南": "hainan",
    "四川": "sichuan",
    "贵州": "guizhou",
    "云南": "yunnan",
    "陕西": "shanxi1",     // 举例：你的省级 JSON 文件若叫 shanxi1.json，就写 "shanxi1"
    "甘肃": "gansu",
    "青海": "qinghai",
    "台湾": "taiwan",
    "内蒙古": "neimenggu",
    "广西": "guangxi",
    "西藏": "xizang",
    "宁夏": "ningxia",
    "新疆": "xinjiang",
    "香港": "xianggang",
    "澳门": "aomen"
    // …… 根据你自己的 map/province 目录增减
};

// -----------------------------
// 渲染全国（中国）地图
// -----------------------------
// ---------------------------------------------
// 【替换内容开始】请把下面整个块复制，粘贴到 renderChinaMap()/renderProvinceMap 原来所在的位置
// ---------------------------------------------

// 0. 全局状态：记录已访问的省份和城市
const visited = {
  provinces: JSON.parse(localStorage.getItem('visitedProvinces') || '[]'),
  cities:     JSON.parse(localStorage.getItem('visitedCities')    || '{}')
};

// 页面第一次加载时调用
function initTravelMap() {
  renderChinaMap();
}

// 1. 渲染中国地图，并同时创建一个省级地图实例
function renderChinaMap() {
  // 标记当前层级、清空省拼音
  currentLevel = 'country';
  currentProvincePinyin = '';

  // 如果页面里有“返回全国”按钮，需要隐藏
  const backBtn = document.getElementById('back-to-china');
  if (backBtn) backBtn.style.display = 'none';

  // 找到主地图的容器
  const dom = document.getElementById('map-container');
  if (!dom) {
    console.error('找不到地图容器 map-container');
    return;
  }

  // 如果已有 ECharts 实例，先销毁
  if (chart) {
    chart.dispose();
  }
  // 初始化全国地图实例
  chart = echarts.init(dom);

  // *** 新增：初始化省级地图实例，用于 Modal 弹窗 ***
  const provDom = document.getElementById('province-map-container');
  if (!provDom) {
    console.error('找不到省级地图容器 province-map-container');
  }
  // 如果已有实例也先 dispose
  if (provinceChart) {
    provinceChart.dispose();
  }
  provinceChart = echarts.init(provDom);

  // 拉取全国 GeoJSON 并注册到 ECharts
  fetch('map/china.json')
    .then(res => {
      if (!res.ok) throw new Error('请求中国 GeoJSON 失败，状态码 ' + res.status);
      return res.json();
    })
    .then(geoJson => {
      echarts.registerMap('china', geoJson);

      // 根据 visited.provinces 生成高亮数据
      const option = optionForMap('china', visited.provinces, 'province');
      chart.setOption(option);

      // 点击事件：如果当前是“全国地图”，则认为用户在点某个省
      chart.off('click');
      chart.on('click', params => {
        const name = params.name;
        if (!name) return;

        // 判断当前图层：series[0].map 是 'china' 还是某个省拼音
        const currentMap = chart.getOption().series[0].map;
        if (currentMap === 'china') {
          // 用户点击了省份
          const provincePinyin = params.data.pinyin; // 例如 "yunnan"
          const provinceNameCn = name;               // 例如 "云南省"
          if (provincePinyin) {
            // 切换“已去过”状态
            const pi = visited.provinces.indexOf(provinceNameCn);
            if (pi >= 0) visited.provinces.splice(pi, 1);
            else visited.provinces.push(provinceNameCn);
            localStorage.setItem('visitedProvinces', JSON.stringify(visited.provinces));

            // 先刷新全国地图高亮
            const newOpt = optionForMap('china', visited.provinces, 'province');
            chart.setOption(newOpt);

            // 同时在 Modal 里渲染该省的地图
            fetch(`maps/province/${provincePinyin}.json`)
              .then(r => {
                if (!r.ok) throw new Error(`请求省级 GeoJSON 失败：/maps/province/${provincePinyin}.json`);
                return r.json();
              })
              .then(provGeo => {
                // 注册省级地图
                echarts.registerMap(provinceNameCn, provGeo);
                // 根据 visited.cities[provinceNameCn] 生成“已去过城市”高亮
                const cityList = visited.cities[provinceNameCn] || [];
                provinceChart.setOption(optionForMap(provinceNameCn, cityList, 'city'));


                // 更新 Modal 标题、然后 show
                document.getElementById('provinceMapModalLabel').innerText = `${provinceNameCn} 省级地图`;
                const modalEl = document.getElementById('provinceMapModal');
                const modal = new bootstrap.Modal(modalEl);
                modal.show();
              })
              .catch(err => console.error(err));
          } else {
            console.warn(`${provinceNameCn} 在映射表里没有对应拼音，无法渲染省级地图`);
          }
        }
      });
    })
    .catch(err => console.error('加载全国地图失败：', err));
}


// 2. 省级地图点击事件（在 Modal 里）
function renderProvinceMap() {
  // 这里已不需要。我们直接在上面的 chart.on('click') 里用 provinceChart 取代。
  // 这段函数可以删掉或保留空实现，并不再被调用。
}


// 3. 工具函数：根据层级生成 ECharts 配置
function optionForMap(mapName, highlighted, level) {
  return {
    title: {
      text: level === 'province'
            ? '中国 地图（点击省份标记已去过）'
            : `${mapName} 省级地图（点击城市/县标记已去过）`,
      left: 'center'
    },
    tooltip: { trigger: 'item' },
    visualMap: {
      show: false,
      pieces: [{ value: 1, label: '已去过', color: '#87CEFA' }],
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


// 4. 图集数据：把 “省名小写–adcode” 对应的图片路径列出来
//const images = {
//  'hubei–420100': ['/imgs/420100_wuhan_1.jpg', '/imgs/420100_wuhan_2.png'],
//  'guangdong–440500': ['/imgs/440500_shantou_1.jpg', '/imgs/440500_shantou_2.png'],
//  'guangdong–445100': ['/imgs/440500_shantou_1.jpg', '/imgs/440500_shantou_2.png'],
//  'yunnan–530100': ['/imgs/530100_kunming_1.jpg']
//  // …根据需要把其它城市的照片路径补全
//};

// 如果你想从“城市中文名”直接拿 adcode，可用下面这张表
const cityCodeMap = {
  'Wuhan':   '420100',
  'Shantou': '440500',
  'Chaozhou': '445100',
  'Kunming':'530100'
  // …按需继续补充
};

// （5）点击省级地图里的某个城市时，调用此函数显示照片
function showGallery(provName, cityName) {
  const code = cityCodeMap[cityName] || cityName;
  const key = `${provName.toLowerCase()}–${code}`;
  const arr = images[key] || [];

  const galleryEl = document.getElementById('gallery');
  galleryEl.innerHTML = arr.map(url =>
    `<img src="${url}" style="width:400px; margin:10px;
       border:1px solid #ccc; border-radius:4px;">`
  ).join('');
}


// 6. 页面加载完毕后启动全国地图
window.addEventListener('DOMContentLoaded', () => {
  renderChinaMap();
});

// ---------------------------------------------
// 【替换内容结束】
// ---------------------------------------------

    /**
     * 弹出某地级市的所有图片
     * @param {string} adcode - 地级市行政编码，例如 "420100"
     * @param {string} provincePinyin - 该地级市所属省的拼音，例如 "hubei"
     * @param {string} cityName - 地级市中文名，例如 "武汉市"
     */
    function openCityImageModal(adcode, provincePinyin, cityName) {
        // 1. 移除旧弹层（如果存在）
        const oldCover = document.getElementById('city-image-modal');
        if (oldCover) oldCover.remove();

        // 2. 全屏半透明背景
        const cover = document.createElement('div');
        cover.id = 'city-image-modal';
        Object.assign(cover.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: '10000',
            overflowY: 'auto',
            padding: '40px 20px'
        });

        // 3. 白底弹层容器
        const container = document.createElement('div');
        Object.assign(container.style, {
            maxWidth: '1000px',
            margin: '0 auto',
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '20px'
        });

        // 4. 标题
        const title = document.createElement('h2');
        title.innerText = `${cityName} - 图片预览`;
        title.style.marginBottom = '20px';
        container.appendChild(title);

        // 5. 图片容器（flex 布局）
        const imgContainer = document.createElement('div');
        Object.assign(imgContainer.style, {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px'
        });

        // 6. 按序号和后缀尝试加载图片：imgs/{adcode}_{provincePinyin}_{i}.{ext}
        const exts = ['jpg', 'jpeg', 'png', 'gif'];
        for (let i = 1; i <= 10; i++) {  
            exts.forEach(ext => {
                const fileName = `${adcode}_${provincePinyin}_${i}.${ext}`;
                const url = `imgs/${fileName}`;
                const img = document.createElement('img');
                img.src = url;
                img.alt = `${cityName} 图片 ${i}`;
                Object.assign(img.style, {
                    width: '200px',
                    height: 'auto',
                    borderRadius: '4px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                });
                img.onerror = () => img.remove();
                imgContainer.appendChild(img);
            });
        }

        // 7. 如果所有 <img> 都被移除，则显示“未找到任何图片”提示
        setTimeout(() => {
            if (!imgContainer.querySelector('img')) {
                const noImg = document.createElement('p');
                noImg.innerText = '未找到任何图片';
                noImg.style.color = '#555';
                imgContainer.appendChild(noImg);
            }
        }, 200);

        container.appendChild(imgContainer);

        // 8. 点击背景关闭弹层
        cover.addEventListener('click', e => {
            if (e.target === cover) {
                cover.remove();
            }
        });

        // 9. 组装并插入页面
        cover.appendChild(container);
        document.body.appendChild(cover);
    }

    /**
     * 初始化地图：第一次加载“Traveling”板块时调用
     */
    function initTravelMap() {
        renderChinaMap();
    }

});  // ← 这是闭合最外层 window.addEventListener 的括号和分号

// ---------------------------------------------
// scripts.js 结尾
// ---------------------------------------------
