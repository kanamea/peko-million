(()=>{"use strict";const e=require("path"),s=require("express"),t=s(),o=__dirname,r=e.join(o,"index.html");t.use(s.static(o)),t.use(((e,s,t)=>{console.log(e.secure),e.secure?t():s.redirect("https://"+e.headers.host+e.url)})),t.get("*",((e,s)=>{s.sendFile(r)}));const i=process.env.PORT||8080;t.listen(i,(()=>{console.log(`App listening to ${i}....`),console.log("Press Ctrl+C to quit.")}))})();