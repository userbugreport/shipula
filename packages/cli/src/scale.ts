import { Command } from "commander";
import docs, { errorMessage } from "./docs";
import { CPU_Memory } from "./aws/info";
import { buildInfoProps } from "./context";
import { EnvSet } from "./components/EnvSet";
import { display } from "./components/application";

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
      throw errorMessage("scale_number.md");
    const validCPU = CPU_Memory.find((c) => c.display === command.cpu);
    if (!validCPU) throw errorMessage("scale_cpu.md");
    const validMemory = CPU_Memory.find((c) => c.display === command.cpu)
      .memory;
    if (!validMemory[command.memory])
      throw errorMessage("scale_memory.md", Object.keys(validMemory));
    const props = await buildInfoProps(packageDirectory, stackName);
    props.scale = {
      number: command.number,
      cpu: validCPU.cpu,
      memory: validMemory[command.memory],
    };
    // scale is just another env set
    display(props, EnvSet);
    return;
  });
