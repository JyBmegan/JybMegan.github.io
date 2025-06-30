

<!-- 1. 首先保证有一个大标题 “TRAVELING” -->
<h2 id="map-subtitle">
  <i class="bi bi-geo-alt-fill"></i> TRAVELING
</h2>

<!-- 2. 这是主界面的中国地图容器（加上边框），宽 100%、高 400px -->
<div id="map-container"
     style="width:60%; height:400px; margin:20px auto;
            border:2px solid #ccc; border-radius:8px;
            box-shadow:0 2px 8px rgba(0,0,0,0.1);">
</div>

<!-- 3. 这是下面用来展示城市照片的图集容器 -->
<div id="gallery" style="margin:20px auto; text-align:center;"></div>

<!-- 4. 这是“弹出省级地图”的 Bootstrap Modal -->
<div class="modal fade" id="provinceMapModal" tabindex="-1"
     aria-labelledby="provinceMapModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-xl modal-dialog-centered" style="max-width: 90vw;">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="provinceMapModalLabel">省级地图</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="关闭"></button>
      </div>
      <div class="modal-body">
        <!-- 这里面放省级地图的 ECharts 容器，高度设为 600px -->
        <div id="province-map-container" style="width:100%; height:600px;"></div>
      </div>
    </div>
  </div>
</div>
