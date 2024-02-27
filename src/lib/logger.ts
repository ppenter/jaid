import ora from "ora";
import prompts from "prompts";

interface PrettyConsoleOptions {
  prefix?: string;
  type?: "log" | "warn" | "error" | "info" | "success" | "debug" | "assert";
  prefixPad?: number;
}

export class PrettyConsole {
  public closeByNewLine = false;
  public dateTime = true;

  public icons = {
    log: "\u25ce",
    warn: "\u26a0",
    error: "\u26D4",
    info: "\u2139",
    success: "\u2713",
    debug: "\u00AB",
    assert: "\u0021",
  };

  public title = {
    log: "LOGS",
    warn: "WARN",
    error: "ERROR",
    info: "INFO",
    success: "✓",
    debug: "DEBUG",
    assert: "ASSERT",
  };

  public colors = {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
  } as any;

  public meta = {
    log: { fg: "white", bg: "black", icon: "\u25ce", title: "LOGS" },
    warn: { fg: "yellow", bg: "", icon: "\u26a0", title: "WARN" },
    error: { fg: "red", bg: "", icon: "\u26D4", title: "ERROR" },
    info: { fg: "blue", bg: "", icon: "\u2139", title: "INFO" },
    success: { fg: "green", bg: "", icon: "\u2713", title: "✓" },
    debug: { fg: "magenta", bg: "", icon: "\u00AB", title: "DEBUG" },
    assert: { fg: "cyan", bg: "", icon: "\u0021", title: "ASSERT" },
  };

  constructor() {}

  print(message: string, options: PrettyConsoleOptions = {}) {
    const { prefix, type, prefixPad } = options;
    const meta = this.meta[type || "log"];
    const fg = this.colors[meta.fg];
    const bg = this.colors[meta.bg];
    const icon = this.icons[type || "log"];
    const title = this.title[type || "log"];
    // console.log(fg, `${icon} ${title}`, prefix ? `${prefix.padEnd(prefixPad || 10)} |` : '', message, '\x1b[0m');
    // print with time
    console.log(
      fg,
      this.dateTime ? new Date().toTimeString().split(" ")[0] + " |" : "",
      `[${title}]`.padEnd(8),
      prefix ? `${prefix.padEnd(prefixPad || 8)} -` : "",
      message,
      "\x1b[0m",
    );
  }
  log(message: string, options?: PrettyConsoleOptions) {
    this.print(message, {
      type: "log",
      ...options,
    });
  }
  warn(message: string, options?: PrettyConsoleOptions) {
    this.print(message, {
      type: "warn",
      ...options,
    });
  }
  error(message: string, options?: PrettyConsoleOptions) {
    this.print(message, {
      type: "error",
      ...options,
    });
  }
  info(message: string, options?: PrettyConsoleOptions) {
    this.print(message, {
      type: "info",
      ...options,
    });
  }
  success(message: string, options?: PrettyConsoleOptions) {
    this.print(message, {
      type: "success",
      ...options,
    });
  }
  debug(message: string, options?: PrettyConsoleOptions) {
    this.print(message, {
      type: "debug",
      ...options,
    });
  }
  assert(message: string, options?: PrettyConsoleOptions) {
    this.print(message, {
      type: "assert",
      ...options,
    });
  }
  clear(): void {
    console.clear();
  }

  public propmt = prompts;
  public spinner = ora;
}

const logger = new PrettyConsole();

export default logger;
