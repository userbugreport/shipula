(window.webpackJsonp=window.webpackJsonp||[]).push([[7],{109:function(e,t,n){"use strict";n.r(t),n.d(t,"frontMatter",(function(){return i})),n.d(t,"metadata",(function(){return s})),n.d(t,"rightToc",(function(){return r})),n.d(t,"default",(function(){return c}));var a=n(2),o=(n(0),n(131));const i={title:"Getting Started"},s={id:"getting-started",isDocsHomePage:!0,title:"Getting Started",description:"\u26f4\ud83e\udddb\ud83c\udffb\u200d\u2642\ufe0f",source:"@site/docs/getting-started.mdx",permalink:"/shipula/docs/",editUrl:"https://github.com/facebook/docusaurus/edit/master/website/docs/getting-started.mdx",sidebar:"someSidebar",next:{title:"deploy",permalink:"/shipula/docs/commands/deploy"}},r=[{value:"TLDR",id:"tldr",children:[{value:"Assumptions",id:"assumptions",children:[]}]}],d={rightToc:r};function c({components:e,...t}){return Object(o.b)("wrapper",Object(a.a)({},d,t,{components:e,mdxType:"MDXLayout"}),Object(o.b)("h1",{id:"\ud83e\udddb\u2642\ufe0f"},"\u26f4\ud83e\udddb\ud83c\udffb\u200d\u2642\ufe0f"),Object(o.b)("div",{className:"admonition admonition-tip alert alert--success"},Object(o.b)("div",Object(a.a)({parentName:"div"},{className:"admonition-heading"}),Object(o.b)("h5",{parentName:"div"},Object(o.b)("span",Object(a.a)({parentName:"h5"},{className:"admonition-icon"}),Object(o.b)("svg",Object(a.a)({parentName:"span"},{xmlns:"http://www.w3.org/2000/svg",width:"12",height:"16",viewBox:"0 0 12 16"}),Object(o.b)("path",Object(a.a)({parentName:"svg"},{fillRule:"evenodd",d:"M6.5 0C3.48 0 1 2.19 1 5c0 .92.55 2.25 1 3 1.34 2.25 1.78 2.78 2 4v1h5v-1c.22-1.22.66-1.75 2-4 .45-.75 1-2.08 1-3 0-2.81-2.48-5-5.5-5zm3.64 7.48c-.25.44-.47.8-.67 1.11-.86 1.41-1.25 2.06-1.45 3.23-.02.05-.02.11-.02.17H5c0-.06 0-.13-.02-.17-.2-1.17-.59-1.83-1.45-3.23-.2-.31-.42-.67-.67-1.11C2.44 6.78 2 5.65 2 5c0-2.2 2.02-4 4.5-4 1.22 0 2.36.42 3.22 1.19C10.55 2.94 11 3.94 11 5c0 .66-.44 1.78-.86 2.48zM4 14h5c-.23 1.14-1.3 2-2.5 2s-2.27-.86-2.5-2z"})))),"Shipula' Goal")),Object(o.b)("div",Object(a.a)({parentName:"div"},{className:"admonition-content"}),Object(o.b)("p",{parentName:"div"},"Be the simplest way to get your node server to the cloud"))),Object(o.b)("p",null,"Programming node servers, whichever frameworks you use like ","[Express]"," or ","[Koa]",", or just a raw port server, sooner or later you need to ship it."),Object(o.b)("p",null,"Then you are going to find out you need to know a lot more things than just ","[node]",", things like:"),Object(o.b)("p",null,"[Docker]","\n| ","[AWS]","\n| ","[ALB]","\n| ","[IAM]","\n| ","[S3]","\n| ","[ECS]","\n| ","[ECR]","\n| ","[Kubernetes]","\n| ","[CloudWatch]","\n| ","[CloudFormation]","-","[CDK]","-","[Terraform]"),Object(o.b)("p",null,"It's a lot to take in, and in most team settings, it ends up being a dedicated person to help everyone else out. But what you really want to do is jsut ",Object(o.b)("strong",{parentName:"p"},"ship")," -- so let's."),Object(o.b)("h2",{id:"tldr"},"TLDR"),Object(o.b)("h3",{id:"assumptions"},"Assumptions"),Object(o.b)("ul",null,Object(o.b)("li",{parentName:"ul"},"You have a node http/https  you want on the cloud"),Object(o.b)("li",{parentName:"ul"},"That node program listens on a ",Object(o.b)("inlineCode",{parentName:"li"},"${PORT}")," you can read from an environment variable"),Object(o.b)("li",{parentName:"ul"},"You have signed up for AWS, and have ",Object(o.b)("inlineCode",{parentName:"li"},"AWS_ACCESS_KEY_ID")," and ",Object(o.b)("inlineCode",{parentName:"li"},"AWS_SECRET_ACCESS_KEY")),Object(o.b)("li",{parentName:"ul"},"You can go to your shell and type ",Object(o.b)("inlineCode",{parentName:"li"},"npx shipula deploy"))),Object(o.b)("p",null,"Yep -- that's it."))}c.isMDXComponent=!0}}]);