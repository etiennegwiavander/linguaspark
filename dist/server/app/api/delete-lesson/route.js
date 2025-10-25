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
exports.id = "app/api/delete-lesson/route";
exports.ids = ["app/api/delete-lesson/route"];
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

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fdelete-lesson%2Froute&page=%2Fapi%2Fdelete-lesson%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fdelete-lesson%2Froute.ts&appDir=D%3A%5Clinguaspark%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=D%3A%5Clinguaspark&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!*******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fdelete-lesson%2Froute&page=%2Fapi%2Fdelete-lesson%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fdelete-lesson%2Froute.ts&appDir=D%3A%5Clinguaspark%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=D%3A%5Clinguaspark&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var D_linguaspark_app_api_delete_lesson_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/delete-lesson/route.ts */ \"(rsc)/./app/api/delete-lesson/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/delete-lesson/route\",\n        pathname: \"/api/delete-lesson\",\n        filename: \"route\",\n        bundlePath: \"app/api/delete-lesson/route\"\n    },\n    resolvedPagePath: \"D:\\\\linguaspark\\\\app\\\\api\\\\delete-lesson\\\\route.ts\",\n    nextConfigOutput,\n    userland: D_linguaspark_app_api_delete_lesson_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/delete-lesson/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZkZWxldGUtbGVzc29uJTJGcm91dGUmcGFnZT0lMkZhcGklMkZkZWxldGUtbGVzc29uJTJGcm91dGUmYXBwUGF0aHM9JnBhZ2VQYXRoPXByaXZhdGUtbmV4dC1hcHAtZGlyJTJGYXBpJTJGZGVsZXRlLWxlc3NvbiUyRnJvdXRlLnRzJmFwcERpcj1EJTNBJTVDbGluZ3Vhc3BhcmslNUNhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPUQlM0ElNUNsaW5ndWFzcGFyayZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD0mcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQXNHO0FBQ3ZDO0FBQ2M7QUFDRTtBQUMvRTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsZ0hBQW1CO0FBQzNDO0FBQ0EsY0FBYyx5RUFBUztBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsWUFBWTtBQUNaLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQSxRQUFRLGlFQUFpRTtBQUN6RTtBQUNBO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ3VIOztBQUV2SCIsInNvdXJjZXMiOlsid2VicGFjazovL215LXYwLXByb2plY3QvP2E4Y2EiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Z1dHVyZS9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Z1dHVyZS9yb3V0ZS1raW5kXCI7XG5pbXBvcnQgeyBwYXRjaEZldGNoIGFzIF9wYXRjaEZldGNoIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvbGliL3BhdGNoLWZldGNoXCI7XG5pbXBvcnQgKiBhcyB1c2VybGFuZCBmcm9tIFwiRDpcXFxcbGluZ3Vhc3BhcmtcXFxcYXBwXFxcXGFwaVxcXFxkZWxldGUtbGVzc29uXFxcXHJvdXRlLnRzXCI7XG4vLyBXZSBpbmplY3QgdGhlIG5leHRDb25maWdPdXRwdXQgaGVyZSBzbyB0aGF0IHdlIGNhbiB1c2UgdGhlbSBpbiB0aGUgcm91dGVcbi8vIG1vZHVsZS5cbmNvbnN0IG5leHRDb25maWdPdXRwdXQgPSBcIlwiXG5jb25zdCByb3V0ZU1vZHVsZSA9IG5ldyBBcHBSb3V0ZVJvdXRlTW9kdWxlKHtcbiAgICBkZWZpbml0aW9uOiB7XG4gICAgICAgIGtpbmQ6IFJvdXRlS2luZC5BUFBfUk9VVEUsXG4gICAgICAgIHBhZ2U6IFwiL2FwaS9kZWxldGUtbGVzc29uL3JvdXRlXCIsXG4gICAgICAgIHBhdGhuYW1lOiBcIi9hcGkvZGVsZXRlLWxlc3NvblwiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvZGVsZXRlLWxlc3Nvbi9yb3V0ZVwiXG4gICAgfSxcbiAgICByZXNvbHZlZFBhZ2VQYXRoOiBcIkQ6XFxcXGxpbmd1YXNwYXJrXFxcXGFwcFxcXFxhcGlcXFxcZGVsZXRlLWxlc3NvblxcXFxyb3V0ZS50c1wiLFxuICAgIG5leHRDb25maWdPdXRwdXQsXG4gICAgdXNlcmxhbmRcbn0pO1xuLy8gUHVsbCBvdXQgdGhlIGV4cG9ydHMgdGhhdCB3ZSBuZWVkIHRvIGV4cG9zZSBmcm9tIHRoZSBtb2R1bGUuIFRoaXMgc2hvdWxkXG4vLyBiZSBlbGltaW5hdGVkIHdoZW4gd2UndmUgbW92ZWQgdGhlIG90aGVyIHJvdXRlcyB0byB0aGUgbmV3IGZvcm1hdC4gVGhlc2Vcbi8vIGFyZSB1c2VkIHRvIGhvb2sgaW50byB0aGUgcm91dGUuXG5jb25zdCB7IHJlcXVlc3RBc3luY1N0b3JhZ2UsIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzIH0gPSByb3V0ZU1vZHVsZTtcbmNvbnN0IG9yaWdpbmFsUGF0aG5hbWUgPSBcIi9hcGkvZGVsZXRlLWxlc3Nvbi9yb3V0ZVwiO1xuZnVuY3Rpb24gcGF0Y2hGZXRjaCgpIHtcbiAgICByZXR1cm4gX3BhdGNoRmV0Y2goe1xuICAgICAgICBzZXJ2ZXJIb29rcyxcbiAgICAgICAgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZVxuICAgIH0pO1xufVxuZXhwb3J0IHsgcm91dGVNb2R1bGUsIHJlcXVlc3RBc3luY1N0b3JhZ2UsIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzLCBvcmlnaW5hbFBhdGhuYW1lLCBwYXRjaEZldGNoLCAgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwLXJvdXRlLmpzLm1hcCJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fdelete-lesson%2Froute&page=%2Fapi%2Fdelete-lesson%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fdelete-lesson%2Froute.ts&appDir=D%3A%5Clinguaspark%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=D%3A%5Clinguaspark&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./app/api/delete-lesson/route.ts":
/*!****************************************!*\
  !*** ./app/api/delete-lesson/route.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   DELETE: () => (/* binding */ DELETE)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _supabase_supabase_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @supabase/supabase-js */ \"(rsc)/./node_modules/@supabase/supabase-js/dist/module/index.js\");\n\n\nasync function DELETE(request) {\n    try {\n        const supabaseUrl = \"https://jbkpnirowdvlwlgheqho.supabase.co\";\n        const supabaseKey = \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impia3BuaXJvd2R2bHdsZ2hlcWhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTQ3NTEsImV4cCI6MjA3NDQ5MDc1MX0.FZhruXKDzIkZLhla5oerfs7yzjvTsGLlKTUer34N6N0\";\n        console.log(\"[API] Delete lesson - Getting auth token from request headers\");\n        // Get the Authorization header from the request\n        const authHeader = request.headers.get(\"Authorization\");\n        if (!authHeader) {\n            console.error(\"[API] No Authorization header\");\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: \"No authorization header\"\n            }, {\n                status: 401\n            });\n        }\n        // Get lesson ID from URL\n        const url = new URL(request.url);\n        const lessonId = url.searchParams.get(\"id\");\n        if (!lessonId) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: \"No lesson ID provided\"\n            }, {\n                status: 400\n            });\n        }\n        console.log(\"[API] Deleting lesson:\", lessonId);\n        // Create a Supabase client with the user's token\n        const token = authHeader.replace(\"Bearer \", \"\");\n        const supabase = (0,_supabase_supabase_js__WEBPACK_IMPORTED_MODULE_1__.createClient)(supabaseUrl, supabaseKey, {\n            global: {\n                headers: {\n                    Authorization: authHeader\n                }\n            }\n        });\n        // Get user from token\n        const { data: { user }, error: authError } = await supabase.auth.getUser(token);\n        if (authError || !user) {\n            console.error(\"[API] Auth error:\", authError);\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: \"Authentication failed\"\n            }, {\n                status: 401\n            });\n        }\n        console.log(\"[API] Authenticated user:\", user.id);\n        // Delete lesson (RLS policy will ensure user owns it)\n        const { error: deleteError } = await supabase.from(\"lessons\").delete().eq(\"id\", lessonId).eq(\"tutor_id\", user.id);\n        if (deleteError) {\n            console.error(\"[API] Failed to delete lesson:\", deleteError);\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: `Failed to delete lesson: ${deleteError.message}`\n            }, {\n                status: 500\n            });\n        }\n        console.log(\"[API] ✅ Lesson deleted successfully\");\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            success: true\n        });\n    } catch (error) {\n        console.error(\"[API] Error:\", error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: error instanceof Error ? error.message : \"Unknown error\"\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL2RlbGV0ZS1sZXNzb24vcm91dGUudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQTBDO0FBQ1U7QUFFN0MsZUFBZUUsT0FBT0MsT0FBZ0I7SUFDM0MsSUFBSTtRQUNGLE1BQU1DLGNBQWNDLDBDQUFvQztRQUN4RCxNQUFNRyxjQUFjSCxrTkFBeUM7UUFFN0RLLFFBQVFDLEdBQUcsQ0FBQztRQUVaLGdEQUFnRDtRQUNoRCxNQUFNQyxhQUFhVCxRQUFRVSxPQUFPLENBQUNDLEdBQUcsQ0FBQztRQUV2QyxJQUFJLENBQUNGLFlBQVk7WUFDZkYsUUFBUUssS0FBSyxDQUFDO1lBQ2QsT0FBT2YscURBQVlBLENBQUNnQixJQUFJLENBQUM7Z0JBQUVELE9BQU87WUFBMEIsR0FBRztnQkFBRUUsUUFBUTtZQUFJO1FBQy9FO1FBRUEseUJBQXlCO1FBQ3pCLE1BQU1DLE1BQU0sSUFBSUMsSUFBSWhCLFFBQVFlLEdBQUc7UUFDL0IsTUFBTUUsV0FBV0YsSUFBSUcsWUFBWSxDQUFDUCxHQUFHLENBQUM7UUFFdEMsSUFBSSxDQUFDTSxVQUFVO1lBQ2IsT0FBT3BCLHFEQUFZQSxDQUFDZ0IsSUFBSSxDQUFDO2dCQUFFRCxPQUFPO1lBQXdCLEdBQUc7Z0JBQUVFLFFBQVE7WUFBSTtRQUM3RTtRQUVBUCxRQUFRQyxHQUFHLENBQUMsMEJBQTBCUztRQUV0QyxpREFBaUQ7UUFDakQsTUFBTUUsUUFBUVYsV0FBV1csT0FBTyxDQUFDLFdBQVc7UUFDNUMsTUFBTUMsV0FBV3ZCLG1FQUFZQSxDQUFDRyxhQUFhSSxhQUFhO1lBQ3REaUIsUUFBUTtnQkFDTlosU0FBUztvQkFDUGEsZUFBZWQ7Z0JBQ2pCO1lBQ0Y7UUFDRjtRQUVBLHNCQUFzQjtRQUN0QixNQUFNLEVBQUVlLE1BQU0sRUFBRUMsSUFBSSxFQUFFLEVBQUViLE9BQU9jLFNBQVMsRUFBRSxHQUFHLE1BQU1MLFNBQVNNLElBQUksQ0FBQ0MsT0FBTyxDQUFDVDtRQUV6RSxJQUFJTyxhQUFhLENBQUNELE1BQU07WUFDdEJsQixRQUFRSyxLQUFLLENBQUMscUJBQXFCYztZQUNuQyxPQUFPN0IscURBQVlBLENBQUNnQixJQUFJLENBQUM7Z0JBQUVELE9BQU87WUFBd0IsR0FBRztnQkFBRUUsUUFBUTtZQUFJO1FBQzdFO1FBRUFQLFFBQVFDLEdBQUcsQ0FBQyw2QkFBNkJpQixLQUFLSSxFQUFFO1FBRWhELHNEQUFzRDtRQUN0RCxNQUFNLEVBQUVqQixPQUFPa0IsV0FBVyxFQUFFLEdBQUcsTUFBTVQsU0FDbENVLElBQUksQ0FBQyxXQUNMQyxNQUFNLEdBQ05DLEVBQUUsQ0FBQyxNQUFNaEIsVUFDVGdCLEVBQUUsQ0FBQyxZQUFZUixLQUFLSSxFQUFFO1FBRXpCLElBQUlDLGFBQWE7WUFDZnZCLFFBQVFLLEtBQUssQ0FBQyxrQ0FBa0NrQjtZQUNoRCxPQUFPakMscURBQVlBLENBQUNnQixJQUFJLENBQUM7Z0JBQUVELE9BQU8sQ0FBQyx5QkFBeUIsRUFBRWtCLFlBQVlJLE9BQU8sQ0FBQyxDQUFDO1lBQUMsR0FBRztnQkFBRXBCLFFBQVE7WUFBSTtRQUN2RztRQUVBUCxRQUFRQyxHQUFHLENBQUM7UUFDWixPQUFPWCxxREFBWUEsQ0FBQ2dCLElBQUksQ0FBQztZQUFFc0IsU0FBUztRQUFLO0lBQzNDLEVBQUUsT0FBT3ZCLE9BQU87UUFDZEwsUUFBUUssS0FBSyxDQUFDLGdCQUFnQkE7UUFDOUIsT0FBT2YscURBQVlBLENBQUNnQixJQUFJLENBQ3RCO1lBQUVELE9BQU9BLGlCQUFpQndCLFFBQVF4QixNQUFNc0IsT0FBTyxHQUFHO1FBQWdCLEdBQ2xFO1lBQUVwQixRQUFRO1FBQUk7SUFFbEI7QUFDRiIsInNvdXJjZXMiOlsid2VicGFjazovL215LXYwLXByb2plY3QvLi9hcHAvYXBpL2RlbGV0ZS1sZXNzb24vcm91dGUudHM/YmM5OSJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0UmVzcG9uc2UgfSBmcm9tIFwibmV4dC9zZXJ2ZXJcIlxyXG5pbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tIFwiQHN1cGFiYXNlL3N1cGFiYXNlLWpzXCJcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBERUxFVEUocmVxdWVzdDogUmVxdWVzdCkge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBzdXBhYmFzZVVybCA9IHByb2Nlc3MuZW52Lk5FWFRfUFVCTElDX1NVUEFCQVNFX1VSTCFcclxuICAgIGNvbnN0IHN1cGFiYXNlS2V5ID0gcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfU1VQQUJBU0VfQU5PTl9LRVkhXHJcbiAgICBcclxuICAgIGNvbnNvbGUubG9nKCdbQVBJXSBEZWxldGUgbGVzc29uIC0gR2V0dGluZyBhdXRoIHRva2VuIGZyb20gcmVxdWVzdCBoZWFkZXJzJylcclxuICAgIFxyXG4gICAgLy8gR2V0IHRoZSBBdXRob3JpemF0aW9uIGhlYWRlciBmcm9tIHRoZSByZXF1ZXN0XHJcbiAgICBjb25zdCBhdXRoSGVhZGVyID0gcmVxdWVzdC5oZWFkZXJzLmdldCgnQXV0aG9yaXphdGlvbicpXHJcbiAgICBcclxuICAgIGlmICghYXV0aEhlYWRlcikge1xyXG4gICAgICBjb25zb2xlLmVycm9yKCdbQVBJXSBObyBBdXRob3JpemF0aW9uIGhlYWRlcicpXHJcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiAnTm8gYXV0aG9yaXphdGlvbiBoZWFkZXInIH0sIHsgc3RhdHVzOiA0MDEgfSlcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gR2V0IGxlc3NvbiBJRCBmcm9tIFVSTFxyXG4gICAgY29uc3QgdXJsID0gbmV3IFVSTChyZXF1ZXN0LnVybClcclxuICAgIGNvbnN0IGxlc3NvbklkID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoJ2lkJylcclxuICAgIFxyXG4gICAgaWYgKCFsZXNzb25JZCkge1xyXG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ05vIGxlc3NvbiBJRCBwcm92aWRlZCcgfSwgeyBzdGF0dXM6IDQwMCB9KVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBjb25zb2xlLmxvZygnW0FQSV0gRGVsZXRpbmcgbGVzc29uOicsIGxlc3NvbklkKVxyXG4gICAgXHJcbiAgICAvLyBDcmVhdGUgYSBTdXBhYmFzZSBjbGllbnQgd2l0aCB0aGUgdXNlcidzIHRva2VuXHJcbiAgICBjb25zdCB0b2tlbiA9IGF1dGhIZWFkZXIucmVwbGFjZSgnQmVhcmVyICcsICcnKVxyXG4gICAgY29uc3Qgc3VwYWJhc2UgPSBjcmVhdGVDbGllbnQoc3VwYWJhc2VVcmwsIHN1cGFiYXNlS2V5LCB7XHJcbiAgICAgIGdsb2JhbDoge1xyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgIEF1dGhvcml6YXRpb246IGF1dGhIZWFkZXJcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgICBcclxuICAgIC8vIEdldCB1c2VyIGZyb20gdG9rZW5cclxuICAgIGNvbnN0IHsgZGF0YTogeyB1c2VyIH0sIGVycm9yOiBhdXRoRXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlLmF1dGguZ2V0VXNlcih0b2tlbilcclxuICAgIFxyXG4gICAgaWYgKGF1dGhFcnJvciB8fCAhdXNlcikge1xyXG4gICAgICBjb25zb2xlLmVycm9yKCdbQVBJXSBBdXRoIGVycm9yOicsIGF1dGhFcnJvcilcclxuICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6ICdBdXRoZW50aWNhdGlvbiBmYWlsZWQnIH0sIHsgc3RhdHVzOiA0MDEgfSlcclxuICAgIH1cclxuICAgIFxyXG4gICAgY29uc29sZS5sb2coJ1tBUEldIEF1dGhlbnRpY2F0ZWQgdXNlcjonLCB1c2VyLmlkKVxyXG4gICAgXHJcbiAgICAvLyBEZWxldGUgbGVzc29uIChSTFMgcG9saWN5IHdpbGwgZW5zdXJlIHVzZXIgb3ducyBpdClcclxuICAgIGNvbnN0IHsgZXJyb3I6IGRlbGV0ZUVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgICAuZnJvbShcImxlc3NvbnNcIilcclxuICAgICAgLmRlbGV0ZSgpXHJcbiAgICAgIC5lcShcImlkXCIsIGxlc3NvbklkKVxyXG4gICAgICAuZXEoXCJ0dXRvcl9pZFwiLCB1c2VyLmlkKVxyXG4gICAgXHJcbiAgICBpZiAoZGVsZXRlRXJyb3IpIHtcclxuICAgICAgY29uc29sZS5lcnJvcignW0FQSV0gRmFpbGVkIHRvIGRlbGV0ZSBsZXNzb246JywgZGVsZXRlRXJyb3IpXHJcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiBgRmFpbGVkIHRvIGRlbGV0ZSBsZXNzb246ICR7ZGVsZXRlRXJyb3IubWVzc2FnZX1gIH0sIHsgc3RhdHVzOiA1MDAgfSlcclxuICAgIH1cclxuICAgIFxyXG4gICAgY29uc29sZS5sb2coJ1tBUEldIOKchSBMZXNzb24gZGVsZXRlZCBzdWNjZXNzZnVsbHknKVxyXG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgc3VjY2VzczogdHJ1ZSB9KVxyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKCdbQVBJXSBFcnJvcjonLCBlcnJvcilcclxuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbihcclxuICAgICAgeyBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicgfSxcclxuICAgICAgeyBzdGF0dXM6IDUwMCB9XHJcbiAgICApXHJcbiAgfVxyXG59XHJcbiJdLCJuYW1lcyI6WyJOZXh0UmVzcG9uc2UiLCJjcmVhdGVDbGllbnQiLCJERUxFVEUiLCJyZXF1ZXN0Iiwic3VwYWJhc2VVcmwiLCJwcm9jZXNzIiwiZW52IiwiTkVYVF9QVUJMSUNfU1VQQUJBU0VfVVJMIiwic3VwYWJhc2VLZXkiLCJORVhUX1BVQkxJQ19TVVBBQkFTRV9BTk9OX0tFWSIsImNvbnNvbGUiLCJsb2ciLCJhdXRoSGVhZGVyIiwiaGVhZGVycyIsImdldCIsImVycm9yIiwianNvbiIsInN0YXR1cyIsInVybCIsIlVSTCIsImxlc3NvbklkIiwic2VhcmNoUGFyYW1zIiwidG9rZW4iLCJyZXBsYWNlIiwic3VwYWJhc2UiLCJnbG9iYWwiLCJBdXRob3JpemF0aW9uIiwiZGF0YSIsInVzZXIiLCJhdXRoRXJyb3IiLCJhdXRoIiwiZ2V0VXNlciIsImlkIiwiZGVsZXRlRXJyb3IiLCJmcm9tIiwiZGVsZXRlIiwiZXEiLCJtZXNzYWdlIiwic3VjY2VzcyIsIkVycm9yIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./app/api/delete-lesson/route.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@supabase","vendor-chunks/tr46","vendor-chunks/whatwg-url","vendor-chunks/webidl-conversions"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fdelete-lesson%2Froute&page=%2Fapi%2Fdelete-lesson%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fdelete-lesson%2Froute.ts&appDir=D%3A%5Clinguaspark%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=D%3A%5Clinguaspark&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();