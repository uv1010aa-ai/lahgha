/* =====================================================
   لَحْقها - إتمام الطلب
   Supabase + LocalStorage Cart
===================================================== */

const SUPABASE_URL =
    "https://gyyyzavjzvcxzgrtukqu.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_Rj6F5Fp2tHJSWzbRRdLVZQ_8D5wL8p-";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =====================================================
   قراءة السلة
===================================================== */

let cart = [];

try {
    cart = JSON.parse(
        localStorage.getItem("cart") || "[]"
    );

    if (!Array.isArray(cart)) {
        cart = [];
    }

} catch (error) {

    console.error("Cart read error:", error);

    cart = [];
}


/* =====================================================
   عناصر الصفحة
===================================================== */

const form =
    document.getElementById("checkout-form");

const message =
    document.getElementById("checkout-message");

const orderCount =
    document.getElementById("order-count");

const orderTotal =
    document.getElementById("order-total");

const submitButton =
    form
        ? form.querySelector(
            'button[type="submit"]'
        )
        : null;


/* =====================================================
   رسالة المستخدم
===================================================== */

function showMessage(text, type = "error") {

    if (!message) {
        return;
    }

    message.textContent = text;
    message.className = type;
}


/* =====================================================
   حساب الطلب
===================================================== */

function calculateOrder() {

    let count = 0;
    let total = 0;

    cart.forEach(item => {

        const quantity =
            Math.max(
                1,
                Number(item.quantity) || 1
            );

        const price =
            Number(item.price) || 0;

        count += quantity;

        total +=
            price * quantity;
    });

    return {
        count,
        total
    };
}


/* =====================================================
   عرض ملخص الطلب
===================================================== */

function renderSummary() {

    const summary =
        calculateOrder();

    if (orderCount) {
        orderCount.textContent =
            summary.count;
    }

    if (orderTotal) {
        orderTotal.textContent =
            summary.total.toFixed(2) +
            " ر.س";
    }
}


/* =====================================================
   تجهيز المنتجات
===================================================== */

function prepareItems() {

    return cart.map(item => {

        const price =
            Number(item.price) || 0;

        const quantity =
            Math.max(
                1,
                Number(item.quantity) || 1
            );

        return {
            id: item.id || null,

            name:
                item.name ||
                item.title ||
                "منتج",

            title:
                item.title ||
                item.name ||
                "منتج",

            category:
                item.category || "",

            price: price,

            quantity: quantity,

            image:
                item.image || "",

            subtotal:
                Number(
                    (price * quantity).toFixed(2)
                )
        };
    });
}


/* =====================================================
   التحقق من السلة
===================================================== */

if (!cart.length) {

    showMessage(
        "⚠️ السلة فارغة. أضف منتجات قبل إتمام الطلب."
    );

    if (submitButton) {
        submitButton.disabled = true;
    }
}


/* =====================================================
   إرسال الطلب
===================================================== */

if (form) {

    form.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            showMessage("", "");


            /* ---------------------------------------------
               التأكد من وجود منتجات
            --------------------------------------------- */

            if (!cart.length) {

                showMessage(
                    "❌ السلة فارغة. أضف منتجًا أولًا."
                );

                return;
            }


            /* ---------------------------------------------
               قراءة بيانات المشتري
            --------------------------------------------- */

            const buyerName =
                document
                    .getElementById("name")
                    .value
                    .trim();

            const buyerPhone =
                document
                    .getElementById("phone")
                    .value
                    .trim();

            const buyerAddress =
                document
                    .getElementById("address")
                    .value
                    .trim();

            const paymentMethod =
                document
                    .getElementById("payment")
                    .value
                    .trim();


            /* ---------------------------------------------
               التحقق من البيانات
            --------------------------------------------- */

            if (!buyerName) {

                showMessage(
                    "❌ اكتب الاسم الكامل."
                );

                return;
            }


            if (!buyerPhone) {

                showMessage(
                    "❌ اكتب رقم الجوال."
                );

                return;
            }


            if (!buyerAddress) {

                showMessage(
                    "❌ اكتب عنوان التوصيل."
                );

                return;
            }


            /* ---------------------------------------------
               حساب الإجمالي
            --------------------------------------------- */

            const summary =
                calculateOrder();


            /* ---------------------------------------------
               المنتجات
            --------------------------------------------- */

            const items =
                prepareItems();


            /* ---------------------------------------------
               إنشاء رقم الطلب
            --------------------------------------------- */

            const orderNumber =
                "ORD-" +
                Date.now();


            /* ---------------------------------------------
               تعطيل الزر
            --------------------------------------------- */

            if (submitButton) {

                submitButton.disabled = true;

                submitButton.textContent =
                    "⏳ جاري إرسال الطلب...";
            }


            try {

                console.log(
                    "Sending order:",
                    {
                        orderNumber,
                        buyerName,
                        buyerPhone,
                        buyerAddress,
                        paymentMethod,
                        items,
                        total: summary.total
                    }
                );


                /* =========================================
                   إرسال الطلب إلى Supabase
                ========================================= */

                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .from("orders")
                        .insert([
                            {
                                order_number:
                                    orderNumber,

                                buyer_name:
                                    buyerName,

                                buyer_phone:
                                    buyerPhone,

                                buyer_address:
                                    buyerAddress,

                                payment_method:
                                    paymentMethod,

                                items:
                                    items,

                                total:
                                    summary.total,

                                status:
                                    "pending"
                            }
                        ])
                        .select()
                        .single();


                /* -----------------------------------------
                   فحص الخطأ
                ----------------------------------------- */

                if (error) {

                    console.error(
                        "Supabase error:",
                        error
                    );

                    throw error;
                }


                /* -----------------------------------------
                   التأكد من إنشاء الطلب
                ----------------------------------------- */

                if (!data) {

                    throw new Error(
                        "لم يتم إنشاء الطلب."
                    );
                }


                console.log(
                    "Order created successfully:",
                    data
                );


                /* =========================================
                   نجاح الطلب
                ========================================= */

                localStorage.removeItem("cart");

                cart = [];


                showMessage(
                    "✅ تم تأكيد طلبك بنجاح. رقم الطلب: " +
                    orderNumber,
                    "success"
                );


                if (submitButton) {

                    submitButton.textContent =
                        "✅ تم تأكيد الطلب";
                }


                /* -----------------------------------------
                   تعطيل الحقول
                ----------------------------------------- */

                form
                    .querySelectorAll(
                        "input, textarea, select"
                    )
                    .forEach(element => {

                        element.disabled = true;
                    });


                /* -----------------------------------------
                   الانتقال للرئيسية
                ----------------------------------------- */

                setTimeout(
                    function() {

                        window.location.href =
                            "index.html";

                    },
                    3000
                );


            } catch (error) {

                console.error(
                    "Order submission error:",
                    error
                );


                let errorMessage =
                    "❌ تعذر إرسال الطلب.";


                if (
                    error &&
                    error.code === "42501"
                ) {

                    errorMessage =
                        "❌ لا توجد صلاحية لإضافة الطلب. تحقق من سياسة INSERT في Supabase.";
                }


                else if (
                    error &&
                    error.code === "23505"
                ) {

                    errorMessage =
                        "❌ رقم الطلب مكرر. حاول مرة أخرى.";
                }


                else if (
                    error &&
                    error.message
                ) {

                    errorMessage +=
                        " " +
                        error.message;
                }


                showMessage(
                    errorMessage
                );


                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "✅ تأكيد الطلب";
                }
            }
        }
    );
}


/* =====================================================
   تشغيل الصفحة
===================================================== */

renderSummary();