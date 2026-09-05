/* =====================================================
   لَحْقها - إتمام الطلب
   Supabase + LocalStorage Cart
===================================================== */


/* =====================================================
   SUPABASE
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

    console.error(
        "Cart read error:",
        error
    );

    cart = [];

}


/* =====================================================
   عناصر الصفحة
===================================================== */

const form =
    document.getElementById(
        "checkout-form"
    );

const message =
    document.getElementById(
        "checkout-message"
    );

const orderCount =
    document.getElementById(
        "order-count"
    );

const orderTotal =
    document.getElementById(
        "order-total"
    );

const payment =
    document.getElementById(
        "payment"
    );

const bankDetails =
    document.getElementById(
        "bankDetails"
    );

const submitButton =
    form
        ? form.querySelector(
            'button[type="submit"]'
        )
        : null;


/* =====================================================
   الرسائل
===================================================== */

function showMessage(
    text,
    type = "error"
) {

    if (!message) {
        return;
    }

    message.textContent =
        text;

    message.className =
        type;

}


/* =====================================================
   إظهار بيانات التحويل البنكي
===================================================== */

if (
    payment &&
    bankDetails
) {

    payment.addEventListener(
        "change",
        function () {

            if (
                payment.value ===
                "تحويل بنكي"
            ) {

                bankDetails.style.display =
                    "block";

            } else {

                bankDetails.style.display =
                    "none";

            }

        }
    );

}


/* =====================================================
   حساب الطلب
===================================================== */

