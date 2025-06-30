### Updated `map.md`

```markdown
<h2 id="map-subtitle" class="section-title">
  <i class="bi bi-geo-alt-fill"></i> TRAVELING
</h2>

<!-- 全国地图容器 -->
<div id="map-container"
     style="width:100%; height:400px; margin:20px auto;
            border:2px solid #ccc; border-radius:8px;
            box-shadow:0 2px 8px rgba(0,0,0,0.1);">
</div>

<!-- 行内省级地图容器，初始隐藏 -->
<div id="province-inline-container"
     style="width:100%; height:600px; margin:20px auto;
            border:2px solid #ccc; border-radius:8px;
            box-shadow:0 2px 8px rgba(0,0,0,0.1); display:none;">
</div>

<!-- 城市照片弹窗 -->
<div class="modal fade" id="cityGalleryModal" tabindex="-1"
     aria-labelledby="cityGalleryModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-lg modal-dialog-centered" style="max-width: 80vw;">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="cityGalleryModalLabel"></h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="关闭"></button>
      </div>
      <div class="modal-body" id="cityGalleryBody" style="text-align:center;">
        <!-- JS 插入图片 -->
      </div>
    </div>
  </div>
</div>
```

---

### Updates to `scripts.js`

1. **移除 Bootstrap 省级 Modal 相关代码**（`provinceMapModal` & `bootstrap.Modal`）
2. **修改 `renderProvinceMap` 渲染到 `#province-inline-container`**
3. **修改城市点击回调，使用 `cityGalleryModal` 弹窗**

```diff
 function renderProvinceMap(provinceName, provincePinyin) {
     const provinceMapPath = `map/province/${provincePinyin}.json`;
     fetch(provinceMapPath)
         .then(res => res.json())
         .then(provinceGeoJson => {
-            echarts.registerMap(provinceName, provinceGeoJson);
-            const citiesToHighlight = processedData.cities[provinceName] || [];
-            const highlightData = citiesToHighlight.map(name => ({ name }));
-            const provinceOptions = getMapOptions(provinceName, highlightData);
-            provinceChart.setOption(provinceOptions);
-
-            // 显示弹窗省级地图（已移除）
-            const modal = new bootstrap.Modal(document.getElementById('provinceMapModal'));
-            modal.show();
+            echarts.registerMap(provinceName, provinceGeoJson);
+            // 在行内容器中渲染
+            const container = document.getElementById('province-inline-container');
+            container.style.display = 'block';
+            const inlineChart = echarts.init(container);
+            const citiesToHighlight = processedData.cities[provinceName] || [];
+            const highlightData = citiesToHighlight.map(name => ({ name }));
+            inlineChart.setOption(getMapOptions(provinceName, highlightData));
         })
         .catch(err => console.error(`加载省级地图失败: ${err}`));
 }

 // 初始化全国地图
 function initTravelMap() {
@@
     // 全国地图绑定点击
     chinaChart.on('click', params => {
         const provinceName = params.name;
         const provincePinyin = provinceNameToPinyin[provinceName];
         if (provincePinyin) {
             renderProvinceMap(provinceName, provincePinyin);
         }
     });

-    // 省级地图点击图片弹窗（原在 modal 中）
-    provinceChart.on('click', params => {
+    // 行内省级地图点击城市弹出照片
+    // 使用 cityGalleryModal
+    const inlineChart = provinceChart; // reuse if needed
+    inlineChart.on('click', params => {
         const cityName = params.name;
         const cityCode = Object.keys(cityCodeToName).find(code => cityCodeToName[code] === cityName);
         const provinceName = document.getElementById('provinceMapModalLabel')
             .innerText.replace(' 省地图', '');
         const provincePinyin = provinceNameToPinyin[provinceName];

         const imageKey = `${provincePinyin}-${cityCode}`;
         const photos = imagesByCode[imageKey];

-        const galleryDiv = document.getElementById('gallery');
-        if (photos && photos.length > 0) {
-            galleryDiv.innerHTML = `<h3>${cityName} 的照片</h3>`;
-            photos.forEach(photoPath => {
-                const img = document.createElement('img');
-                img.src = photoPath;
-                img.style.maxWidth = '200px';
-                img.style.margin = '10px';
-                img.style.borderRadius = '5px';
-                galleryDiv.appendChild(img);
-            });
-            const modal = bootstrap.Modal.getInstance(document.getElementById('provinceMapModal'));
-            modal.hide();
-            galleryDiv.scrollIntoView({ behavior: 'smooth' });
-        } else {
-            alert(`您点击了 ${cityName}，但这个城市还没有关联照片。`);
-        }
+        if (photos && photos.length) {
+            const titleEl = document.getElementById('cityGalleryModalLabel');
+            const bodyEl = document.getElementById('cityGalleryBody');
+            titleEl.innerText = `${cityName} 的照片`;
+            bodyEl.innerHTML = '';
+            photos.forEach(path => {
+                const img = document.createElement('img');
+                img.src = path;
+                img.style.maxWidth = '90%';
+                img.style.margin = '10px';
+                bodyEl.appendChild(img);
+            });
+            const cityModal = new bootstrap.Modal(document.getElementById('cityGalleryModal'));
+            cityModal.show();
+        } else {
+            alert(`您点击了 ${cityName}，但这个城市还没有关联照片。`);
+        }
     });
 }
```
