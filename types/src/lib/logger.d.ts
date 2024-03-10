import ora from "ora";
import prompts from "prompts";
interface PrettyConsoleOptions {
    prefix?: string;
    type?: "log" | "warn" | "error" | "info" | "success" | "debug" | "assert";
    prefixPad?: number;
}
export declare class PrettyConsole {
    closeByNewLine: boolean;
    dateTime: boolean;
    icons: {
        log: string;
        warn: string;
        error: string;
        info: string;
        success: string;
        debug: string;
        assert: string;
    };
    title: {
        log: string;
        warn: string;
        error: string;
        info: string;
        success: string;
        debug: string;
        assert: string;
    };
    colors: any;
    meta: {
        log: {
            fg: string;
            bg: string;
            icon: string;
            title: string;
        };
        warn: {
            fg: string;
            bg: string;
            icon: string;
            title: string;
        };
        error: {
            fg: string;
            bg: string;
            icon: string;
            title: string;
        };
        info: {
            fg: string;
            bg: string;
            icon: string;
            title: string;
        };
        success: {
            fg: string;
            bg: string;
            icon: string;
            title: string;
        };
        debug: {
            fg: string;
            bg: string;
            icon: string;
            title: string;
        };
        assert: {
            fg: string;
            bg: string;
            icon: string;
            title: string;
        };
    };
    constructor();
    print(message: string, options?: PrettyConsoleOptions): void;
    log(message: string, options?: PrettyConsoleOptions): void;
    warn(message: string, options?: PrettyConsoleOptions): void;
    error(message: string, options?: PrettyConsoleOptions): void;
    info(message: string, options?: PrettyConsoleOptions): void;
    success(message: string, options?: PrettyConsoleOptions): void;
    debug(message: string, options?: PrettyConsoleOptions): void;
    assert(message: string, options?: PrettyConsoleOptions): void;
    clear(): void;
    propmt: typeof prompts;
    spinner: {
        (options?: string | ora.Options | undefined): ora.Ora;
        promise(action: PromiseLike<unknown>, options?: string | ora.Options | undefined): ora.Ora;
    };
}
declare const logger: PrettyConsole;
export default logger;
