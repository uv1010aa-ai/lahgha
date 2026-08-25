const SUPABASE_URL = "https://gyyyzavjzvcxzgrtukqu.supabase.co";
const SUPABASE_KEY = "sb_publishable_Rj6F5Fp2tHJSWzbRRdLVZQ_8D5wL8p-";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let books = [];
let cart = JSON.parse(localStorage.getItem("cart") || "[]");

const booksContainer = document.getElementById("books");
const cartItems = document.getElementById("cart-items");
const cartCount = document.getElementById("cart-count");
const totalPrice = document.getElementById("total-price");
const searchInput = document.getElementById("product-search");
const clearCartBtn = document.getElementById("clear-cart");
const checkoutBtn = document.getElementById("checkout-btn");
const toast = document.getElementById("toast");
const productsHeading = document.getElementById("products-heading");
const productsSubtitle = document.getElementById("products-subtitle");


// =========================
// الصور
// =========================

function imageUrl(path) {
    const value = String(path || "").trim();

    if (/^https?:\/\//i.test(value)) {
        return value;
    }

    return encodeURI(
        value.replace(/^\.\//, "")
    );
}


// =========================
// حماية النصوص
// =========================

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


// =========================
// رسالة التنبيه
// =========================

function showToast(message) {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}


// =========================
// حفظ السلة
// =========================

function saveCart() {
    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

    updateCart();
}


// =========================
// قراءة الرابط
// =========================

const params = new URLSearchParams(
    window.location.search
);

const selectedCategory =
    (params.get("category") || "").trim();


// =========================
// واجهة الصفحة
// =========================

function updateConditionUI() {

    if (!productsHeading) {
        return;
    }

    if (selectedCategory) {

        productsHeading.textContent =
            `📂 منتجات ${selectedCategory}`;

        if (productsSubtitle) {
            productsSubtitle.textContent =
                `تصفح جميع السلع المتاحة في قسم ${selectedCategory}.`;
        }

        return;
    }

    productsHeading.textContent =
        "🛍️ أحدث المنتجات";

    if (productsSubtitle) {
        productsSubtitle.textContent =
            "تصفح أحدث المنتجات من جميع الأقسام.";
    }
}


// =========================
// عرض المنتجات
// =========================

function renderBooks(list) {

    if (!booksContainer) return;

    booksContainer.innerHTML = "";


    if (!list.length) {

        booksContainer.innerHTML = `

            <div class="no-results">

                <div class="empty-icon">
                    🔎
                </div>

                <h3>
                    لا توجد سلع في هذا القسم حاليًا.
                </h3>

                <p>
                    جرّب قسمًا آخر.
                </p>

            </div>

        `;

        return;
    }


    list.forEach(book => {

        const card =
            document.createElement("article");

        card.className =
            "book-card";


        card.innerHTML = `

            <a
                class="book-link"
                href="book.html?id=${encodeURIComponent(book.id)}"
            >

                <img
                    src="${imageUrl(book.image)}"
                    alt="${escapeHtml(book.title)}"
                    loading="lazy"
                >

                <div class="book-info">

                    <h3>
                        ${escapeHtml(book.title)}
                    </h3>

                    <p>
                        📂 ${escapeHtml(book.category)}
                    </p>

                    ${
                        book.description
                            ? `
                                <p>
                                    ${escapeHtml(book.description)}
                                </p>
                            `
                            : ""
                    }

                    <p class="price">
                        ${escapeHtml(book.price)} ريال
                    </p>

                    <p class="availability">
                        ${
                            book.available
                                ? "🟢 متوفر"
                                : "🔴 غير متوفر"
                        }
                    </p>

                </div>

            </a>

            <button
                class="add-btn"
                type="button"
                ${book.available ? "" : "disabled"}
            >
                ${
                    book.available
                        ? "🛒 أضف إلى السلة"
                        : "غير متوفر"
                }
            </button>

        `;


        const addButton =
            card.querySelector(".add-btn");


        if (addButton) {

            addButton.onclick = () => {

                addToCart(book);

                showToast(
                    `تمت إضافة «${book.title}» إلى السلة`
                );
            };
        }


        booksContainer.appendChild(card);
    });
}


// =========================
// البحث والتصفية
// =========================

function applyFilters() {

    const q =
        searchInput?.value
            .trim()
            .toLocaleLowerCase("ar") || "";


    let filtered = [...books];


    // =========================
    // القسم
    // =========================

    if (selectedCategory) {

        filtered =
            filtered.filter(
                book =>
                    String(book.category || "").trim() ===
                    selectedCategory
            );
    }


    // =========================
    // البحث
    // =========================

    if (q) {

        filtered =
            filtered.filter(book => {

                const text = `

                    ${book.title || ""}

                    ${book.category || ""}

                    ${book.description || ""}

                `.toLocaleLowerCase("ar");


                return text.includes(q);
            });
    }


    renderBooks(filtered);
}


// =========================
// إضافة إلى السلة
// =========================

function addToCart(book) {

    const existing =
        cart.find(
            item =>
                item.id === book.id
        );


    if (existing) {

        existing.quantity++;

    } else {

        cart.push({
            ...book,
            quantity: 1
        });
    }


    saveCart();
}


// =========================
// تحديث السلة
// =========================

function updateCart() {

    if (!cartItems) return;

    cartItems.innerHTML = "";

    let total = 0;
    let count = 0;


    cart.forEach(book => {

        book.quantity =
            Math.max(
                1,
                Number(book.quantity) || 1
            );


        const subtotal =
            Number(book.price || 0) *
            book.quantity;


        total += subtotal;
        count += book.quantity;


        const li =
            document.createElement("li");


        li.innerHTML = `

            <div class="cart-item">

                <img
                    src="${imageUrl(book.image)}"
                    alt="${escapeHtml(book.title)}"
                    class="cart-image"
                >

                <div class="cart-info">

                    <h4>
                        ${escapeHtml(book.title)}
                    </h4>

                    <p>
                        ${escapeHtml(book.price)} ريال ×
                        ${book.quantity}
                    </p>

                    <strong>
                        ${subtotal} ريال
                    </strong>

                    <div class="cart-buttons">

                        <button
                            class="minus"
                            type="button"
                        >
                            −
                        </button>

                        <span>
                            ${book.quantity}
                        </span>

                        <button
                            class="plus"
                            type="button"
                        >
                            +
                        </button>

                    </div>

                    <button
                        class="delete"
                        type="button"
                    >
                        🗑 حذف
                    </button>

                </div>

            </div>

        `;


        li.querySelector(".plus").onclick =
            () => {

                book.quantity++;

                saveCart();
            };


        li.querySelector(".minus").onclick =
            () => {

                book.quantity--;

                if (book.quantity <= 0) {

                    cart =
                        cart.filter(
                            item =>
                                item.id !== book.id
                        );
                }

                saveCart();
            };


        li.querySelector(".delete").onclick =
            () => {

                cart =
                    cart.filter(
                        item =>
                            item.id !== book.id
                    );

                saveCart();

                showToast(
                    "تم حذف المنتج"
                );
            };


        cartItems.appendChild(li);
    });


    if (!cart.length) {

        cartItems.innerHTML = `

            <li class="cart-empty">

                🛍️ السلة فارغة

                <br>

                <small>
                    أضف منتجًا للبدء.
                </small>

            </li>

        `;
    }


    if (cartCount) {
        cartCount.textContent =
            count;
    }


    if (totalPrice) {
        totalPrice.textContent =
            total;
    }


    localStorage.setItem(
        "totalPrice",
        total
    );

    localStorage.setItem(
        "totalItems",
        count
    );
}


// =========================
// إفراغ السلة
// =========================

clearCartBtn?.addEventListener(
    "click",
    () => {

        if (
            cart.length &&
            confirm(
                "هل تريد إفراغ السلة بالكامل؟"
            )
        ) {

            cart = [];

            saveCart();

            showToast(
                "تم إفراغ السلة"
            );
        }
    }
);


// =========================
// إتمام الطلب
// =========================

checkoutBtn?.addEventListener(
    "click",
    event => {

        if (!cart.length) {

            event.preventDefault();

            showToast(
                "السلة فارغة، أضف منتجًا أولًا"
            );

            return;
        }


        location.href =
            "checkout.html";
    }
);


// =========================
// البحث
// =========================

searchInput?.addEventListener(
    "input",
    applyFilters
);


// =========================
// تحميل المنتجات من Supabase
// =========================

async function loadProducts() {

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("products")
            .select("*")
            .order("id", {
                ascending: false
            });


        if (error) {
            throw error;
        }


        books =
            (data || []).map(book => ({

                id: book.id,

                title:
                    String(
                        book.title || ""
                    ).trim(),

                description:
                    String(
                        book.description || ""
                    ).trim(),

                price:
                    Number(
                        book.price || 0
                    ),

                category:
                    String(
                        book.category || ""
                    ).trim(),

                image:
                    String(
                        book.image || ""
                    ).trim(),

                available:
                    Boolean(
                        book.available
                    )

            }));


        applyFilters();

        updateCart();


    } catch (error) {

        console.error(
            "Supabase error:",
            error
        );


        if (booksContainer) {

            booksContainer.innerHTML = `

                <div class="no-results">

                    <h3>
                        تعذر تحميل المنتجات
                    </h3>

                    <p>
                        حدث خطأ أثناء الاتصال بقاعدة البيانات.
                    </p>

                </div>

            `;
        }
    }
}


// =========================
// تشغيل الصفحة
// =========================

updateConditionUI();

loadProducts();
