import { getStackPath, getStackName } from "../src";

describe("Context", () => {
  it("can build a stack path", async () => {
    const p = await getStackPath("a", "b");
    expect(p).toEqual("shipula/a/b");
  });
  it("can build a stack name", async () => {
    const p = await getStackName("@a/b", "b");
    expect(p).toEqual("ab-b");
  });
});
