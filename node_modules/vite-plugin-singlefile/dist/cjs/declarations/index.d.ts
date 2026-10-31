import { UserConfig, PluginOption } from "vite";
export type Config = {
    useRecommendedBuildConfig?: boolean;
    removeViteModuleLoader?: boolean;
    inlinePattern?: string[];
    deleteInlinedFiles?: boolean;
    outputFileName?: string;
    overrideConfig?: Partial<UserConfig>;
};
export declare function replaceScript(html: string, scriptFilename: string, scriptCode: string, removeViteModuleLoader?: boolean): string;
export declare function replaceCss(html: string, scriptFilename: string, scriptCode: string): string;
export declare function findCspProblems(html: string, inlinedScript: boolean, inlinedStyle: boolean): string[];
export declare function viteSingleFile({ useRecommendedBuildConfig, removeViteModuleLoader, inlinePattern, deleteInlinedFiles, outputFileName, overrideConfig, }?: Config): PluginOption;
