"use strict"

const actualVersionCach = '3'
const actualIdCach = '2ryfs7'
const staticCacheActual = `st-cache-${actualIdCach}-${actualVersionCach}`
const dynamicCacheActual = `dn-cache-${actualIdCach}-${actualVersionCach}`
let isOnline = true

const assets = {
    static: [
        '/',
        'index.html',
        '/static/js/main.6d248b1a.js',
        '/static/js/231.e61645a0.chunk.js',
        '/static/js/354.c2dc4e4a.chunk.js',
        '/static/js/231.e61645a0.chunk.js.LICENSE.txt',
        '/static/js/main.6d248b1a.js.LICENSE.txt',
        '/static/main.1de048ee.css',
        '/static/231.95c46afb.chunk.css',
        '/offline.html',
        '/asset-manifest.json',
        '/manifest.json',
        '/favicon.ico',
        '/logo512.png',
        '/logo192.png',        
        '/static_resume/SapozhnikovI_CV_en.pdf',
        '/static_resume/SapozhnikovI_CV_ru.pdf',
    ]
}

self.addEventListener('install', onInstall)
self.addEventListener('activate', onActivate)
self.addEventListener('message', onMessage)
self.addEventListener('fetch', onFetch)

mainSW().catch(console.error)

async function mainSW() {
    await sendMessage({
        requestStatusUpdate: true
    })
    await cacheLoggedOutFiles()
}

async function onInstall(evt) {
    self.skipWaiting()
}

async function sendMessage(msg) {
    const allClients = await clients.matchAll({
        includeUncontrolled: true
    })
    return Promise.all(
        allClients.map(function clientMsg(client) {
            const chan = new MessageChannel()
            chan.port1.onMessage = onMessage
            return client.postMessage(msg, [chan.port2])
        })
    )
}

function onMessage({
    data
}) {
    if (data.statusUpdate) {
        ({
            isOnline
        } = data.statusUpdate)
    }
}

function onFetch(evt) {
    let urlOF = new URL(evt.request.url)
    if (urlOF.origin === location.origin) {
        evt.respondWith(router(evt.request))
    }
}


async function router(req) {
    let url = new URL(req.url)
    let reqURL = url.pathname
    let cache = await caches.open(staticCacheActual)

    if (url.origin === location.origin) {
        let res
        let nres

        try {
            let fetchOptions = {
                method: req.method,
                headers: req.headers,
                credentials: 'omit',
                cache: 'no-store'
            }
            let res = await fetch(req.url, fetchOptions)
            if (res && res.ok) {
                await cache.put(reqURL, res.clone())
                return res
            }
        }
        catch (err) {

        }

        res = await cache.match(reqURL)
        if (res) {
            return res.clone()
        } else {
                nres = await caches.match('/offline.html')
                if (nres) {
                    return nres.clone()
                } else {
                    return offlineNoCachStaticResponse(req)
                }
        }

    }
}

function offlineNoCachStaticResponse(req) {
    const offlineHTMLConst = `
    <!DOCTYPE html>
    <head>
        <meta charset="utf-8" />
        <title>offline status</title>
    </head>    
    <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <header id="offline-status">
            <h2>Actual cache not found. Please connect to the internet and try again.</h2>
        </header>
    </body>`

    const requestNow = new Response(offlineHTMLConst,{
        headers: new Headers({
            'Content-Type': 'text/html'+';charset=utf-8',
        }),
        ok: true,
		status: 200,
		statusText: 'OK',
        type: 'opaqueredirect'
	})
	return requestNow
}
function notFoundResponse() {
	return new Response('',{
		status: 404,
		statusText: 'Not Found'
	})
}

function delay(ms) {
	return new Promise(function c(res){
		setTimeout(res,ms);
	})
}

function onActivate(evt) {
    evt.waitUntil(handleActivation())
}

async function handleActivation() {
    await clearCaches()
    await cacheLoggedOutFiles( /*forceReload=*/ true)
    await clients.claim()
}

async function clearCaches() {
    let cacheNames = await caches.keys()
    let oldCacheNames = cacheNames.filter(function matchOldCache(cacheName) {
        const regSWCache = new RegExp(`^st-cache-${actualIdCach}-\\d+$`)
        const regSWCache2 = new RegExp(`^st-cache-${actualIdCach}-(\\d+)$`)

        if (regSWCache.test(cacheName)) {
            let [, cacheVersion] = cacheName.match(regSWCache2)
            cacheVersion = cacheVersion !== null ? Number(cacheVersion) : cacheVersion
            return (
                cacheVersion > 0 &&
                cacheVersion !== actualVersionCach
            )
        }
    })
    return Promise.all(
        oldCacheNames.map(function deleteCache(cacheName) {
            return caches.delete(cacheName)
        })
    )

}

async function cacheLoggedOutFiles(forceReload = false) {
    const cache = await caches.open(staticCacheActual)

    return Promise.all(
        assets.static.map(async function rquestFile(url) {
            try {
                let res

                if (!forceReload) {
                    res = await cache.match(url)
                    if (res) {
                        return res
                    }
                }

                let fetchOptions = {
                    method: 'GET',
                    cache: 'no-cache',
                    credentials: 'omit'
                }
                res = await fetch(url, fetchOptions)
                if (res.ok) {
                    await cache.put(url, res)
                }

            } catch (err) {

            }
        })
    )
}