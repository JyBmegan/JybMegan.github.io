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

// =========================================================================
// 地图与图片功能区 (最终功能版)
// =========================================================================

// 全局变量，用于持有 ECharts 实例
let chinaChart = null;
let provinceChart = null;

// ------------------- 数据定义区 (您未来主要维护这里) -------------------

// 1. 定义您的照片数据
// 格式: '省份拼音-城市邮政编码': ['图片路径1', '图片路径2', ...]
const imagesByCode = {
  'hubei-420100': ['imgs/420100_wuhan_1.jpg', 'imgs/420100_wuhan_2.png'],
  'guangdong-440500': ['imgs/440500_shantou_1.jpg', 'imgs/440500_shantou_2.png'],
  'guangdong-445100': ['imgs/445100_chaozhou_1.jpg'],
  'yunnan-530100': ['imgs/530100_kunming_1.jpg']
  // 当您添加新城市的照片时，在这里新增一行即可
};

// 2. 城市邮政编码到中文名的映射 (非常重要)
// ECharts 地图里需要用中文名来匹配，所以我们需要这个转换表
const cityCodeToName = {
    "420100": "武汉市",
    "440500": "汕头市",
    "445100": "潮州市",
    "530100": "昆明市"
    // 每当您在上面 `imagesByCode` 中添加一个新城市，都需要在这里加上它的邮政编码和中文名
};

// 3. 省份中文名到拼音的映射表 (这个基本不用动)
const provinceNameToPinyin = {
    "北京": "beijing", "天津": "tianjin", "上海": "shanghai", "重庆": "chongqing",
    "河北": "hebei", "山西": "shanxi", "辽宁": "liaoning", "吉林": "jilin",
    "黑龙江": "heilongjiang", "江苏": "jiangsu", "浙江": "zhejiang", "安徽": "anhui",
    "福建": "fujian", "江西": "jiangxi", "山东": "shandong", "河南": "henan",
    "湖北": "hubei", "湖南": "hunan", "广东": "guangdong", "海南": "hainan",
    "四川": "sichuan", "贵州": "guizhou", "云南": "yunnan", "陕西": "shanxi1",
    "甘肃": "gansu", "青海": "qinghai", "台湾": "taiwan", "内蒙古": "neimenggu",
    "广西": "guangxi", "西藏": "xizang", "宁夏": "ningxia", "新疆": "xinjiang",
    "香港": "xianggang", "澳门": "aomen"
};

// ------------------- 核心功能函数 (基本不用修改) -------------------

/**
 * 预处理照片数据，方便后续使用
 * @returns {object} { provinces: ['湖北', '广东'], cities: {'湖北': ['武汉市'], '广东': ['汕头市', '潮州市']} }
 */
function processImageData() {
    const provinces = new Set();
    const citiesByProvince = {};
    for (const key in imagesByCode) {
        const [provPinyin, cityCode] = key.split('-');
        const provName = Object.keys(provinceNameToPinyin).find(name => provinceNameToPinyin[name] === provPinyin);
        const cityName = cityCodeToName[cityCode];

        if (provName && cityName) {
            provinces.add(provName);
            if (!citiesByProvince[provName]) {
                citiesByProvince[provName] = [];
            }
            citiesByProvince[provName].push(cityName);
        }
    }
    return {
        provinces: Array.from(provinces),
        cities: citiesByProvince
    };
}

const processedData = processImageData();

/**
 * 函数：生成 ECharts 地图配置
 */
function getMapOptions(mapName, highlightData) {
    return {
        tooltip: { trigger: 'item' },
        // **【功能修改#1】**: 移除颜色条 (visualMap)
        // 我们通过直接给数据上色的方式，替代原来的 visualMap
        series: [{
            type: 'map',
            map: mapName,
            roam: true,
            emphasis: { label: { show: true }, itemStyle: { areaColor: '#FFD700' } },
            data: highlightData.map(item => ({
                name: item.name,
                value: item.value, // 为未来扩展保留
                itemStyle: {
                    areaColor: '#1E90FF', // 高亮区域的颜色
                    borderColor: '#fff'
                }
            }))
        }]
    };
}

/**
 * 函数：渲染省级地图
 */
function renderProvinceMap(provinceName, provincePinyin) {
    const provinceMapPath = `map/province/${provincePinyin}.json`;
    fetch(provinceMapPath)
        .then(res => res.json())
        .then(provinceGeoJson => {
            echarts.registerMap(provinceName, provinceGeoJson);
            
            // **【功能修改#2】**: 找出这个省内需要高亮的城市
            const citiesToHighlight = processedData.cities[provinceName] || [];
            const highlightData = citiesToHighlight.map(name => ({ name }));
            
            const provinceOptions = getMapOptions(provinceName, highlightData);
            provinceChart.setOption(provinceOptions);

            document.getElementById('provinceMapModalLabel').innerText = `${provinceName} 省地图`;
            const modal = new bootstrap.Modal(document.getElementById('provinceMapModal'));
            modal.show();
        })
        .catch(err => console.error(`加载省级地图失败: ${err}`));
}

/**
 * 函数：初始化全国地图（总入口）
 */
function initTravelMap() {
    const chinaContainer = document.getElementById('map-container');
    const provinceContainer = document.getElementById('province-map-container');
    if (!chinaContainer || !provinceContainer) return;

    chinaChart = echarts.init(chinaContainer);
    provinceChart = echarts.init(provinceContainer);

    fetch('map/china.json')
        .then(res => res.json())
        .then(chinaGeoJson => {
            echarts.registerMap('china', chinaGeoJson);
            
            // 根据预处理的数据，高亮有照片的省份
            const highlightData = processedData.provinces.map(name => ({ name }));
            const options = getMapOptions('china', highlightData);
            chinaChart.setOption(options);
        })
        .catch(err => console.error(`加载全国地图失败: ${err}`));
    
    // 为全国地图绑定点击事件
    chinaChart.on('click', params => {
        const provinceName = params.name;
        const provincePinyin = provinceNameToPinyin[provinceName];
        if (provincePinyin) {
            renderProvinceMap(provinceName, provincePinyin);
        }
    });

    // **【功能修改#3】**: 为省级地图绑定点击事件，以显示照片
    provinceChart.on('click', params => {
        const cityName = params.name; // "武汉市"
        const cityCode = Object.keys(cityCodeToName).find(code => cityCodeToName[code] === cityName);
        
        // 查找对应的省份拼音，用于构建照片数据的 key
        const provinceName = document.getElementById('provinceMapModalLabel').innerText.replace(' 省地图', '');
        const provincePinyin = provinceNameToPinyin[provinceName];

        const imageKey = `${provincePinyin}-${cityCode}`;
        const photos = imagesByCode[imageKey];

        const galleryDiv = document.getElementById('gallery');
        if (photos && photos.length > 0) {
            // 先清空上一次的图片
            galleryDiv.innerHTML = `<h3>${cityName} 的照片</h3>`;
            
            // 创建并添加新的图片
            photos.forEach(photoPath => {
                const img = document.createElement('img');
                img.src = photoPath;
                img.style.maxWidth = '200px';
                img.style.margin = '10px';
                img.style.borderRadius = '5px';
                galleryDiv.appendChild(img);
            });
            
            // 关闭弹窗并滚动到画廊位置
            const modal = bootstrap.Modal.getInstance(document.getElementById('provinceMapModal'));
            modal.hide();
            galleryDiv.scrollIntoView({ behavior: 'smooth' });

        } else {
            // 如果点击了没有照片的城市，可以给一个提示
            alert(`您点击了 ${cityName}，但这个城市还没有关联照片。`);
        }
    });
}
}); 