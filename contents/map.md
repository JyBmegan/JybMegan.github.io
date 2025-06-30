<h2 id="map-subtitle">
  <i class="bi bi-geo-alt-fill"></i> TRAVELING
</h2>

<!-- 地图容器：与文字宽度一致 -->
<div class="content-width">
  <div id="map-container"
       style="width:100%; height:400px; border:2px solid #ccc;
              border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
  </div>
</div>

<!-- 城市照片弹窗 -->
<div class="modal fade" id="cityGalleryModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-lg modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="cityGalleryModalLabel"></h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body" id="cityGalleryBody" style="text-align:center;">
      </div>
    </div>
  </div>
</div>
