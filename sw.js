```js
const CACHE = "lahgha-v132";

const ASSETS = [
    "./",
    "./index.html",
    "./categories.html",
    "./category.html",
    "./book.html",
    "./about.html",
    "./contact.html",
    "./checkout.html",
    "./success.html",
    "./style.css",
    "./script.js",
    "./book.js",
    "./checkout.js",
    "./books.json"
];

/* =========================================
   Install
========================================= */

self.addEventListener("install", event => {

    event.waitUntil(

        caches
            .open(CACHE)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())

    );

});


/* =========================================
   Activate
========================================= */

self.addEventListener("activate", event => {

    event.waitUntil(

        caches
            .keys()
            .then(keys =>

                Promise.all(

                    keys

                        .filter(key => key !== CACHE)

                        .map(key =>
                            caches.delete(key)
                        )

                )

            )

            .then(() =>
                self.clients.claim()
            )

    );

});


/* =========================================
   Fetch
========================================= */

self.addEventListener("fetch", event => {

    const request = event.request;


    if (request.method !== "GET") {
        return;
    }


    const url = new URL(request.url);


    /*
       لا نخزن Supabase في Service Worker.
       طلبات المنتجات يجب أن تأتي مباشرة
       من قاعدة البيانات.
    */

    if (
        url.hostname.includes("supabase.co")
    ) {

        return;

    }


    /*
       صفحات HTML:
       الشبكة أولًا، ثم الكاش عند انقطاع الشبكة.
    */

    if (
        request.mode === "navigate" ||
        request.destination === "document"
    ) {

        event.respondWith(

            fetch(request)

                .then(response => {

                    return response;

                })

                .catch(() => {

                    return caches.match(request);

                })

        );

        return;

    }


    /*
       الملفات الثابتة:
       الشبكة أولًا ثم حفظ النسخة الجديدة.
    */

    event.respondWith(

        fetch(request)

            .then(response => {

                if (
                    response &&
                    response.status === 200
                ) {

                    const copy =
                        response.clone();


                    caches
                        .open(CACHE)
                        .then(cache => {

                            cache.put(
                                request,
                                copy
                            );

                        });

                }


                return response;

            })

            .catch(() => {

                return caches.match(request);

            })

    );

});
```
