// ---------------------------------------------
// scripts.js
// ---------------------------------------------

const content\_dir = 'contents/';
const config\_file = 'config.yml';
const section\_names = \['top','meetme','publications','awards','blog','traveling','download'];

window\.addEventListener('DOMContentLoaded', () => {
// 1. 导航 ScrollSpy
const mainNav = document.querySelector('#mainNav');
if (mainNav) new bootstrap.ScrollSpy(document.body,{ target:'#mainNav', offset:74 });

// 2. 收起菜单
const toggler = document.querySelector('.navbar-toggler');
document.querySelectorAll('#navbarResponsive .nav-link').forEach(el => {
el.addEventListener('click',()=> {
if (window\.getComputedStyle(toggler).display !== 'none') toggler.click();
});
});

// 3. 加载 config.yml
fetch(content\_dir + config\_file)
.then(r=>r.text())
.then(txt=> {
const cfg = jsyaml.load(txt);
Object.entries(cfg).forEach((\[id,html]) => {
const el = document.getElementById(id);
if (el) el.innerHTML = html;
});
}).catch(console.error);

// 4. 加载 Markdown
marked.use({ mangle\:false, headerIds\:false });
section\_names.forEach(name => {
const md = name==='traveling' ? 'map.md' : `${name}.md`;
fetch(content\_dir + md)
.then(r=>{ if(!r.ok) throw new Error(r.status); return r.text(); })
.then(txt=> {
const html = marked.parse(txt);
const id = name==='traveling' ? 'map-md' : `${name}-md`;
const container = document.getElementById(id);
if (!container) return console.warn('找不到',id);
container.innerHTML = html;
if (name==='traveling') initTravelMap();
}).catch(err=>console.error('加载 Markdown 失败',err));
});

// --- 地图 & 照片 ---
let chinaChart, provinceChart;
// 只保留每个城市照片的数量，文件名统一: {cityCode}*{provPinyin}*{index}.jpg
const imageCounts = {
'hubei-420100': 2,
'guangdong-440500': 2,
'guangdong-445100': 1,
'yunnan-530100': 1
};
const cityCodeToName = {
'420100':'武汉市','440500':'汕头市','445100':'潮州市','530100':'昆明市'
};
const provinceNameToPinyin = {
'北京':'beijing','天津':'tianjin','上海':'shanghai','重庆':'chongqing',
'河北':'hebei','山西':'shanxi','辽宁':'liaoning','吉林':'jilin',
'黑龙江':'heilongjiang','江苏':'jiangsu','浙江':'zhejiang','安徽':'anhui',
'福建':'fujian','江西':'jiangxi','山东':'shandong','河南':'henan',
'湖北':'hubei','湖南':'hunan','广东':'guangdong','海南':'hainan',
'四川':'sichuan','贵州':'guizhou','云南':'yunnan','陕西':'shanxi1',
'甘肃':'gansu','青海':'qinghai','台湾':'taiwan','内蒙古':'neimenggu',
'广西':'guangxi','西藏':'xizang','宁夏':'ningxia','新疆':'xinjiang',
'香港':'xianggang','澳门':'aomen'
};

function processImageData(){
const provs=new Set(), cities={};
for(let key in imageCounts){
const \[pinyin, code] = key.split('-');
const pname = Object.keys(provinceNameToPinyin).find(n=>provinceNameToPinyin\[n]===pinyin);
const cname = cityCodeToName\[code];
if(pname && cname){
provs.add(pname);
(cities\[pname]=cities\[pname]||\[]).push(cname);
}
}
return { provinces:\[...provs], cities };
}
const processed = processImageData();

function getMapOptions(mapName,data){
return {
tooltip:{trigger:'item'},
series:\[{ type:'map', map\:mapName, roam\:true,
emphasis:{label:{show\:true}, itemStyle:{areaColor:'#FFD700'}},
data\:data.map(d=>({name\:d.name,itemStyle:{areaColor:'#1E90FF',borderColor:'#fff'}}))
}]
};
}

function renderProvinceMap(name,pinyin){
fetch(`map/province/${pinyin}.json`)
.then(r=>r.json())
.then(geo=>{
echarts.registerMap(name,geo);
const container=document.getElementById('province-inline-container');
container.style.display='block';
if(chinaChart) chinaChart.dispose();
provinceChart = echarts.init(container);
const highlights = (processed.cities\[name]||\[]).map(n=>({name\:n}));
provinceChart.setOption(getMapOptions(name,highlights));

```
    // 返回全国
    document.getElementById('backToChina').onclick = ()=>{
      container.style.display='none';
      initTravelMap();
    };

    // 城市点击
    provinceChart.off('click');
    provinceChart.on('click',p=>{
      const city = p.name;
      const code = Object.keys(cityCodeToName).find(c=>cityCodeToName[c]===city);
      const key = `${pinyin}-${code}`;
      const count = imageCounts[key] || 0;
      if(count===0) return alert(`${city} 无照片`);
      const lbl=document.getElementById('cityGalleryModalLabel');
      const body=document.getElementById('cityGalleryBody');
      lbl.innerText = `${city} 的照片`;
      body.innerHTML = '';
      for(let i=1;i<=count;i++){
        const img=document.createElement('img');
        img.src = `imgs/${code}_${pinyin}_${i}.jpg`;
        img.style.maxWidth='90%'; img.style.margin='10px';
        body.appendChild(img);
      }
      new bootstrap.Modal(document.getElementById('cityGalleryModal')).show();
    });
  })
  .catch(e=>console.error('加载省级失败：', e));
```

}

function initTravelMap(){
const c = document.getElementById('map-container');
if(!c) return;
const pi = document.getElementById('province-inline-container');
if(pi) pi.style.display='none';
chinaChart = echarts.init(c);
fetch('map/china.json')
.then(r=>r.json())
.then(geo=>{
echarts.registerMap('china',geo);
const data = processed.provinces.map(n=>({name\:n}));
chinaChart.setOption(getMapOptions('china',data));
}).catch(e=>console.error('加载全国失败',e));

```
chinaChart.off('click');
chinaChart.on('click',p=>{
  const prov = p.name;
  const py = provinceNameToPinyin[prov];
  if(py) renderProvinceMap(prov,py);
});
```

}
});
