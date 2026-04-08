<div class="content-width">
  <button id="backChinaBtn" class="btn btn-secondary btn-sm mb-2" style="color: #ffffff; background: #1c4c6d; border: 1px solid #ffffff">
    ← Back
  </button>

  <div style="position: relative;">
      <div id="map-container"
           style="width:100%; height:600px;
                  border:2px solid #ccc; border-radius:8px;
                  box-shadow:0 2px 8px rgba(0,0,0,0.1);">
      </div>
      <div id="map-stats-widget" 
           style="position: absolute; bottom: 20px; right: 20px; background: rgba(255, 255, 255, 0.95); 
                  padding: 12px 20px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.15); 
                  z-index: 999; cursor: pointer; border: 1px solid #1c4c6d; text-align: center; 
                  transition: transform 0.2s;"
           onmouseover="this.style.transform='translateY(-3px)'"
           onmouseout="this.style.transform='translateY(0)'"
           onclick="showStatsModal()">
        <div style="color: #1c4c6d; font-weight: 700; font-size: 1.1rem; border-bottom: 1px solid #eee; margin-bottom: 8px; padding-bottom: 5px;">
            <i class="bi bi-geo-alt-fill me-1"></i> Footprints
        </div>
        <div style="font-size: 0.95rem; color: #444; margin-bottom: 3px;">
            Provinces: <span id="stat-prov-count" style="font-weight:bold; color:#1c4c6d; font-size: 1.1rem;">0</span>
        </div>
        <div style="font-size: 0.95rem; color: #444;">
            Cities: <span id="stat-city-count" style="font-weight:bold; color:#1c4c6d; font-size: 1.1rem;">0</span>
        </div>
        <div style="font-size: 0.75rem; color: #888; margin-top: 8px;">Click to view list</div>
      </div>
      
  </div>
</div>

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

<div class="modal fade" id="statsModal" tabindex="-1" aria-labelledby="statsModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header" style="background-color: #1c4c6d; color: white;">
        <h5 class="modal-title fw-bold" id="statsModalLabel"><i class="bi bi-map-fill me-2"></i> My Footprints</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body" id="statsModalBody">
      </div>
    </div>
  </div>
</div>