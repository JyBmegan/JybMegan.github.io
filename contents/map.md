<!-- contents/map.md -->
<div class="content-width">
  <h2 id="map-subtitle">
    <i class="bi bi-pin-map"></i> TRAVELING
  </h2>

  <!-- 返回全国地图按钮，初始隐藏 -->
  <button id="backChinaBtn" class="btn btn-secondary btn-sm mb-2" style="display: none;">
    ← 返回全国
  </button>

  <!-- 地图容器 -->
  <div id="map-container"
       style="width:100%; height:600px;
              border:2px solid #ccc; border-radius:8px;
              box-shadow:0 2px 8px rgba(0,0,0,0.1); position:relative;">
  </div>
</div>

<!-- 城市照片 Modal -->
<div class="modal fade" id="cityGalleryModal" tabindex="-1" aria-labelledby="cityGalleryModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-lg modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="cityGalleryModalLabel"></h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="关闭"></button>
      </div>
      <div class="modal-body" id="cityGalleryBody" style="text-align:center;"></div>
    </div>
  </div>
</div>
