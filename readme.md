# ⛴🧛🏻‍♂️

:::tip Shipula's Goal
Make **works-on-cloud** as easy as _works-on-my-machine_.
:::

Programming node servers, whichever frameworks you use like [Express](https://expressjs.com/) or [Koa](https://koajs.com/), or just a raw port server, sooner or later you need to ship it.

Then you are going to find out you need to know a lot more things than just [node], things like:

[Docker](http://docker.com)
| [AWS](http://aws.amazon.com)
| [ALB](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html)~[Route53](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/Welcome.html)~[ACM](https://docs.aws.amazon.com/acm/latest/userguide/acm-overview.html)
| [IAM]
| [S3]
| [ECS]~[ECR]~[FarGate]~[EKS]~[Kubernetes]
| [CloudWatch]~[CloudBackup]
| [CloudFormation]~[CDK]~[Terraform]~[AWSCLI]

It's a lot to take in, and in most team settings, it ends up being a dedicated person to help everyone else out.
But what you really want to do is just **ship** -- so let's.

```shell
yarn global add @shipula/cli
```

or

```shell
npm install -g @shipula/cli
```

- yarn install -g @shipula/cli
- git clone git@github.com:userbugreport/shipula.git
- shipula deploy shipula/packages/express-sample
- ... wait ...
- curl

To the 🏗[Docks](https://userbugreport.github.io/shipula/docs/)
