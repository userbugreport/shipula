import * as cdk from "@aws-cdk/core";
import { AmazonEfsIntegrationsStack } from "./AmazonEfsIntegrationsStack";

const app = new cdk.App();
const stack = new AmazonEfsIntegrationsStack(app, "hello", {
  cpuSize: "256",
  memorySize: "1024",
});
console.assert(stack);
app.synth();
