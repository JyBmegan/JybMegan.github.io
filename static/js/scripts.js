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
// 地图与图片功能区 (最终版)
// =========================================================================

// 全局变量，用于持有 ECharts 实例
let chinaChart = null;
let provinceChart = null;

// 1. 定义哪些省份有照片，这将决定初始高亮的颜色
//    这里的 key 必须是省份的中文名，和地图数据一致。
const provincesWithPhotos = {
  "湖北": true,
  "广东": true,
  "云南": true
  // 如果您在其他省份也有照片，请在这里添加，例如: "四川": true,
};

// 2. 省份中文名到拼音的映射表 (确保这里的拼音和你的文件名一致)
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

/**
 * 函数：生成 ECharts 地图配置
 * @param {string} mapName - 地图名称 (例如 'china' 或 '湖北')
 * @param {Array} highlightData - 需要高亮的数据数组 (例如 ['湖北', '广东'])
 * @returns {object} ECharts 配置对象
 */
function getMapOptions(mapName, highlightData) {
    return {
        tooltip: { trigger: 'item' },
        visualMap: {
            show: true,
            min: 0,
            max: 1,
            left: 'left',
            top: 'bottom',
            text: ['有照片', ''],
            calculable: false,
            inRange: { color: ['#87CEFA', '#1E90FF'] }, // 有数据的省份颜色
            outOfRange: { color: '#E0E0E0' } // 没数据的省份颜色
        },
        series: [{
            type: 'map',
            map: mapName,
            roam: true,
            emphasis: { label: { show: true }, itemStyle: { areaColor: '#FFD700' } },
            data: highlightData.map(name => ({ name: name, value: 1 }))
        }]
    };
}

/**
 * 函数：渲染省级地图
 * @param {string} provinceName - 省份中文名 (例如 '湖北')
 * @param {string} provincePinyin - 省份拼音 (例如 'hubei')
 */
function renderProvinceMap(provinceName, provincePinyin) {
    const provinceMapPath = `map/province/${provincePinyin}.json`;
    fetch(provinceMapPath)
        .then(res => {
            if (!res.ok) throw new Error(`加载省级地图失败: ${provinceMapPath}`);
            return res.json();
        })
        .then(provinceGeoJson => {
            echarts.registerMap(provinceName, provinceGeoJson);

            // TODO: 将来在这里定义哪些城市需要高亮
            const cityHighlightData = []; 
            const provinceOptions = getMapOptions(provinceName, cityHighlightData);
            provinceChart.setOption(provinceOptions);

            document.getElementById('provinceMapModalLabel').innerText = `${provinceName} 省级地图`;
            const modal = new bootstrap.Modal(document.getElementById('provinceMapModal'));
            modal.show();
        })
        .catch(err => console.error(err));
}

/**
 * 函数：初始化全国地图（总入口）
 */
function initTravelMap() {
    // 1. 获取容器
    const chinaContainer = document.getElementById('map-container');
    const provinceContainer = document.getElementById('province-map-container');
    if (!chinaContainer || !provinceContainer) {
        console.error('地图容器未找到，请检查 map.md 文件是否正确！');
        return;
    }

    // 2. 初始化 ECharts 实例
    chinaChart = echarts.init(chinaContainer);
    provinceChart = echarts.init(provinceContainer);

    // 3. 加载全国地图数据
    fetch('map/china.json')
        .then(res => {
            if (!res.ok) throw new Error('加载全国地图失败: map/china.json');
            return res.json();
        })
        .then(chinaGeoJson => {
            echarts.registerMap('china', chinaGeoJson);

            // 4. 根据 provincesWithPhotos 自动生成高亮数据
            const highlightData = Object.keys(provincesWithPhotos);
            const options = getMapOptions('china', highlightData);
            chinaChart.setOption(options);
        })
        .catch(err => console.error(err));

    // 5. 为全国地图绑定点击事件
    chinaChart.on('click', params => {
        const provinceName = params.name; // 获取点击的省份中文名
        const provincePinyin = provinceNameToPinyin[provinceName]; // 从映射表查找拼音

        if (provincePinyin) {
            renderProvinceMap(provinceName, provincePinyin);
        } else {
            console.error(`${provinceName} 在映射表里没有对应拼音，无法渲染省级地图`);
        }
    });

    // 6. 为省级地图绑定点击事件 (未来使用)
    provinceChart.on('click', params => {
        alert(`您点击了城市: ${params.name}`);
        // 在这里添加显示城市相册的逻辑
    });
}
});