function calculateOrder() {

    let count = 0;

    let total = 0;


    cart.forEach(
        function (item) {

            const quantity =
                Math.max(
                    1,
                    Number(
                        item.quantity
                    ) || 1
                );


            const price =
                Number(
                    item.price
                ) || 0;


            count +=
                quantity;


            total +=
                price *
                quantity;

        }
    );


    return {

        count:
            count,

        total:
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

    return cart.map(
        function (item) {

            const price =
                Number(
                    item.price
                ) || 0;


            const quantity =
                Math.max(
                    1,
                    Number(
                        item.quantity
                    ) || 1
                );


            return {

                id:
                    item.id || null,

                name:
                    item.name ||
                    item.title ||
                    "منتج",

                title:
                    item.title ||
                    item.name ||
                    "منتج",

                category:
                    item.category ||
                    "",

                price:
                    price,

                quantity:
                    quantity,

                image:
                    item.image ||
                    "",

                subtotal:
                    Number(
                        (
                            price *
                            quantity
                        ).toFixed(2)
                    )

            };

        }
    );

}


/* =====================================================
   إذا كانت السلة فارغة
===================================================== */

if (!cart.length) {

    showMessage(
        "⚠️ السلة فارغة. أضف منتجات قبل إتمام الطلب."
    );


    if (submitButton) {

        submitButton.disabled =
            true;

    }

}


/* =====================================================
   إرسال الطلب
===================================================== */

if (form) {

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            showMessage(
                "",
                ""
            );


            /* -----------------------------------------
               التأكد من وجود منتجات
            ----------------------------------------- */

            if (!cart.length) {

                showMessage(
                    "❌ السلة فارغة. أضف منتجًا أولًا."
                );

                return;

            }


            /* -----------------------------------------
               قراءة بيانات المشتري
            ----------------------------------------- */

            const buyerName =
                document
                    .getElementById(
                        "name"
                    )
                    .value
                    .trim();


            const buyerPhone =
                document
                    .getElementById(
                        "phone"
                    )
                    .value
                    .trim();


            const buyerAddress =
                document
                    .getElementById(
                        "address"
                    )
                    .value
                    .trim();


            const paymentMethod =
                payment.value.trim();


            /* -----------------------------------------
               التحقق من البيانات
            ----------------------------------------- */

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


            /* -----------------------------------------
               حساب الإجمالي
            ----------------------------------------- */

            const summary =
                calculateOrder();


            /* -----------------------------------------
               المنتجات
            ----------------------------------------- */

            const items =
                prepareItems();


            /* -----------------------------------------
               إنشاء رقم الطلب
            ----------------------------------------- */

            const orderNumber =
                "ORD-" +
                Date.now();


            /* -----------------------------------------
               تحديد حالة الطلب
            ----------------------------------------- */

            let orderStatus =
                "pending";


            if (
                paymentMethod ===
                "تحويل بنكي"
            ) {

                orderStatus =
                    "waiting_transfer";

            }


            /* -----------------------------------------
               تعطيل الزر
            ----------------------------------------- */

            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "⏳ جاري إرسال الطلب...";

            }


            try {

                console.log(
                    "Sending order:",
                    {
                        orderNumber:
                            orderNumber,

                        buyerName:
                            buyerName,

                        buyerPhone:
                            buyerPhone,

                        buyerAddress:
                            buyerAddress,

                        paymentMethod:
                            paymentMethod,

                        items:
                            items,

                        total:
                            summary.total,

                        status:
                            orderStatus
                    }
                );


                /* =====================================
                   إرسال الطلب إلى Supabase
                ===================================== */

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
                                    orderStatus

                            }
                        ])
                        .select()
                        .single();


                /* -------------------------------------
                   فحص الخطأ
                ------------------------------------- */

                if (error) {

                    console.error(
                        "Supabase error:",
                        error
                    );

                    throw error;

                }


                /* -------------------------------------
                   التأكد من إنشاء الطلب
                ------------------------------------- */

                if (!data) {

                    throw new Error(
                        "لم يتم إنشاء الطلب."
                    );

                }


                console.log(
                    "Order created successfully:",
                    data
                );


                /* =====================================
                   حفظ بيانات الطلب لصفحة التأكيد
                ===================================== */

                const trackingCode =
                    data.order_number ||
                    orderNumber;


                localStorage.setItem(
                    "lastOrder",
                    JSON.stringify({

                        id:
                            data.order_number ||
                            orderNumber,

                        trackingCode:
                            trackingCode,

                        total:
                            summary.total,

                        phone:
                            buyerPhone,

                        name:
                            buyerName,

                        status:
                            orderStatus

                    })
                );


                /* =====================================
                   حذف السلة بعد نجاح الطلب
                ===================================== */

                localStorage.removeItem(
                    "cart"
                );

                cart = [];


                /* =====================================
                   رسالة نجاح
                ===================================== */

                if (
                    paymentMethod ===
                    "تحويل بنكي"
                ) {

                    showMessage(
                        "✅ تم إرسال طلبك بنجاح. بانتظار التحقق من التحويل.",
                        "success"
                    );

                } else {

                    showMessage(
                        "✅ تم تأكيد طلبك بنجاح.",
                        "success"
                    );

                }


                /* -------------------------------------
                   تغيير نص الزر
                ------------------------------------- */

                if (submitButton) {

                    submitButton.textContent =
                        "✅ تم إرسال الطلب";

                }


                /* -------------------------------------
                   تعطيل الحقول
                ------------------------------------- */

                form
                    .querySelectorAll(
                        "input, textarea, select"
                    )
                    .forEach(
                        function (element) {

                            element.disabled =
                                true;

                        }
                    );


                /* =====================================
                   فتح صفحة تأكيد الطلب للمشتري
                ===================================== */

                setTimeout(
                    function () {

                        window.location.href =
                            "success.html";

                    },
                    500
                );


            } catch (error) {

                console.error(
                    "Order submission error:",
                    error
                );


                let errorMessage =
                    "❌ تعذر إرسال الطلب.";


                /* -------------------------------------
                   RLS
                ------------------------------------- */

                if (
                    error &&
                    error.code ===
                    "42501"
                ) {

                    errorMessage =
                        "❌ لا توجد صلاحية لإضافة الطلب. تحقق من سياسة INSERT في Supabase.";

                }


                /* -------------------------------------
                   رقم مكرر
                ------------------------------------- */

                else if (
                    error &&
                    error.code ===
                    "23505"
                ) {

                    errorMessage =
                        "❌ رقم الطلب مكرر. حاول مرة أخرى.";

                }


                /* -------------------------------------
                   خطأ آخر
                ------------------------------------- */

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


                /* -------------------------------------
                   إعادة الزر
                ------------------------------------- */

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
