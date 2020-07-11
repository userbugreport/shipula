import { Command } from "commander";
import docs from "./docs";
import { Info } from "@shipula/context";
import { buildInfoProps } from "./context";
import { EnvSet } from "./components/EnvSet";
import { display } from "./components/application";
import { ErrorMessage } from "@shipula/context";

export default new Command()
  .command("scale <packageDirectory> [stackName]")
  .description("Set scaling limits on your App Stack.")
  .requiredOption(
    "--number <number>",
    "Number of copies to run -- horizontal scale",
    parseInt
  )
  .requiredOption("--cpu <number>", "Number of CPUs per copy", parseInt)
  .requiredOption(
    "--memory <number>",
    "Number of GB of memory, limited by number of CPUs",
    parseInt
  )
  .on("--help", () => {
    console.log(docs("scale.md"));
  })
  .action(async (packageDirectory, stackName, command) => {
    if (isNaN(command.number) || command.number <= 0 || command.number > 32)
      throw new ErrorMessage("Specify a number of copies between `1` and `32`");
    const validCPU = Info.CPU_Memory.find((c) => c.display === command.cpu);
    if (!validCPU)
      throw new ErrorMessage("Specify a number of CPUs between `1` and `4`");
    const validMemory = Info.CPU_Memory.find((c) => c.display === command.cpu)
      .memory;
    if (!validMemory[command.memory])
      throw new ErrorMessage(
        `Specify an amount of memory from ${Object.keys(validMemory)}`
      );
    const props = await buildInfoProps(packageDirectory, stackName);
    props.setVariables = {
      SHIPULA_NUMBER: `${command.number}`,
      SHIPULA_CPU: `${validCPU.cpu}`,
      SHIPULA_MEMORY: `${validMemory[command.memory]}`,
    };
    // scale is just another env set
    await display(props, EnvSet);
    return;
  });
