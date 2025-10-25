"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/get-lesson/route";
exports.ids = ["app/api/get-lesson/route"];
exports.modules = {

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ "punycode":
/*!***************************!*\
  !*** external "punycode" ***!
  \***************************/
/***/ ((module) => {

module.exports = require("punycode");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("stream");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("zlib");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fget-lesson%2Froute&page=%2Fapi%2Fget-lesson%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fget-lesson%2Froute.ts&appDir=D%3A%5Clinguaspark%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=D%3A%5Clinguaspark&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fget-lesson%2Froute&page=%2Fapi%2Fget-lesson%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fget-lesson%2Froute.ts&appDir=D%3A%5Clinguaspark%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=D%3A%5Clinguaspark&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var D_linguaspark_app_api_get_lesson_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/get-lesson/route.ts */ \"(rsc)/./app/api/get-lesson/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/get-lesson/route\",\n        pathname: \"/api/get-lesson\",\n        filename: \"route\",\n        bundlePath: \"app/api/get-lesson/route\"\n    },\n    resolvedPagePath: \"D:\\\\linguaspark\\\\app\\\\api\\\\get-lesson\\\\route.ts\",\n    nextConfigOutput,\n    userland: D_linguaspark_app_api_get_lesson_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/get-lesson/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZnZXQtbGVzc29uJTJGcm91dGUmcGFnZT0lMkZhcGklMkZnZXQtbGVzc29uJTJGcm91dGUmYXBwUGF0aHM9JnBhZ2VQYXRoPXByaXZhdGUtbmV4dC1hcHAtZGlyJTJGYXBpJTJGZ2V0LWxlc3NvbiUyRnJvdXRlLnRzJmFwcERpcj1EJTNBJTVDbGluZ3Vhc3BhcmslNUNhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPUQlM0ElNUNsaW5ndWFzcGFyayZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD0mcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQXNHO0FBQ3ZDO0FBQ2M7QUFDRDtBQUM1RTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsZ0hBQW1CO0FBQzNDO0FBQ0EsY0FBYyx5RUFBUztBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsWUFBWTtBQUNaLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQSxRQUFRLGlFQUFpRTtBQUN6RTtBQUNBO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ3VIOztBQUV2SCIsInNvdXJjZXMiOlsid2VicGFjazovL215LXYwLXByb2plY3QvP2YzN2UiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Z1dHVyZS9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Z1dHVyZS9yb3V0ZS1raW5kXCI7XG5pbXBvcnQgeyBwYXRjaEZldGNoIGFzIF9wYXRjaEZldGNoIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvbGliL3BhdGNoLWZldGNoXCI7XG5pbXBvcnQgKiBhcyB1c2VybGFuZCBmcm9tIFwiRDpcXFxcbGluZ3Vhc3BhcmtcXFxcYXBwXFxcXGFwaVxcXFxnZXQtbGVzc29uXFxcXHJvdXRlLnRzXCI7XG4vLyBXZSBpbmplY3QgdGhlIG5leHRDb25maWdPdXRwdXQgaGVyZSBzbyB0aGF0IHdlIGNhbiB1c2UgdGhlbSBpbiB0aGUgcm91dGVcbi8vIG1vZHVsZS5cbmNvbnN0IG5leHRDb25maWdPdXRwdXQgPSBcIlwiXG5jb25zdCByb3V0ZU1vZHVsZSA9IG5ldyBBcHBSb3V0ZVJvdXRlTW9kdWxlKHtcbiAgICBkZWZpbml0aW9uOiB7XG4gICAgICAgIGtpbmQ6IFJvdXRlS2luZC5BUFBfUk9VVEUsXG4gICAgICAgIHBhZ2U6IFwiL2FwaS9nZXQtbGVzc29uL3JvdXRlXCIsXG4gICAgICAgIHBhdGhuYW1lOiBcIi9hcGkvZ2V0LWxlc3NvblwiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvZ2V0LWxlc3Nvbi9yb3V0ZVwiXG4gICAgfSxcbiAgICByZXNvbHZlZFBhZ2VQYXRoOiBcIkQ6XFxcXGxpbmd1YXNwYXJrXFxcXGFwcFxcXFxhcGlcXFxcZ2V0LWxlc3NvblxcXFxyb3V0ZS50c1wiLFxuICAgIG5leHRDb25maWdPdXRwdXQsXG4gICAgdXNlcmxhbmRcbn0pO1xuLy8gUHVsbCBvdXQgdGhlIGV4cG9ydHMgdGhhdCB3ZSBuZWVkIHRvIGV4cG9zZSBmcm9tIHRoZSBtb2R1bGUuIFRoaXMgc2hvdWxkXG4vLyBiZSBlbGltaW5hdGVkIHdoZW4gd2UndmUgbW92ZWQgdGhlIG90aGVyIHJvdXRlcyB0byB0aGUgbmV3IGZvcm1hdC4gVGhlc2Vcbi8vIGFyZSB1c2VkIHRvIGhvb2sgaW50byB0aGUgcm91dGUuXG5jb25zdCB7IHJlcXVlc3RBc3luY1N0b3JhZ2UsIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzIH0gPSByb3V0ZU1vZHVsZTtcbmNvbnN0IG9yaWdpbmFsUGF0aG5hbWUgPSBcIi9hcGkvZ2V0LWxlc3Nvbi9yb3V0ZVwiO1xuZnVuY3Rpb24gcGF0Y2hGZXRjaCgpIHtcbiAgICByZXR1cm4gX3BhdGNoRmV0Y2goe1xuICAgICAgICBzZXJ2ZXJIb29rcyxcbiAgICAgICAgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZVxuICAgIH0pO1xufVxuZXhwb3J0IHsgcm91dGVNb2R1bGUsIHJlcXVlc3RBc3luY1N0b3JhZ2UsIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzLCBvcmlnaW5hbFBhdGhuYW1lLCBwYXRjaEZldGNoLCAgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwLXJvdXRlLmpzLm1hcCJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fget-lesson%2Froute&page=%2Fapi%2Fget-lesson%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fget-lesson%2Froute.ts&appDir=D%3A%5Clinguaspark%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=D%3A%5Clinguaspark&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./app/api/get-lesson/route.ts":
/*!*************************************!*\
  !*** ./app/api/get-lesson/route.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _supabase_supabase_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @supabase/supabase-js */ \"(rsc)/./node_modules/@supabase/supabase-js/dist/module/index.js\");\n\n\nasync function GET(request) {\n    try {\n        const supabaseUrl = \"https://jbkpnirowdvlwlgheqho.supabase.co\";\n        const supabaseKey = \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impia3BuaXJvd2R2bHdsZ2hlcWhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTQ3NTEsImV4cCI6MjA3NDQ5MDc1MX0.FZhruXKDzIkZLhla5oerfs7yzjvTsGLlKTUer34N6N0\";\n        console.log(\"[API] Get lesson - Getting auth token from request headers\");\n        // Get the Authorization header from the request\n        const authHeader = request.headers.get(\"Authorization\");\n        if (!authHeader) {\n            console.error(\"[API] No Authorization header\");\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: \"No authorization header\"\n            }, {\n                status: 401\n            });\n        }\n        // Get lesson ID from URL\n        const url = new URL(request.url);\n        const lessonId = url.searchParams.get(\"id\");\n        if (!lessonId) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: \"No lesson ID provided\"\n            }, {\n                status: 400\n            });\n        }\n        console.log(\"[API] Fetching lesson:\", lessonId);\n        // Create a Supabase client with the user's token\n        const token = authHeader.replace(\"Bearer \", \"\");\n        const supabase = (0,_supabase_supabase_js__WEBPACK_IMPORTED_MODULE_1__.createClient)(supabaseUrl, supabaseKey, {\n            global: {\n                headers: {\n                    Authorization: authHeader\n                }\n            }\n        });\n        // Get user from token\n        const { data: { user }, error: authError } = await supabase.auth.getUser(token);\n        if (authError || !user) {\n            console.error(\"[API] Auth error:\", authError);\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: \"Authentication failed\"\n            }, {\n                status: 401\n            });\n        }\n        console.log(\"[API] Authenticated user:\", user.id);\n        // Fetch lesson (RLS policy will ensure user owns it)\n        const { data: lesson, error: fetchError } = await supabase.from(\"lessons\").select(\"*\").eq(\"id\", lessonId).eq(\"tutor_id\", user.id).single();\n        if (fetchError) {\n            console.error(\"[API] Failed to fetch lesson:\", fetchError);\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: `Failed to fetch lesson: ${fetchError.message}`\n            }, {\n                status: 404\n            });\n        }\n        if (!lesson) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: \"Lesson not found\"\n            }, {\n                status: 404\n            });\n        }\n        console.log(\"[API] ✅ Lesson fetched successfully:\", lesson.title);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            lesson\n        });\n    } catch (error) {\n        console.error(\"[API] Error:\", error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: error instanceof Error ? error.message : \"Unknown error\"\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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MC1wcm9qZWN0Ly4vYXBwL2FwaS9nZXQtbGVzc29uL3JvdXRlLnRzP2M4Y2YiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmV4dFJlc3BvbnNlIH0gZnJvbSBcIm5leHQvc2VydmVyXCJcclxuaW1wb3J0IHsgY3JlYXRlQ2xpZW50IH0gZnJvbSBcIkBzdXBhYmFzZS9zdXBhYmFzZS1qc1wiXHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gR0VUKHJlcXVlc3Q6IFJlcXVlc3QpIHtcclxuICB0cnkge1xyXG4gICAgY29uc3Qgc3VwYWJhc2VVcmwgPSBwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19TVVBBQkFTRV9VUkwhXHJcbiAgICBjb25zdCBzdXBhYmFzZUtleSA9IHByb2Nlc3MuZW52Lk5FWFRfUFVCTElDX1NVUEFCQVNFX0FOT05fS0VZIVxyXG4gICAgXHJcbiAgICBjb25zb2xlLmxvZygnW0FQSV0gR2V0IGxlc3NvbiAtIEdldHRpbmcgYXV0aCB0b2tlbiBmcm9tIHJlcXVlc3QgaGVhZGVycycpXHJcbiAgICBcclxuICAgIC8vIEdldCB0aGUgQXV0aG9yaXphdGlvbiBoZWFkZXIgZnJvbSB0aGUgcmVxdWVzdFxyXG4gICAgY29uc3QgYXV0aEhlYWRlciA9IHJlcXVlc3QuaGVhZGVycy5nZXQoJ0F1dGhvcml6YXRpb24nKVxyXG4gICAgXHJcbiAgICBpZiAoIWF1dGhIZWFkZXIpIHtcclxuICAgICAgY29uc29sZS5lcnJvcignW0FQSV0gTm8gQXV0aG9yaXphdGlvbiBoZWFkZXInKVxyXG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ05vIGF1dGhvcml6YXRpb24gaGVhZGVyJyB9LCB7IHN0YXR1czogNDAxIH0pXHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIEdldCBsZXNzb24gSUQgZnJvbSBVUkxcclxuICAgIGNvbnN0IHVybCA9IG5ldyBVUkwocmVxdWVzdC51cmwpXHJcbiAgICBjb25zdCBsZXNzb25JZCA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KCdpZCcpXHJcbiAgICBcclxuICAgIGlmICghbGVzc29uSWQpIHtcclxuICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6ICdObyBsZXNzb24gSUQgcHJvdmlkZWQnIH0sIHsgc3RhdHVzOiA0MDAgfSlcclxuICAgIH1cclxuICAgIFxyXG4gICAgY29uc29sZS5sb2coJ1tBUEldIEZldGNoaW5nIGxlc3NvbjonLCBsZXNzb25JZClcclxuICAgIFxyXG4gICAgLy8gQ3JlYXRlIGEgU3VwYWJhc2UgY2xpZW50IHdpdGggdGhlIHVzZXIncyB0b2tlblxyXG4gICAgY29uc3QgdG9rZW4gPSBhdXRoSGVhZGVyLnJlcGxhY2UoJ0JlYXJlciAnLCAnJylcclxuICAgIGNvbnN0IHN1cGFiYXNlID0gY3JlYXRlQ2xpZW50KHN1cGFiYXNlVXJsLCBzdXBhYmFzZUtleSwge1xyXG4gICAgICBnbG9iYWw6IHtcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICBBdXRob3JpemF0aW9uOiBhdXRoSGVhZGVyXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gICAgXHJcbiAgICAvLyBHZXQgdXNlciBmcm9tIHRva2VuXHJcbiAgICBjb25zdCB7IGRhdGE6IHsgdXNlciB9LCBlcnJvcjogYXV0aEVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZS5hdXRoLmdldFVzZXIodG9rZW4pXHJcbiAgICBcclxuICAgIGlmIChhdXRoRXJyb3IgfHwgIXVzZXIpIHtcclxuICAgICAgY29uc29sZS5lcnJvcignW0FQSV0gQXV0aCBlcnJvcjonLCBhdXRoRXJyb3IpXHJcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiAnQXV0aGVudGljYXRpb24gZmFpbGVkJyB9LCB7IHN0YXR1czogNDAxIH0pXHJcbiAgICB9XHJcbiAgICBcclxuICAgIGNvbnNvbGUubG9nKCdbQVBJXSBBdXRoZW50aWNhdGVkIHVzZXI6JywgdXNlci5pZClcclxuICAgIFxyXG4gICAgLy8gRmV0Y2ggbGVzc29uIChSTFMgcG9saWN5IHdpbGwgZW5zdXJlIHVzZXIgb3ducyBpdClcclxuICAgIGNvbnN0IHsgZGF0YTogbGVzc29uLCBlcnJvcjogZmV0Y2hFcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgICAgLmZyb20oXCJsZXNzb25zXCIpXHJcbiAgICAgIC5zZWxlY3QoXCIqXCIpXHJcbiAgICAgIC5lcShcImlkXCIsIGxlc3NvbklkKVxyXG4gICAgICAuZXEoXCJ0dXRvcl9pZFwiLCB1c2VyLmlkKVxyXG4gICAgICAuc2luZ2xlKClcclxuICAgIFxyXG4gICAgaWYgKGZldGNoRXJyb3IpIHtcclxuICAgICAgY29uc29sZS5lcnJvcignW0FQSV0gRmFpbGVkIHRvIGZldGNoIGxlc3NvbjonLCBmZXRjaEVycm9yKVxyXG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogYEZhaWxlZCB0byBmZXRjaCBsZXNzb246ICR7ZmV0Y2hFcnJvci5tZXNzYWdlfWAgfSwgeyBzdGF0dXM6IDQwNCB9KVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpZiAoIWxlc3Nvbikge1xyXG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ0xlc3NvbiBub3QgZm91bmQnIH0sIHsgc3RhdHVzOiA0MDQgfSlcclxuICAgIH1cclxuICAgIFxyXG4gICAgY29uc29sZS5sb2coJ1tBUEldIOKchSBMZXNzb24gZmV0Y2hlZCBzdWNjZXNzZnVsbHk6JywgbGVzc29uLnRpdGxlKVxyXG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgbGVzc29uIH0pXHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ1tBUEldIEVycm9yOicsIGVycm9yKVxyXG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKFxyXG4gICAgICB7IGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyB9LFxyXG4gICAgICB7IHN0YXR1czogNTAwIH1cclxuICAgIClcclxuICB9XHJcbn1cclxuIl0sIm5hbWVzIjpbIk5leHRSZXNwb25zZSIsImNyZWF0ZUNsaWVudCIsIkdFVCIsInJlcXVlc3QiLCJzdXBhYmFzZVVybCIsInByb2Nlc3MiLCJlbnYiLCJORVhUX1BVQkxJQ19TVVBBQkFTRV9VUkwiLCJzdXBhYmFzZUtleSIsIk5FWFRfUFVCTElDX1NVUEFCQVNFX0FOT05fS0VZIiwiY29uc29sZSIsImxvZyIsImF1dGhIZWFkZXIiLCJoZWFkZXJzIiwiZ2V0IiwiZXJyb3IiLCJqc29uIiwic3RhdHVzIiwidXJsIiwiVVJMIiwibGVzc29uSWQiLCJzZWFyY2hQYXJhbXMiLCJ0b2tlbiIsInJlcGxhY2UiLCJzdXBhYmFzZSIsImdsb2JhbCIsIkF1dGhvcml6YXRpb24iLCJkYXRhIiwidXNlciIsImF1dGhFcnJvciIsImF1dGgiLCJnZXRVc2VyIiwiaWQiLCJsZXNzb24iLCJmZXRjaEVycm9yIiwiZnJvbSIsInNlbGVjdCIsImVxIiwic2luZ2xlIiwibWVzc2FnZSIsInRpdGxlIiwiRXJyb3IiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./app/api/get-lesson/route.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@supabase","vendor-chunks/tr46","vendor-chunks/whatwg-url","vendor-chunks/webidl-conversions"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fget-lesson%2Froute&page=%2Fapi%2Fget-lesson%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fget-lesson%2Froute.ts&appDir=D%3A%5Clinguaspark%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=D%3A%5Clinguaspark&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();