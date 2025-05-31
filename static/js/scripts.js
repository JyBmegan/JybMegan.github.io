

const content_dir = 'contents/'
const config_file = 'config.yml'
const section_names = ['top', 'meetme', 'publications', 'awards', 'blog', 'traveling', 'download']


window.addEventListener('DOMContentLoaded', event => {

    // Activate Bootstrap scrollspy on the main nav element
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            offset: 74,
        });
    };

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });


    // Yaml
    fetch(content_dir + config_file)
        .then(response => response.text())
        .then(text => {
            const yml = jsyaml.load(text);
            Object.keys(yml).forEach(key => {
                try {
                    document.getElementById(key).innerHTML = yml[key];
                } catch {
                    console.log("Unknown id and value: " + key + "," + yml[key].toString())
                }

            })
        })
        .catch(error => console.log(error));


    // Marked
    marked.use({ mangle: false, headerIds: false })
section_names.forEach((name, idx) => {
    // 先决定要 fetch 哪个 Markdown 文件
    let mdFileName;
    if (name === 'traveling') {
        // “旅游” 板块实际使用 contents/map.md
        mdFileName = 'map.md';
    } else {
        mdFileName = name + '.md';
    }

    fetch(content_dir + mdFileName)
        .then(response => response.text())
        .then(markdown => {
            const html = marked.parse(markdown);

            // —— 核心改动：  
            // 如果是 traveling 板块，就插到 id="map-md"；否则还是插到 name + '-md'。
            if (name === 'traveling') {
                const container = document.getElementById('map-md');
                if (container) {
                    container.innerHTML = html;
                } else {
                    console.error('找不到 <div id="map-md">，请确保 index.html 里存在这个元素');
                }
                // Markdown 内容插好之后，再初始化地图
                initTravelMap();
            } else {
                // 其余板块按老逻辑插入
                const container = document.getElementById(name + '-md');
                if (container) {
                    container.innerHTML = html;
                } else {
                    console.warn(`找不到 <div id="${name}-md"> （${name} 这一节）。`);
                }
            }
        })
        .then(() => {
            // MathJax 排版（如果你在 MD 里有公式）
            MathJax.typeset();
        })
        .catch(error => {
            console.error('加载 Markdown 失败：', error);
        });
});



}); 
// scripts.js

document.addEventListener('DOMContentLoaded', () => {
  // 1. 把 Markdown 文件 fetch 下来
  fetch('contents/awards.md')
    .then(res => {
      if (!res.ok) throw new Error(`Markdown 加载失败：${res.status}`);
      return res.text();
    })
    .then(mdText => {
      // 2. 用 marked.js 把 Markdown 转成 HTML
      //    如果你用的是 marked@2.x，请用 marked.parse；1.x 用 marked()
      const html = marked.parse(mdText);
      // 3. 插入到 id="awards-md" 的容器里
      document.getElementById('awards-md').innerHTML = html;
    })
    .catch(err => {
      console.error(err);
      document.getElementById('awards-md').innerHTML = '<p>加载 Awards 内容失败</p>';
    });
});

function initTravelMap() {
    // 1. 找到 <div id="map-container">
    const dom = document.getElementById('map-container');
    if (!dom) {
        console.error('未找到地图容器 map-container');
        return;
    }

    // 2. 请求你的 GeoJSON（假设 map 文件夹就在 index.html 同级）
    fetch('map/china.json')
        .then(res => {
            if (!res.ok) {
                throw new Error('请求中国 GeoJSON 失败，状态码 ' + res.status);
            }
            return res.json();
        })
        .then(geoJson => {
            // 3. 注册中国地图
            echarts.registerMap('china', geoJson);

            // 4. 新建 ECharts 实例并渲染到 map-container
            const chart = echarts.init(dom);

            // 5. 模拟“哪些城市已上传图片”（后续你可以从后端/API 拿到真正数据）
            const uploadStatus = {
                '北京市': true,
                '上海市': true
                // 你可以把这里改成你自己已经上传过图片的城市名称
            };

            // 6. 构造 data 数组：有图片的城市 value = 1（橙色），否则 value = 0（灰色）
            const dataArr = geoJson.features.map(f => {
                const name = f.properties.name; // 省/直辖市中文名
                return {
                    name: name,
                    value: uploadStatus[name] ? 1 : 0
                };
            });

            // 7. 最简单的 Option：带 tooltip + visualMap + map series
            const option = {
                tooltip: { trigger: 'item' },
                visualMap: {
                    show: false,
                    min: 0,
                    max: 1,
                    inRange: {
                        color: ['#e0e0e0', '#ff7f50']
                    }
                },
                series: [{
                    name: '中国',
                    type: 'map',
                    map: 'china',
                    roam: true,
                    label: { show: false },
                    data: dataArr
                }]
            };

            chart.setOption(option);
        })
        .catch(err => {
            console.error('地图加载失败：', err);
        });
}
