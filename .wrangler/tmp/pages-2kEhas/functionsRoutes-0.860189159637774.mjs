import { onRequestGet as __api_nu_js_onRequestGet } from "C:\\laragon\\www\\masjid\\functions\\api\\nu.js"
import { onRequest as __api_db_js_onRequest } from "C:\\laragon\\www\\masjid\\functions\\api\\db.js"
import { onRequest as __api_khgt_js_onRequest } from "C:\\laragon\\www\\masjid\\functions\\api\\khgt.js"

export const routes = [
    {
      routePath: "/api/nu",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_nu_js_onRequestGet],
    },
  {
      routePath: "/api/db",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_db_js_onRequest],
    },
  {
      routePath: "/api/khgt",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_khgt_js_onRequest],
    },
  ]