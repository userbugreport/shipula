(window.webpackJsonp=window.webpackJsonp||[]).push([[23],{122:function(e,t,r){"use strict";r.r(t),r.d(t,"frontMatter",(function(){return a})),r.d(t,"metadata",(function(){return i})),r.d(t,"rightToc",(function(){return c})),r.d(t,"default",(function(){return u}));var n=r(2),o=(r(0),r(136));const a={title:"HTTPS"},i={id:"reference/https",isDocsHomePage:!1,title:"HTTPS",description:"Shipula will take care of HTTPS for you, but you will need to help out a little bit:",source:"@site/docs/reference/https.mdx",permalink:"/shipula/docs/reference/https",editUrl:"https://github.com/facebook/docusaurus/edit/master/website/docs/reference/https.mdx",sidebar:"someSidebar",previous:{title:"logs",permalink:"/shipula/docs/commands/logs"},next:{title:"package.json",permalink:"/shipula/docs/reference/package.json"}},c=[{value:"hostname",id:"hostname",children:[]},{value:"DNS",id:"dns",children:[]}],l={rightToc:c};function u({components:e,...t}){return Object(o.b)("wrapper",Object(n.a)({},l,t,{components:e,mdxType:"MDXLayout"}),Object(o.b)("p",null,"Shipula will take care of HTTPS for you, but you will need to help out a little bit:"),Object(o.b)("h2",{id:"hostname"},"hostname"),Object(o.b)("p",null,"Shipula needs to be told where it is in order to provsion a certificate for you, the way to do that is in your ",Object(o.b)("a",Object(n.a)({parentName:"p"},{href:"./package.json#hostname"}),"package.json"),"."),Object(o.b)("h2",{id:"dns"},"DNS"),Object(o.b)("p",null,"Shipula will tell you the the cloud hostname to create a ","[CNAME]"," record with ",Object(o.b)("inlineCode",{parentName:"p"},"npx shipula info"),".\nPaste this into your DNS provider."))}u.isMDXComponent=!0},136:function(e,t,r){"use strict";r.d(t,"a",(function(){return s})),r.d(t,"b",(function(){return b}));var n=r(0),o=r.n(n);function a(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function i(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function c(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?i(Object(r),!0).forEach((function(t){a(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):i(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function l(e,t){if(null==e)return{};var r,n,o=function(e,t){if(null==e)return{};var r,n,o={},a=Object.keys(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||(o[r]=e[r]);return o}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(o[r]=e[r])}return o}var u=o.a.createContext({}),p=function(e){var t=o.a.useContext(u),r=t;return e&&(r="function"==typeof e?e(t):c(c({},t),e)),r},s=function(e){var t=p(e.components);return o.a.createElement(u.Provider,{value:t},e.children)},f={inlineCode:"code",wrapper:function(e){var t=e.children;return o.a.createElement(o.a.Fragment,{},t)}},d=o.a.forwardRef((function(e,t){var r=e.components,n=e.mdxType,a=e.originalType,i=e.parentName,u=l(e,["components","mdxType","originalType","parentName"]),s=p(r),d=n,b=s["".concat(i,".").concat(d)]||s[d]||f[d]||a;return r?o.a.createElement(b,c(c({ref:t},u),{},{components:r})):o.a.createElement(b,c({ref:t},u))}));function b(e,t){var r=arguments,n=t&&t.mdxType;if("string"==typeof e||n){var a=r.length,i=new Array(a);i[0]=d;var c={};for(var l in t)hasOwnProperty.call(t,l)&&(c[l]=t[l]);c.originalType=e,c.mdxType="string"==typeof e?e:n,i[1]=c;for(var u=2;u<a;u++)i[u]=r[u];return o.a.createElement.apply(null,i)}return o.a.createElement.apply(null,r)}d.displayName="MDXCreateElement"}}]);