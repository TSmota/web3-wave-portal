import {Ethereumish} from "./react-app-env";

declare global {
    interface Window {
        ethereum: Ethereumish;
    }
}

declare module "*.svg" {
    const content: any;
    export default content;
}