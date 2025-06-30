<!-- contents/map.md -->
<h2 id="map-subtitle" class="section-title">
  <i class="bi bi-geo-alt-fill"></i> TRAVELING
</h2>

<!-- 全国地图容器 -->
<div id="map-container" class="map-box"></div>

<!-- 省级地图行内容器，初始隐藏 -->
<div id="province-inline-container" class="map-box hidden">
  <button id="backToChina" class="btn btn-secondary btn-back">← 返回全国</button>
</div>

<!-- 城市照片弹窗 -->
<div class="modal fade" id="cityGalleryModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-lg modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="cityGalleryModalLabel"></h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body" id="cityGalleryBody"></div>
    </div>
  </div>
</div>
