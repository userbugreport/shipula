Deploy your App to the cloud.

Creates a default Stack, or you can specift a stack name.

This will provision from the network on down to shared disk, with a minimum deployment being:
* A load balancer, with HTTP/HTTPS
* 2 running copies
* 1 CPU
* 8G RAM
* A shared file system at `/var/data`