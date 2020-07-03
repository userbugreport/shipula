import path from "path";
import { buildDeployProps } from "../src/context";

describe("Context", () => {
  it("deploy", async () => {
    const p = await buildDeployProps(path.join(__dirname, ".."));
    expect(p).toMatchSnapshot();
  });
});
