import * as cdk from "@aws-cdk/core";
import { FargateEfs } from "./FargateEfs";

const app = new cdk.App();
const stack = new FargateEfs(app, "hello");
console.assert(stack);
app.synth();
