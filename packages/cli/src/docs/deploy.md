Deploy your App to the cloud.

Creates a default Stack, or you can specify a stack name.

This will provision from the network on down to shared disk, with a minimum deployment being:

- A load balancer, with HTTP/HTTPS
- 2 running copies
- 1 CPU
- 2G RAM
- A shared file system at `/cluster_shared`

You can make as many named stacks as you like -- if you do not specify, it will be called `default`.

You can create a static site, with no running server.
This is automatic if docusaurus is detected, or you can force it by having
a marker in your package.json:

```
"shipula": {
  "static": true
}
```

This will:

- Run your `scripts.build` target in your `package.json`
- Take the contents of `<package_root>/build` and host it as a static site
- `index.html` is the default page, but all pages will be served
