import path from "path";
import { loadPackage } from "../src/nouns/package";

describe("Nouns", () => {
  it("loads my pacakge", async () => {
    const p = await loadPackage(path.join(__dirname, ".."));
    expect(p).toMatchSnapshot();
  });
  it("loads my pacakge", async () => {
    const p = await loadPackage();
    expect(p).toMatchSnapshot();
  });
});
