<!-- contents/map.md -->
<div class="content-width">
  <!-- 标题与其它板块保持一致 -->
  <h2 id="map-subtitle">
    <i class="bi bi-geo-alt-fill"></i> TRAVELING
  </h2>

  <!-- 同一个容器，切换全国/省级地图 -->
  <div id="map-container"
       style="width:100%; height:400px;
              border:2px solid #ccc; border-radius:8px;
              box-shadow:0 2px 8px rgba(0,0,0,0.1); position:relative;">
    <!-- “返回全国”按钮，一开始隐藏 -->
    <button id="backChinaBtn"
            class="btn btn-secondary btn-sm"
            style="position:absolute; top:10px; left:10px; display:none; z-index:10;">
      ← 全国
    </button>
  </div>
</div>

<!-- 城市照片 Modal -->
<div class="modal fade" id="cityGalleryModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-lg modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="cityGalleryModalLabel"></h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body" id="cityGalleryBody" style="text-align:center;"></div>
    </div>
  </div>
</div>
