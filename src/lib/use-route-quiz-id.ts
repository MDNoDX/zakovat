"use client";

import { useEffect, useState } from "react";

// The site is a static export (Cloudflare Workers static assets), so only
// one placeholder page per dynamic route is built (`/edit/_`, `/present/_`)
// and `_redirects` serves it for every `/edit/<id>` and `/present/<id>`.
// The real quiz id therefore has to come from the browser URL, not from
// the build-time `params`.
export function useRouteQuizId(): string {
  const [id, setId] = useState("");
  useEffect(() => {
    const seg = window.location.pathname.replace(/\/+$/, "").split("/").pop() ?? "";
    setId(decodeURIComponent(seg));
  }, []);
  return id;
}
