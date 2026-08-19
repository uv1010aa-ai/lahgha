const productId = new URLSearchParams(location.search).get("id") || "";
const details = document.getElementById("book-details");
const related = document.getElementById("related-container");
let cart = JSON.parse(localStorage.getItem("cart") || "[]");

function imageUrl(path){
  const value=String(path||"").trim();
  if(!value) return "";
  if(/^data:image\//i.test(value) || /^https?:\/\//i.test(value)) return value;
  return encodeURI(value.replace(/^\.\//,""));
}
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#039;"}[c]));}
function publicProduct(p){
  if(!p || typeof p!=="object") return null;
  return {
    id:String(p.id ?? p.requestId ?? ""), requestId:String(p.requestId ?? p.id ?? ""),
    title:p.title||p.name||p.productName||"سلعة بدون اسم",
    name:p.name||p.title||p.productName||"سلعة بدون اسم",
    category:String(p.category||"").trim(), price:Number(p.price||0), quantity:Number(p.quantity||0),
    image:p.image||p.productImage||p.imageUrl||p.photo||"",
    images:Array.isArray(p.images)?p.images.filter(Boolean):[],
    description:p.description||"", notes:p.notes||"", available:p.available!==false, active:p.active!==false,
    status:p.status||"منشور", createdAt:p.createdAt||""
  };
}
function getPublished(){
  try{
    const arr=JSON.parse(localStorage.getItem("publishedProducts")||"[]");
    return Array.isArray(arr)?arr.map(publicProduct).filter(Boolean).filter(p=>p.active!==false):[];
  }catch(e){console.error("تعذر قراءة المنتجات المنشورة",e);return []}
}
async function getAllProducts(){
  let books=[];
  try{
    const r=await fetch("books.json",{cache:"no-store"});
    if(r.ok){const data=await r.json();if(Array.isArray(data)) books=data.map(publicProduct).filter(Boolean);}
  }catch(e){console.warn("تعذر تحميل books.json",e)}
  return [...books,...getPublished()];
}
function showToast(message){const t=document.getElementById("toast");if(!t)return;t.textContent=message;t.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove("show"),2200)}
function saveCart(){localStorage.setItem("cart",JSON.stringify(cart));renderCartBadge()}
function renderCartBadge(){document.querySelectorAll("#cart-count").forEach(e=>e.textContent=cart.reduce((s,x)=>s+(Number(x.quantity)||0),0))}
function addToCart(product){const found=cart.find(x=>String(x.id)===String(product.id));if(found)found.quantity=(Number(found.quantity)||0)+1;else cart.push({...product,quantity:1});saveCart();showToast("تمت إضافة المنتج إلى السلة")}

function renderProduct(product, allProducts){
  const rawImages=Array.isArray(product.images)?product.images.map(imageUrl).filter(Boolean):[];
  const images=rawImages.length?rawImages:(product.image?[imageUrl(product.image)]:[]);
  const uniqueImages=[...new Set(images)];
  const galleryImages=uniqueImages.length?uniqueImages:images;
  document.title=`${product.title} - لَحْقها`;
  details.innerHTML=`
  <div class="book-details">
    <div class="product-gallery">
      <div class="main-image-wrap">
        <button type="button" class="gallery-arrow gallery-prev" aria-label="الصورة السابقة">‹</button>
        <img id="main-product-image" class="book-detail-image" src="${galleryImages[0]||""}" alt="${escapeHtml(product.title)}">
        <button type="button" class="gallery-arrow gallery-next" aria-label="الصورة التالية">›</button>
      </div>
      <div class="product-thumbnails" id="product-thumbnails">
        ${galleryImages.map((src,i)=>`<button type="button" class="product-thumb ${i===0?"active":""}" data-index="${i}"><img src="${src}" alt="صورة ${i+1}" loading="lazy"></button>`).join("")}
      </div>
      <div class="gallery-counter" id="gallery-counter">${galleryImages.length?1:0} / ${galleryImages.length} صورة</div>
    </div>
    <div class="book-content">
      <h1>${escapeHtml(product.title)}</h1>
      ${product.author?`<p><strong>✍ المؤلف:</strong> ${escapeHtml(product.author)}</p>`:""}
      <p><strong>📚 التصنيف:</strong> ${escapeHtml(product.category)}</p>
      <p><strong>🏷️ الحالة:</strong> ${product.condition==="new"?"🆕 جديد":"♻️ مستعمل"}</p>
      <div class="price">${Number(product.price||0).toFixed(2)} ريال</div>
      <div class="description"><strong>📝 الوصف</strong><br>${escapeHtml(product.description||"لا يوجد وصف لهذا المنتج.")}</div>
      <button type="button" class="add-to-cart" id="add-detail" ${product.available===false?"disabled":""}>${product.available===false?"غير متوفر":"🛒 أضف إلى السلة"}</button>
    </div>
  </div>`;

  const main=document.getElementById("main-product-image");
  const thumbs=[...document.querySelectorAll(".product-thumb")];
  const counter=document.getElementById("gallery-counter");
  let current=0;
  function showImage(i){if(!galleryImages.length)return;current=(i+galleryImages.length)%galleryImages.length;main.src=galleryImages[current];thumbs.forEach((b,n)=>b.classList.toggle("active",n===current));counter.textContent=`${current+1} / ${galleryImages.length} صورة`;}
  thumbs.forEach(b=>b.onclick=()=>showImage(Number(b.dataset.index)));
  document.querySelector(".gallery-prev").onclick=()=>showImage(current-1);
  document.querySelector(".gallery-next").onclick=()=>showImage(current+1);
  if(galleryImages.length<=1){document.querySelector(".gallery-prev").style.display="none";document.querySelector(".gallery-next").style.display="none";}
  document.getElementById("add-detail")?.addEventListener("click",()=>addToCart(product));
  let startX=0;main.addEventListener("touchstart",e=>startX=e.changedTouches[0].screenX,{passive:true});main.addEventListener("touchend",e=>{const d=e.changedTouches[0].screenX-startX;if(Math.abs(d)>40)showImage(current+(d<0?1:-1))},{passive:true});

  const same=allProducts.filter(x=>String(x.id)!==String(product.id)&&x.category===product.category).slice(0,4);
  related.innerHTML=same.length?same.map(x=>`<a class="related-card" href="book.html?id=${encodeURIComponent(x.id)}"><img src="${imageUrl(x.image||x.images?.[0])}" alt="${escapeHtml(x.title)}"><strong>${escapeHtml(x.title)}</strong><span>${Number(x.price||0).toFixed(2)} ريال</span></a>`).join(""):"<p>لا توجد منتجات مشابهة حاليًا.</p>";
}

(async()=>{
  try{
    const all=await getAllProducts();
    const product=all.find(p=>String(p.id)===String(productId)||String(p.requestId)===String(productId));
    if(!product){details.innerHTML='<div class="no-results"><h2>المنتج غير موجود</h2><a href="index.html" class="back-home">العودة إلى المتجر</a></div>';return;}
    renderProduct(product,all);renderCartBadge();
  }catch(error){console.error(error);details.innerHTML='<div class="no-results"><h2>تعذر تحميل بيانات المنتج</h2><p>حدث خطأ أثناء قراءة بيانات المنتج أو صوره. حاول تحديث الصفحة.</p></div>';}
})();
