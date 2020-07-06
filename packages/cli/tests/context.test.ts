import path from "path";
import {
  buildDeployProps,
  buildInfoProps,
  buildEnvProps,
} from "../src/context";

describe("Context", () => {
  it("can build deploy props", async () => {
    const p = await buildDeployProps(
      path.join(__dirname, "..", "..", "express-sample")
    );
    expect(p).toMatchSnapshot();
  });
  it("can build info props with default stack", async () => {
    const p = await buildInfoProps("@shipula/express-sample");
    expect(p).toMatchSnapshot();
  });
  it("can build info props with named stack", async () => {
    const p = await buildInfoProps("@shipula/express-sample", "dev");
    expect(p).toMatchSnapshot();
  });
  it("can build env props with named stack", async () => {
    const p = await buildEnvProps("@shipula/express-sample", "dev", [
      "a=b",
      "/junk@=stuff",
    ]);
    expect(p).toMatchSnapshot();
  });
  it("can build env props with default stack", async () => {
    const p = await buildEnvProps("@shipula/express-sample", "a=b");
    expect(p).toMatchSnapshot();
  });
});
