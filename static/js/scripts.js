

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
    // 先决定要 fetch 哪个 markdown 文件
    let mdFileName;
    if (name === 'traveling') {
        // 旅游板块用 map.md
        mdFileName = 'map.md';
    } else {
        // 其他板块仍然按 name + '.md'
        mdFileName = name + '.md';
    }

    fetch(content_dir + mdFileName)
        .then(response => response.text())
        .then(markdown => {
            const html = marked.parse(markdown);
            // 把解析出来的 HTML 插到对应的 div 里
            document.getElementById(name + '-md').innerHTML = html;

            // 如果恰好是 traveling 这个板块，就初始化地图
            if (name === 'traveling') {
                initTravelMap();
            }
        })
        .then(() => {
            MathJax.typeset();
        })
        .catch(error => console.log(error));
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

// 注意：这个函数要放在上面 foreach 之外
function initTravelMap() {
    const dom = document.getElementById('map-container');
    if (!dom) {
        console.error('未找到地图容器 map-container');
        return;
    }

    fetch('map/china.json')  // 这里假设你的 map 文件夹在 index.html 同级
        .then(res => {
            if (!res.ok) throw new Error('请求中国 GeoJSON 失败，状态码 ' + res.status);
            return res.json();
        })
        .then(geoJson => {
            // 注册中国地图
            echarts.registerMap('china', geoJson);

            // 初始化 ECharts 实例
            const chart = echarts.init(dom);

            // 模拟“哪些城市已上传图片”的状态对象
            const uploadStatus = {
                '北京市': true,
                '上海市': true
                // 你可以把这里的城市名换成你真正已经上传图片的城市
            };

            // 构造 data 数组，根据 uploadStatus 决定 value=1 或 0
            const dataArr = geoJson.features.map(f => {
                const name = f.properties.name; // 省/直辖市中文名
                return {
                    name: name,
                    value: uploadStatus[name] ? 1 : 0
                };
            });

            // 最简配置：灰色中国 + 1 的变色
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
