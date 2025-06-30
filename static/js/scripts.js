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

// 1. 导航滚动高亮 & 收起
function initNav() {
  const nav = document.querySelector('#mainNav');
  if (nav) new bootstrap.ScrollSpy(document.body, { target:'#mainNav', offset:74 });
  const toggler = document.querySelector('.navbar-toggler');
  document.querySelectorAll('#navbarResponsive .nav-link')
    .forEach(a => a.addEventListener('click', () => {
      if (getComputedStyle(toggler).display !== 'none') toggler.click();
    }));
}

// 2. 加载 config.yml
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

// 3. 加载各板块 Markdown
function loadSections() {
  marked.use({ mangle:false, headerIds:false });
  sections.forEach(name => {
    const md = name === 'traveling' ? 'map.md' : `${name}.md`;
    fetch(`${contentDir}${md}`)
      .then(r => r.ok ? r.text() : Promise.reject(r.status))
      .then(txt => {
        const html = marked.parse(txt);
        const id = name === 'traveling' ? 'map-md' : `${name}-md`;
        const container = document.getElementById(id);
        if (container) {
          container.innerHTML = html;
          if (name === 'traveling') initMap();
        }
      })
      .catch(err => console.error('加载 Markdown 失败:', err));
  });
}

// ---------------------------------------------
// 地图 & 照片 逻辑
// ---------------------------------------------

let chart;
let currentMode = 'china'; // 'china' or provincePinyin

//
