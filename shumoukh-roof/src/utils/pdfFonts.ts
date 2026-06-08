import { Font } from "@react-pdf/renderer";

const basePath = typeof window !== 'undefined' ? window.location.pathname.replace(/\/$/, '').replace(/\/index\.html$/, '') : '';
const fontPath = `${basePath}/fonts/Cairo`;

Font.register({
  family: "Cairo",
  fonts: [
    { src: `${fontPath}-Regular.ttf`, fontWeight: 400 },
    { src: `${fontPath}-Bold.ttf`, fontWeight: 700 },
    { src: `${fontPath}-Black.ttf`, fontWeight: 900 },
  ],
});
