// ---------------------------------------------
// scripts.js
// ---------------------------------------------

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
                MathJax.typeset();
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
    "北京市": "beijing",
    "天津市": "tianjin",
    "上海市": "shanghai",
    "重庆市": "chongqing",
    "河北省": "hebei",
    "山西省": "shanxi",
    "辽宁省": "liaoning",
    "吉林省": "jilin",
    "黑龙江省": "heilongjiang",
    "江苏省": "jiangsu",
    "浙江省": "zhejiang",
    "安徽省": "anhui",
    "福建省": "fujian",
    "江西省": "jiangxi",
    "山东省": "shandong",
    "河南省": "henan",
    "湖北省": "hubei",
    "湖南省": "hunan",
    "广东省": "guangdong",
    "海南省": "hainan",
    "四川省": "sichuan",
    "贵州省": "guizhou",
    "云南省": "yunnan",
    "陕西省": "shanxi1",     // 举例：你的省级 JSON 文件若叫 shanxi1.json，就写 "shanxi1"
    "甘肃省": "gansu",
    "青海省": "qinghai",
    "台湾省": "taiwan",
    "内蒙古自治区": "neimenggu",
    "广西壮族自治区": "guangxi",
    "西藏自治区": "xizang",
    "宁夏回族自治区": "ningxia",
    "新疆维吾尔自治区": "xinjiang",
    "香港特别行政区": "xianggang",
    "澳门特别行政区": "aomen"
    // …… 根据你自己的 map/province 目录增减
};

// -----------------------------
// 渲染全国（中国）地图
// -----------------------------
function renderChinaMap() {
    currentLevel = 'country';
    currentProvincePinyin = '';

    // 隐藏“返回全国”按钮（如果存在）
    const backBtn = document.getElementById('back-to-china');
    if (backBtn) backBtn.style.display = 'none';

    // 找到地图容器
    const dom = document.getElementById('map-container');
    if (!dom) {
        console.error('找不到地图容器 map-container');
        return;
    }

    // 如果已有 ECharts 实例，先销毁
    if (chart) {
        chart.dispose();
    }
    chart = echarts.init(dom);

    // 请求中国 GeoJSON
    fetch('map/china.json')
        .then(res => {
            if (!res.ok) {
                throw new Error('请求中国 GeoJSON 失败，状态码 ' + res.status);
            }
            return res.json();
        })
        .then(geoJson => {
            // 注册中国地图
            echarts.registerMap('china', geoJson);

            // 构造省级 data 数组：用中文名找拼音，再决定是否上色
            const dataArr = geoJson.features.map(f => {
                const provinceNameCn = f.properties.name;         // e.g. "湖北省"
                const provincePinyin = provinceNameToPinyin[provinceNameCn]; // e.g. "hubei" 或 undefined
                return {
                    name: provinceNameCn,
                    // 如果你希望给已上传过的省份上色，就用拼音去查 uploadProvinceStatus
                    value: uploadProvinceStatus[provincePinyin] ? 1 : 0,
                    pinyin: provincePinyin    // 点击省份时，就从这里拿到拼音
                };
            });

            // 配置全国地图
            const option = {
                tooltip: {
                    trigger: 'item',
                    formatter: params => params.name
                },
                visualMap: {
                    show: false,
                    min: 0,
                    max: 1,
                    inRange: {
                        color: ['#e0e0e0', '#ff7f50']  // 0→灰色，1→橙色
                    }
                },
                series: [
                    {
                        name: '中国',
                        type: 'map',
                        map: 'china',
                        roam: true,
                        label: { show: false },
                        emphasis: {
                            label: { show: true, color: '#000' }
                        },
                        data: dataArr
                    }
                ]
            };
            chart.setOption(option);

            // 点击省份：从 dataArr 中的 pinyin 拿到拼音，再 renderProvinceMap
            chart.off('click');
            chart.on('click', params => {
                if (currentLevel === 'country') {
                    const provincePinyin = params.data.pinyin;   // e.g. "hubei"
                    const provinceNameCn = params.name;          // e.g. "湖北省"
                    if (provincePinyin) {
                        renderProvinceMap(provincePinyin, provinceNameCn);
                    } else {
                        console.warn(`${provinceNameCn} 在映射表中没有对应的拼音，无法加载省级地图`);
                    }
                }
            });
        })
        .catch(err => {
            console.error('全国地图加载失败：', err);
        });
}

    /**
     * 渲染某个省的地级市地图
     * @param {string} pinyin - 省份拼音，对应 map/province/{pinyin}.json
     * @param {string} provinceNameCn - 省份中文名，例如“湖北省”
     */
    function renderProvinceMap(pinyin, provinceNameCn) {
        currentLevel = 'province';
        currentProvincePinyin = pinyin;

        // 显示“返回全国”按钮（如果你加了该按钮）
        const backBtn = document.getElementById('back-to-china');
        if (backBtn) {
            backBtn.style.display = 'inline-block';
            backBtn.onclick = () => {
                renderChinaMap();
            };
        }

        // 1. 找到 <div id="map-container">
        const dom = document.getElementById('map-container');
        if (!dom) {
            console.error('找不到地图容器 map-container');
            return;
        }

        // 2. 销毁已有实例并重新初始化
        if (chart) {
            chart.dispose();
        }
        chart = echarts.init(dom);

        // 3. 请求该省 GeoJSON
        fetch(`map/province/${pinyin}.json`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`请求省级 GeoJSON 失败：map/province/${pinyin}.json`);
                }
                return res.json();
            })
            .then(provinceGeo => {
                // 注册该省地图
                echarts.registerMap(pinyin, provinceGeo);

                // 4. 构造地级市 data 数组
                const cityDataArr = provinceGeo.features.map(f => {
                    const cityName = f.properties.name;     // e.g. "武汉市"
                    const adcode = f.properties.adcode;     // e.g. "420100"
                    return {
                        name: cityName,
                        adcode: adcode,
                        value: uploadCityStatus[adcode] ? 1 : 0
                    };
                });

                // 5. 省级地图配置
                const option = {
                    title: {
                        text: provinceNameCn,
                        left: 'center',
                        top: 10,
                        textStyle: { fontSize: 20 }
                    },
                    tooltip: {
                        trigger: 'item',
                        formatter: params => params.name
                    },
                    visualMap: {
                        show: false,
                        min: 0,
                        max: 1,
                        inRange: {
                            color: ['#e0e0e0', '#87cefa']  // 灰色 → 浅蓝
                        }
                    },
                    series: [
                        {
                            name: provinceNameCn,
                            type: 'map',
                            map: pinyin,
                            roam: true,
                            label: { show: false },
                            emphasis: {
                                label: { show: true, color: '#000' }
                            },
                            data: cityDataArr
                        }
                    ]
                };
                chart.setOption(option);

                // 6. 点击地级市事件：如果有图片就弹层查看，否则提示
                chart.off('click');
                chart.on('click', params => {
                    if (currentLevel === 'province') {
                        const adcode = params.data.adcode;   // e.g. "420100"
                        const cityName = params.name;        // e.g. "武汉市"
                        if (uploadCityStatus[adcode]) {
                            openCityImageModal(adcode, pinyin, cityName);
                        } else {
                            alert(`${cityName} 暂未上传任何图片`);
                        }
                    }
                });
            })
            .catch(err => {
                console.error('省级地图加载失败：', err);
            });
    }

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
