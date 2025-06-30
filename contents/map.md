<h2 id="map-subtitle" class="section-title">
  <i class="bi bi-geo-alt-fill"></i> TRAVELING
</h2>

<!-- 全国地图容器 -->
<div id="map-container"
     style="width:100%; height:400px; margin:20px auto;
            border:2px solid #ccc; border-radius:8px;
            box-shadow:0 2px 8px rgba(0,0,0,0.1);">
</div>

<!-- 省级地图容器（行内展示） -->
<div id="province-inline-container"
     style="width:100%; height:600px; margin:20px auto;
            border:2px solid #ccc; border-radius:8px;
            box-shadow:0 2px 8px rgba(0,0,0,0.1); display:none;">
</div>

<!-- 城市照片 Modal 弹窗 -->
<div class="modal fade" id="cityGalleryModal" tabindex="-1"
     aria-labelledby="cityGalleryModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-lg modal-dialog-centered" style="max-width: 80vw;">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="cityGalleryModalLabel"></h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="关闭"></button>
      </div>
      <div class="modal-body" id="cityGalleryBody" style="text-align:center;">
        <!-- JavaScript 自动填充图片 -->
