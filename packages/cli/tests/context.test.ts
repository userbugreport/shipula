import path from "path";
import {
  buildDeployProps,
  buildInfoProps,
  buildEnvProps,
  getInternalPath,
  getStackPath,
} from "../src/context";

describe("Context", () => {
  const sampleIn = path.join(__dirname, "..", "..", "express-sample");
  it("can build deploy props", async () => {
    const p = await buildDeployProps(sampleIn);
    expect(p).toMatchSnapshot();
  });
  it("can build info props with default stack", async () => {
    const p = await buildInfoProps(sampleIn);
    expect(p).toMatchSnapshot();
  });
  it("can build info props with named stack", async () => {
    const p = await buildInfoProps(sampleIn, "dev");
    expect(p).toMatchSnapshot();
  });
  it("can build env props with named stack", async () => {
    const p = await buildEnvProps(sampleIn, "dev", ["a=b", "/junk@=stuff"]);
    expect(p).toMatchSnapshot();
  });
  it("can build env props with default stack", async () => {
    const p = await buildEnvProps(sampleIn, "a=b");
    expect(p).toMatchSnapshot();
  });
  it("can build a stack path", async () => {
    const p = await getStackPath("a", "b");
    expect(p).toEqual("shipula/a/b");
  });
  it("can build a system path", async () => {
    const p = await getInternalPath("a", "b");
    expect(p).toEqual(".shipula/a/b");
  });
});
