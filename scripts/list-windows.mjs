import { execSync } from "child_process";

try {
  const ps = `Get-Process | Where-Object { $_.MainWindowTitle -ne '' } | Select-Object ProcessName, Id, MainWindowTitle | Format-List`;
  const out = execSync(`powershell -Command "${ps}"`, { encoding: "utf8" });
  console.log("ACTIVE OPEN WINDOWS ON DESKTOP:\n");
  console.log(out);
} catch (e) {
  console.error(e.message);
}
