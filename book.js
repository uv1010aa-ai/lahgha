```javascript
"use strict";

const productId =
    new URLSearchParams(location.search).get("id") || "";

const details =
    document.getElementById("book-details");

const related =
    document.getElementById("related-container");

let cart =
    JSON.parse(
        localStorage.getItem("cart") || "[]"
    );


/* =========================
   رابط الصورة
========================= */
function imageUrl(path) {

    const value =
        String(path || "").trim();

    if (!value) return "";

    if (
        /^data:image\//i.test(value) ||
        /^https?:\/\//i.test(value)
    ) {
        return value;
    }

    return encodeURI(
        value.replace(/^\.\//, "")
    );
}


/* =========================
   حماية النصوص
========================= */
function escapeHtml(value) {

    return String(value ?? "").replace(
        /[&<>"']/g,
        c => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[c])
    );

}


/* =========================
   توحيد المنتج
   الصورة الأساسية + الصور الإضافية
========================= */
function publicProduct(p) {

    if (
        !p ||
        typeof p !== "object"
    ) {
        return null;
    }


    const primaryImage =
        p.image ||
        p.productImage ||
        p.imageUrl ||
        p.photo ||
        "";


    const extraImages =
        Array.isArray(p.images)
            ? p.images
                .flat(Infinity)
                .filter(Boolean)
            : [];


    /*
       نجمع الصورة الأساسية مع الصور الإضافية
       ونزيل التكرار
    */
    const allImages =
        [
            primaryImage,
            ...extraImages
        ]
        .map(imageUrl)
        .filter(Boolean);


    return {

        id:
            String(
                p.id ??
                p.requestId ??
                ""
            ),

        requestId:
            String(
                p.requestId ??
                p.id ??
                ""
            ),

        title:
            p.title ||
            p.name ||
            p.productName ||
            "سلعة بدون اسم",

        name:
            p.name ||
            p.title ||
            p.productName ||
            "سلعة بدون اسم",

        category:
            String(
                p.category || ""
            ).trim(),

        price:
            Number(
                p.price || 0
            ),

        quantity:
            p.quantity === undefined ||
            p.quantity === null ||
            p.quantity === ""
                ? null
                : Number(p.quantity),

        image:
            allImages[0] || "",

        images:
            [
                ...new Set(allImages)
            ],

        description:
            p.description || "",

        notes:
            p.notes || "",

        condition:
            p.condition || "used",

        available:
            p.available !== false,

        active:
            p.active !== false,

        status:
            p.status || "منشور",

        createdAt:
            p.createdAt || ""

    };

}


/* =========================
   المنتجات المنشورة
========================= */
function getPublished() {

    try {

        const arr =
            JSON.parse(
                localStorage.getItem(
                    "publishedProducts"
                ) || "[]"
            );


        return Array.isArray(arr)

            ? arr
                .map(publicProduct)
                .filter(Boolean)
                .filter(
                    p =>
                        p.active !== false
                )

            : [];

    }

    catch (e) {

        console.error(
            "تعذر قراءة المنتجات المنشورة",
            e
        );

        return [];

    }

}


/* =========================
   جميع المنتجات
========================= */
async function getAllProducts() {

    let books = [];

    try {

        const response =
            await fetch(
                "books.json",
                {
                    cache: "no-store"
                }
            );


        if (response.ok) {

            const data =
                await response.json();


            if (Array.isArray(data)) {

                books =
                    data
                        .map(publicProduct)
                        .filter(Boolean);

            }

        }

    }

    catch (e) {

        console.warn(
            "تعذر تحميل books.json",
            e
        );

    }


    return [
        ...books,
        ...getPublished()
    ];

}


/* =========================
   رسالة صغيرة
========================= */
function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );

    if (!toast) return;


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        showToast.timer
    );


    showToast.timer =
        setTimeout(
            () =>
                toast.classList.remove(
                    "show"
                ),
            2200
        );

}


/* =========================
   حفظ السلة
========================= */
function saveCart() {

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

    renderCartBadge();

}


/* =========================
   عداد السلة
========================= */
function renderCartBadge() {

    document
        .querySelectorAll(
            "#cart-count"
        )
        .forEach(element => {

            element.textContent =
                cart.reduce(
                    (sum, item) =>
                        sum +
                        (
                            Number(
                                item.quantity
                            ) || 0
                        ),
                    0
                );

        });

}


/* =========================
   إضافة إلى السلة
========================= */
function addToCart(product) {

    const found =
        cart.find(
            item =>
                String(item.id) ===
                String(product.id)
        );


    if (found) {

        found.quantity =
            (
                Number(
                    found.quantity
                ) || 0
            ) + 1;

    }

    else {

        cart.push({

            ...product,

            quantity: 1

        });

    }


    saveCart();


    showToast(
        "تمت إضافة المنتج إلى السلة"
    );

}


/* =========================
   عرض المنتج
========================= */
function renderProduct(
    product,
    allProducts
) {

    /*
       استخدام images التي تم تجهيزها
       داخل publicProduct
    */
    const galleryImages =
        [
            ...new Set(
                (
                    Array.isArray(product.images)
                        ? product.images
                        : []
                )
                .map(imageUrl)
                .filter(Boolean)
            )
        ];


    /*
       احتياط إضافي
    */
    if (
        !galleryImages.length &&
        product.image
    ) {

        galleryImages.push(
            imageUrl(product.image)
        );

    }


    document.title =
        `${product.title} - لَحْقها`;


    details.innerHTML = `

        <div class="book-details">

            <div class="product-gallery">

                <div class="main-image-wrap">

                    <button
                        type="button"
                        class="gallery-arrow gallery-prev"
                        aria-label="الصورة السابقة"
                    >
                        ‹
                    </button>


                    <img
                        id="main-product-image"
                        class="book-detail-image"
                        src="${galleryImages[0] || ""}"
                        alt="${escapeHtml(
                            product.title
                        )}"
                        draggable="false"
                    >


                    <button
                        type="button"
                        class="gallery-arrow gallery-next"
                        aria-label="الصورة التالية"
                    >
                        ›
                    </button>

                </div>


                <div
                    class="product-thumbnails"
                    id="product-thumbnails"
                >

                    ${
                        galleryImages
                            .map(
                                (src, i) => `

                                    <button
                                        type="button"
                                        class="product-thumb ${
                                            i === 0
                                                ? "active"
                                                : ""
                                        }"
                                        data-index="${i}"
                                        aria-label="عرض الصورة ${i + 1}"
                                    >

                                        <img
                                            src="${src}"
                                            alt="صورة ${i + 1}"
                                            loading="lazy"
                                            draggable="false"
                                        >

                                    </button>

                                `
                            )
                            .join("")
                    }

                </div>


                <div
                    class="gallery-counter"
                    id="gallery-counter"
                >
                    ${
                        galleryImages.length
                            ? 1
                            : 0
                    }
                    /
                    ${galleryImages.length}
                    صورة
                </div>

            </div>


            <div class="book-content">

                <h1>
                    ${escapeHtml(
                        product.title
                    )}
                </h1>


                ${
                    product.author
                        ? `
                            <p>
                                <strong>
                                    ✍ المؤلف:
                                </strong>

                                ${escapeHtml(
                                    product.author
                                )}
                            </p>
                        `
                        : ""
                }


                <p>

                    <strong>
                        📚 التصنيف:
                    </strong>

                    ${escapeHtml(
                        product.category
                    )}

                </p>


                <p>

                    <strong>
                        🏷️ الحالة:
                    </strong>

                    ${
                        product.condition === "new"
                            ? "🆕 جديد"
                            : "♻️ مستعمل"
                    }

                </p>


                <div class="price">

                    ${Number(
                        product.price || 0
                    ).toFixed(2)}

                    ريال

                </div>


                <div class="description">

                    <strong>
                        📝 الوصف
                    </strong>

                    <br>

                    ${escapeHtml(
                        product.description ||
                        "لا يوجد وصف لهذا المنتج."
                    )}

                </div>


              <button
    type="button"
    class="detail-add"
    id="add-detail"
    ${
        product.available === false
            ? "disabled"
            : ""
    }
