import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the app be opened from another device on the same network - a phone,
  // to test touch dragging - by pointing it at this machine's local IP.
  //
  // Why it is needed: `next dev` serves the HTML to anyone, but BLOCKS its
  // internal dev assets (the JavaScript bundles, hot reload) when the request
  // comes from a hostname other than localhost. Without this, the page renders
  // perfectly and then nothing works: no validation, no buttons, and forms
  // fall back to the browser's native submit, putting the typed password in
  // the URL.
  //
  // It is a sensible default - otherwise anyone on the same network could
  // poke at the dev server - which is why the exception has to be explicit.
  //
  // `*` matches exactly one label of the hostname, so this covers the whole
  // 192.168.20.x range and survives the router handing out a different
  // address. It only affects `next dev`; production ignores it.
  allowedDevOrigins: ["192.168.20.*"],
};

export default nextConfig;
