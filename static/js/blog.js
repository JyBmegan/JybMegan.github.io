// static/js/blog.js

// ——— 博客文章元数据 ———
const posts = [
  {
    slug: '2025-05-01-my-post',
    title: 'My Project Update',
    date: '2025-05-01',
    thumb: 'static/assets/blog/2025-05-01-thumb.jpg',
    excerpt: 'A brief summary of my latest project, including methodology and early results…'
  }
  // 若有更多文章，再以逗号 , 添加一个对象
];

// 渲染函数：把卡片插入到指定容器
function renderPosts(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`容器 #${containerId} 不存在`);
    return;
  }
  container.innerHTML = '';  // 先清空，防止重复
  posts.forEach(p => {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    col.innerHTML = `
      <div class="card h-100 shadow-sm">
        <img src="${p.thumb}" class="card-img-top" alt="Thumbnail for ${p.title}">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${p.title}</h5>
          <p class="card-text text-muted">${p.date}</p>
          <p class="card-text">${p.excerpt}</p>
          <a href="posts/${p.slug}.html" class="mt-auto btn btn-outline-primary">Read more</a>
        </div>
      </div>`;
    container.appendChild(col);
  });
}

// 暴露到全局，供页面调用
window.renderPosts = renderPosts;