>

    ${
        product.available === false
            ? "غير متوفر"
            : "🛒 أضف إلى السلة"
    }

</button>

<a
    href="cart.html"
    id="go-to-cart"
    class="detail-add"
    style="
        display:none;
        box-sizing:border-box;
        text-align:center;
        text-decoration:none;
        background:#2e7d32;
        margin-top:10px;
    "
>
    🧺 الذهاب إلى السلة
</a>

            </div>

        </div>

    `;


    const main =
        document.getElementById(
            "main-product-image"
        );


    const thumbs =
        [
            ...document.querySelectorAll(
                ".product-thumb"
            )
        ];


    const counter =
        document.getElementById(
            "gallery-counter"
        );


    let current = 0;


    /* =========================
       تغيير الصورة
    ========================= */
    function showImage(index) {

        if (
            !galleryImages.length ||
            !main
        ) {
            return;
        }


        current =
            (
                index +
                galleryImages.length
            ) %
            galleryImages.length;


        main.src =
            galleryImages[current];


        thumbs.forEach(
            (button, position) => {

                button.classList.toggle(
                    "active",
                    position === current
                );

            }
        );


        if (counter) {

            counter.textContent =
                `${current + 1} / ${galleryImages.length} صورة`;

        }

    }


    /* =========================
       الصور المصغرة
    ========================= */
    thumbs.forEach(
        button => {

            button.addEventListener(
                "click",
                () =>
                    showImage(
                        Number(
                            button.dataset.index
                        )
                    )
            );

        }
    );


    /* =========================
       الأسهم
    ========================= */
    const previous =
        document.querySelector(
            ".gallery-prev"
        );


    const next =
        document.querySelector(
            ".gallery-next"
        );


    if (previous) {

        previous.addEventListener(
            "click",
            () =>
                showImage(
                    current - 1
                )
        );

    }


    if (next) {

        next.addEventListener(
            "click",
            () =>
                showImage(
                    current + 1
                )
        );

    }


    /*
       إذا كانت صورة واحدة فقط
       نخفي الأسهم والصور المصغرة
    */
    if (
        galleryImages.length <= 1
    ) {

        if (previous) {
            previous.style.display =
                "none";
        }

        if (next) {
            next.style.display =
                "none";
        }

        if (thumbs.length <= 1) {

            const thumbnails =
                document.getElementById(
                    "product-thumbnails"
                );

            if (thumbnails) {
                thumbnails.style.display =
                    "none";
            }

        }

    }


    /* =========================
       السلة
    ========================= */
    const addButton =
        document.getElementById(
            "add-detail"
        );


    addButton?.addEventListener(
        "click",
        () =>
            addToCart(
                product
            )
    );


    /* =========================
       السحب على الجوال
    ========================= */
    let startX = 0;
    let startY = 0;


    if (main) {

        main.addEventListener(
            "touchstart",
            event => {

                const touch =
                    event.changedTouches[0];

                startX =
                    touch.screenX;

                startY =
                    touch.screenY;

            },
            {
                passive: true
            }
        );


        main.addEventListener(
            "touchend",
            event => {

                const touch =
                    event.changedTouches[0];


                const distanceX =
                    touch.screenX -
                    startX;


                const distanceY =
                    touch.screenY -
                    startY;


                /*
                   نتأكد أن الحركة أفقية
                   وليست تمرير الصفحة للأعلى والأسفل
                */
                if (
                    Math.abs(distanceX) > 40 &&
                    Math.abs(distanceX) >
                        Math.abs(distanceY)
                ) {

                    showImage(
                        current +
                        (
                            distanceX < 0
                                ? 1
                                : -1
                        )
                    );

                }

            },
            {
                passive: true
            }
        );

    }


    /* =========================
       المنتجات المشابهة
    ========================= */
    const sameProducts =
        allProducts
            .filter(
                item =>
                    String(item.id) !==
                        String(product.id) &&
                    item.category ===
                        product.category
            )
            .slice(0, 4);


    if (!related) return;


    related.innerHTML =
        sameProducts.length

            ? sameProducts
                .map(
                    item => {

                        const relatedImage =
                            item.image ||
                            item.images?.[0] ||
                            "";


                        return `

                            <a
                                class="related-card"
                                href="book.html?id=${encodeURIComponent(
                                    item.id
                                )}"
                            >

                                <img
                                    src="${imageUrl(
                                        relatedImage
                                    )}"
                                    alt="${escapeHtml(
                                        item.title
                                    )}"
                                    loading="lazy"
                                >

                                <strong>
                                    ${escapeHtml(
                                        item.title
                                    )}
                                </strong>

                                <span>
                                    ${Number(
                                        item.price || 0
                                    ).toFixed(2)}
                                    ريال
                                </span>

                            </a>

                        `;

                    }
                )
                .join("")

            : "<p>لا توجد منتجات مشابهة حاليًا.</p>";

}


/* =========================
   تشغيل الصفحة
========================= */
(async () => {

    try {

        const allProducts =
            await getAllProducts();


        const product =
            allProducts.find(
                item =>
                    String(item.id) ===
                        String(productId) ||

                    String(item.requestId) ===
                        String(productId)
            );


        if (!product) {

            details.innerHTML = `

                <div class="no-results">

                    <h2>
                        المنتج غير موجود
                    </h2>

                    <a
                        href="index.html"
                        class="back-home"
                    >
                        العودة إلى المتجر
                    </a>

                </div>

            `;

            return;

        }


        renderProduct(
            product,
            allProducts
        );


        renderCartBadge();

    }

    catch (error) {

        console.error(
            error
        );


        details.innerHTML = `

            <div class="no-results">

                <h2>
                    تعذر تحميل بيانات المنتج
                </h2>

                <p>
                    حدث خطأ أثناء قراءة بيانات المنتج أو صوره.
                    حاول تحديث الصفحة.
                </p>

            </div>

        `;

    }

})();
```
