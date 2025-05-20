

const content_dir = 'contents/'
const config_file = 'config.yml'
const section_names = ['top', 'meetme', 'publications', 'awards', 'blog', 'nightstand', 'map', 'download']


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
        fetch(content_dir + name + '.md')
            .then(response => response.text())
            .then(markdown => {
                const html = marked.parse(markdown);
                document.getElementById(name + '-md').innerHTML = html;
            }).then(() => {
                // MathJax
                MathJax.typeset();
            })
            .catch(error => console.log(error));
    })

}); 
// scripts.js

document.addEventListener('DOMContentLoaded', () => {
  // 1. 把 Markdown 文件 fetch 下来
  fetch('static/md/awards.md')
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
