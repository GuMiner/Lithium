import "../scss/math.css";
import renderMathInElement from 'katex/contrib/auto-render/auto-render.js';

window.onload = (event) =>
{
    renderMathInElement(document.body);
};