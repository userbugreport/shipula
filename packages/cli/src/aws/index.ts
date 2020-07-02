import * as cdk from "@aws-cdk/core";
import { FargateEfs } from "./FargateEfs";

const app = new cdk.App();
// pull in from an env var, or just default
const stack = new FargateEfs(app, process.env.STACK_NAME || "Shipula");
console.assert(stack);
app.synth();
